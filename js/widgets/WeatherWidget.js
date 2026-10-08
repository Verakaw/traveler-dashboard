import UIComponent from '../UIComponent.js';
import ApiService from '../services/ApiService.js';

const weatherText = (code) => code === 0 ? 'Ясно' : code <= 3 ? 'Переменная облачность' : code <= 48 ? 'Туман' : code <= 67 ? 'Дождь' : code <= 77 ? 'Снег' : code <= 82 ? 'Ливень' : 'Гроза';
export default class WeatherWidget extends UIComponent {
  constructor(config = {}) { super({ id: config.id, title: 'Погода', icon: '☼' }); this.city = config.city || ''; this.busy = false; }
  render() {
    const card = this.createShell('weather-widget'); const body = card.querySelector('.widget-content');
    body.innerHTML = `<form class="inline-form"><label class="sr-only" for="${this.id}-city">Город</label><input id="${this.id}-city" name="city" placeholder="Например, Токио" value="${this.city}" required><button class="primary-button" type="submit" aria-label="Найти погоду">→</button></form><div class="result-area" aria-live="polite"><div class="empty-state">Введите город, чтобы узнать погоду</div></div><div class="api-credit">Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo.com</a></div>`;
    const form = body.querySelector('form'); this.listen(form, 'submit', (event) => { event.preventDefault(); this.load(form.elements.city.value.trim()); });
    if (this.city) this.load(this.city); return card;
  }
  async load(city) {
    if (!city || this.busy) return; this.busy = true; this.city = city;
    const result = this.element.querySelector('.result-area'); result.innerHTML = '<div class="loading-state"><span class="spinner"></span>Ищем город…</div>';
    const controller = this.createController();
    try {
      const geo = await ApiService.fetchJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`, { signal: controller.signal });
      const place = geo.results?.[0];
      if (!place) { result.innerHTML = '<div class="empty-state">Город не найден. Проверьте название.</div>'; return; }
      const data = await ApiService.fetchJSON(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=5`, { signal: controller.signal });
      const unit = data.current_units?.temperature_2m || '°C';
      const days = data.daily.time.slice(0, 5).map((date, i) => `<div class="forecast-day"><span>${new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(new Date(`${date}T12:00:00`))}</span><span>${Math.round(data.daily.temperature_2m_min[i])}° <b>${Math.round(data.daily.temperature_2m_max[i])}°</b></span></div>`).join('');
      result.innerHTML = `<div class="weather-now"><div><div class="weather-place">${place.name}, ${place.country}</div><div class="weather-condition">${weatherText(data.current.weather_code)}</div></div><div class="weather-temp">${Math.round(data.current.temperature_2m)}<sup>${unit}</sup></div></div><div class="weather-meta"><span>↗ Ветер ${Math.round(data.current.wind_speed_10m)} км/ч</span><span>Прогноз · 5 дней</span></div><div class="forecast-list">${days}</div>`;
    } catch (error) { if (error.name !== 'AbortError') result.innerHTML = `<div class="error-state">${error.name === 'TimeoutError' ? 'Запрос занял слишком много времени.' : error.message}</div>`; }
    finally { this.releaseController(controller); this.busy = false; }
  }
}
