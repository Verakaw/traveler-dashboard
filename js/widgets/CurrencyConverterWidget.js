import UIComponent from '../UIComponent.js';
import ApiService from '../services/ApiService.js';

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'RUB', 'INR', 'NZD', 'SEK'];
const options = (selected) => currencies.map((code) => `<option value="${code}" ${code === selected ? 'selected' : ''}>${code}</option>`).join('');
export default class CurrencyConverterWidget extends UIComponent {
  constructor(config = {}) { super({ id: config.id, title: 'Конвертер валют', icon: '⇄' }); this.from = config.from || 'USD'; this.to = config.to || 'EUR'; this.amount = config.amount || '100'; }
  render() {
    const card = this.createShell('currency-widget'); const body = card.querySelector('.widget-content');
    body.innerHTML = `<form class="currency-form"><label class="field-label">СУММА<input name="amount" type="number" min="0.01" step="any" value="${this.amount}" required></label><div class="currency-row"><label class="field-label">ИЗ<select name="from">${options(this.from)}</select></label><button class="swap-button" type="button" aria-label="Поменять валюты местами" title="Поменять местами">⇄</button><label class="field-label">ВАЛЮТА<select name="to">${options(this.to)}</select></label></div><button class="primary-button convert-button" type="submit">Конвертировать <span>→</span></button></form><div class="result-area conversion-result" aria-live="polite"><div class="empty-state">Актуальный курс ЕЦБ</div></div>`;
    const form = body.querySelector('form'); this.listen(form, 'submit', (event) => { event.preventDefault(); this.convert(form); });
    this.listen(body.querySelector('.swap-button'), 'click', () => { const from = form.elements.from.value; form.elements.from.value = form.elements.to.value; form.elements.to.value = from; this.convert(form); });
    return card;
  }
  async convert(form) {
    const amount = Number(form.elements.amount.value), from = form.elements.from.value, to = form.elements.to.value; this.amount = amount; this.from = from; this.to = to;
    const result = this.element.querySelector('.conversion-result');
    if (!(amount > 0)) { result.innerHTML = '<div class="error-state">Введите сумму больше нуля.</div>'; return; }
    if (from === to) { result.innerHTML = `<div class="conversion-output"><span>РЕЗУЛЬТАТ</span><b>${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(amount)} ${to}</b></div><div class="rate-note">Одинаковые валюты · курс 1:1</div>`; return; }
    result.innerHTML = '<div class="loading-state"><span class="spinner"></span>Получаем курс ЕЦБ…</div>';
    const controller = this.createController();
    try {
      // Frankfurter v2 предоставляет бесплатную пару через /rate/{from}/{to}.
      const data = await ApiService.fetchJSON(`https://api.frankfurter.dev/v2/rate/${from}/${to}`, { signal: controller.signal });
      const converted = amount * data.rate;
      if (!Number.isFinite(converted)) throw new Error('Сервис не вернул курс для выбранной валюты.');
      result.innerHTML = `<div class="conversion-output"><span>РЕЗУЛЬТАТ</span><b>${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(converted)} ${to}</b></div><div class="rate-note">1 ${from} = ${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 4 }).format(data.rate)} ${to} <span>· данные ЕЦБ, ${data.date}</span></div>`;
    } catch (error) { if (error.name !== 'AbortError') result.innerHTML = `<div class="error-state">${error.message}</div>`; }
    finally { this.releaseController(controller); }
  }
}
