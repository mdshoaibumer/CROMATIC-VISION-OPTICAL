package main

import (
	"log"

	"github.com/cromatic-vision-optical/backend/internal/app"
)

func main() {
	// Construct backend state
	application, err := app.New()
	if err != nil {
		log.Fatalf("Critical Boot Error: App initialization failed: %v", err)
	}

	// Active running state
	if err := application.Run(); err != nil {
		log.Fatalf("Application Service Crashed: %v", err)
	}
}
