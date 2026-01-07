package api

import (
	"encoding/json"
	"execution/internal/ferry"
	"execution/internal/notification"
	"log"
	"net/http"
	"time"
)

type Server struct {
	EmailService    *notification.Service
	TelegramService *notification.TelegramService
}

func (s *Server) HandleScan(w http.ResponseWriter, r *http.Request) {
	date := r.URL.Query().Get("date")
	direction := r.URL.Query().Get("direction")
	fromTime := r.URL.Query().Get("from")
	toTime := r.URL.Query().Get("to")

	if date == "" || direction == "" {
		http.Error(w, "date and direction required", http.StatusBadRequest)
		return
	}

	spots, err := ferry.GetTrips(date, direction)
	if err != nil {
		log.Printf("Error fetching spots: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var filtered []ferry.Trip
	for _, spot := range spots {
		// DtStart format example: 2026-01-07T19:55:00.000+0200
		// Layout: 2006-01-02T15:04:05.000-0700
		const layout = "2006-01-02T15:04:05.000-0700"
		t, err := time.Parse(layout, spot.Start)
		if err != nil {
			// Fallback to RFC3339 if the format varies
			t, err = time.Parse(time.RFC3339, spot.Start)
			if err != nil {
				log.Printf("Error parsing time %s: %v", spot.Start, err)
				continue
			}
		}

		// Format to HH:MM for comparison
		spotTime := t.Format("15:04")

		if fromTime != "" && spotTime < fromTime {
			continue
		}
		if toTime != "" && spotTime > toTime {
			continue
		}
		filtered = append(filtered, spot)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"date":      date,
		"direction": direction,
		"items":     filtered,
	})
}

type AlertRequest struct {
	Email          string `json:"email"`
	TelegramChatID string `json:"telegram_chat_id"`
	Message        string `json:"message"`
}

func (s *Server) HandleAlert(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req AlertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Email
	if req.Email != "" && s.EmailService != nil {
		go func() {
			if err := s.EmailService.SendAlert(req.Email, req.Message); err != nil {
				log.Printf("Error sending email: %v\n", err)
			}
		}()
	}

	// Telegram
	if req.TelegramChatID != "" && s.TelegramService != nil {
		go func() {
			if err := s.TelegramService.SendAlert(req.TelegramChatID, req.Message); err != nil {
				log.Printf("Error sending telegram: %v\n", err)
			}
		}()
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Alert queued"))
}

func (s *Server) HandleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}
