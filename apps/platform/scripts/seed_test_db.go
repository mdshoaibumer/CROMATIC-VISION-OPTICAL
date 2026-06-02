package main

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://cromatic_user:cromatic_password_secret@localhost:5432/cromatic_vision_db?sslmode=disable"
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer pool.Close()

	// Clear existing test data to make it idempotent
	log.Println("Clearing existing test data...")
	_, _ = pool.Exec(ctx, "DELETE FROM cart_items")
	_, _ = pool.Exec(ctx, "DELETE FROM order_items")
	_, _ = pool.Exec(ctx, "DELETE FROM invoices")
	_, _ = pool.Exec(ctx, "DELETE FROM payments")
	_, _ = pool.Exec(ctx, "DELETE FROM prescriptions")
	_, _ = pool.Exec(ctx, "DELETE FROM orders")
	_, _ = pool.Exec(ctx, "DELETE FROM carts")
	_, _ = pool.Exec(ctx, "DELETE FROM product_images")

	_, err = pool.Exec(ctx, "DELETE FROM products WHERE slug IN ('premium-cut-optics', 'aero-titanium-x')")
	if err != nil {
		log.Printf("Warning: failed to delete products: %v", err)
	}
	_, err = pool.Exec(ctx, "DELETE FROM categories WHERE slug IN ('test-titanium-frames', 'test-acetate-frames')")
	if err != nil {
		log.Printf("Warning: failed to delete categories: %v", err)
	}
	_, err = pool.Exec(ctx, "DELETE FROM users WHERE email = 'admin@cromaticvision.test'")
	if err != nil {
		log.Printf("Warning: failed to delete users: %v", err)
	}

	// 1. Insert Categories
	log.Println("Seeding categories...")
	var cat1ID int
	err = pool.QueryRow(ctx, `
		INSERT INTO categories (name, slug, description) 
		VALUES ('Titanium Frames', 'test-titanium-frames', 'Ultra-lightweight surgical titanium')
		RETURNING id
	`).Scan(&cat1ID)
	if err != nil {
		log.Fatalf("Failed to insert category: %v", err)
	}

	// 2. Insert Products
	log.Println("Seeding products...")
	_, err = pool.Exec(ctx, `
		INSERT INTO products (category_id, name, slug, description, price, stock, brand, frame_type, material, gender)
		VALUES 
		($1, 'Premium Cut Optics', 'premium-cut-optics', 'Surgical grade optical lens', 299.99, 50, 'Aero Engineering', 'Full Rim', 'Surgical Titanium', 'Unisex'),
		($1, 'Aero Titanium Model X', 'aero-titanium-x', 'Lightweight frame', 450.00, 20, 'Aero Engineering', 'Rimless', 'Surgical Titanium', 'Men')
	`, cat1ID)
	if err != nil {
		log.Fatalf("Failed to insert products: %v", err)
	}

	// 3. Insert Admin User (password is 'admin123' hashed with bcrypt cost 10 roughly)
	// For testing, we just need a bcrypt hash. I'll use a pre-computed hash for 'admin123'
	// $2a$10$wN/sOq0Qz/lG/h.NqV8O.OV2Gk9C5dJwGz9nL7c8y2aV0X9Z8mN6u
	log.Println("Seeding admin user...")
	_, err = pool.Exec(ctx, `
		INSERT INTO users (name, email, password_hash, role)
		VALUES ('System Admin', 'admin@cromaticvision.test', '$2a$10$wN/sOq0Qz/lG/h.NqV8O.OV2Gk9C5dJwGz9nL7c8y2aV0X9Z8mN6u', 'admin')
	`)
	if err != nil {
		log.Fatalf("Failed to insert admin: %v", err)
	}

	log.Println("Test database seeded successfully!")
}
