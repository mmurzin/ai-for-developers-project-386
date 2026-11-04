package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/mmurzin/ai-for-developers-project-386/internal/server"
	"github.com/mmurzin/ai-for-developers-project-386/internal/storage"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "calls.db"
	}

	store, err := storage.Open(dbPath)
	if err != nil {
		log.Fatalf("open storage: %v", err)
	}
	defer func() { _ = store.Close() }()

	srv := server.NewServer(":"+port, store, time.Now)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Printf("server listening on %s", srv.Addr) // #nosec G706 -- addr из операторского env, не пользовательский ввод
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("listen: %v", err)
		}
	}()

	<-ctx.Done()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("shutdown: %v", err)
	}
}
