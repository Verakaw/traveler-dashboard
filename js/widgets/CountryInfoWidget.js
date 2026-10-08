import UIComponent from '../UIComponent.js';
import ApiService from '../services/ApiService.js';

export default class CountryInfoWidget extends UIComponent {
  constructor(config = {}) { super({ id: config.id, title: 'Информация о стране', icon: '◎' }); this.country = config.country || ''; this.busy = false; }
  render() {
    const card = this.createShell('country-widget'); const body = card.querySelector('.widget-content');
    body.innerHTML = `<form class="inline-form"><label class="sr-only" for="${this.id}-country">Страна или ISO-код</label><input id="${this.id}-country" name="country" placeholder="Страна или ISO-код" value="${this.country}" required><button class="primary-button" type="submit" aria-label="Найти страну">→</button></form><div class="result-area" aria-live="polite"><div class="empty-state">Введите страну или ISO-код</div></div>`;
    const form = body.querySelector('form'); this.listen(form, 'submit', (event) => { event.preventDefault(); this.load(form.elements.country.value.trim()); });
    if (this.country) this.load(this.country); return card;
  }
  async load(query) {
    if (!query || this.busy) return; this.busy = true; const result = this.element.querySelector('.result-area'); result.innerHTML = '<div class="loading-state"><span class="spinner"></span>Загружаем данные…</div>';
    const controller = this.createController();
    try {
      let matches;
      // Старый REST Countries v3.1 отключён. Сначала пробуем его, затем используем
      // совместимый статический снимок того же открытого набора стран без ключа.
      try {
        const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(query)}?fields=name,capital,currencies,languages,flags,population,region`;
        const response = await ApiService.fetchJSON(url, { signal: controller.signal });
        if (Array.isArray(response)) matches = response;
        else throw new Error(response?.errors?.[0]?.message || 'REST Countries v3.1 недоступен.');
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        const countries = await ApiService.fetchJSON('https://raw.githubusercontent.com/mledoze/countries/master/countries.json', { signal: controller.signal, timeout: 20000 });
        const normalized = query.trim().toLocaleLowerCase();
        const regionNames = { africa: 'africa', americas: 'americas', asia: 'asia', europe: 'europe', oceania: 'oceania', антарктида: 'antarctic' };
        matches = countries.filter((item) => [item.name?.common, item.name?.official, item.cca2, item.cca3].some((value) => value?.toLocaleLowerCase() === normalized)
          || item.name?.common?.toLocaleLowerCase().includes(normalized)
          || (regionNames[normalized] && item.region?.toLocaleLowerCase() === regionNames[normalized]));
      }
      const country = Array.isArray(matches) ? matches[0] : matches;
      if (!country) { result.innerHTML = '<div class="empty-state">Страна не найдена.</div>'; return; }
      const currency = Object.values(country.currencies || {})[0];
      const population = country.population ? new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 }).format(country.population) : '—';
      const commonName = country.name?.common || country.name?.official || country.name;
      result.innerHTML = `<div class="country-card"><img class="country-flag" src="${country.flags?.svg || country.flags?.png || ''}" alt="Флаг: ${commonName}" loading="lazy"><div><div class="country-name">${commonName}</div><div class="country-region">${country.region || 'Регион не указан'}</div></div></div><div class="country-facts"><div><span>СТОЛИЦА</span><b>${country.capital?.[0] || '—'}</b></div><div><span>ВАЛЮТА</span><b>${currency ? `${currency.name} (${currency.symbol || ''})` : Object.keys(country.currencies || {})[0] || '—'}</b></div><div><span>ЯЗЫКИ</span><b>${Object.values(country.languages || {}).slice(0, 2).join(', ') || '—'}</b></div><div><span>НАСЕЛЕНИЕ</span><b>${population}</b></div></div><div class="api-credit">Источник: открытая база стран · REST Countries v3.1 сейчас недоступен</div>`;
    } catch (error) { if (error.name !== 'AbortError') result.innerHTML = `<div class="error-state">${error.message.includes('(404)') ? 'Страна не найдена.' : error.message}</div>`; }
    finally { this.releaseController(controller); this.busy = false; }
  }
}
