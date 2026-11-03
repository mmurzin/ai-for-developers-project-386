package smoke_test

import (
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"testing"
	"time"
)

func TestAppStartup(t *testing.T) {
	_, thisFile, _, _ := runtime.Caller(0)
	root := filepath.Dir(filepath.Dir(filepath.Dir(thisFile)))

	bin := filepath.Join(t.TempDir(), "server")

	build := exec.Command("go", "build", "-o", bin, "./cmd/server")
	build.Dir = root
	if out, err := build.CombinedOutput(); err != nil {
		t.Fatalf("build server: %v\n%s", err, out)
	}

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("reserve port: %v", err)
	}
	port := listener.Addr().(*net.TCPAddr).Port
	_ = listener.Close()

	app := exec.Command(bin)
	app.Env = append(app.Env, "PORT="+strconv.Itoa(port))
	if err := app.Start(); err != nil {
		t.Fatalf("start server: %v", err)
	}
	t.Cleanup(func() {
		_ = app.Process.Kill()
		_ = app.Wait()
	})

	url := "http://127.0.0.1:" + strconv.Itoa(port) + "/health"
	resp, err := pollHealth(url, 3*time.Second)
	if err != nil {
		t.Fatalf("server did not become healthy: %v", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.StatusCode)
	}

	var body struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if body.Status != "ok" {
		t.Fatalf("expected status ok, got %q", body.Status)
	}
}

func pollHealth(url string, timeout time.Duration) (*http.Response, error) {
	deadline := time.Now().Add(timeout)
	for {
		resp, err := http.Get(url)
		if err == nil {
			if resp.StatusCode == http.StatusOK {
				return resp, nil
			}
			_ = resp.Body.Close()
		}
		if time.Now().After(deadline) {
			return nil, errors.New("deadline exceeded")
		}
		time.Sleep(100 * time.Millisecond)
	}
}
