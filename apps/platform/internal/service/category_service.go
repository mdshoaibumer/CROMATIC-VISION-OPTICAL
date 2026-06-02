package service

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/cromatic-vision-optical/backend/internal/repository"
	"github.com/cromatic-vision-optical/backend/internal/shared/sanitize"
	"github.com/jackc/pgx/v5"
)

var (
	ErrCategoryNotFound     = errors.New("category not found")
	ErrCategorySlugExists   = errors.New("category slug already exists")
	ErrCategoryNameRequired = errors.New("category name is required")
)

// CategoryService implements business rules around categorizations
type CategoryService interface {
	Create(ctx context.Context, name string, slug string, description *string) (sqlc.Category, error)
	Update(ctx context.Context, id int64, name *string, slug *string, description *string) (sqlc.Category, error)
	Delete(ctx context.Context, id int64) error
	GetByID(ctx context.Context, id int64) (sqlc.Category, error)
	GetBySlug(ctx context.Context, slug string) (sqlc.Category, error)
	List(ctx context.Context) ([]sqlc.Category, error)
}

type categoryService struct {
	repo repository.CategoryRepository
}

// NewCategoryService allocates a category service implementation
func NewCategoryService(repo repository.CategoryRepository) CategoryService {
	return &categoryService{repo: repo}
}

// GenerateSlug cleans strings to be SEO safe URL paths
func GenerateSlug(input string) string {
	slug := strings.TrimSpace(strings.ToLower(input))
	re := regexp.MustCompile(`[^a-z0-9]+`)
	slug = re.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	return slug
}

func (s *categoryService) Create(ctx context.Context, name string, slug string, description *string) (sqlc.Category, error) {
	name = sanitize.Text(strings.TrimSpace(name))
	if name == "" {
		return sqlc.Category{}, ErrCategoryNameRequired
	}

	slug = strings.TrimSpace(slug)
	if slug == "" {
		slug = GenerateSlug(name)
	} else {
		slug = GenerateSlug(slug)
	}

	// Verify slug uniqueness
	_, err := s.repo.GetBySlug(ctx, slug)
	if err == nil {
		return sqlc.Category{}, ErrCategorySlugExists
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return sqlc.Category{}, err
	}

	return s.repo.Create(ctx, sqlc.CreateCategoryParams{
		Name:        name,
		Slug:        slug,
		Description: description,
	})
}

func (s *categoryService) Update(ctx context.Context, id int64, name *string, slug *string, description *string) (sqlc.Category, error) {
	// Verify current existence
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return sqlc.Category{}, ErrCategoryNotFound
		}
		return sqlc.Category{}, err
	}

	var pName *string
	if name != nil {
		trimmed := strings.TrimSpace(*name)
		if trimmed == "" {
			return sqlc.Category{}, ErrCategoryNameRequired
		}
		pName = &trimmed
	}

	var pSlug *string
	if slug != nil {
		trimmedSlug := GenerateSlug(*slug)
		if trimmedSlug != "" && trimmedSlug != existing.Slug {
			// Verify global uniqueness for updated slug
			other, err := s.repo.GetBySlug(ctx, trimmedSlug)
			if err == nil && other.ID != id {
				return sqlc.Category{}, ErrCategorySlugExists
			}
			pSlug = &trimmedSlug
		}
	} else if name != nil {
		// Auto re-generate slug if name changed but slug wasn't specified
		newSlug := GenerateSlug(*name)
		if newSlug != existing.Slug {
			other, err := s.repo.GetBySlug(ctx, newSlug)
			if err == nil && other.ID != id {
				return sqlc.Category{}, ErrCategorySlugExists
			}
			pSlug = &newSlug
		}
	}

	return s.repo.Update(ctx, sqlc.UpdateCategoryParams{
		ID:          id,
		Name:        pName,
		Slug:        pSlug,
		Description: description,
	})
}

func (s *categoryService) Delete(ctx context.Context, id int64) error {
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrCategoryNotFound
		}
		return err
	}
	return s.repo.Delete(ctx, id)
}

func (s *categoryService) GetByID(ctx context.Context, id int64) (sqlc.Category, error) {
	cat, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return sqlc.Category{}, ErrCategoryNotFound
		}
		return sqlc.Category{}, err
	}
	return cat, nil
}

func (s *categoryService) GetBySlug(ctx context.Context, slug string) (sqlc.Category, error) {
	cat, err := s.repo.GetBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return sqlc.Category{}, ErrCategoryNotFound
		}
		return sqlc.Category{}, err
	}
	return cat, nil
}

func (s *categoryService) List(ctx context.Context) ([]sqlc.Category, error) {
	return s.repo.List(ctx)
}
