package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"chain101/server/handlers"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	clientDir, _ := filepath.Abs("client")
	http.Handle("/", http.FileServer(http.Dir(clientDir)))
	http.HandleFunc("/api/stats", handlers.StatsHandler)
	http.HandleFunc("/api/logs", handlers.LogsHandler)
	http.HandleFunc("/api/echo", handlers.EchoHandler)
	http.HandleFunc("/api/blocks", handlers.BlocksHandler)

	log.Printf("Server running at http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
