package service

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/cromatic-vision-optical/backend/internal/repository"
	"github.com/cromatic-vision-optical/backend/internal/storage"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var (
	ErrPrescriptionNotFound      = errors.New("prescription not found")
	ErrPrecriptionInvalidType    = errors.New("invalid file type, allowed: pdf, jpg, jpeg, png")
	ErrPrescriptionSizeExceeded  = errors.New("file size exceeds maximum limit of 10MB")
	ErrPrescriptionUnauthorized  = errors.New("unauthorized access to prescription")
	ErrPrescriptionOrderNotFound = errors.New("associated order not found")
	ErrPrescriptionUserMismatch  = errors.New("user does not own the associated order")
	ErrPrescriptionInvalidStatus = errors.New("invalid prescription status")
)

type PrescriptionResponse struct {
	ID               int64     `json:"id"`
	OrderID          int64     `json:"order_id"`
	UserID           uuid.UUID `json:"user_id"`
	UserName         string    `json:"user_name,omitempty"`
	UserEmail        string    `json:"user_email,omitempty"`
	PrescriptionType string    `json:"prescription_type"`
	FileUrl          string    `json:"file_url"`
	ObjectKey        string    `json:"object_key"`
	Notes            *string   `json:"notes"`
	Status           string    `json:"status"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type PrescriptionService interface {
	UploadPrescription(ctx context.Context, userID uuid.UUID, orderID int64, prescriptionType string, fileData []byte, fileName string, contentType string, notes *string) (PrescriptionResponse, error)
	GetPrescription(ctx context.Context, userID uuid.UUID, id int64, isAdmin bool) (PrescriptionResponse, error)
	ListPrescriptions(ctx context.Context, userID uuid.UUID, isAdmin bool) ([]PrescriptionResponse, error)
	UpdateStatus(ctx context.Context, id int64, status string) (PrescriptionResponse, error)
}

type prescriptionService struct {
	rxRepo     repository.PrescriptionRepository
	orderRepo  repository.OrderRepository
	storageSvc storage.StorageService
}

func NewPrescriptionService(
	rxRepo repository.PrescriptionRepository,
	orderRepo repository.OrderRepository,
	storageSvc storage.StorageService,
) PrescriptionService {
	return &prescriptionService{
		rxRepo:     rxRepo,
		orderRepo:  orderRepo,
		storageSvc: storageSvc,
	}
}

func (s *prescriptionService) UploadPrescription(
	ctx context.Context,
	userID uuid.UUID,
	orderID int64,
	prescriptionType string,
	fileData []byte,
	fileName string,
	contentType string,
	notes *string,
) (PrescriptionResponse, error) {
	// 1. Validate File Size
	if len(fileData) > 10*1024*1024 {
		return PrescriptionResponse{}, ErrPrescriptionSizeExceeded
	}

	// 2. Validate File Extension & Content Type
	ext := strings.ToLower(filepath.Ext(fileName))
	validExt := ext == ".pdf" || ext == ".jpg" || ext == ".jpeg" || ext == ".png"

	detectedType := http.DetectContentType(fileData)
	validMime := detectedType == "application/pdf" || detectedType == "image/jpeg" || detectedType == "image/png"

	cleanContentType := strings.ToLower(contentType)
	allowedMimes := map[string]bool{
		"application/pdf": true,
		"image/jpeg":       true,
		"image/png":        true,
	}
	isAllowedContentType := allowedMimes[cleanContentType] || cleanContentType == "image/jpg"

	if !validExt && !validMime && !isAllowedContentType {
		return PrescriptionResponse{}, ErrPrecriptionInvalidType
	}

	// Resolve actual content type to use
	resolvedContentType := contentType
	if resolvedContentType == "" || !allowedMimes[strings.ToLower(resolvedContentType)] {
		if allowedMimes[detectedType] {
			resolvedContentType = detectedType
		} else if ext == ".pdf" {
			resolvedContentType = "application/pdf"
		} else if ext == ".png" {
			resolvedContentType = "image/png"
		} else {
			resolvedContentType = "image/jpeg"
		}
	}

	// 3. Verify associated order exists and belongs to user
	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PrescriptionResponse{}, ErrPrescriptionOrderNotFound
		}
		return PrescriptionResponse{}, err
	}

	if order.UserID != userID {
		return PrescriptionResponse{}, ErrPrescriptionUserMismatch
	}

	// 4. Upload to storage
	uniqueID := uuid.New().String()
	objectKey := fmt.Sprintf("prescriptions/%s/%s_%s", userID.String(), uniqueID, fileName)

	fileURL, err := s.storageSvc.Upload(ctx, fileData, objectKey, resolvedContentType)
	if err != nil {
		return PrescriptionResponse{}, fmt.Errorf("failed to upload asset to storage backend: %w", err)
	}

	// 5. Save to database
	rx, err := s.rxRepo.Create(ctx, sqlc.CreatePrescriptionParams{
		OrderID:          orderID,
		UserID:           userID,
		PrescriptionType: prescriptionType,
		FileUrl:          fileURL,
		ObjectKey:        objectKey,
		Notes:            notes,
		Status:           "UPLOADED",
	})
	if err != nil {
		// Clean up the uploaded asset to prevent dangling files
		_ = s.storageSvc.Delete(ctx, objectKey)
		return PrescriptionResponse{}, err
	}

	return s.buildResponse(rx), nil
}

func (s *prescriptionService) GetPrescription(ctx context.Context, userID uuid.UUID, id int64, isAdmin bool) (PrescriptionResponse, error) {
	if isAdmin {
		rx, err := s.rxRepo.AdminGetPrescriptionByID(ctx, id)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return PrescriptionResponse{}, ErrPrescriptionNotFound
			}
			return PrescriptionResponse{}, err
		}
		return s.buildAdminGetPrescriptionResponse(rx), nil
	}

	rx, err := s.rxRepo.GetByIDAndUserID(ctx, id, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PrescriptionResponse{}, ErrPrescriptionNotFound
		}
		return PrescriptionResponse{}, err
	}

	return s.buildResponse(rx), nil
}

func (s *prescriptionService) ListPrescriptions(ctx context.Context, userID uuid.UUID, isAdmin bool) ([]PrescriptionResponse, error) {
	if isAdmin {
		list, err := s.rxRepo.AdminListAllPrescriptions(ctx)
		if err != nil {
			return nil, err
		}
		responses := make([]PrescriptionResponse, len(list))
		for i, r := range list {
			responses[i] = s.buildAdminListPrescriptionsResponse(r)
		}
		return responses, nil
	}

	list, err := s.rxRepo.ListByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	responses := make([]PrescriptionResponse, len(list))
	for i, r := range list {
		responses[i] = s.buildResponse(r)
	}
	return responses, nil
}

func (s *prescriptionService) UpdateStatus(ctx context.Context, id int64, status string) (PrescriptionResponse, error) {
	status = strings.ToUpper(status)
	if status != "UPLOADED" && status != "REVIEWED" && status != "APPROVED" && status != "REJECTED" {
		return PrescriptionResponse{}, ErrPrescriptionInvalidStatus
	}

	// Fetch first to verify existence
	_, err := s.rxRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PrescriptionResponse{}, ErrPrescriptionNotFound
		}
		return PrescriptionResponse{}, err
	}

	rx, err := s.rxRepo.UpdateStatus(ctx, id, status)
	if err != nil {
		return PrescriptionResponse{}, err
	}

	return s.buildResponse(rx), nil
}

func (s *prescriptionService) buildResponse(rx sqlc.Prescription) PrescriptionResponse {
	return PrescriptionResponse{
		ID:               rx.ID,
		OrderID:          rx.OrderID,
		UserID:           rx.UserID,
		PrescriptionType: rx.PrescriptionType,
		FileUrl:          rx.FileUrl,
		ObjectKey:        rx.ObjectKey,
		Notes:            rx.Notes,
		Status:           rx.Status,
		CreatedAt:        rx.CreatedAt,
		UpdatedAt:        rx.UpdatedAt,
	}
}

func (s *prescriptionService) buildAdminListPrescriptionsResponse(rx sqlc.AdminListAllPrescriptionsRow) PrescriptionResponse {
	resp := s.buildResponse(sqlc.Prescription{
		ID:               rx.ID,
		OrderID:          rx.OrderID,
		UserID:           rx.UserID,
		PrescriptionType: rx.PrescriptionType,
		FileUrl:          rx.FileUrl,
		ObjectKey:        rx.ObjectKey,
		Notes:            rx.Notes,
		Status:           rx.Status,
		CreatedAt:        rx.CreatedAt,
		UpdatedAt:        rx.UpdatedAt,
	})
	resp.UserName = rx.UserName
	resp.UserEmail = rx.UserEmail
	return resp
}

func (s *prescriptionService) buildAdminGetPrescriptionResponse(rx sqlc.AdminGetPrescriptionByIDRow) PrescriptionResponse {
	resp := s.buildResponse(sqlc.Prescription{
		ID:               rx.ID,
		OrderID:          rx.OrderID,
		UserID:           rx.UserID,
		PrescriptionType: rx.PrescriptionType,
		FileUrl:          rx.FileUrl,
		ObjectKey:        rx.ObjectKey,
		Notes:            rx.Notes,
		Status:           rx.Status,
		CreatedAt:        rx.CreatedAt,
		UpdatedAt:        rx.UpdatedAt,
	})
	resp.UserName = rx.UserName
	resp.UserEmail = rx.UserEmail
	return resp
}
