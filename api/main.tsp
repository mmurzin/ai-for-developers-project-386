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
