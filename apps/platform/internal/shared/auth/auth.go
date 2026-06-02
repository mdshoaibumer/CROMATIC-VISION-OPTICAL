package auth

import (
	"context"
	"crypto/subtle"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrExpiredToken   = errors.New("token has expired")
	ErrInvalidToken   = errors.New("token is invalid")
	ErrMalformedToken = errors.New("token is malformed")
	ErrRevokedToken   = errors.New("token has been revoked")
)

const (
	// RevokedTokenPrefix is the Redis key prefix for revoked access tokens
	RevokedTokenPrefix = "revoked_token:"
)

// Token type constants
const (
	TokenTypeAccess  = "access"
	TokenTypeRefresh = "refresh"
)

// UserClaims defines JWT token payload structure
type UserClaims struct {
	UserID    string `json:"user_id"`
	Role      string `json:"role"`
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

// HashPassword computes bcrypt hash of a password
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// CheckPasswordHash compares password against its bcrypt hash
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateToken creates a JWT token with an explicit token type (access or refresh)
func GenerateToken(userID string, role string, secret string, expiresAt time.Time, tokenType ...string) (string, error) {
	tType := TokenTypeAccess
	if len(tokenType) > 0 && tokenType[0] != "" {
		tType = tokenType[0]
	}

	claims := &UserClaims{
		UserID:    userID,
		Role:      role,
		TokenType: tType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// VerifyToken decodes and validates a JWT token
func VerifyToken(tokenString string, secret string) (*UserClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &UserClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return []byte(secret), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenMalformed) {
			return nil, ErrMalformedToken
		} else if errors.Is(err, jwt.ErrTokenExpired) || errors.Is(err, jwt.ErrTokenNotValidYet) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*UserClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// ConstantTimeCompare safe string comparison to mitigate timing attacks
func ConstantTimeCompare(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}

// RevokeToken adds a token to the revocation blacklist in Redis.
// The token is stored until its natural expiry time, then auto-removed by Redis TTL.
func RevokeToken(ctx context.Context, redisClient *redis.Client, tokenString string, claims *UserClaims) error {
	if redisClient == nil {
		return nil
	}
	// Calculate remaining TTL from token expiry
	ttl := time.Until(claims.ExpiresAt.Time)
	if ttl <= 0 {
		return nil // Already expired, no need to revoke
	}
	key := RevokedTokenPrefix + tokenString
	return redisClient.Set(ctx, key, "1", ttl).Err()
}

// IsTokenRevoked checks if a token has been revoked.
func IsTokenRevoked(ctx context.Context, redisClient *redis.Client, tokenString string) bool {
	if redisClient == nil {
		return false
	}
	key := RevokedTokenPrefix + tokenString
	exists, err := redisClient.Exists(ctx, key).Result()
	if err != nil {
		return false // Fail open on Redis errors for availability, but log this
	}
	return exists > 0
}

// RevokeAllUserTokens stores a "revoked_all_before" timestamp for a user.
// Any token issued before this timestamp is considered revoked.
func RevokeAllUserTokens(ctx context.Context, redisClient *redis.Client, userID string) error {
	if redisClient == nil {
		return nil
	}
	key := fmt.Sprintf("user_revoked_at:%s", userID)
	// Set with a TTL matching max possible token lifetime (7 days for refresh tokens)
	return redisClient.Set(ctx, key, time.Now().Unix(), 7*24*time.Hour).Err()
}

// IsTokenIssuedBeforeRevocation checks if a token was issued before user-level revocation.
func IsTokenIssuedBeforeRevocation(ctx context.Context, redisClient *redis.Client, userID string, issuedAt time.Time) bool {
	if redisClient == nil {
		return false
	}
	key := fmt.Sprintf("user_revoked_at:%s", userID)
	val, err := redisClient.Get(ctx, key).Int64()
	if err != nil {
		return false // No revocation record
	}
	revokedAt := time.Unix(val, 0)
	return issuedAt.Before(revokedAt)
}
