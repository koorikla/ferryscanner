package main

import (
	"execution/internal/api"
	"execution/internal/notification"
	"log"
	"net/http"
	"os"
)

func main() {
	// Serve static files
	// Email Config
	emailConfig := notification.Config{
		Host:     getEnv("SMTP_HOST", ""),
		Port:     getEnv("SMTP_PORT", ""),
		Username: getEnv("SMTP_USER", ""),
		Password: getEnv("SMTP_PASS", ""),
		From:     getEnv("SMTP_FROM", ""),
	}
	emailService := notification.NewService(emailConfig)

	// API Server
	server := &api.Server{
		EmailService: emailService,
	}

	http.HandleFunc("/api/scan", server.HandleScan)
	http.HandleFunc("/api/alert", server.HandleAlert)
	http.HandleFunc("/health", server.HandleHealth)
	http.Handle("/", http.FileServer(http.Dir("./static")))

	port := getEnv("PORT", "8080")
	log.Printf("Server starting on :%s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
