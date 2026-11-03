package server

import (
	"net/http"
	"time"

	"github.com/mmurzin/ai-for-developers-project-386/internal/web"
)

func NewServer(addr string) *http.Server {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	mux.Handle("GET /", web.Handler())

	// Резерв под будущие ручки: неизвестные /api/* — 404, а не SPA-фолбэк.
	mux.HandleFunc("GET /api/", http.NotFound)

	return &http.Server{
		Addr:              addr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
}
