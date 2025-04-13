package handlers

import (
    "log"
    "math/rand"
    "net/http"
    "sync"
    "time"
)

type Stat struct {
    ServerTime string   `json:"serverTime"`
    Blocks     int      `json:"blocks"`
    Mined      int      `json:"mined"`
    Activities []string `json:"activities"`
}

type UserStat struct {
    Blocks     int      `json:"blocks"`
    Mined      int      `json:"mined"`
    Activities []string `json:"activities"`
}

var (
    statData = Stat{
        ServerTime: time.Now().Format(time.RFC3339),
        Blocks:     0,
        Mined:      0,
        Activities: []string{},
    }
    sessions         = make(map[string]UserStat)
    mu               sync.Mutex
    serverInstanceID string
)

func init() {
    // Generate a unique server instance ID on startup
    rand.Seed(time.Now().UnixNano())
    serverInstanceID = generateServerInstanceID()
    log.Printf("Server Instance ID: %s", serverInstanceID)
}

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

    sessionID := cookie.Value
    
    // Invalidate session if server instance ID does not match
    instanceCookie, err := r.Cookie("server_instance_id")
    if err != nil || instanceCookie.Value != serverInstanceID {
        log.Println("Invalid session detected. Resetting session.")
        sessionID = generateSessionID()
        userStats := UserStat{}
        sessions[sessionID] = userStats
        return sessionID, userStats
    }

    // Only check if the session exists if none created
    userStats, exists := sessions[sessionID]
    if !exists {
        userStats = UserStat{}
        sessions[sessionID] = userStats
    }
    return sessionID, userStats
}

func saveSession(w http.ResponseWriter, sessionID string, userStats UserStat) {
    sessions[sessionID] = userStats
    http.SetCookie(w, &http.Cookie{
        Name:    "session_id",
        Value:   sessionID,
        Expires: time.Now().Add(24 * time.Hour),
        Path:    "/",
    })
    http.SetCookie(w, &http.Cookie{
        Name:    "server_instance_id",
        Value:   serverInstanceID,
        Expires: time.Now().Add(24 * time.Hour),
        Path:    "/",
    })
}

func generateSessionID() string {
    return time.Now().Format("20060102150405") + randomString(6)
}

func generateServerInstanceID() string {
    return randomString(16)
}

func randomString(n int) string {
    const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    result := make([]byte, n)
    for i := range result {
        result[i] = letters[rand.Intn(len(letters))]
    }
    return string(result)
}