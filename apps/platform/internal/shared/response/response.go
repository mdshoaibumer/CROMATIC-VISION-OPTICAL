package response

// SuccessResponse defines the standard structure for all successful responses
type SuccessResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message"`
}

// ErrorDetails holds detailed info about the application error
type ErrorDetails struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// ErrorResponse defines the standard structure for all failed responses
type ErrorResponse struct {
	Success bool         `json:"success"`
	Error   ErrorDetails `json:"error"`
}

// Map helpers

// OK returns a generic success response
func OK(data interface{}, message string) SuccessResponse {
	if message == "" {
		message = "success"
	}
	return SuccessResponse{
		Success: true,
		Data:    data,
		Message: message,
	}
}

// Err returns a generic structured error response
func Err(code, message string) ErrorResponse {
	return ErrorResponse{
		Success: false,
		Error: ErrorDetails{
			Code:    code,
			Message: message,
		},
	}
}
