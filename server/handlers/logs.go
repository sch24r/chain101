package handlers

import (
    "log"
    "net/http"
)

func LogsHandler(w http.ResponseWriter, r *http.Request) {
    log.Println("LogsHandler invoked")

    sessionID, userStats := getSession(r)

    mu.Lock()
    defer mu.Unlock()

    log.Printf("Session ID: %s\n", sessionID)
    log.Println("Current Stats:")
    log.Printf("Blocks: %d, Mined: %d, Removed: %d\n", userStats.Blocks, userStats.Mined, userStats.Removed)
    log.Println("Activities:")
    for _, activity := range userStats.Activities {
        log.Println("-", activity)
    }

    w.WriteHeader(http.StatusOK)
}