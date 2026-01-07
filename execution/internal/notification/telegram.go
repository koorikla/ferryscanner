package notification

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type TelegramConfig struct {
	BotToken string
}

type TelegramService struct {
	config TelegramConfig
	client *http.Client
}

func NewTelegramService(cfg TelegramConfig) *TelegramService {
	return &TelegramService{
		config: cfg,
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

type telegramBody struct {
	ChatID string `json:"chat_id"`
	Text   string `json:"text"`
}

func (s *TelegramService) SendAlert(chatID string, message string) error {
	if s.config.BotToken == "" {
		return fmt.Errorf("bot token not configured")
	}

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", s.config.BotToken)

	body := telegramBody{
		ChatID: chatID,
		Text:   "🚢 Ferry Scanner Alert!\n\n" + message,
	}

	jsonBytes, err := json.Marshal(body)
	if err != nil {
		return err
	}

	resp, err := s.client.Post(url, "application/json", bytes.NewBuffer(jsonBytes))
	if err != nil {
		return fmt.Errorf("telegram request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("telegram api returned status: %d", resp.StatusCode)
	}

	return nil
}
