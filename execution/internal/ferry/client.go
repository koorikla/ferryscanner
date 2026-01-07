package ferry

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type FerryResponse struct {
	Items []FerryItem `json:"items"`
}

type FerryItem struct {
	DtStart    string     `json:"dtstart"`
	DtEnd      string     `json:"dtend"`
	Capacities Capacities `json:"capacities"`
}

type Capacities struct {
	Sv int `json:"sv"` // Small vehicles (cars)
}

type Trip struct {
	Start    string `json:"start"`
	End      string `json:"end"`
	CarSpots int    `json:"car_spots"`
}

// GetTrips fetches all ferry trips, regardless of availability.
// date format: YYYY-MM-DD
// direction: "VK" (Virtsu-Kuivastu) or "KV" (Kuivastu-Virtsu), "HR" (Heltermaa-Rohukula), "RH" (Rohukula-Heltermaa)
func GetTrips(date string, direction string) ([]Trip, error) {
	// Map short codes to praamid.ee direction codes if needed, or use as is if they match.
	// Based on the python script: "HR", "RH" are direct.
	// Virtsu-Kuivastu is usually "VK" and "KV".
	// The Python script url: https://www.praamid.ee/online/events?direction={direction}&departure-date={departure_date}&time-shift=300

	url := fmt.Sprintf("https://www.praamid.ee/online/events?direction=%s&departure-date=%s&time-shift=300", direction, date)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch ferry data: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("api returned status: %d", resp.StatusCode)
	}

	var ferryResp FerryResponse
	if err := json.NewDecoder(resp.Body).Decode(&ferryResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	var trips []Trip
	for _, item := range ferryResp.Items {
		trips = append(trips, Trip{
			Start:    item.DtStart,
			End:      item.DtEnd,
			CarSpots: item.Capacities.Sv,
		})
	}

	return trips, nil
}
