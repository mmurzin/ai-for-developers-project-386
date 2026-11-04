package api

import (
	"context"
	"errors"
	"time"

	_ "time/tzdata" // база зон зашита в бинарь: Europe/Moscow доступна без системного tzdata

	"github.com/mmurzin/ai-for-developers-project-386/internal/storage"
)

// Константы v1 (карта решений #13, пп. 5–8): Окно записи — 14 календарных
// дней начиная со следующего дня; Рабочие часы — ежедневно 9:00–18:00
// в зоне инстанса; старты — по сетке 15 минут от начала Рабочих часов.
const (
	bookingWindowDays = 14
	workStartHour     = 9
	workEndHour       = 18
	slotStep          = 15 * time.Minute
)

// instanceZone — часовой пояс инстанса: в нём заданы Рабочие часы
// и считается дата «сегодня» для Окна записи (решение #13, п. 7).
var instanceZone = mustLoadZone("Europe/Moscow")

func mustLoadZone(name string) *time.Location {
	loc, err := time.LoadLocation(name)
	if err != nil {
		panic("time: zone " + name + " is unavailable: " + err.Error())
	}
	return loc
}

// SlotsAPI — публичная ручка Слотов: сетка вычисляется на лету
// из Рабочих часов и Окна записи, ничего не хранится.
type SlotsAPI struct {
	store *storage.Store
	now   func() time.Time
}

// NewSlotsAPI собирает хендлеры Слотов поверх хранилища и источника
// времени. now — внедряемый шов: продакшн передаёт time.Now,
// тесты — фиксированные часы для детерминированной сетки.
func NewSlotsAPI(store *storage.Store, now func() time.Time) SlotsAPI {
	return SlotsAPI{store: store, now: now}
}

// ListSlots отдаёт Слоты Типа звонка на Окно записи (публичная ручка):
// 200 с computed-сеткой, 404 для неизвестного идентификатора типа.
func (a SlotsAPI) ListSlots(ctx context.Context, request ListSlotsRequestObject) (ListSlotsResponseObject, error) {
	ct, err := a.store.GetCallType(ctx, request.Id)
	switch {
	case errors.Is(err, storage.ErrNotFound):
		return ListSlots404JSONResponse(ErrorBody{
			Code:    "call_type_not_found",
			Message: "Тип звонка не найден",
		}), nil
	case err != nil:
		return nil, err
	}

	return ListSlots200JSONResponse(SlotList{Items: computeSlots(a.now(), ct.DurationMinutes)}), nil
}

// computeSlots вычисляет Слоты на Окно записи (чистая функция,
// GLOSSARY.md: Слот, Окно записи, Рабочие часы).
//
// Окно записи — bookingWindowDays календарных дней начиная со следующего
// за «сегодня» дня; дата «сегодня» считается в зоне инстанса (включая
// выходные). Внутри каждого дня — Рабочие часы workStartHour–workEndHour:
// старты идут по сетке slotStep от начала часа, Слот длится durationMinutes
// и должен вмещаться целиком, поэтому последний старт — не позже,
// чем за Длительность до конца Рабочих часов. Времена строятся в зоне
// инстанса: на границе API маршалятся в ISO 8601 со смещением зоны.
func computeSlots(now time.Time, durationMinutes int32) []Slot {
	duration := time.Duration(durationMinutes) * time.Minute

	today := now.In(instanceZone)
	y, m, d := today.Date()

	slots := make([]Slot, 0, bookingWindowDays*int(workEndHour-workStartHour)*2)
	for day := 1; day <= bookingWindowDays; day++ {
		workStart := time.Date(y, m, d+day, workStartHour, 0, 0, 0, instanceZone)
		workEnd := time.Date(y, m, d+day, workEndHour, 0, 0, 0, instanceZone)
		for start := workStart; !start.Add(duration).After(workEnd); start = start.Add(slotStep) {
			slots = append(slots, Slot{StartsAt: start, EndsAt: start.Add(duration)})
		}
	}
	return slots
}
