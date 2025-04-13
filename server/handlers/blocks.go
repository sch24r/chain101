package handlers

import (
    "encoding/json"
    "net/http"
)

type Block struct {
    Index      int    `json:"index"`
    PrevHash   string `json:"prevHash"`
    Data       string `json:"data"`
    Hash       string `json:"hash"`
    Nonce      int    `json:"nonce"`
    Mined      bool   `json:"mined"`
    LastHash   string `json:"lastHash"`
    MinedCount int    `json:"minedCount"`
    IsValid    bool   `json:"isValid"`
}

var userBlocks = make(map[string][]Block)

func BlocksHandler(w http.ResponseWriter, r *http.Request) {
    sessionID, _ := getSession(r)

    w.Header().Set("X-Session-ID", sessionID)
    w.Header().Set("Content-Type", "application/json")

    mu.Lock()
    defer mu.Unlock()

    if r.Method == http.MethodPost {
        var blocks []Block
        err := json.NewDecoder(r.Body).Decode(&blocks)
        if err != nil {
            http.Error(w, "Invalid payload", http.StatusBadRequest)
            return
        }
        userBlocks[sessionID] = blocks
        
        saveSession(w, sessionID, sessions[sessionID])
        
        w.WriteHeader(http.StatusOK)
        return
    }

    // Return blocks for the session
    blocks, exists := userBlocks[sessionID]
    if !exists {
        blocks = []Block{}
    }
    
    json.NewEncoder(w).Encode(blocks)
}