package main

import (
	"log"
	"net/http"
	"os"
	"blockchain-101/server/handlers"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fs := http.FileServer(http.Dir("./client"))
	http.Handle("/", fs)

	http.HandleFunc("/api/stats", handlers.StatsHandler)
	http.HandleFunc("/api/logs", handlers.LogsHandler)
	http.HandleFunc("/api/echo", handlers.EchoHandler)

	log.Printf("Server running at http://localhost:%s\n", port)
	http.ListenAndServe(":"+port, nil)
}
