package handlers

import (
	"encoding/json"
	"net/http"
)

func StatsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Retrieve or create a session
	sessionID, userStats := getSession(r)

	mu.Lock()
	defer mu.Unlock()

	if r.Method == http.MethodPost {
		var payload struct {
			Action string `json:"action"`
		}

		err := json.NewDecoder(r.Body).Decode(&payload)
		if err != nil || payload.Action == "" {
			http.Error(w, "Invalid payload", http.StatusBadRequest)
			return
		}

		switch payload.Action {
		case "add":
			userStats.Blocks++
			logActivity("Block created for session " + sessionID)
		case "mine":
			userStats.Mined++
			logActivity("Block mined for session " + sessionID)
		case "remove":
			if userStats.Blocks > 0 {
				userStats.Blocks--
				userStats.Removed++
				logActivity("Block removed for session " + sessionID)
			}
		}

		// Save updated stats back to the cookie
		saveSession(w, sessionID, userStats)

		w.WriteHeader(http.StatusOK)
		return
	}

	// Return the user's stats
	json.NewEncoder(w).Encode(userStats)
}
