package service

import (
	"context"
	"fmt"
	"log"
	"net/smtp"
	"time"

	"github.com/cromatic-vision-optical/backend/internal/config"
)

// NotificationService manages dispatching emails/notifications to users and administrators
type NotificationService interface {
	NotifyCustomerInvoiceCreated(ctx context.Context, email string, invoiceNo string, amount float64, downloadURL string) error
	NotifyAdminNewInvoice(ctx context.Context, invoiceNo string, amount float64, downloadURL string) error
}

type notificationService struct {
	cfg *config.Config
}

// NewNotificationService constructs a new notification instance
func NewNotificationService(cfg *config.Config) NotificationService {
	return &notificationService{
		cfg: cfg,
	}
}

// NotifyCustomerInvoiceCreated formats and dispatches invoice info to the customers
func (s *notificationService) NotifyCustomerInvoiceCreated(ctx context.Context, email string, invoiceNo string, amount float64, downloadURL string) error {
	subject := fmt.Sprintf("Cromatic Vision Optical Invoice Generated - %s", invoiceNo)
	body := fmt.Sprintf(
		"Hello,\n\nYour invoice %s has been generated for order payment.\nAmount: %.2f INR\n\nYou can access and download your receipt here:\n%s\n\nThanks for choosing Cromatic Vision Optical!\n",
		invoiceNo, amount, downloadURL,
	)

	return s.sendEmailWithRetry(email, subject, body)
}

// NotifyAdminNewInvoice formats and delivers administrative logs of newly received invoices
func (s *notificationService) NotifyAdminNewInvoice(ctx context.Context, invoiceNo string, amount float64, downloadURL string) error {
	adminEmail := s.cfg.AdminEmail
	if adminEmail == "" {
		adminEmail = "admin@cromaticvision.com"
	}
	subject := fmt.Sprintf("[ADMIN] New Invoice Captured - %s", invoiceNo)
	body := fmt.Sprintf(
		"Attention Admin,\n\nA new invoice has been recorded:\nInvoice Number: %s\nTotal Amount: %.2f INR\n\nInvoice URL Link:\n%s\n\nCromatic Vision Optical Notifications Engine\n",
		invoiceNo, amount, downloadURL,
	)

	return s.sendEmailWithRetry(adminEmail, subject, body)
}

func (s *notificationService) sendEmailWithRetry(to, subject, body string) error {
	host := s.cfg.SMTPHost
	port := s.cfg.SMTPPort
	user := s.cfg.SMTPUser
	pass := s.cfg.SMTPPassword
	from := s.cfg.SMTPFrom

	if from == "" {
		from = "no-reply@cromaticvision.com"
	}

	// Logging mock action or executing real SMTP
	if host == "" || host == "localhost" || user == "" {
		log.Printf("[NOTIFICATION MOCK EMAIL] From: %s, To: %s, Subject: '%s'\nBody:\n%s\n", from, to, subject, body)
		return nil
	}

	msg := []byte(fmt.Sprintf("To: %s\r\nFrom: %s\r\nSubject: %s\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s", to, from, subject, body))
	addr := fmt.Sprintf("%s:%s", host, port)
	auth := smtp.PlainAuth("", user, pass, host)

	var lastErr error
	maxRetries := 3

	for attempt := 1; attempt <= maxRetries; attempt++ {
		err := smtp.SendMail(addr, auth, from, []string{to}, msg)
		if err == nil {
			log.Printf("[NOTIFICATION EMAIL SENT] Successfully delivered email to %s on try %d", to, attempt)
			return nil
		}
		lastErr = err
		log.Printf("[NOTIFICATION WARNING] Failed email delivery to %s on try %d: %v", to, attempt, err)

		if attempt < maxRetries {
			time.Sleep(time.Duration(attempt) * 100 * time.Millisecond) // backoff
		}
	}

	return fmt.Errorf("all SMTP email retries failed: %w", lastErr)
}
