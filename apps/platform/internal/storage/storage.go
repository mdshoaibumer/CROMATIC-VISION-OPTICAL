package storage

import (
	"bytes"
	"context"
	"fmt"
	"sync"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	appConfig "github.com/cromatic-vision-optical/backend/internal/config"
)

// StorageService manages storage uploads and deletes to local or cloud S3/R2 storage
type StorageService interface {
	Upload(ctx context.Context, fileData []byte, objectKey string, contentType string) (string, error)
	Delete(ctx context.Context, objectKey string) error
	GeneratePublicURL(objectKey string) string
	Retrieve(ctx context.Context, objectKey string) ([]byte, error)
	// IsMock returns true when running in local/test mock mode.
	// The invoice service uses this to regenerate PDFs on-demand instead of
	// performing S3 Retrieve calls that would always fail with ephemeral in-memory storage.
	IsMock() bool
}

// S3Storage provides a production compatible Cloudflare R2 / AWS S3 client
type S3Storage struct {
	client    *s3.Client
	bucket    string
	urlPrefix string
}

// NewS3Storage initializes S3 SDK connection pool using configurations
func NewS3Storage(cfg *appConfig.Config) (*S3Storage, error) {
	ctx := context.Background()

	creds := credentials.NewStaticCredentialsProvider(cfg.S3AccessKeyID, cfg.S3SecretAccessKey, "")

	awsCfg, err := awsconfig.LoadDefaultConfig(ctx,
		awsconfig.WithCredentialsProvider(creds),
		awsconfig.WithRegion(cfg.S3Region),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load S3 configuration: %w", err)
	}

	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		if cfg.S3Endpoint != "" {
			o.BaseEndpoint = aws.String(cfg.S3Endpoint)
		}
		o.UsePathStyle = true
	})

	return &S3Storage{
		client:    client,
		bucket:    cfg.S3Bucket,
		urlPrefix: cfg.S3PublicURLPrefix,
	}, nil
}

// Upload uploads file payload to AWS S3 / Cloudflare R2
func (s *S3Storage) Upload(ctx context.Context, fileData []byte, objectKey string, contentType string) (string, error) {
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(objectKey),
		Body:        bytes.NewReader(fileData),
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload s3 object: %w", err)
	}
	return s.GeneratePublicURL(objectKey), nil
}

// Delete removes asset from S3 compatible stores
func (s *S3Storage) Delete(ctx context.Context, objectKey string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(objectKey),
	})
	if err != nil {
		return fmt.Errorf("failed to delete s3 object: %w", err)
	}
	return nil
}

// GeneratePublicURL returns fully qualified endpoint address of the image
func (s *S3Storage) GeneratePublicURL(objectKey string) string {
	if s.urlPrefix != "" {
		return fmt.Sprintf("%s/%s", s.urlPrefix, objectKey)
	}
	return fmt.Sprintf("https://%s.s3.amazonaws.com/%s", s.bucket, objectKey)
}

// IsMock returns false — S3Storage is always a real cloud backend.
func (s *S3Storage) IsMock() bool { return false }

// Retrieve downloads the raw bytes of an object from S3 / Cloudflare R2
func (s *S3Storage) Retrieve(ctx context.Context, objectKey string) ([]byte, error) {
	out, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(objectKey),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve s3 object: %w", err)
	}
	defer out.Body.Close()
	buf := new(bytes.Buffer)
	_, err = buf.ReadFrom(out.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read s3 object body: %w", err)
	}
	return buf.Bytes(), nil
}

// MockStorage is used for high velocity testing and isolation
type MockStorage struct {
	mu        sync.RWMutex
	files     map[string][]byte
	urlPrefix string
}

// NewMockStorage instantiates mock registry
func NewMockStorage(urlPrefix string) *MockStorage {
	if urlPrefix == "" {
		urlPrefix = "http://localhost:3000/public"
	}
	return &MockStorage{
		files:     make(map[string][]byte),
		urlPrefix: urlPrefix,
	}
}

// Upload mocks uploading a file
func (m *MockStorage) Upload(ctx context.Context, fileData []byte, objectKey string, contentType string) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.files[objectKey] = fileData
	return m.GeneratePublicURL(objectKey), nil
}

// Delete mocks dropping file coverage
func (m *MockStorage) Delete(ctx context.Context, objectKey string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.files, objectKey)
	return nil
}

// GeneratePublicURL builds expected dynamic local server path
func (m *MockStorage) GeneratePublicURL(objectKey string) string {
	return fmt.Sprintf("%s/%s", m.urlPrefix, objectKey)
}

// IsMock returns true — MockStorage is ephemeral and cannot support persistent Retrieve calls.
func (m *MockStorage) IsMock() bool { return true }

// Retrieve mock downloads file bytes from memory
func (m *MockStorage) Retrieve(ctx context.Context, objectKey string) ([]byte, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	bytes, ok := m.files[objectKey]
	if !ok {
		return nil, fmt.Errorf("objectKey %s not found in mock storage", objectKey)
	}
	return bytes, nil
}

// NewStorageService acts as main industrial dependency factory
func NewStorageService(cfg *appConfig.Config) (StorageService, error) {
	if cfg.StorageProvider == "s3" {
		return NewS3Storage(cfg)
	}
	return NewMockStorage(cfg.S3PublicURLPrefix), nil
}
