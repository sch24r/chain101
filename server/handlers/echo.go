package handlers

import (
    "encoding/json"
    "net/http"
)

func EchoHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")

    mu.Lock()
    defer mu.Unlock()

    json.NewEncoder(w).Encode(statData)
}