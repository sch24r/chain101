package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

func StatsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	sessionID, userStats := getSession(r)
	w.Header().Set("X-Session-ID", sessionID)

	mu.Lock()
	defer mu.Unlock()

	if r.Method == http.MethodPost {
		var payload struct {
			Action string `json:"action"`
			Count  int    `json:"count"`
		}

		err := json.NewDecoder(r.Body).Decode(&payload)
		if err != nil || payload.Action == "" {
			http.Error(w, "Invalid payload", http.StatusBadRequest)
			return
		}

		// Use count or default to 1 if not provided
		count := payload.Count
		if count <= 0 {
			count = 1
		}

		switch payload.Action {
		case "add":
			userStats.Blocks += count
			logActivity(fmt.Sprintf("%d block(s) created for session %s", count, sessionID))
		case "mine":
			userStats.Mined += count
			logActivity(fmt.Sprintf("%d block(s) mined for session %s", count, sessionID))
		case "unmine":
			if userStats.Mined >= count {
				userStats.Mined -= count
			} else {
				userStats.Mined = 0
			}
			logActivity(fmt.Sprintf("%d block(s) unmined for session %s", count, sessionID))
		case "remove":
			if userStats.Blocks >= count {
				userStats.Blocks -= count
			} else {
				userStats.Blocks = 0
			}
			logActivity(fmt.Sprintf("%d block(s) removed for session %s", count, sessionID))
		case "reset":
			userStats.Blocks = 0
			userStats.Mined = 0
			logActivity("All stats reset for session " + sessionID)
		}

		saveSession(w, sessionID, userStats)
		w.WriteHeader(http.StatusOK)
		return
	}

	logActivity("Session " + sessionID + " retrieved from the server.")
	json.NewEncoder(w).Encode(userStats)
}

func LogsHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("LogsHandler invoked")

	sessionID, userStats := getSession(r)
	w.Header().Set("X-Session-ID", sessionID)

	mu.Lock()
	defer mu.Unlock()

	log.Printf("Session ID: %s\n", sessionID)
	log.Println("Current Stats:")
	log.Printf("Blocks: %d, Mined: %d\n", userStats.Blocks, userStats.Mined)
	for _, activity := range userStats.Activities {
		log.Println("-", activity)
	}

	if r.Method == http.MethodPost {
		saveSession(w, sessionID, userStats)
	}
	
	w.WriteHeader(http.StatusOK)
}

func EchoHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	mu.Lock()
	defer mu.Unlock()

	json.NewEncoder(w).Encode(statData)
}
