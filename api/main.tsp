import "@typespec/http";
import "@typespec/openapi";

using TypeSpec.Http;

@service(#{ title: "Call Calendar API" })
@OpenAPI.info(#{ version: "0.0.1" })
namespace CallCalendar;

/**
 * Ответ проверки живости сервиса.
 */
model HealthStatus {
  /**
   * Текущее состояние; живой сервис отвечает "ok".
   */
  status: string;
}

/**
 * Проверка живости сервиса.
 */
@route("/health")
@get
op health(): HealthStatus;

// ---------- Ошибки ----------

/**
 * Тело ошибки: machine-readable код + сообщение для человека.
 *
 * Коды (snake_case), используемые сервисом:
 * - `malformed_json` — тело запроса не является корректным JSON (400);
 * - `invalid_field_type` — поле запроса имеет неверный тип,
 *   например нецелая длительность (422);
 * - `empty_id` — пустой идентификатор Типа звонка (422);
 * - `empty_name` — пустое название Типа звонка (422);
 * - `duration_out_of_range` — Длительность звонка вне 5–240 минут (422);
 * - `duplicate_id` — идентификатор Типа звонка уже существует (409);
 * - `call_type_not_found` — Тип звонка по идентификатору не найден (404).
 */
model ErrorBody {
  /**
   * Machine-readable код ошибки.
   */
  code: string;

  /**
   * Сообщение для человека.
   */
  message: string;
}

/**
 * Дубликат идентификатора Типа звонка.
 */
@error
model ConflictError extends ConflictResponse {
  @body body: ErrorBody;
}

/**
 * Ошибка валидации данных запроса.
 */
/**
 * Ошибка валидации данных запроса.
 */
@error
model ValidationError extends Response<422> {
  @body body: ErrorBody;
}

/**
 * Ресурс не найден.
 */
@error
model NotFoundError extends NotFoundResponse {
  @body body: ErrorBody;
}

// ---------- Типы звонков ----------

/**
 * Тип звонка: набор параметров, который задаёт Владелец страницы.
 */
model CallType {
  /**
   * Идентификатор: строковый, задаёт Владелец страницы.
   */
  id: string;

  /**
   * Название для отображения Гостю.
   */
  name: string;

  /**
   * Описание вида Звонка.
   */
  description: string;

  /**
   * Длительность звонка в минутах: целое от 5 до 240.
   */
  durationMinutes: int32;
}

/**
 * Данные для создания Типа звонка.
 */
model CreateCallTypeRequest {
  /**
   * Идентификатор: строковый, задаёт Владелец страницы.
   */
  id: string;

  /**
   * Название для отображения Гостю.
   */
  name: string;

  /**
   * Описание вида Звонка.
   */
  description: string;

  /**
   * Длительность звонка в минутах: целое от 5 до 240.
   */
  durationMinutes: int32;
}

/**
 * Тип звонка создан.
 */
model CallTypeCreated extends CreatedResponse {
  @body body: CallType;
}

/**
 * Список Типов звонков.
 */
model CallTypeList {
  /**
   * Созданные Типы звонков.
   */
  items: CallType[];
}

/**
 * Создать Тип звонка (Владелец страницы).
 */
@route("/api/call-types")
@post
op createCallType(@body body: CreateCallTypeRequest): CallTypeCreated | ConflictError | ValidationError;

/**
 * Список Типов звонков (публично: их видит Гость).
 */
@route("/api/call-types")
@get
op listCallTypes(): CallTypeList;

// ---------- Слоты ----------

/**
 * Слот: свободное место для Звонка внутри Окна записи и Рабочих часов,
 * вмещающее Звонок выбранного Типа звонка целиком (GLOSSARY.md).
 * Вычисляется на лету, не хранится.
 */
model Slot {
  /**
   * Начало Слота; ISO 8601 с явным смещением часового пояса.
   */
  startsAt: offsetDateTime;

  /**
   * Конец Слота: начало плюс Длительность звонка Типа звонка.
   */
  endsAt: offsetDateTime;
}

/**
 * Список Слотов Типа звонка на Окно записи.
 */
model SlotList {
  /**
   * Свободные Слоты внутри Окна записи, по порядку времени.
   */
  items: Slot[];
}

/**
 * Слоты Типа звонка (публично: их видит Гость): вычисленная сетка
 * на Окно записи — 14 календарных дней со следующего дня,
 * Рабочие часы 9:00–18:00 Europe/Moscow, старты каждые 15 минут.
 */
@route("/api/call-types/{id}/slots")
@get
op listSlots(id: string): SlotList | NotFoundError;
