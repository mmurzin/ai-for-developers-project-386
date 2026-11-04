package server

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/mmurzin/ai-for-developers-project-386/internal/api"
	"github.com/mmurzin/ai-for-developers-project-386/internal/storage"
	"github.com/mmurzin/ai-for-developers-project-386/internal/web"
)

func NewServer(addr string, store *storage.Store) *http.Server {
	mux := http.NewServeMux()

	// Роуты из TypeSpec-контракта (api/main.tsp → api/openapi.yaml):
	// типизированные strict-хендлеры, паттерны Go 1.22 на общем мухе.
	//
	// RequestErrorHandlerFunc: ошибки декодинга тела по умолчанию отдаются
	// 400 текстом. Поле не того типа (например, нецелая длительность) —
	// это ошибка валидации данных, а не синтаксиса: 422 с телом ErrorBody.
	api.HandlerWithOptions(
		api.NewStrictHandlerWithOptions(api.NewAPI(store), nil, api.StrictHTTPServerOptions{
			RequestErrorHandlerFunc: func(w http.ResponseWriter, _ *http.Request, err error) {
				var typeErr *json.UnmarshalTypeError
				if errors.As(err, &typeErr) {
					api.WriteError(w, http.StatusUnprocessableEntity, "invalid_field_type",
						fmt.Sprintf("поле %s: неверный тип", typeErr.Field))
					return
				}
				api.WriteError(w, http.StatusBadRequest, "malformed_json",
					"тело запроса не является корректным JSON")
			},
		}),
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
