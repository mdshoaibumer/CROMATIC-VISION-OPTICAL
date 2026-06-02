package money

import "math"

// RoundTo2 rounds a float64 to 2 decimal places using banker's rounding.
// Use this for all monetary calculations to prevent floating-point drift.
func RoundTo2(amount float64) float64 {
	return math.Round(amount*100) / 100
}

// Multiply safely multiplies price by quantity and rounds to 2 decimal places.
func Multiply(price float64, quantity int) float64 {
	return RoundTo2(price * float64(quantity))
}

// Sum safely adds monetary values and rounds the result.
func Sum(amounts ...float64) float64 {
	var total float64
	for _, a := range amounts {
		total += a
	}
	return RoundTo2(total)
}

// IsEqual compares two monetary amounts with epsilon tolerance for floating-point.
func IsEqual(a, b float64) bool {
	const epsilon = 0.001
	return math.Abs(a-b) < epsilon
}
