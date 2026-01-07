package main

import (
	"execution/internal/api"
	"log"
	"net/http"
)

func main() {
	// Serve static files
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/", fs)

	// API endpoint
	http.HandleFunc("/api/scan", api.HandleScan)
	http.HandleFunc("/health", api.HandleHealth)

	log.Println("Server starting on :8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
