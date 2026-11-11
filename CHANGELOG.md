# Changelog

## [0.4.0](https://github.com/mmurzin/ai-for-developers-project-386/compare/v0.3.0...v0.4.0) (2026-11-11)


### Features

* **frontend:** возвращать календарь к активному дню после конфликта ([#35](https://github.com/mmurzin/ai-for-developers-project-386/issues/35)) ([769b415](https://github.com/mmurzin/ai-for-developers-project-386/commit/769b415e22a1d9f406acb88e50a2696182dc0a6f))
* **frontend:** показывать Тип звонка и длительность в шапке экрана Слотов ([#34](https://github.com/mmurzin/ai-for-developers-project-386/issues/34)) ([3c94991](https://github.com/mmurzin/ai-for-developers-project-386/commit/3c9499199368f6b86fc732eb00f0be9a4aa4b87a))
* **frontend:** постоянная форма Записи со сводкой выбора ([#33](https://github.com/mmurzin/ai-for-developers-project-386/issues/33)) ([bd16a54](https://github.com/mmurzin/ai-for-developers-project-386/commit/bd16a548b45385e7e15609cec2799cea6e755ea1))
* **frontend:** сохранять сообщение конфликта при опустевшем Окне записи ([#35](https://github.com/mmurzin/ai-for-developers-project-386/issues/35)) ([58b9a23](https://github.com/mmurzin/ai-for-developers-project-386/commit/58b9a236b6200ed0c4ee1ef42e13f9e3253e44c6))
* **frontend:** считать длительность Слота из его границ ([#33](https://github.com/mmurzin/ai-for-developers-project-386/issues/33)) ([3a090b2](https://github.com/mmurzin/ai-for-developers-project-386/commit/3a090b2c2f7a603a377abe62d19a0bf170278861))
* **frontend:** чистые хелперы календаря в lib/slots ([#32](https://github.com/mmurzin/ai-for-developers-project-386/issues/32)) ([8983dc9](https://github.com/mmurzin/ai-for-developers-project-386/commit/8983dc9ea5e46d961436cad36ac8282ac5af90e1))
* **frontend:** экран Слотов в три колонны с календарём выбора дня ([#32](https://github.com/mmurzin/ai-for-developers-project-386/issues/32)) ([5cc9fbf](https://github.com/mmurzin/ai-for-developers-project-386/commit/5cc9fbf62c5baf65f7a387bda39389f1ff64d5c7))


### Bug Fixes

* **frontend:** не полагаться на порядок дней в calendarMonthRange ([#31](https://github.com/mmurzin/ai-for-developers-project-386/issues/31)) ([9095f6e](https://github.com/mmurzin/ai-for-developers-project-386/commit/9095f6e76c5b8f5d4ad3e128533a616a1479e95a))

## [0.3.0](https://github.com/mmurzin/ai-for-developers-project-386/compare/v0.2.0...v0.3.0) (2026-11-09)


### Features

* **server:** посеять дефолтные Типы звонка при старте ([#26](https://github.com/mmurzin/ai-for-developers-project-386/issues/26)) ([869d46c](https://github.com/mmurzin/ai-for-developers-project-386/commit/869d46c5bcc93575e4468d9157cf4ffe3c304845))
* **server:** посеять дефолтные Типы звонка при старте ([#26](https://github.com/mmurzin/ai-for-developers-project-386/issues/26)) ([54f4d49](https://github.com/mmurzin/ai-for-developers-project-386/commit/54f4d494a8d132d64930f06eba4a45b86a51bdd6))

## [0.2.0](https://github.com/mmurzin/ai-for-developers-project-386/compare/v0.1.0...v0.2.0) (2026-11-09)


### Features

* **api:** computed-слоты типов звонка и шов времени ([#15](https://github.com/mmurzin/ai-for-developers-project-386/issues/15)) ([9868b40](https://github.com/mmurzin/ai-for-developers-project-386/commit/9868b4049684c6aef572481443f3eaebb7c0253c))
* **api:** вычет активных Записей из Слотов ([#16](https://github.com/mmurzin/ai-for-developers-project-386/issues/16)) ([23fa4ee](https://github.com/mmurzin/ai-for-developers-project-386/commit/23fa4ee272b150b19b4b74f27ce5329213ff80d9))
* **api:** контракт слотов типа звонка в TypeSpec ([#15](https://github.com/mmurzin/ai-for-developers-project-386/issues/15)) ([1f3d0c7](https://github.com/mmurzin/ai-for-developers-project-386/commit/1f3d0c70c1d366d8c44a4f78584cb53f40d090df))
* **api:** контракт создания Записи в TypeSpec ([#16](https://github.com/mmurzin/ai-for-developers-project-386/issues/16)) ([bdb665a](https://github.com/mmurzin/ai-for-developers-project-386/commit/bdb665a9834e34b1c5b478655da9c122c01e9c8f))
* **api:** ручка предстоящих Записей одним списком ([#17](https://github.com/mmurzin/ai-for-developers-project-386/issues/17)) ([191813b](https://github.com/mmurzin/ai-for-developers-project-386/commit/191813b42fce24bff538ebd3ca12cccf22548bb3))
* **api:** ручка создания Записи с валидацией и конфликтом ([#16](https://github.com/mmurzin/ai-for-developers-project-386/issues/16)) ([262c343](https://github.com/mmurzin/ai-for-developers-project-386/commit/262c343e18d651d16179fd840a444366d483996f))
* **api:** ручки типов звонка через контракт, сервер и валидацию ([#14](https://github.com/mmurzin/ai-for-developers-project-386/issues/14)) ([fb23c59](https://github.com/mmurzin/ai-for-developers-project-386/commit/fb23c598980c711dde5f53ee59d2f143737816a3))
* **frontend:** страница админки «Предстоящие» одним списком ([#17](https://github.com/mmurzin/ai-for-developers-project-386/issues/17)) ([eceea7f](https://github.com/mmurzin/ai-for-developers-project-386/commit/eceea7f23207f7c79071c5eda46767995ac6a6d4))
* **frontend:** страница админки типов звонка ([#14](https://github.com/mmurzin/ai-for-developers-project-386/issues/14)) ([6d60145](https://github.com/mmurzin/ai-for-developers-project-386/commit/6d60145f1805dbef9324dd364b94e09b6975603a))
* **frontend:** страница гостя с типами звонков и календарём слотов ([#15](https://github.com/mmurzin/ai-for-developers-project-386/issues/15)) ([49ae925](https://github.com/mmurzin/ai-for-developers-project-386/commit/49ae92582bb54d1bb374128aa7d1c786b3394e8b))
* **frontend:** форма брони Слота и экран подтверждения ([#16](https://github.com/mmurzin/ai-for-developers-project-386/issues/16)) ([b54ab51](https://github.com/mmurzin/ai-for-developers-project-386/commit/b54ab5197ea74a604ba939d061b7f6bdf46b3450))
* **storage:** sqlite-хранилище типов звонка ([#14](https://github.com/mmurzin/ai-for-developers-project-386/issues/14)) ([3acdbc4](https://github.com/mmurzin/ai-for-developers-project-386/commit/3acdbc4311a236e7efb5fa7296eca503d08e69b9))
* **storage:** получение типа звонка по идентификатору ([#15](https://github.com/mmurzin/ai-for-developers-project-386/issues/15)) ([0e42a43](https://github.com/mmurzin/ai-for-developers-project-386/commit/0e42a4323b7415cb5e81feaf67e7170e04bcde7c))
* **storage:** таблица Записей и атомарная бронь ([#16](https://github.com/mmurzin/ai-for-developers-project-386/issues/16)) ([2f6538e](https://github.com/mmurzin/ai-for-developers-project-386/commit/2f6538ea8ba3d11bc63a7591fcd3344199a4c067))


### Bug Fixes

* **frontend:** типизация результатов hey-api клиента ([#14](https://github.com/mmurzin/ai-for-developers-project-386/issues/14)) ([505e23a](https://github.com/mmurzin/ai-for-developers-project-386/commit/505e23a87c39845d3c57e264c5bfbcb4a86ca836))

## 0.1.0 (2026-11-04)


### Features

* **api:** add typespec project emitting openapi 3.0 ([3f4e10f](https://github.com/mmurzin/ai-for-developers-project-386/commit/3f4e10fb528d409756d93405ee31b66ef15d2f41))
* **api:** serve health from generated oapi-codegen stubs ([855c6ec](https://github.com/mmurzin/ai-for-developers-project-386/commit/855c6ec69e29d3591b9bc2592528abbdf406ee07))
* **frontend:** add duration choice home page with booking stub route ([0011ac3](https://github.com/mmurzin/ai-for-developers-project-386/commit/0011ac300891b39f9eb5c4c0f53a5f1ed3f2f394))
* **frontend:** add Vite React SPA with shadcn ([66baffb](https://github.com/mmurzin/ai-for-developers-project-386/commit/66baffb0823f95401e12aac4bb45b66d073cb6ba))
* **frontend:** generate typed api client from openapi spec ([913d4e1](https://github.com/mmurzin/ai-for-developers-project-386/commit/913d4e1b9b32df088f204a00b0294c014442ee2c))
* **server:** add HTTP server with health endpoint ([ae31c82](https://github.com/mmurzin/ai-for-developers-project-386/commit/ae31c824a78e9e1cf63f6066b50a5139b8a9ff41))
* **server:** serve embedded frontend from binary with spa fallback ([dea889d](https://github.com/mmurzin/ai-for-developers-project-386/commit/dea889d508eb1cfc56f5218d667db2e838652641))
