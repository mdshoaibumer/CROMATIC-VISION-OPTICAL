package service

import (
	"context"
	"errors"
	"strings"

	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/cromatic-vision-optical/backend/internal/repository"
	"github.com/cromatic-vision-optical/backend/internal/shared/sanitize"
	"github.com/jackc/pgx/v5"
)

var (
	ErrProductNotFound         = errors.New("product not found")
	ErrProductSlugExists       = errors.New("product slug already exists")
	ErrProductPriceInvalid     = errors.New("price must be greater than 0")
	ErrProductSalePriceInvalid = errors.New("sale price must be greater than or equal to 0 and less than price")
	ErrProductStockInvalid     = errors.New("stock cannot be negative")
	ErrProductRequiredFields   = errors.New("missing required fields (name, description, brand, frame_type, material, gender)")
)

// ProductService provides functional catalog orchestration
type ProductService interface {
	Create(ctx context.Context, p sqlc.CreateProductParams, images []string) (repository.ProductWithDetails, error)
	Update(ctx context.Context, id int64, p sqlc.UpdateProductParams, images *[]string) (repository.ProductWithDetails, error)
	Delete(ctx context.Context, id int64) error
	GetByID(ctx context.Context, id int64) (repository.ProductWithDetails, error)
	GetBySlug(ctx context.Context, slug string) (repository.ProductWithDetails, error)
	List(ctx context.Context, filter repository.ProductFilter) ([]repository.ProductWithDetails, int64, error)
}

type productService struct {
	repo    repository.ProductRepository
	catRepo repository.CategoryRepository
}

// NewProductService creates a product service implementation
func NewProductService(repo repository.ProductRepository, catRepo repository.CategoryRepository) ProductService {
	return &productService{
		repo:    repo,
		catRepo: catRepo,
	}
}

func (s *productService) Create(ctx context.Context, p sqlc.CreateProductParams, images []string) (repository.ProductWithDetails, error) {
	// 1. Sanitize and validate inputs
	p.Name = sanitize.Text(strings.TrimSpace(p.Name))
	p.Description = sanitize.Text(strings.TrimSpace(p.Description))
	p.Brand = sanitize.Text(strings.TrimSpace(p.Brand))
	p.FrameType = sanitize.Text(strings.TrimSpace(p.FrameType))
	p.Material = sanitize.Text(strings.TrimSpace(p.Material))
	p.Gender = sanitize.Text(strings.TrimSpace(p.Gender))

	if p.Name == "" || p.Description == "" || p.Brand == "" || p.FrameType == "" || p.Material == "" || p.Gender == "" {
		return repository.ProductWithDetails{}, ErrProductRequiredFields
	}

	if p.Price <= 0 {
		return repository.ProductWithDetails{}, ErrProductPriceInvalid
	}

	if p.SalePrice != nil {
		if *p.SalePrice < 0 || *p.SalePrice >= p.Price {
			return repository.ProductWithDetails{}, ErrProductSalePriceInvalid
		}
	}

	if p.Stock < 0 {
		return repository.ProductWithDetails{}, ErrProductStockInvalid
	}

	p.Slug = strings.TrimSpace(p.Slug)
	if p.Slug == "" {
		p.Slug = GenerateSlug(p.Name)
	} else {
		p.Slug = GenerateSlug(p.Slug)
	}

	// 2. Validate Category existence
	if p.CategoryID != nil {
		_, err := s.catRepo.GetByID(ctx, *p.CategoryID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return repository.ProductWithDetails{}, ErrCategoryNotFound
			}
			return repository.ProductWithDetails{}, err
		}
	}

	// 3. Validate Slug Uniqueness
	_, err := s.repo.GetBySlug(ctx, p.Slug)
	if err == nil {
		return repository.ProductWithDetails{}, ErrProductSlugExists
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return repository.ProductWithDetails{}, err
	}

	if p.Status == "" {
		p.Status = "active"
	}

	// 4. Create Product
	createdProduct, err := s.repo.Create(ctx, p)
	if err != nil {
		return repository.ProductWithDetails{}, err
	}

	// 5. Store Product Images
	var createdImages []sqlc.ProductImage
	for idx, imgURL := range images {
		imgURL = strings.TrimSpace(imgURL)
		if imgURL == "" {
			continue
		}
		isPrimary := idx == 0 // Defaults first image to primary
		img, err := s.repo.CreateImage(ctx, sqlc.CreateProductImageParams{
			ProductID: createdProduct.ID,
			ImageUrl:  imgURL,
			ObjectKey: nil,
			IsPrimary: isPrimary,
		})
		if err == nil {
			createdImages = append(createdImages, img)
		}
	}

	var catName *string
	if createdProduct.CategoryID != nil {
		cat, err := s.catRepo.GetByID(ctx, *createdProduct.CategoryID)
		if err == nil {
			catName = &cat.Name
		}
	}

	return repository.ProductWithDetails{
		Product:      createdProduct,
		CategoryName: catName,
		Images:       createdImages,
	}, nil
}

func (s *productService) Update(ctx context.Context, id int64, p sqlc.UpdateProductParams, images *[]string) (repository.ProductWithDetails, error) {
	// 1. Verify existence
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return repository.ProductWithDetails{}, ErrProductNotFound
		}
		return repository.ProductWithDetails{}, err
	}

	// 2. Check update fields validations
	if p.Name != nil {
		trimmedName := strings.TrimSpace(*p.Name)
		if trimmedName == "" {
			return repository.ProductWithDetails{}, ErrProductRequiredFields
		}
		p.Name = &trimmedName
	}

	if p.Price != nil {
		if *p.Price <= 0 {
			return repository.ProductWithDetails{}, ErrProductPriceInvalid
		}
	}

	// Sale price boundary validation relative to price
	effectivePrice := existing.Price
	if p.Price != nil {
		effectivePrice = *p.Price
	}

	effectiveSalePrice := existing.SalePrice
	if p.SalePrice != nil {
		effectiveSalePrice = p.SalePrice
	}

	if effectiveSalePrice != nil {
		if *effectiveSalePrice < 0 || *effectiveSalePrice >= effectivePrice {
			return repository.ProductWithDetails{}, ErrProductSalePriceInvalid
		}
	}

	if p.Stock != nil {
		if *p.Stock < 0 {
			return repository.ProductWithDetails{}, ErrProductStockInvalid
		}
	}

	// Slug resolution and uniqueness
	var pSlug *string
	if p.Slug != nil {
		trimmedSlug := GenerateSlug(*p.Slug)
		if trimmedSlug != "" && trimmedSlug != existing.Slug {
			other, err := s.repo.GetBySlug(ctx, trimmedSlug)
			if err == nil && other.ID != id {
				return repository.ProductWithDetails{}, ErrProductSlugExists
			}
			pSlug = &trimmedSlug
		}
	} else if p.Name != nil {
		// Auto regenerate slug of new name if slug wasn't specified
		newSlug := GenerateSlug(*p.Name)
		if newSlug != existing.Slug {
			other, err := s.repo.GetBySlug(ctx, newSlug)
			if err == nil && other.ID != id {
				return repository.ProductWithDetails{}, ErrProductSlugExists
			}
			pSlug = &newSlug
		}
	}

	// Validate category_id existence if changing category
	if p.CategoryID != nil {
		_, err := s.catRepo.GetByID(ctx, *p.CategoryID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return repository.ProductWithDetails{}, ErrCategoryNotFound
			}
			return repository.ProductWithDetails{}, err
		}
	}

	// 3. Perform update
	p.ID = id
	p.Slug = pSlug
	_, err = s.repo.Update(ctx, p)
	if err != nil {
		return repository.ProductWithDetails{}, err
	}

	// 4. Sync product images of provided
	if images != nil {
		// Clean out old images
		_ = s.repo.DeleteImages(ctx, id)

		// Create replacements
		for idx, imgURL := range *images {
			imgURL = strings.TrimSpace(imgURL)
			if imgURL == "" {
				continue
			}
			isPrimary := idx == 0
			_, _ = s.repo.CreateImage(ctx, sqlc.CreateProductImageParams{
				ProductID: id,
				ImageUrl:  imgURL,
				ObjectKey: nil,
				IsPrimary: isPrimary,
			})
		}
	}

	// Fetch full updated structure
	return s.repo.GetDetailsByID(ctx, id)
}

func (s *productService) Delete(ctx context.Context, id int64) error {
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrProductNotFound
		}
		return err
	}
	return s.repo.Delete(ctx, id)
}

func (s *productService) GetByID(ctx context.Context, id int64) (repository.ProductWithDetails, error) {
	details, err := s.repo.GetDetailsByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return repository.ProductWithDetails{}, ErrProductNotFound
		}
		return repository.ProductWithDetails{}, err
	}
	return details, nil
}

func (s *productService) GetBySlug(ctx context.Context, slug string) (repository.ProductWithDetails, error) {
	details, err := s.repo.GetDetailsBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return repository.ProductWithDetails{}, ErrProductNotFound
		}
		return repository.ProductWithDetails{}, err
	}
	return details, nil
}

func (s *productService) List(ctx context.Context, filter repository.ProductFilter) ([]repository.ProductWithDetails, int64, error) {
	return s.repo.List(ctx, filter)
}
