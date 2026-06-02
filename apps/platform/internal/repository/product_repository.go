package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ProductFilter structures options for public catalog lists
type ProductFilter struct {
	CategoryID   *int64
	CategorySlug *string
	Brand        *string
	Gender       *string
	FrameType    *string
	Material     *string
	MinPrice     *float64
	MaxPrice     *float64
	Status       *string
	Search       *string
	SortBy       string // price_asc, price_desc, name_asc, name_desc, created_at_desc
	Page         int32
	Limit        int32
}

// ProductWithDetails holds product features along with joined metadata
type ProductWithDetails struct {
	sqlc.Product
	CategoryName *string             `json:"category_name"`
	Images       []sqlc.ProductImage `json:"images"`
}

// ProductRepository provides database catalog integration
type ProductRepository interface {
	Create(ctx context.Context, arg sqlc.CreateProductParams) (sqlc.Product, error)
	Update(ctx context.Context, arg sqlc.UpdateProductParams) (sqlc.Product, error)
	Delete(ctx context.Context, id int64) error
	GetByID(ctx context.Context, id int64) (sqlc.Product, error)
	GetBySlug(ctx context.Context, slug string) (sqlc.Product, error)
	GetDetailsBySlug(ctx context.Context, slug string) (ProductWithDetails, error)
	GetDetailsByID(ctx context.Context, id int64) (ProductWithDetails, error)
	List(ctx context.Context, filter ProductFilter) ([]ProductWithDetails, int64, error)

	// Images
	CreateImage(ctx context.Context, arg sqlc.CreateProductImageParams) (sqlc.ProductImage, error)
	DeleteImages(ctx context.Context, productID int64) error
	ListImages(ctx context.Context, productID int64) ([]sqlc.ProductImage, error)
	GetImageByID(ctx context.Context, id int64) (sqlc.ProductImage, error)
	DeleteImageByID(ctx context.Context, id int64, productID int64) error
	ClearPrimaryImage(ctx context.Context, productID int64) error
}

type productRepository struct {
	pool *pgxpool.Pool
	q    sqlc.Querier
}

// NewProductRepository creates a product repository instance
func NewProductRepository(pool *pgxpool.Pool, q sqlc.Querier) ProductRepository {
	return &productRepository{
		pool: pool,
		q:    q,
	}
}

func (r *productRepository) Create(ctx context.Context, arg sqlc.CreateProductParams) (sqlc.Product, error) {
	return r.q.CreateProduct(ctx, arg)
}

func (r *productRepository) Update(ctx context.Context, arg sqlc.UpdateProductParams) (sqlc.Product, error) {
	return r.q.UpdateProduct(ctx, arg)
}

func (r *productRepository) Delete(ctx context.Context, id int64) error {
	return r.q.DeleteProduct(ctx, id)
}

func (r *productRepository) GetByID(ctx context.Context, id int64) (sqlc.Product, error) {
	return r.q.GetProductByID(ctx, id)
}

func (r *productRepository) GetBySlug(ctx context.Context, slug string) (sqlc.Product, error) {
	return r.q.GetProductBySlug(ctx, slug)
}

func (r *productRepository) GetDetailsBySlug(ctx context.Context, slug string) (ProductWithDetails, error) {
	var details ProductWithDetails

	product, err := r.q.GetProductBySlug(ctx, slug)
	if err != nil {
		return details, err
	}
	details.Product = product

	// Fetch category details
	if product.CategoryID != nil {
		cat, err := r.q.GetCategoryByID(ctx, *product.CategoryID)
		if err == nil {
			details.CategoryName = &cat.Name
		}
	}

	// Fetch images
	imgs, err := r.q.ListProductImagesByProductID(ctx, product.ID)
	if err == nil {
		details.Images = imgs
	} else {
		details.Images = []sqlc.ProductImage{}
	}

	return details, nil
}

func (r *productRepository) GetDetailsByID(ctx context.Context, id int64) (ProductWithDetails, error) {
	var details ProductWithDetails

	product, err := r.q.GetProductByID(ctx, id)
	if err != nil {
		return details, err
	}
	details.Product = product

	// Fetch category details
	if product.CategoryID != nil {
		cat, err := r.q.GetCategoryByID(ctx, *product.CategoryID)
		if err == nil {
			details.CategoryName = &cat.Name
		}
	}

	// Fetch images
	imgs, err := r.q.ListProductImagesByProductID(ctx, product.ID)
	if err == nil {
		details.Images = imgs
	} else {
		details.Images = []sqlc.ProductImage{}
	}

	return details, nil
}

func (r *productRepository) List(ctx context.Context, filter ProductFilter) ([]ProductWithDetails, int64, error) {
	var conditions []string
	var args []interface{}
	argCount := 1

	// Base count and data sql builders
	whereClause := " WHERE 1=1"

	if filter.CategoryID != nil {
		conditions = append(conditions, fmt.Sprintf("p.category_id = $%d", argCount))
		args = append(args, *filter.CategoryID)
		argCount++
	}

	if filter.CategorySlug != nil && *filter.CategorySlug != "" {
		conditions = append(conditions, fmt.Sprintf("c.slug = $%d", argCount))
		args = append(args, *filter.CategorySlug)
		argCount++
	}

	if filter.Brand != nil && *filter.Brand != "" {
		conditions = append(conditions, fmt.Sprintf("LOWER(p.brand) = LOWER($%d)", argCount))
		args = append(args, *filter.Brand)
		argCount++
	}

	if filter.Gender != nil && *filter.Gender != "" {
		conditions = append(conditions, fmt.Sprintf("LOWER(p.gender) = LOWER($%d)", argCount))
		args = append(args, *filter.Gender)
		argCount++
	}

	if filter.FrameType != nil && *filter.FrameType != "" {
		conditions = append(conditions, fmt.Sprintf("LOWER(p.frame_type) = LOWER($%d)", argCount))
		args = append(args, *filter.FrameType)
		argCount++
	}

	if filter.Material != nil && *filter.Material != "" {
		conditions = append(conditions, fmt.Sprintf("LOWER(p.material) = LOWER($%d)", argCount))
		args = append(args, *filter.Material)
		argCount++
	}

	if filter.MinPrice != nil {
		conditions = append(conditions, fmt.Sprintf("p.price >= $%d", argCount))
		args = append(args, *filter.MinPrice)
		argCount++
	}

	if filter.MaxPrice != nil {
		conditions = append(conditions, fmt.Sprintf("p.price <= $%d", argCount))
		args = append(args, *filter.MaxPrice)
		argCount++
	}

	if filter.Status != nil && *filter.Status != "" {
		conditions = append(conditions, fmt.Sprintf("p.status = $%d", argCount))
		args = append(args, *filter.Status)
		argCount++
	}

	if filter.Search != nil && *filter.Search != "" {
		conditions = append(conditions, fmt.Sprintf("(p.name ILIKE $%d OR p.description ILIKE $%d OR p.brand ILIKE $%d)", argCount, argCount, argCount))
		args = append(args, "%"+*filter.Search+"%")
		argCount++
	}

	if len(conditions) > 0 {
		whereClause += " AND " + strings.Join(conditions, " AND ")
	}

	// 1. Get total matching count
	countQuery := "SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id = c.id" + whereClause
	var totalCount int64
	err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&totalCount)
	if err != nil {
		return nil, 0, err
	}

	// 2. Sort order logic
	orderBy := " ORDER BY p.created_at DESC"
	switch filter.SortBy {
	case "price_asc":
		orderBy = " ORDER BY p.price ASC"
	case "price_desc":
		orderBy = " ORDER BY p.price DESC"
	case "name_asc":
		orderBy = " ORDER BY p.name ASC"
	case "name_desc":
		orderBy = " ORDER BY p.name DESC"
	case "created_at_desc":
		orderBy = " ORDER BY p.created_at DESC"
	}

	// 3. Pagination limits and offsets
	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	pagination := fmt.Sprintf(" LIMIT %d OFFSET %d", limit, offset)

	dataQuery := `
		SELECT p.id, p.category_id, p.name, p.slug, p.description, p.price, p.sale_price, 
		       p.brand, p.frame_type, p.material, p.gender, p.stock, p.status, 
		       p.created_at, p.updated_at, c.name as category_name
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
	` + whereClause + orderBy + pagination

	rows, err := r.pool.Query(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var products []ProductWithDetails
	for rows.Next() {
		var p ProductWithDetails
		var catName *string
		err := rows.Scan(
			&p.ID,
			&p.CategoryID,
			&p.Name,
			&p.Slug,
			&p.Description,
			&p.Price,
			&p.SalePrice,
			&p.Brand,
			&p.FrameType,
			&p.Material,
			&p.Gender,
			&p.Stock,
			&p.Status,
			&p.CreatedAt,
			&p.UpdatedAt,
			&catName,
		)
		if err != nil {
			return nil, 0, err
		}
		p.CategoryName = catName
		products = append(products, p)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	// Batch load images for all products in a single query (avoids N+1)
	if len(products) > 0 {
		productIDs := make([]int64, len(products))
		for i, p := range products {
			productIDs[i] = p.ID
		}

		// Build batch image query
		imgQuery := "SELECT id, product_id, image_url, object_key, is_primary, created_at FROM product_images WHERE product_id = ANY($1) ORDER BY is_primary DESC, id ASC"
		imgRows, err := r.pool.Query(ctx, imgQuery, productIDs)
		if err == nil {
			defer imgRows.Close()
			imageMap := make(map[int64][]sqlc.ProductImage)
			for imgRows.Next() {
				var img sqlc.ProductImage
				if err := imgRows.Scan(&img.ID, &img.ProductID, &img.ImageUrl, &img.ObjectKey, &img.IsPrimary, &img.CreatedAt); err == nil {
					imageMap[img.ProductID] = append(imageMap[img.ProductID], img)
				}
			}
			for i, p := range products {
				if imgs, ok := imageMap[p.ID]; ok {
					products[i].Images = imgs
				} else {
					products[i].Images = []sqlc.ProductImage{}
				}
			}
		} else {
			for i := range products {
				products[i].Images = []sqlc.ProductImage{}
			}
		}
	}

	return products, totalCount, nil
}

// Images delegators
func (r *productRepository) CreateImage(ctx context.Context, arg sqlc.CreateProductImageParams) (sqlc.ProductImage, error) {
	return r.q.CreateProductImage(ctx, arg)
}

func (r *productRepository) DeleteImages(ctx context.Context, productID int64) error {
	return r.q.DeleteProductImagesByProductID(ctx, productID)
}

func (r *productRepository) ListImages(ctx context.Context, productID int64) ([]sqlc.ProductImage, error) {
	return r.q.ListProductImagesByProductID(ctx, productID)
}

func (r *productRepository) GetImageByID(ctx context.Context, id int64) (sqlc.ProductImage, error) {
	return r.q.GetProductImageByID(ctx, id)
}

func (r *productRepository) DeleteImageByID(ctx context.Context, id int64, productID int64) error {
	return r.q.DeleteProductImageByID(ctx, sqlc.DeleteProductImageByIDParams{
		ID:        id,
		ProductID: productID,
	})
}

func (r *productRepository) ClearPrimaryImage(ctx context.Context, productID int64) error {
	return r.q.ClearPrimaryProductImage(ctx, productID)
}
