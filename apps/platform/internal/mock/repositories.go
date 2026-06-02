package mock

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/cromatic-vision-optical/backend/internal/repository"
	"github.com/google/uuid"
)

// ─── Category Repository Mock ────────────────────────────────────────────────

type CategoryRepository struct {
	mu         sync.RWMutex
	categories []sqlc.Category
	nextID     int64
}

func NewCategoryRepository() *CategoryRepository {
	return &CategoryRepository{nextID: 1}
}

func (r *CategoryRepository) Create(_ context.Context, arg sqlc.CreateCategoryParams) (sqlc.Category, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	c := sqlc.Category{
		ID:          r.nextID,
		Name:        arg.Name,
		Slug:        arg.Slug,
		Description: arg.Description,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	r.nextID++
	r.categories = append(r.categories, c)
	return c, nil
}

func (r *CategoryRepository) Update(_ context.Context, arg sqlc.UpdateCategoryParams) (sqlc.Category, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, c := range r.categories {
		if c.ID == arg.ID {
			if arg.Name != nil {
				r.categories[i].Name = *arg.Name
			}
			if arg.Slug != nil {
				r.categories[i].Slug = *arg.Slug
			}
			if arg.Description != nil {
				r.categories[i].Description = arg.Description
			}
			r.categories[i].UpdatedAt = time.Now()
			return r.categories[i], nil
		}
	}
	return sqlc.Category{}, fmt.Errorf("category not found")
}

func (r *CategoryRepository) Delete(_ context.Context, id int64) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, c := range r.categories {
		if c.ID == id {
			r.categories = append(r.categories[:i], r.categories[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("category not found")
}

func (r *CategoryRepository) GetByID(_ context.Context, id int64) (sqlc.Category, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, c := range r.categories {
		if c.ID == id {
			return c, nil
		}
	}
	return sqlc.Category{}, fmt.Errorf("category not found")
}

func (r *CategoryRepository) GetBySlug(_ context.Context, slug string) (sqlc.Category, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, c := range r.categories {
		if c.Slug == slug {
			return c, nil
		}
	}
	return sqlc.Category{}, fmt.Errorf("category not found")
}

func (r *CategoryRepository) List(_ context.Context) ([]sqlc.Category, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	result := make([]sqlc.Category, len(r.categories))
	copy(result, r.categories)
	return result, nil
}

// ─── Product Repository Mock ─────────────────────────────────────────────────

type ProductRepository struct {
	mu       sync.RWMutex
	products []sqlc.Product
	images   []sqlc.ProductImage
	nextID   int64
	imgID    int64
	catRepo  *CategoryRepository
}

func NewProductRepository(catRepo *CategoryRepository) *ProductRepository {
	return &ProductRepository{nextID: 1, imgID: 1, catRepo: catRepo}
}

func (r *ProductRepository) Create(_ context.Context, arg sqlc.CreateProductParams) (sqlc.Product, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	p := sqlc.Product{
		ID:          r.nextID,
		CategoryID:  arg.CategoryID,
		Name:        arg.Name,
		Slug:        arg.Slug,
		Description: arg.Description,
		Price:       arg.Price,
		SalePrice:   arg.SalePrice,
		Brand:       arg.Brand,
		FrameType:   arg.FrameType,
		Material:    arg.Material,
		Gender:      arg.Gender,
		Stock:       arg.Stock,
		Status:      arg.Status,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	r.nextID++
	r.products = append(r.products, p)
	return p, nil
}

func (r *ProductRepository) Update(_ context.Context, arg sqlc.UpdateProductParams) (sqlc.Product, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, p := range r.products {
		if p.ID == arg.ID {
			if arg.Name != nil {
				r.products[i].Name = *arg.Name
			}
			if arg.Slug != nil {
				r.products[i].Slug = *arg.Slug
			}
			if arg.Description != nil {
				r.products[i].Description = *arg.Description
			}
			if arg.Price != nil {
				r.products[i].Price = *arg.Price
			}
			r.products[i].SalePrice = arg.SalePrice
			if arg.Brand != nil {
				r.products[i].Brand = *arg.Brand
			}
			if arg.FrameType != nil {
				r.products[i].FrameType = *arg.FrameType
			}
			if arg.Material != nil {
				r.products[i].Material = *arg.Material
			}
			if arg.Gender != nil {
				r.products[i].Gender = *arg.Gender
			}
			if arg.Stock != nil {
				r.products[i].Stock = *arg.Stock
			}
			if arg.Status != nil {
				r.products[i].Status = *arg.Status
			}
			r.products[i].CategoryID = arg.CategoryID
			r.products[i].UpdatedAt = time.Now()
			return r.products[i], nil
		}
	}
	return sqlc.Product{}, fmt.Errorf("product not found")
}

func (r *ProductRepository) Delete(_ context.Context, id int64) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, p := range r.products {
		if p.ID == id {
			r.products = append(r.products[:i], r.products[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("product not found")
}

func (r *ProductRepository) GetByID(_ context.Context, id int64) (sqlc.Product, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, p := range r.products {
		if p.ID == id {
			return p, nil
		}
	}
	return sqlc.Product{}, fmt.Errorf("product not found")
}

func (r *ProductRepository) GetBySlug(_ context.Context, slug string) (sqlc.Product, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, p := range r.products {
		if p.Slug == slug {
			return p, nil
		}
	}
	return sqlc.Product{}, fmt.Errorf("product not found")
}

func (r *ProductRepository) GetDetailsBySlug(ctx context.Context, slug string) (repository.ProductWithDetails, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, p := range r.products {
		if p.Slug == slug {
			return r.buildDetails(ctx, p), nil
		}
	}
	return repository.ProductWithDetails{}, fmt.Errorf("product not found")
}

func (r *ProductRepository) GetDetailsByID(ctx context.Context, id int64) (repository.ProductWithDetails, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, p := range r.products {
		if p.ID == id {
			return r.buildDetails(ctx, p), nil
		}
	}
	return repository.ProductWithDetails{}, fmt.Errorf("product not found")
}

func (r *ProductRepository) buildDetails(_ context.Context, p sqlc.Product) repository.ProductWithDetails {
	var catName *string
	if p.CategoryID != nil {
		for _, c := range r.catRepo.categories {
			if c.ID == *p.CategoryID {
				catName = &c.Name
				break
			}
		}
	}
	var imgs []sqlc.ProductImage
	for _, img := range r.images {
		if img.ProductID == p.ID {
			imgs = append(imgs, img)
		}
	}
	return repository.ProductWithDetails{
		Product:      p,
		CategoryName: catName,
		Images:       imgs,
	}
}

func (r *ProductRepository) List(_ context.Context, filter repository.ProductFilter) ([]repository.ProductWithDetails, int64, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var filtered []sqlc.Product
	for _, p := range r.products {
		if filter.Status != nil && p.Status != *filter.Status {
			continue
		}
		if filter.CategoryID != nil && (p.CategoryID == nil || *p.CategoryID != *filter.CategoryID) {
			continue
		}
		if filter.Brand != nil && p.Brand != *filter.Brand {
			continue
		}
		if filter.Gender != nil && p.Gender != *filter.Gender {
			continue
		}
		if filter.Search != nil && !strings.Contains(strings.ToLower(p.Name), strings.ToLower(*filter.Search)) {
			continue
		}
		filtered = append(filtered, p)
	}

	total := int64(len(filtered))

	// Pagination
	start := int(filter.Page-1) * int(filter.Limit)
	if start > len(filtered) {
		start = len(filtered)
	}
	end := start + int(filter.Limit)
	if end > len(filtered) {
		end = len(filtered)
	}
	paged := filtered[start:end]

	var results []repository.ProductWithDetails
	for _, p := range paged {
		var catName *string
		if p.CategoryID != nil {
			for _, c := range r.catRepo.categories {
				if c.ID == *p.CategoryID {
					catName = &c.Name
					break
				}
			}
		}
		var imgs []sqlc.ProductImage
		for _, img := range r.images {
			if img.ProductID == p.ID {
				imgs = append(imgs, img)
			}
		}
		results = append(results, repository.ProductWithDetails{
			Product:      p,
			CategoryName: catName,
			Images:       imgs,
		})
	}

	return results, total, nil
}

func (r *ProductRepository) CreateImage(_ context.Context, arg sqlc.CreateProductImageParams) (sqlc.ProductImage, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	img := sqlc.ProductImage{
		ID:        r.imgID,
		ProductID: arg.ProductID,
		ImageUrl:  arg.ImageUrl,
		IsPrimary: arg.IsPrimary,
		ObjectKey: arg.ObjectKey,
		CreatedAt: time.Now(),
	}
	r.imgID++
	r.images = append(r.images, img)
	return img, nil
}

func (r *ProductRepository) DeleteImages(_ context.Context, productID int64) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	var kept []sqlc.ProductImage
	for _, img := range r.images {
		if img.ProductID != productID {
			kept = append(kept, img)
		}
	}
	r.images = kept
	return nil
}

func (r *ProductRepository) ListImages(_ context.Context, productID int64) ([]sqlc.ProductImage, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var result []sqlc.ProductImage
	for _, img := range r.images {
		if img.ProductID == productID {
			result = append(result, img)
		}
	}
	return result, nil
}

func (r *ProductRepository) GetImageByID(_ context.Context, id int64) (sqlc.ProductImage, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, img := range r.images {
		if img.ID == id {
			return img, nil
		}
	}
	return sqlc.ProductImage{}, fmt.Errorf("image not found")
}

func (r *ProductRepository) DeleteImageByID(_ context.Context, id int64, productID int64) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, img := range r.images {
		if img.ID == id && img.ProductID == productID {
			r.images = append(r.images[:i], r.images[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("image not found")
}

func (r *ProductRepository) ClearPrimaryImage(_ context.Context, productID int64) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, img := range r.images {
		if img.ProductID == productID {
			r.images[i].IsPrimary = false
		}
	}
	return nil
}

// ─── Cart Repository Mock ────────────────────────────────────────────────────

type CartRepository struct {
	mu       sync.RWMutex
	carts    []sqlc.Cart
	items    []sqlc.CartItem
	cartID   int64
	itemID   int64
	prodRepo *ProductRepository
}

func NewCartRepository(prodRepo *ProductRepository) *CartRepository {
	return &CartRepository{cartID: 1, itemID: 1, prodRepo: prodRepo}
}

func (r *CartRepository) GetByUserID(_ context.Context, userID uuid.UUID) (sqlc.Cart, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, c := range r.carts {
		if c.UserID == userID {
			return c, nil
		}
	}
	return sqlc.Cart{}, fmt.Errorf("cart not found")
}

func (r *CartRepository) Create(_ context.Context, userID uuid.UUID) (sqlc.Cart, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	c := sqlc.Cart{
		ID:        r.cartID,
		UserID:    userID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	r.cartID++
	r.carts = append(r.carts, c)
	return c, nil
}

func (r *CartRepository) GetItemByProduct(_ context.Context, cartID int64, productID int64) (sqlc.CartItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, item := range r.items {
		if item.CartID == cartID && item.ProductID == productID {
			return item, nil
		}
	}
	return sqlc.CartItem{}, fmt.Errorf("cart item not found")
}

func (r *CartRepository) CreateItem(_ context.Context, arg sqlc.CreateCartItemParams) (sqlc.CartItem, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	item := sqlc.CartItem{
		ID:        r.itemID,
		CartID:    arg.CartID,
		ProductID: arg.ProductID,
		Quantity:  arg.Quantity,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	r.itemID++
	r.items = append(r.items, item)
	return item, nil
}

func (r *CartRepository) UpdateItemQuantity(_ context.Context, arg sqlc.UpdateCartItemQuantityParams) (sqlc.CartItem, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, item := range r.items {
		if item.ID == arg.ID {
			r.items[i].Quantity = arg.Quantity
			r.items[i].UpdatedAt = time.Now()
			return r.items[i], nil
		}
	}
	return sqlc.CartItem{}, fmt.Errorf("cart item not found")
}

func (r *CartRepository) DeleteItem(_ context.Context, arg sqlc.DeleteCartItemParams) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, item := range r.items {
		if item.ID == arg.ID && item.CartID == arg.CartID {
			r.items = append(r.items[:i], r.items[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("cart item not found")
}

func (r *CartRepository) ClearCart(_ context.Context, cartID int64) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	var kept []sqlc.CartItem
	for _, item := range r.items {
		if item.CartID != cartID {
			kept = append(kept, item)
		}
	}
	r.items = kept
	return nil
}

func (r *CartRepository) GetItemByID(_ context.Context, id int64) (sqlc.CartItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, item := range r.items {
		if item.ID == id {
			return item, nil
		}
	}
	return sqlc.CartItem{}, fmt.Errorf("cart item not found")
}

func (r *CartRepository) ListItemsDetailed(_ context.Context, cartID int64) ([]sqlc.ListCartItemsDetailedRow, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var results []sqlc.ListCartItemsDetailedRow
	for _, item := range r.items {
		if item.CartID == cartID {
			// Find product details
			var row sqlc.ListCartItemsDetailedRow
			row.ID = item.ID
			row.CartID = item.CartID
			row.ProductID = item.ProductID
			row.Quantity = item.Quantity
			row.CreatedAt = item.CreatedAt
			row.UpdatedAt = item.UpdatedAt
			for _, p := range r.prodRepo.products {
				if p.ID == item.ProductID {
					row.ProductName = p.Name
					row.ProductPrice = p.Price
					row.ProductSalePrice = p.SalePrice
					row.ProductSlug = p.Slug
					row.ProductBrand = p.Brand
					row.ProductStock = p.Stock
					break
				}
			}
			results = append(results, row)
		}
	}
	return results, nil
}

// ─── Order Repository Mock ───────────────────────────────────────────────────

type OrderRepository struct {
	mu         sync.RWMutex
	orders     []sqlc.Order
	orderItems []sqlc.OrderItem
	nextID     int64
	nextItemID int64
	users      *UserRepository
}

func NewOrderRepository(users *UserRepository) *OrderRepository {
	return &OrderRepository{nextID: 1, nextItemID: 1, users: users}
}

func (r *OrderRepository) Create(_ context.Context, arg sqlc.CreateOrderParams) (sqlc.Order, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	o := sqlc.Order{
		ID:              r.nextID,
		UserID:          arg.UserID,
		Status:          arg.Status,
		TotalAmount:     arg.TotalAmount,
		TrackingNumber:  arg.TrackingNumber,
		ShippingAddress: arg.ShippingAddress,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}
	r.nextID++
	r.orders = append(r.orders, o)
	return o, nil
}

func (r *OrderRepository) CreateItem(_ context.Context, arg sqlc.CreateOrderItemParams) (sqlc.OrderItem, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	item := sqlc.OrderItem{
		ID:              r.nextItemID,
		OrderID:         arg.OrderID,
		ProductID:       arg.ProductID,
		Quantity:        arg.Quantity,
		Price:           arg.Price,
		ProductSnapshot: arg.ProductSnapshot,
	}
	r.nextItemID++
	r.orderItems = append(r.orderItems, item)
	return item, nil
}

func (r *OrderRepository) GetByID(_ context.Context, id int64) (sqlc.Order, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, o := range r.orders {
		if o.ID == id {
			return o, nil
		}
	}
	return sqlc.Order{}, fmt.Errorf("order not found")
}

func (r *OrderRepository) ListByUserID(_ context.Context, userID uuid.UUID, limit, offset int32) ([]sqlc.Order, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var result []sqlc.Order
	for _, o := range r.orders {
		if o.UserID == userID {
			result = append(result, o)
		}
	}
	start := int(offset)
	if start > len(result) {
		return nil, nil
	}
	end := start + int(limit)
	if end > len(result) {
		end = len(result)
	}
	return result[start:end], nil
}

func (r *OrderRepository) ListAllPaged(_ context.Context, limit, offset int32) ([]sqlc.Order, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	start := int(offset)
	if start > len(r.orders) {
		return nil, nil
	}
	end := start + int(limit)
	if end > len(r.orders) {
		end = len(r.orders)
	}
	result := make([]sqlc.Order, end-start)
	copy(result, r.orders[start:end])
	return result, nil
}

func (r *OrderRepository) AdminListOrdersPaged(_ context.Context, limit, offset int32) ([]sqlc.AdminListOrdersPagedRow, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	start := int(offset)
	if start > len(r.orders) {
		return nil, nil
	}
	end := start + int(limit)
	if end > len(r.orders) {
		end = len(r.orders)
	}
	var result []sqlc.AdminListOrdersPagedRow
	for _, o := range r.orders[start:end] {
		user, _ := r.users.GetByID(context.Background(), o.UserID)
		result = append(result, sqlc.AdminListOrdersPagedRow{
			ID:              o.ID,
			UserID:          o.UserID,
			Status:          o.Status,
			TotalAmount:     o.TotalAmount,
			TrackingNumber:  o.TrackingNumber,
			ShippingAddress: o.ShippingAddress,
			CreatedAt:       o.CreatedAt,
			UpdatedAt:       o.UpdatedAt,
			UserName:        user.Name,
			UserEmail:       user.Email,
		})
	}
	return result, nil
}

func (r *OrderRepository) AdminGetOrderDetails(_ context.Context, orderID int64) (sqlc.AdminGetOrderDetailsRow, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, o := range r.orders {
		if o.ID == orderID {
			user, _ := r.users.GetByID(context.Background(), o.UserID)
			return sqlc.AdminGetOrderDetailsRow{
				ID:              o.ID,
				UserID:          o.UserID,
				Status:          o.Status,
				TotalAmount:     o.TotalAmount,
				TrackingNumber:  o.TrackingNumber,
				ShippingAddress: o.ShippingAddress,
				CreatedAt:       o.CreatedAt,
				UpdatedAt:       o.UpdatedAt,
				UserName:        user.Name,
				UserEmail:       user.Email,
			}, nil
		}
	}
	return sqlc.AdminGetOrderDetailsRow{}, fmt.Errorf("order not found")
}

func (r *OrderRepository) ListOrderItems(_ context.Context, orderID int64) ([]sqlc.OrderItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var result []sqlc.OrderItem
	for _, item := range r.orderItems {
		if item.OrderID == orderID {
			result = append(result, item)
		}
	}
	return result, nil
}

func (r *OrderRepository) UpdateStatus(_ context.Context, orderID int64, status string) (sqlc.Order, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, o := range r.orders {
		if o.ID == orderID {
			r.orders[i].Status = status
			r.orders[i].UpdatedAt = time.Now()
			return r.orders[i], nil
		}
	}
	return sqlc.Order{}, fmt.Errorf("order not found")
}

func (r *OrderRepository) CreateOrderWithTx(
	ctx context.Context,
	userID uuid.UUID,
	totalAmount float64,
	trackingNum string,
	shippingAddress string,
	items []repository.OrderItemTxParam,
) (sqlc.Order, []sqlc.OrderItem, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	order := sqlc.Order{
		ID:              r.nextID,
		UserID:          userID,
		Status:          "PENDING",
		TotalAmount:     totalAmount,
		TrackingNumber:  &trackingNum,
		ShippingAddress: shippingAddress,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}
	r.nextID++
	r.orders = append(r.orders, order)

	var orderItems []sqlc.OrderItem
	for _, item := range items {
		oi := sqlc.OrderItem{
			ID:              r.nextItemID,
			OrderID:         order.ID,
			ProductID:       item.ProductID,
			Quantity:        item.Quantity,
			Price:           item.Price,
			ProductSnapshot: item.ProductSnapshot,
		}
		r.nextItemID++
		r.orderItems = append(r.orderItems, oi)
		orderItems = append(orderItems, oi)
	}

	return order, orderItems, nil
}

// ─── Prescription Repository Mock ────────────────────────────────────────────

type PrescriptionRepository struct {
	mu            sync.RWMutex
	prescriptions []sqlc.Prescription
	nextID        int64
	users         *UserRepository
}

func NewPrescriptionRepository(users *UserRepository) *PrescriptionRepository {
	return &PrescriptionRepository{nextID: 1, users: users}
}

func (r *PrescriptionRepository) Create(_ context.Context, arg sqlc.CreatePrescriptionParams) (sqlc.Prescription, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	rx := sqlc.Prescription{
		ID:               r.nextID,
		OrderID:          arg.OrderID,
		UserID:           arg.UserID,
		PrescriptionType: arg.PrescriptionType,
		FileUrl:          arg.FileUrl,
		ObjectKey:        arg.ObjectKey,
		Notes:            arg.Notes,
		Status:           "pending",
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
	r.nextID++
	r.prescriptions = append(r.prescriptions, rx)
	return rx, nil
}

func (r *PrescriptionRepository) GetByID(_ context.Context, id int64) (sqlc.Prescription, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, rx := range r.prescriptions {
		if rx.ID == id {
			return rx, nil
		}
	}
	return sqlc.Prescription{}, fmt.Errorf("prescription not found")
}

func (r *PrescriptionRepository) GetByIDAndUserID(_ context.Context, id int64, userID uuid.UUID) (sqlc.Prescription, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, rx := range r.prescriptions {
		if rx.ID == id && rx.UserID == userID {
			return rx, nil
		}
	}
	return sqlc.Prescription{}, fmt.Errorf("prescription not found")
}

func (r *PrescriptionRepository) ListByUserID(_ context.Context, userID uuid.UUID) ([]sqlc.Prescription, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var result []sqlc.Prescription
	for _, rx := range r.prescriptions {
		if rx.UserID == userID {
			result = append(result, rx)
		}
	}
	return result, nil
}

func (r *PrescriptionRepository) ListAll(_ context.Context) ([]sqlc.Prescription, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	result := make([]sqlc.Prescription, len(r.prescriptions))
	copy(result, r.prescriptions)
	return result, nil
}

func (r *PrescriptionRepository) AdminListAllPrescriptions(_ context.Context) ([]sqlc.AdminListAllPrescriptionsRow, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var result []sqlc.AdminListAllPrescriptionsRow
	for _, rx := range r.prescriptions {
		user, _ := r.users.GetByID(context.Background(), rx.UserID)
		result = append(result, sqlc.AdminListAllPrescriptionsRow{
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
			UserName:         user.Name,
			UserEmail:        user.Email,
		})
	}
	return result, nil
}

func (r *PrescriptionRepository) UpdateStatus(_ context.Context, id int64, status string) (sqlc.Prescription, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, rx := range r.prescriptions {
		if rx.ID == id {
			r.prescriptions[i].Status = status
			r.prescriptions[i].UpdatedAt = time.Now()
			return r.prescriptions[i], nil
		}
	}
	return sqlc.Prescription{}, fmt.Errorf("prescription not found")
}

func (r *PrescriptionRepository) ListByOrderID(_ context.Context, orderID int64) ([]sqlc.Prescription, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var result []sqlc.Prescription
	for _, rx := range r.prescriptions {
		if rx.OrderID == orderID {
			result = append(result, rx)
		}
	}
	return result, nil
}

func (r *PrescriptionRepository) AdminGetPrescriptionByID(_ context.Context, id int64) (sqlc.AdminGetPrescriptionByIDRow, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, rx := range r.prescriptions {
		if rx.ID == id {
			user, _ := r.users.GetByID(context.Background(), rx.UserID)
			return sqlc.AdminGetPrescriptionByIDRow{
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
				UserName:         user.Name,
				UserEmail:        user.Email,
			}, nil
		}
	}
	return sqlc.AdminGetPrescriptionByIDRow{}, fmt.Errorf("prescription not found")
}

// ─── Payment Repository Mock ─────────────────────────────────────────────────

type PaymentRepository struct {
	mu       sync.RWMutex
	payments []sqlc.Payment
	nextID   int64
}

func NewPaymentRepository() *PaymentRepository {
	return &PaymentRepository{nextID: 1}
}

func (r *PaymentRepository) Create(_ context.Context, arg sqlc.CreatePaymentParams) (sqlc.Payment, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	p := sqlc.Payment{
		ID:              r.nextID,
		OrderID:         arg.OrderID,
		UserID:          arg.UserID,
		Provider:        arg.Provider,
		ProviderOrderID: arg.ProviderOrderID,
		Amount:          arg.Amount,
		Status:          arg.Status,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}
	r.nextID++
	r.payments = append(r.payments, p)
	return p, nil
}

func (r *PaymentRepository) GetByID(_ context.Context, id int64) (sqlc.Payment, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, p := range r.payments {
		if p.ID == id {
			return p, nil
		}
	}
	return sqlc.Payment{}, fmt.Errorf("payment not found")
}

func (r *PaymentRepository) GetByProviderOrderID(_ context.Context, providerOrderID string) (sqlc.Payment, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, p := range r.payments {
		if p.ProviderOrderID == providerOrderID {
			return p, nil
		}
	}
	return sqlc.Payment{}, fmt.Errorf("payment not found")
}

func (r *PaymentRepository) GetByProviderPaymentID(_ context.Context, providerPaymentID *string) (sqlc.Payment, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if providerPaymentID == nil {
		return sqlc.Payment{}, fmt.Errorf("payment not found")
	}
	for _, p := range r.payments {
		if p.ProviderPaymentID != nil && *p.ProviderPaymentID == *providerPaymentID {
			return p, nil
		}
	}
	return sqlc.Payment{}, fmt.Errorf("payment not found")
}

func (r *PaymentRepository) UpdateStatus(_ context.Context, id int64, status string) (sqlc.Payment, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, p := range r.payments {
		if p.ID == id {
			r.payments[i].Status = status
			r.payments[i].UpdatedAt = time.Now()
			return r.payments[i], nil
		}
	}
	return sqlc.Payment{}, fmt.Errorf("payment not found")
}

func (r *PaymentRepository) UpdateStatusAndPaymentID(_ context.Context, id int64, status string, providerPaymentID *string) (sqlc.Payment, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, p := range r.payments {
		if p.ID == id {
			r.payments[i].Status = status
			r.payments[i].ProviderPaymentID = providerPaymentID
			r.payments[i].UpdatedAt = time.Now()
			return r.payments[i], nil
		}
	}
	return sqlc.Payment{}, fmt.Errorf("payment not found")
}

func (r *PaymentRepository) ListByUserID(_ context.Context, userID uuid.UUID) ([]sqlc.Payment, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var result []sqlc.Payment
	for _, p := range r.payments {
		if p.UserID == userID {
			result = append(result, p)
		}
	}
	return result, nil
}

func (r *PaymentRepository) ProcessPaymentCapture(_ context.Context, providerOrderID string, providerPaymentID string) (sqlc.Payment, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, p := range r.payments {
		if p.ProviderOrderID == providerOrderID {
			r.payments[i].Status = "captured"
			r.payments[i].ProviderPaymentID = &providerPaymentID
			r.payments[i].UpdatedAt = time.Now()
			return r.payments[i], nil
		}
	}
	return sqlc.Payment{}, fmt.Errorf("payment not found")
}

// ─── Invoice Repository Mock ─────────────────────────────────────────────────

type InvoiceRepository struct {
	mu       sync.RWMutex
	invoices []sqlc.Invoice
	nextID   int64
}

func NewInvoiceRepository() *InvoiceRepository {
	return &InvoiceRepository{nextID: 1}
}

func (r *InvoiceRepository) Create(_ context.Context, arg sqlc.CreateInvoiceParams) (sqlc.Invoice, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	inv := sqlc.Invoice{
		ID:            r.nextID,
		OrderID:       arg.OrderID,
		InvoiceNumber: arg.InvoiceNumber,
		InvoiceUrl:    arg.InvoiceUrl,
		Status:        arg.Status,
		CreatedAt:     time.Now(),
	}
	r.nextID++
	r.invoices = append(r.invoices, inv)
	return inv, nil
}

func (r *InvoiceRepository) GetByID(_ context.Context, id int64) (sqlc.Invoice, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, inv := range r.invoices {
		if inv.ID == id {
			return inv, nil
		}
	}
	return sqlc.Invoice{}, fmt.Errorf("invoice not found")
}

func (r *InvoiceRepository) GetByIDAndUserID(_ context.Context, id int64, userID uuid.UUID) (sqlc.Invoice, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	// In mock, we don't track invoice-to-user directly; find via order
	for _, inv := range r.invoices {
		if inv.ID == id {
			return inv, nil
		}
	}
	return sqlc.Invoice{}, fmt.Errorf("invoice not found")
}

func (r *InvoiceRepository) GetByOrderID(_ context.Context, orderID int64) (sqlc.Invoice, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, inv := range r.invoices {
		if inv.OrderID == orderID {
			return inv, nil
		}
	}
	return sqlc.Invoice{}, fmt.Errorf("invoice not found")
}

func (r *InvoiceRepository) ListByUserID(_ context.Context, userID uuid.UUID) ([]sqlc.Invoice, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	// Return all for mock (simplification)
	result := make([]sqlc.Invoice, len(r.invoices))
	copy(result, r.invoices)
	return result, nil
}

func (r *InvoiceRepository) ListAll(_ context.Context) ([]sqlc.Invoice, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	result := make([]sqlc.Invoice, len(r.invoices))
	copy(result, r.invoices)
	return result, nil
}

func (r *InvoiceRepository) UpdateStatus(_ context.Context, id int64, status string) (sqlc.Invoice, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, inv := range r.invoices {
		if inv.ID == id {
			r.invoices[i].Status = status
			return r.invoices[i], nil
		}
	}
	return sqlc.Invoice{}, fmt.Errorf("invoice not found")
}

// ─── User Repository Mock ────────────────────────────────────────────────────

type UserRepository struct {
	mu     sync.RWMutex
	users  []sqlc.User
	nextID atomic.Int64
}

func NewUserRepository() *UserRepository {
	return &UserRepository{}
}

func (r *UserRepository) GetByID(_ context.Context, id uuid.UUID) (sqlc.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, u := range r.users {
		if u.ID == id {
			return u, nil
		}
	}
	return sqlc.User{}, fmt.Errorf("user not found")
}

// AddUser is a helper for seeding mock users
func (r *UserRepository) AddUser(user sqlc.User) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.users = append(r.users, user)
}

// GetByEmail finds user by email (used by mock querier for auth)
func (r *UserRepository) GetByEmail(_ context.Context, email string) (sqlc.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, u := range r.users {
		if u.Email == email {
			return u, nil
		}
	}
	return sqlc.User{}, fmt.Errorf("user not found")
}

// ListAll returns all users (for admin endpoints)
func (r *UserRepository) ListAll() []sqlc.User {
	r.mu.RLock()
	defer r.mu.RUnlock()
	result := make([]sqlc.User, len(r.users))
	copy(result, r.users)
	return result
}
