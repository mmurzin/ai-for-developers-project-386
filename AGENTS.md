# AGENTS.md

Учебный проект Хекслета «Календарь звонков»: Go-бэкенд в корне + SPA в `frontend/`. Всё управление — через mise, Makefile и `bin/` удалены намеренно.

## Инструменты и команды

Все инструменты (go 1.26, node 24, pnpm, golangci-lint, gotestsum, oapi-codegen, go-arch-lint) закреплены в `mise.toml`. Запуск задач — только `mise run <задача>` (`mise tasks` — список). Если голые `go`/`pnpm` недоступны — нет активации mise (`eval "$(mise activate zsh)"`); системный node — старый (18), не использовать.

- `mise run dev` — бэкенд + фронтенд параллельно; бэкенд `:8080` (переопределение через `PORT`, healthcheck `/health`), фронт `:5173` (`strictPort`), dev-прокси `/api` → `:8080`
- `mise run check` — полный прогон проверок одной командой: lint + тесты Go + тесты фронта
- `mise run lint` — golangci-lint (Go) + eslint (фронтенд), обе части обязательны к зелёному
- `mise run test` — gotestsum; один тест: `mise x -- go test ./tests/smoke/ -v -run TestAppStartup`
- `mise run frontend-test` / `frontend-build` / `frontend-install`
- `mise run generate` — задел под OpenAPI; упадёт, пока нет `api/openapi.yaml` + `api/oapi-codegen.yaml`

## Конвенции

- Бэкенд — только stdlib (net/http, mux Go 1.22+), без chi/gin. Новые ручки вешать под префикс `/api/...` — от этого зависит vite-прокси без правок конфига
- Зависимости фронта ставить pnpm внутри `frontend/`. Корень репо не должен становиться npm-пакетом (никаких package.json/node_modules в корне)
- Frontend: React 19 + TS + Tailwind 4 + shadcn (base: radix). Компоненты добавлять через shadcn MCP (opencode.json) или `pnpm dlx shadcn@latest add <имя>` из `frontend/`
- Тесты фронта: vitest + RTL + jest-dom, jsdom, setup `src/test/setup.ts`; импорты `{ test, expect }` из vitest явно (globals не включены)

## Коммиты

Формат Conventional Commits 1.0.0: `<type>(<scope>): <описание>` — описание на английском, повелительное наклонение.

- Типы: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `build`, `ci`; scope — часть системы (`server`, `frontend`, `api`, `tools`)
- `feat` → minor, `fix` → patch; breaking changes — `!` после типа или футер `BREAKING CHANGE: ...`
- Будущий деплой по тегам `v*` будет опираться на историю коммитов (semver)

## Тесты

`tests/smoke/` — black-box: сам собирает бинарь (`go build ./cmd/server`), запускает на случайном свободном порту, опрашивает `/health`. Не конфликтует с работающими dev-серверами; при правке пути/порта/health-роута учесть.

## Линтеры: нестандартное

- `.golangci.yml` (v2-синтаксис): `gosec`/`noctx` отключены только в `*_test.go`; у `revive` выключен `package-comments` — не добавлять package-комментарии ради линтера
- В `cmd/server/main.go` строка лога помечена `#nosec G706` (taint из env `PORT`) — не удалять и не размножать: правило оставлено для будущего пользовательского ввода
- `go-arch-lint` установлен, конфига нет — `arch-lint.yml` заводить при появлении доменных пакетов

## Грабли (проверено на практике)

- `.github/workflows/hexlet-check.yml` — автогенерат Хекслета, никогда не править/удалять
- Скаффолды shadcn создают вложенный `.git` в рабочей директории — удалять сразу
- `shadcn mcp init ...` делает `npm install` в текущей папке (мусор в корне) — уже чистили один раз
- CLI shadcn 4.x: шаблон называется `-t vite` (не react); `-b/--base` — библиотека примитивов (radix), не цвет; неинтерактивно: `-t vite --base radix -p <пресет> -n <имя> --no-monorepo` (stdin-промпты не читает)
- CI/деплой пока не настроены (отложено). Запланировано: `go:embed` фронта в бинарь, GitHub Actions через `jdx/mise-action` + junit-отчёты (`GOTESTSUM_JUNITFILE`, vitest `--reporter=junit`), systemd на VPS — не предполагать, что это уже есть

## Agent skills

### Issue tracker

Issues tracked in GitHub Issues (`mmurzin/ai-for-developers-project-386`) via `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five triage labels, label string equals role name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
