/** Общий fetch-клиент: timeout, отмена и понятные ошибки для виджетов. */
export default class ApiService {
  static async fetchJSON(url, { signal, timeout = 10000 } = {}) {
    const controller = new AbortController();
    const abortFromCaller = () => controller.abort(signal?.reason);
    if (signal?.aborted) abortFromCaller();
    else signal?.addEventListener('abort', abortFromCaller, { once: true });
    const timer = setTimeout(() => controller.abort(new DOMException('Превышено время ожидания запроса.', 'TimeoutError')), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Сервис ответил ошибкой (${response.status}).`);
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') throw error;
      throw new Error(error instanceof TypeError ? 'Не удалось подключиться к API. Проверьте интернет и попробуйте снова.' : error.message);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abortFromCaller);
    }
  }
}
