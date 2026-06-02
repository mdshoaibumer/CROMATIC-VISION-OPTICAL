package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/cromatic-vision-optical/backend/internal/redis"
	"github.com/cromatic-vision-optical/backend/internal/repository"
)

const (
	productCacheTTL = 5 * time.Minute
	productListKey  = "products:list:%s"
	productSlugKey  = "products:slug:%s"
	productIDKey    = "products:id:%d"
)

// CachedProductService wraps ProductService with Redis caching
type cachedProductService struct {
	inner ProductService
	cache *redis.RedisClient
}

// NewCachedProductService creates a caching decorator around a ProductService
func NewCachedProductService(inner ProductService, cache *redis.RedisClient) ProductService {
	return &cachedProductService{
		inner: inner,
		cache: cache,
	}
}

func (s *cachedProductService) Create(ctx context.Context, p sqlc.CreateProductParams, images []string) (repository.ProductWithDetails, error) {
	result, err := s.inner.Create(ctx, p, images)
	if err == nil {
		s.invalidateListCache(ctx)
	}
	return result, err
}

func (s *cachedProductService) Update(ctx context.Context, id int64, p sqlc.UpdateProductParams, images *[]string) (repository.ProductWithDetails, error) {
	result, err := s.inner.Update(ctx, id, p, images)
	if err == nil {
		s.invalidateProductCache(ctx, id, result.Slug)
		s.invalidateListCache(ctx)
	}
	return result, err
}

func (s *cachedProductService) Delete(ctx context.Context, id int64) error {
	// Get product first to know slug for cache invalidation
	product, _ := s.inner.GetByID(ctx, id)
	err := s.inner.Delete(ctx, id)
	if err == nil {
		s.invalidateProductCache(ctx, id, product.Slug)
		s.invalidateListCache(ctx)
	}
	return err
}

func (s *cachedProductService) GetByID(ctx context.Context, id int64) (repository.ProductWithDetails, error) {
	cacheKey := fmt.Sprintf(productIDKey, id)

	// Try cache first
	cached, err := s.cache.Client.Get(ctx, cacheKey).Result()
	if err == nil {
		var product repository.ProductWithDetails
		if json.Unmarshal([]byte(cached), &product) == nil {
			return product, nil
		}
	}

	// Cache miss — fetch from DB
	product, err := s.inner.GetByID(ctx, id)
	if err != nil {
		return product, err
	}

	// Store in cache
	if data, err := json.Marshal(product); err == nil {
		s.cache.Client.Set(ctx, cacheKey, data, productCacheTTL)
	}

	return product, nil
}

func (s *cachedProductService) GetBySlug(ctx context.Context, slug string) (repository.ProductWithDetails, error) {
	cacheKey := fmt.Sprintf(productSlugKey, slug)

	// Try cache first
	cached, err := s.cache.Client.Get(ctx, cacheKey).Result()
	if err == nil {
		var product repository.ProductWithDetails
		if json.Unmarshal([]byte(cached), &product) == nil {
			return product, nil
		}
	}

	// Cache miss — fetch from DB
	product, err := s.inner.GetBySlug(ctx, slug)
	if err != nil {
		return product, err
	}

	// Store in cache
	if data, err := json.Marshal(product); err == nil {
		s.cache.Client.Set(ctx, cacheKey, data, productCacheTTL)
	}

	return product, nil
}

func (s *cachedProductService) List(ctx context.Context, filter repository.ProductFilter) ([]repository.ProductWithDetails, int64, error) {
	// Generate cache key from filter parameters
	filterKey, _ := json.Marshal(filter)
	cacheKey := fmt.Sprintf(productListKey, string(filterKey))

	// Try cache first
	cached, err := s.cache.Client.Get(ctx, cacheKey).Result()
	if err == nil {
		var result struct {
			Products []repository.ProductWithDetails `json:"products"`
			Total    int64                           `json:"total"`
		}
		if json.Unmarshal([]byte(cached), &result) == nil {
			return result.Products, result.Total, nil
		}
	}

	// Cache miss — fetch from DB
	products, total, err := s.inner.List(ctx, filter)
	if err != nil {
		return products, total, err
	}

	// Store in cache
	result := struct {
		Products []repository.ProductWithDetails `json:"products"`
		Total    int64                           `json:"total"`
	}{Products: products, Total: total}

	if data, err := json.Marshal(result); err == nil {
		s.cache.Client.Set(ctx, cacheKey, data, productCacheTTL)
	}

	return products, total, nil
}

func (s *cachedProductService) invalidateProductCache(ctx context.Context, id int64, slug string) {
	s.cache.Client.Del(ctx, fmt.Sprintf(productIDKey, id))
	if slug != "" {
		s.cache.Client.Del(ctx, fmt.Sprintf(productSlugKey, slug))
	}
}

func (s *cachedProductService) invalidateListCache(ctx context.Context) {
	// Use scan to find and delete all list cache keys
	iter := s.cache.Client.Scan(ctx, 0, "products:list:*", 100).Iterator()
	for iter.Next(ctx) {
		s.cache.Client.Del(ctx, iter.Val())
	}
}
