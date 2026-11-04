package server

import (
	"net/http"
	"time"

	"github.com/mmurzin/ai-for-developers-project-386/internal/api"
	"github.com/mmurzin/ai-for-developers-project-386/internal/web"
)

func NewServer(addr string) *http.Server {
	mux := http.NewServeMux()

	// Роуты из TypeSpec-контракта (api/main.tsp → api/openapi.yaml):
	// типизированные strict-хендлеры, паттерны Go 1.22 на общем мухе.
	api.HandlerWithOptions(
		api.NewStrictHandler(api.HealthAPI{}, nil),
		api.StdHTTPServerOptions{BaseRouter: mux},
	)

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
