package sanitize

import (
	"regexp"
	"strings"
)

var (
	// stripTags removes all HTML/XML tags
	stripTagsRe = regexp.MustCompile(`<[^>]*>`)
	// stripScriptContent removes script tag content entirely
	stripScriptRe = regexp.MustCompile(`(?i)<script[^>]*>[\s\S]*?</script>`)
	// stripEventHandlers removes on* event handler attributes
	stripEventsRe = regexp.MustCompile(`(?i)\s*on\w+\s*=\s*["'][^"']*["']`)
	// stripJavascriptURI removes javascript: protocol URIs
	stripJSURIRe = regexp.MustCompile(`(?i)javascript\s*:`)
)

// Text sanitizes user input by stripping HTML tags and dangerous content.
// Use for plain text fields like names, descriptions, addresses.
func Text(input string) string {
	// Remove script blocks entirely (including content)
	s := stripScriptRe.ReplaceAllString(input, "")
	// Remove event handler attributes
	s = stripEventsRe.ReplaceAllString(s, "")
	// Remove javascript: URIs
	s = stripJSURIRe.ReplaceAllString(s, "")
	// Strip remaining HTML/XML tags
	s = stripTagsRe.ReplaceAllString(s, "")
	// Normalize whitespace
	s = strings.TrimSpace(s)
	return s
}

// StrictAlphanumeric allows only alphanumeric characters, spaces, hyphens, and periods.
// Use for names and similar identity fields.
func StrictAlphanumeric(input string) string {
	var builder strings.Builder
	for _, r := range input {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == ' ' || r == '-' || r == '.' || r == '\'' {
			builder.WriteRune(r)
		}
	}
	return strings.TrimSpace(builder.String())
}
