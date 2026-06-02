package service

import (
	"context"
	"errors"

	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/cromatic-vision-optical/backend/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var (
	ErrCartItemNotFound = errors.New("cart item not found")
	ErrOutOfStock       = errors.New("requested quantity exceeds available stock")
	ErrInvalidQuantity  = errors.New("quantity must be greater than zero")
)

type CartItemResponse struct {
	ID        int64   `json:"id"`
	ProductID int64   `json:"product_id"`
	Quantity  int32   `json:"quantity"`
	Name      string  `json:"name"`
	Price     float64 `json:"price"`
	Slug      string  `json:"slug"`
	Brand     string  `json:"brand"`
	Stock     int32   `json:"stock"`
	Subtotal  float64 `json:"subtotal"`
}

type CartResponse struct {
	ID          int64              `json:"id"`
	UserID      uuid.UUID          `json:"user_id"`
	Items       []CartItemResponse `json:"items"`
	TotalAmount float64            `json:"total_amount"`
	TotalCount  int32              `json:"total_count"`
}

// CartService defines orchestrations for shopping carts
type CartService interface {
	GetOrCreateCart(ctx context.Context, userID uuid.UUID) (CartResponse, error)
	AddItem(ctx context.Context, userID uuid.UUID, productID int64, qty int32) (CartResponse, error)
	UpdateQuantity(ctx context.Context, userID uuid.UUID, itemID int64, qty int32) (CartResponse, error)
	RemoveItem(ctx context.Context, userID uuid.UUID, itemID int64) (CartResponse, error)
}

type cartService struct {
	cartRepo repository.CartRepository
	prodRepo repository.ProductRepository
}

// NewCartService returns an instance of CartService
func NewCartService(cartRepo repository.CartRepository, prodRepo repository.ProductRepository) CartService {
	return &cartService{
		cartRepo: cartRepo,
		prodRepo: prodRepo,
	}
}

func (s *cartService) GetOrCreateCart(ctx context.Context, userID uuid.UUID) (CartResponse, error) {
	cart, err := s.cartRepo.GetByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			cart, err = s.cartRepo.Create(ctx, userID)
			if err != nil {
				return CartResponse{}, err
			}
		} else {
			return CartResponse{}, err
		}
	}

	return s.assembleCartResponse(ctx, cart)
}

func (s *cartService) AddItem(ctx context.Context, userID uuid.UUID, productID int64, qty int32) (CartResponse, error) {
	if qty <= 0 {
		return CartResponse{}, ErrInvalidQuantity
	}

	// 1. Get product and check stock
	product, err := s.prodRepo.GetByID(ctx, productID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return CartResponse{}, ErrProductNotFound
		}
		return CartResponse{}, err
	}

	if product.Status != "active" {
		return CartResponse{}, errors.New("product is not available")
	}

	// 2. Get or create cart
	cart, err := s.cartRepo.GetByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			cart, err = s.cartRepo.Create(ctx, userID)
			if err != nil {
				return CartResponse{}, err
			}
		} else {
			return CartResponse{}, err
		}
	}

	// 3. See if product already exists in cart item list
	existingItem, err := s.cartRepo.GetItemByProduct(ctx, cart.ID, productID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Create new cart item
			if qty > product.Stock {
				return CartResponse{}, ErrOutOfStock
			}
			_, err = s.cartRepo.CreateItem(ctx, sqlc.CreateCartItemParams{
				CartID:    cart.ID,
				ProductID: productID,
				Quantity:  qty,
			})
			if err != nil {
				return CartResponse{}, err
			}
		} else {
			return CartResponse{}, err
		}
	} else {
		// Update existing item
		newQty := existingItem.Quantity + qty
		if newQty > product.Stock {
			return CartResponse{}, ErrOutOfStock
		}
		_, err = s.cartRepo.UpdateItemQuantity(ctx, sqlc.UpdateCartItemQuantityParams{
			ID:       existingItem.ID,
			Quantity: newQty,
		})
		if err != nil {
			return CartResponse{}, err
		}
	}

	return s.assembleCartResponse(ctx, cart)
}

func (s *cartService) UpdateQuantity(ctx context.Context, userID uuid.UUID, itemID int64, qty int32) (CartResponse, error) {
	if qty <= 0 {
		return CartResponse{}, ErrInvalidQuantity
	}

	// 1. Fetch cart
	cart, err := s.cartRepo.GetByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return CartResponse{}, ErrCartItemNotFound
		}
		return CartResponse{}, err
	}

	// 2. Verify item exists and belongs to this cart
	item, err := s.cartRepo.GetItemByID(ctx, itemID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return CartResponse{}, ErrCartItemNotFound
		}
		return CartResponse{}, err
	}

	if item.CartID != cart.ID {
		return CartResponse{}, ErrCartItemNotFound
	}

	// 3. Verify stock
	product, err := s.prodRepo.GetByID(ctx, item.ProductID)
	if err != nil {
		return CartResponse{}, err
	}

	if qty > product.Stock {
		return CartResponse{}, ErrOutOfStock
	}

	// 4. Perform update
	_, err = s.cartRepo.UpdateItemQuantity(ctx, sqlc.UpdateCartItemQuantityParams{
		ID:       itemID,
		Quantity: qty,
	})
	if err != nil {
		return CartResponse{}, err
	}

	return s.assembleCartResponse(ctx, cart)
}

func (s *cartService) RemoveItem(ctx context.Context, userID uuid.UUID, itemID int64) (CartResponse, error) {
	// 1. Fetch cart
	cart, err := s.cartRepo.GetByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return CartResponse{}, ErrCartItemNotFound
		}
		return CartResponse{}, err
	}

	// 2. Fetch item to verify it belongs to this cart
	item, err := s.cartRepo.GetItemByID(ctx, itemID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return CartResponse{}, ErrCartItemNotFound
		}
		return CartResponse{}, err
	}

	if item.CartID != cart.ID {
		return CartResponse{}, ErrCartItemNotFound
	}

	// 3. Complete deletion
	err = s.cartRepo.DeleteItem(ctx, sqlc.DeleteCartItemParams{
		ID:     itemID,
		CartID: cart.ID,
	})
	if err != nil {
		return CartResponse{}, err
	}

	return s.assembleCartResponse(ctx, cart)
}

// Helpers
func (s *cartService) assembleCartResponse(ctx context.Context, cart sqlc.Cart) (CartResponse, error) {
	dbItems, err := s.cartRepo.ListItemsDetailed(ctx, cart.ID)
	if err != nil {
		return CartResponse{}, err
	}

	var items []CartItemResponse
	var totalAmt float64
	var totalCount int32

	for _, dbItem := range dbItems {
		price := dbItem.ProductPrice
		if dbItem.ProductSalePrice != nil {
			price = *dbItem.ProductSalePrice
		}

		subtotal := price * float64(dbItem.Quantity)
		totalAmt += subtotal
		totalCount += dbItem.Quantity

		items = append(items, CartItemResponse{
			ID:        dbItem.ID,
			ProductID: dbItem.ProductID,
			Quantity:  dbItem.Quantity,
			Name:      dbItem.ProductName,
			Price:     price,
			Slug:      dbItem.ProductSlug,
			Brand:     dbItem.ProductBrand,
			Stock:     dbItem.ProductStock,
			Subtotal:  subtotal,
		})
	}

	// If no items, make an empty slice rather than nil for JSON consistency
	if items == nil {
		items = []CartItemResponse{}
	}

	return CartResponse{
		ID:          cart.ID,
		UserID:      cart.UserID,
		Items:       items,
		TotalAmount: totalAmt,
		TotalCount:  totalCount,
	}, nil
}
