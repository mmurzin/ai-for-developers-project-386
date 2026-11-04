// Package storage — SQLite-хранилище доменных данных (ADR-0001):
// pure-Go драйвер modernc.org/sqlite, один файл базы, прагмы в DSN.
package storage

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"modernc.org/sqlite"
	sqlite3 "modernc.org/sqlite/lib"
)

// ErrDuplicate — семантическая ошибка «запись с таким идентификатором уже есть».
// Хендлеры API маппят её в 409, не зная кодов SQLite.
var ErrDuplicate = errors.New("duplicate id")

// ErrNotFound — семантическая ошибка «объект не найден».
// Хендлеры API маппят её в 404.
var ErrNotFound = errors.New("not found")

// CallType — Тип звонка: параметры, которые задаёт Владелец страницы (GLOSSARY.md).
type CallType struct {
	ID              string
	Name            string
	Description     string
	DurationMinutes int32
}

// Store — хранилище поверх одного файла SQLite.
// DSN уже содержит _txlock=immediate: BeginTx берёт писательский лок сразу,
// поэтому будущие «прочитать-проверить-записать» (бронь Слота, #16)
// атомарны без изменения сетапа.
type Store struct {
	db *sql.DB
}

// schema — миграция при каждом Open: идемпотентная, без внешних либ.
const schema = `
CREATE TABLE IF NOT EXISTS call_types (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  description      TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 5 AND duration_minutes <= 240)
);
`

// Open открывает (или создаёт) базу по пути и накатывает миграцию.
func Open(path string) (*Store, error) {
	// busy_timeout — ждать лок до 5с вместо мгновенного SQLITE_BUSY;
	// WAL — читатели не блокируют писателя; foreign_keys — целостность
	// будущих ссылок (Записи → Типы звонков); см. ADR-0001 и заметки к #14.
	dsn := fmt.Sprintf(
		"file:%s?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_pragma=foreign_keys(1)&_txlock=immediate",
		path,
	)

	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("open sqlite %s: %w", path, err)
	}
	if err := db.PingContext(context.Background()); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("ping sqlite %s: %w", path, err)
	}
	if _, err := db.ExecContext(context.Background(), schema); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("migrate sqlite %s: %w", path, err)
	}

	return &Store{db: db}, nil
}

// Close закрывает базу.
func (s *Store) Close() error {
	return s.db.Close()
}

// CreateCallType сохраняет новый Тип звонка.
// Дубликат идентификатора — ErrDuplicate; прочее — обёрнутая ошибка драйвера.
func (s *Store) CreateCallType(ctx context.Context, ct CallType) error {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO call_types (id, name, description, duration_minutes) VALUES (?, ?, ?, ?)`,
		ct.ID, ct.Name, ct.Description, ct.DurationMinutes,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return ErrDuplicate
		}
		return fmt.Errorf("insert call type %q: %w", ct.ID, err)
	}
	return nil
}

// GetCallType возвращает Тип звонка по идентификатору.
// Отсутствие — ErrNotFound; прочее — обёрнутая ошибка драйвера.
func (s *Store) GetCallType(ctx context.Context, id string) (CallType, error) {
	var ct CallType
	err := s.db.QueryRowContext(ctx,
		`SELECT id, name, description, duration_minutes FROM call_types WHERE id = ?`, id,
	).Scan(&ct.ID, &ct.Name, &ct.Description, &ct.DurationMinutes)
	if errors.Is(err, sql.ErrNoRows) {
		return CallType{}, ErrNotFound
	}
	if err != nil {
		return CallType{}, fmt.Errorf("select call type %q: %w", id, err)
	}
	return ct, nil
}

// ListCallTypes возвращает все Типы звонков, отсортированные по идентификатору.
func (s *Store) ListCallTypes(ctx context.Context) ([]CallType, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, name, description, duration_minutes FROM call_types ORDER BY id`,
	)
	if err != nil {
		return nil, fmt.Errorf("select call types: %w", err)
	}
	defer func() { _ = rows.Close() }()

	var types []CallType
	for rows.Next() {
		var ct CallType
		if err := rows.Scan(&ct.ID, &ct.Name, &ct.Description, &ct.DurationMinutes); err != nil {
			return nil, fmt.Errorf("scan call type: %w", err)
		}
		types = append(types, ct)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate call types: %w", err)
	}
	return types, nil
}

// isUniqueViolation отличает нарушение уникальности PRIMARY KEY (1555)
// от обычного UNIQUE-индекса (2067); sentinel-ошибок в modernc.org/sqlite
// v1.61.x нет — только *sqlite.Error с кодом (заметки к #14).
func isUniqueViolation(err error) bool {
	var se *sqlite.Error
	if !errors.As(err, &se) {
		return false
	}
	return se.Code() == sqlite3.SQLITE_CONSTRAINT_PRIMARYKEY ||
		se.Code() == sqlite3.SQLITE_CONSTRAINT_UNIQUE
}
