package v1

import (
	"errors"
	"log/slog"
	"regexp"
	"strings"
	"time"

	"github.com/cromatic-vision-optical/backend/internal/database"
	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/cromatic-vision-optical/backend/internal/middleware"
	"github.com/cromatic-vision-optical/backend/internal/redis"
	"github.com/cromatic-vision-optical/backend/internal/shared/auth"
	"github.com/cromatic-vision-optical/backend/internal/shared/response"
	"github.com/cromatic-vision-optical/backend/internal/shared/sanitize"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var emailRegex = regexp.MustCompile(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$`)

// AuthHandler structures incoming authentication HTTP handler actions
type AuthHandler struct {
	queries   sqlc.Querier
	db        *database.DB
	redis     *redis.RedisClient
	jwtSecret string
	appEnv    string
	log       *slog.Logger
}

// NewAuthHandler acts as builder instantiating new AuthHandler controllers
func NewAuthHandler(db *database.DB, rc *redis.RedisClient, jwtSecret string, appEnv string, log *slog.Logger) *AuthHandler {
	return &AuthHandler{
		queries:   sqlc.New(db.Pool),
		db:        db,
		redis:     rc,
		jwtSecret: jwtSecret,
		appEnv:    appEnv,
		log:       log,
	}
}

// NewAuthHandlerForTest allocates testing structures with mock objects
func NewAuthHandlerForTest(queries sqlc.Querier, jwtSecret string) *AuthHandler {
	return &AuthHandler{
		queries:   queries,
		redis:     nil,
		jwtSecret: jwtSecret,
		appEnv:    "test",
		log:       slog.Default(),
	}
}

// UserResponse provides sanitized representation of user model payloads
type UserResponse struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     *string   `json:"phone,omitempty"`
	Role      string    `json:"role"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func mapToUserResponse(u sqlc.User) UserResponse {
	return UserResponse{
		ID:        u.ID,
		Name:      u.Name,
		Email:     u.Email,
		Phone:     u.Phone,
		Role:      u.Role,
		IsActive:  u.IsActive,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

// RegisterRequest holds registration payloads
type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Phone    string `json:"phone"`
}

// Register registers new user in the database
func (h *AuthHandler) Register(c fiber.Ctx) error {
	var req RegisterRequest
	if err := c.Bind().JSON(&req); err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Failed to parse request JSON payload"))
	}

	// 1. Validation checks
	req.Name = sanitize.Text(strings.TrimSpace(req.Name))
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Password = strings.TrimSpace(req.Password)
	if req.Phone != "" {
		req.Phone = sanitize.Text(strings.TrimSpace(req.Phone))
	}

	if req.Name == "" {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("VALIDATION_ERROR", "Name is required"))
	}
	if len(req.Name) > 100 {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("VALIDATION_ERROR", "Name must not exceed 100 characters"))
	}
	if req.Email == "" {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("VALIDATION_ERROR", "Email is required"))
	}
	if !emailRegex.MatchString(req.Email) {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("VALIDATION_ERROR", "Email format is invalid"))
	}
	if req.Password == "" {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("VALIDATION_ERROR", "Password is required"))
	}
	if pwErr := sanitize.PasswordStrength(req.Password); pwErr != "" {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("VALIDATION_ERROR", pwErr))
	}

	// 2. Duplicate validation (checked after all input validation to avoid timing leaks)
	_, err := h.queries.GetUserByEmail(c.Context(), req.Email)
	if err == nil {
		c.Status(fiber.StatusConflict)
		return c.JSON(response.Err("CONFLICT", "An account with this email already exists"))
	} else if !errors.Is(err, pgx.ErrNoRows) {
		h.log.Error("Database fetch failure checking existing user", "error", err)
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to verify registration state"))
	}

	// 3. Hash secret password
	pHash, err := auth.HashPassword(req.Password)
	if err != nil {
		h.log.Error("Hashing algorithm computation defect", "error", err)
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to secure user credentials"))
	}

	var phonePtr *string
	if req.Phone != "" {
		pStr := req.Phone
		phonePtr = &pStr
	}

	// 4. Save entity records
	u, err := h.queries.CreateUser(c.Context(), sqlc.CreateUserParams{
		Name:         req.Name,
		Email:        req.Email,
		Phone:        phonePtr,
		PasswordHash: pHash,
		Role:         "customer", // default role is customer
		IsActive:     true,       // user starts active
	})
	if err != nil {
		h.log.Error("Database insertion user creation failure", "error", err)
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to save user record"))
	}

	c.Status(fiber.StatusCreated)
	return c.JSON(response.OK(mapToUserResponse(u), "User registered successfully"))
}

// LoginRequest holds credentials payload
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginResponse wraps JWT elements with profile representations
type LoginResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	User         UserResponse `json:"user"`
}

// Login validates user details and issues standard tokens
func (h *AuthHandler) Login(c fiber.Ctx) error {
	var req LoginRequest
	if err := c.Bind().JSON(&req); err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Failed to parse request JSON payload"))
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Password = strings.TrimSpace(req.Password)

	if req.Email == "" {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("VALIDATION_ERROR", "Email is required"))
	}
	if req.Password == "" {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("VALIDATION_ERROR", "Password is required"))
	}

	// 1. Fetch user by email
	u, err := h.queries.GetUserByEmail(c.Context(), req.Email)
	if errors.Is(err, pgx.ErrNoRows) {
		middleware.RecordFailedLogin(c.Context(), h.redis, c.IP(), req.Email)
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "Invalid email or password"))
	} else if err != nil {
		h.log.Error("Database failure fetching auth credentials", "error", err)
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Database query lookup error"))
	}

	// 1b. Check if this email is locked out (distributed brute-force protection)
	if middleware.IsEmailLocked(c.Context(), h.redis, req.Email) {
		c.Status(fiber.StatusTooManyRequests)
		return c.JSON(response.Err("ACCOUNT_LOCKED", "Too many failed login attempts for this account. Please try again later."))
	}

	// 2. Validate current state
	if !u.IsActive {
		c.Status(fiber.StatusForbidden)
		return c.JSON(response.Err("FORBIDDEN", "User account is suspended or inactive"))
	}

	// 3. Verify bcrypt hashes
	if !auth.CheckPasswordHash(req.Password, u.PasswordHash) {
		middleware.RecordFailedLogin(c.Context(), h.redis, c.IP(), req.Email)
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "Invalid email or password"))
	}

	// Clear failed login attempts on successful auth
	middleware.ClearLoginAttempts(c.Context(), h.redis, c.IP(), req.Email)

	// 4. Generate Access & Refresh tokens
	accessTokenExpiry := time.Now().Add(15 * time.Minute)
	refreshTokenExpiry := time.Now().Add(7 * 24 * time.Hour)

	accessToken, err := auth.GenerateToken(u.ID.String(), u.Role, h.jwtSecret, accessTokenExpiry, auth.TokenTypeAccess)
	if err != nil {
		h.log.Error("Failure generating JWT access token", "error", err)
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Token creation error"))
	}

	refreshToken, err := auth.GenerateToken(u.ID.String(), u.Role, h.jwtSecret, refreshTokenExpiry, auth.TokenTypeRefresh)
	if err != nil {
		h.log.Error("Failure generating JWT refresh token", "error", err)
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Token creation error"))
	}

	// 5. Save refresh token context in Redis database if client is available
	if h.redis != nil && h.redis.Client != nil {
		err = h.redis.Client.Set(c.Context(), "refresh_token:"+u.ID.String(), refreshToken, 7*24*time.Hour).Err()
		if err != nil {
			h.log.Error("Redis connection storing refresh token failure", "error", err)
			c.Status(fiber.StatusInternalServerError)
			return c.JSON(response.Err("INTERNAL_ERROR", "Cache service state synchronization failure"))
		}
	}

	setAuthCookies(c, accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry, h.appEnv == "production")

	resp := LoginResponse{
		AccessToken:  "", // Omitted for HttpOnly security
		RefreshToken: "", // Omitted for HttpOnly security
		User:         mapToUserResponse(u),
	}

	return c.JSON(response.OK(resp, "Login successful"))
}

// RefreshRequest holds the payload to request a rotating access token
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// Refresh validates old refresh tokens verifying them, returning renewed elements
func (h *AuthHandler) Refresh(c fiber.Ctx) error {
	var req RefreshRequest
	_ = c.Bind().JSON(&req) // ignore parsing errors to fallback onto other strategies or header checking

	// Fallback to headers or cookies for highly flexible API integration
	refreshToken := req.RefreshToken
	if refreshToken == "" {
		refreshToken = c.Cookies("refresh_token")
	}
	if refreshToken == "" {
		// Read from cookies/headers if not provided in JSON body
		authHeader := c.Get("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
				refreshToken = parts[1]
			}
		}
	}

	refreshToken = strings.TrimSpace(refreshToken)
	if refreshToken == "" {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("VALIDATION_ERROR", "Refresh token is required"))
	}

	// 1. Verify claims and expiration
	claims, err := auth.VerifyToken(refreshToken, h.jwtSecret)
	if err != nil {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "Refresh token is expired, malformed, or invalid"))
	}

	// 1b. Verify this is actually a refresh token (prevents access token misuse)
	if claims.TokenType != auth.TokenTypeRefresh {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "Invalid token type for refresh"))
	}

	// 2. Fetch from Redis verifying it hasn't been blacklisted or logged out if client is available
	if h.redis != nil && h.redis.Client != nil {
		redisVal, err := h.redis.Client.Get(c.Context(), "refresh_token:"+claims.UserID).Result()
		if err != nil {
			c.Status(fiber.StatusUnauthorized)
			return c.JSON(response.Err("UNAUTHORIZED", "Session expired or logged out"))
		}

		if !auth.ConstantTimeCompare(redisVal, refreshToken) {
			c.Status(fiber.StatusUnauthorized)
			return c.JSON(response.Err("UNAUTHORIZED", "Token represents invalid active session"))
		}
	}

	// 3. Fetch user checking role status
	userIDUUID, err := uuid.Parse(claims.UserID)
	if err != nil {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "Invalid session identity formatting"))
	}

	u, err := h.queries.GetUserByID(c.Context(), userIDUUID)
	if err != nil {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "User profile not found"))
	}

	if !u.IsActive {
		c.Status(fiber.StatusForbidden)
		return c.JSON(response.Err("FORBIDDEN", "User account is suspended"))
	}

	// 4. Issue new access token and rotate refresh tokens (single-use rotation)
	accessTokenExpiry := time.Now().Add(15 * time.Minute)
	newAccessToken, err := auth.GenerateToken(u.ID.String(), u.Role, h.jwtSecret, accessTokenExpiry, auth.TokenTypeAccess)
	if err != nil {
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Token creation error"))
	}

	// Rotate refresh token with new 7-day expiry (old one is invalidated via Redis single-store)
	refreshTokenExpiry := time.Now().Add(7 * 24 * time.Hour)
	newRefreshToken, err := auth.GenerateToken(u.ID.String(), u.Role, h.jwtSecret, refreshTokenExpiry, auth.TokenTypeRefresh)
	if err != nil {
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Token creation error"))
	}

	if h.redis != nil && h.redis.Client != nil {
		// Store new refresh token (atomically invalidates old one since only one is valid per user)
		err = h.redis.Client.Set(c.Context(), "refresh_token:"+u.ID.String(), newRefreshToken, 7*24*time.Hour).Err()
		if err != nil {
			c.Status(fiber.StatusInternalServerError)
			return c.JSON(response.Err("INTERNAL_ERROR", "Cache service state synchronization failure"))
		}
		// Explicitly revoke the old refresh token to prevent any race condition replay
		_ = auth.RevokeToken(c.Context(), h.redis.Client, refreshToken, claims)
	}

	setAuthCookies(c, newAccessToken, newRefreshToken, accessTokenExpiry, refreshTokenExpiry, h.appEnv == "production")

	resp := fiber.Map{
		"access_token":  "",
		"refresh_token": "",
	}

	return c.JSON(response.OK(resp, "Token rotated successfully"))
}

// Logout de-registers refresh tokens from Redis, revokes access token, and clears cookies
func (h *AuthHandler) Logout(c fiber.Ctx) error {
	var userID string
	var accessToken string

	// 1. Try to read from cookies
	accessToken = c.Cookies("access_token")
	if accessToken != "" {
		claims, err := auth.VerifyToken(accessToken, h.jwtSecret)
		if err == nil {
			userID = claims.UserID
			// Revoke the access token so it cannot be reused
			if h.redis != nil && h.redis.Client != nil {
				_ = auth.RevokeToken(c.Context(), h.redis.Client, accessToken, claims)
			}
		}
	}

	if userID == "" {
		// Logout requires active Authorization header OR a token structure
		authHeader := c.Get("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
				tokenString := parts[1]
				claims, err := auth.VerifyToken(tokenString, h.jwtSecret)
				if err == nil {
					userID = claims.UserID
					// Revoke this token too
					if h.redis != nil && h.redis.Client != nil {
						_ = auth.RevokeToken(c.Context(), h.redis.Client, tokenString, claims)
					}
				}
			}
		}
	}

	// Alternatively check if locals user_id is populated by global AuthMiddleware
	if userID == "" {
		if uIDLocal, ok := c.Locals("user_id").(string); ok {
			userID = uIDLocal
		}
	}

	if userID != "" && h.redis != nil && h.redis.Client != nil {
		// Remove from Redis to invalidate refresh capabilities
		_ = h.redis.Client.Del(c.Context(), "refresh_token:"+userID).Err()
	}

	clearAuthCookies(c, h.appEnv == "production")

	return c.JSON(response.OK(nil, "Logout successful"))
}

func setAuthCookies(c fiber.Ctx, accessToken, refreshToken string, accessExpiry, refreshExpiry time.Time, isProduction bool) {
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Expires:  accessExpiry,
		HTTPOnly: true,
		Secure:   isProduction,
		SameSite: "Strict",
		Path:     "/",
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Expires:  refreshExpiry,
		HTTPOnly: true,
		Secure:   isProduction,
		SameSite: "Strict",
		Path:     "/",
	})
}

func clearAuthCookies(c fiber.Ctx, isProduction bool) {
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		HTTPOnly: true,
		Secure:   isProduction,
		SameSite: "Strict",
		Path:     "/",
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		HTTPOnly: true,
		Secure:   isProduction,
		SameSite: "Strict",
		Path:     "/",
	})
}

// Me returning active user metadata structure
func (h *AuthHandler) Me(c fiber.Ctx) error {
	userIDStr, ok := c.Locals("user_id").(string)
	if !ok || userIDStr == "" {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "Unauthenticated user profile context"))
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Invalid user context identifier"))
	}

	u, err := h.queries.GetUserByID(c.Context(), userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", "User profile not found"))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to retrieve user profile"))
	}

	return c.JSON(response.OK(mapToUserResponse(u), "User profile retrieved successfully"))
}

// AdminListCustomers returns a list of all active or inactive customers
func (h *AuthHandler) AdminListCustomers(c fiber.Ctx) error {
	rows, err := h.db.Pool.Query(c.Context(), "SELECT id, name, email, phone, role, is_active, created_at, updated_at FROM users WHERE role = 'customer' ORDER BY created_at DESC")
	if err != nil {
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to query customers from database: "+err.Error()))
	}
	defer rows.Close()

	var customers []UserResponse
	for rows.Next() {
		var u sqlc.User
		err := rows.Scan(
			&u.ID,
			&u.Name,
			&u.Email,
			&u.Phone,
			&u.Role,
			&u.IsActive,
			&u.CreatedAt,
			&u.UpdatedAt,
		)
		if err != nil {
			c.Status(fiber.StatusInternalServerError)
			return c.JSON(response.Err("INTERNAL_ERROR", "Failed to compile customer rows: "+err.Error()))
		}
		customers = append(customers, mapToUserResponse(u))
	}

	if customers == nil {
		customers = []UserResponse{}
	}

	return c.JSON(response.OK(customers, "Customers list retrieved successfully"))
}

// AdminGetCustomerByID returns detail for a specific customer
func (h *AuthHandler) AdminGetCustomerByID(c fiber.Ctx) error {
	idStr := c.Params("id")
	customerID, err := uuid.Parse(idStr)
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Invalid customer ID UUID format"))
	}

	row := h.db.Pool.QueryRow(c.Context(), "SELECT id, name, email, phone, role, is_active, created_at, updated_at FROM users WHERE id = $1 AND role = 'customer'", customerID)
	var u sqlc.User
	err = row.Scan(
		&u.ID,
		&u.Name,
		&u.Email,
		&u.Phone,
		&u.Role,
		&u.IsActive,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", "Customer not found"))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to retrieve customer metadata: "+err.Error()))
	}

	return c.JSON(response.OK(mapToUserResponse(u), "Customer detail fetched successfully"))
}
