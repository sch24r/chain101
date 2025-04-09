package handlers

import (
    "log"
    "net/http"
    "sync"
    "time"
)

type Stat struct {
    ServerTime string   `json:"serverTime"`
    Blocks     int      `json:"blocks"`
    Mined      int      `json:"mined"`
    Removed    int      `json:"removed"`
    Activities []string `json:"activities"`
}

type UserStat struct {
    Blocks     int      `json:"blocks"`
    Mined      int      `json:"mined"`
    Removed    int      `json:"removed"`
    Activities []string `json:"activities"`
}

var (
    statData = Stat{
        ServerTime: time.Now().Format(time.RFC3339),
        Blocks:     0,
        Mined:      0,
        Removed:    0,
        Activities: []string{},
    }
    mu       sync.Mutex
    sessions = make(map[string]UserStat)
)

func logActivity(activity string) {
    statData.Activities = append(statData.Activities, activity)
    log.Println("Activity:", activity)
}

func getSession(r *http.Request) (string, UserStat) {
    cookie, err := r.Cookie("session_id")
    if err != nil || cookie.Value == "" {
        // Create a new session if no cookie exists
        sessionID := generateSessionID()
        sessions[sessionID] = UserStat{}
        return sessionID, sessions[sessionID]
    }

    // Retrieve stats for the existing session
    sessionID := cookie.Value
    userStats, exists := sessions[sessionID]
    if !exists {
        // Initialize stats if session is not found
        userStats = UserStat{}
        sessions[sessionID] = userStats
    }
    return sessionID, userStats
}

func saveSession(w http.ResponseWriter, sessionID string, userStats UserStat) {
    // Save the stats in memory
    sessions[sessionID] = userStats

    // Set the session cookie
    http.SetCookie(w, &http.Cookie{
        Name:    "session_id",
        Value:   sessionID,
        Expires: time.Now().Add(24 * time.Hour), // Cookie expires in 24 hours
        Path:    "/",
    })
}

func generateSessionID() string {
    // Generate a simple session ID (in production, use a secure random generator)
    return time.Now().Format("20060102150405")
}