package notification

import (
	"fmt"
	"net/smtp"
)

type Config struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
}

type Service struct {
	config Config
}

func NewService(cfg Config) *Service {
	return &Service{config: cfg}
}

func (s *Service) SendAlert(to string, message string) error {
	if s.config.Host == "" || s.config.Port == "" {
		return fmt.Errorf("SMTP configuration missing")
	}

	auth := smtp.PlainAuth("", s.config.Username, s.config.Password, s.config.Host)

	addr := fmt.Sprintf("%s:%s", s.config.Host, s.config.Port)

	subject := "Subject: Ferry Spots Found!\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/plain; charset=\"UTF-8\";\n\n"
	body := fmt.Sprintf("Ferry Scanner found available spots:\n\n%s\n\nGo book now at https://praamid.ee", message)

	msg := []byte(subject + mime + body)

	if err := smtp.SendMail(addr, auth, s.config.From, []string{to}, msg); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}
