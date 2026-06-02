package sanitize

import (
	"regexp"
	"unicode"
)

var (
	hasUppercase = regexp.MustCompile(`[A-Z]`)
	hasLowercase = regexp.MustCompile(`[a-z]`)
	hasDigit     = regexp.MustCompile(`[0-9]`)
	hasSpecial   = regexp.MustCompile(`[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]`)
)

// PasswordStrength validates password meets minimum security requirements.
// Returns empty string if valid, or an error message describing what's missing.
func PasswordStrength(password string) string {
	if len(password) < 8 {
		return "Password must be at least 8 characters long"
	}
	if len(password) > 128 {
		return "Password must not exceed 128 characters"
	}
	if !hasUppercase.MatchString(password) {
		return "Password must contain at least one uppercase letter"
	}
	if !hasLowercase.MatchString(password) {
		return "Password must contain at least one lowercase letter"
	}
	if !hasDigit.MatchString(password) {
		return "Password must contain at least one digit"
	}

	hasSpecialChar := false
	for _, r := range password {
		if !unicode.IsLetter(r) && !unicode.IsDigit(r) {
			hasSpecialChar = true
			break
		}
	}
	if !hasSpecialChar {
		return "Password must contain at least one special character"
	}

	return ""
}
