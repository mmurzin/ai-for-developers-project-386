package api

import (
	"github.com/mmurzin/ai-for-developers-project-386/internal/storage"
)

// API собирает все strict-хендлеры контракта в один объект
// для передачи в NewStrictHandler: сгенерированный StrictServerInterface
// единый, а реализация разложена по файлам предметных областей.
type API struct {
	HealthAPI
	CallTypesAPI
}

// NewAPI собирает API поверх хранилища.
func NewAPI(store *storage.Store) API {
	return API{
		HealthAPI:    HealthAPI{},
		CallTypesAPI: NewCallTypesAPI(store),
	}
}
