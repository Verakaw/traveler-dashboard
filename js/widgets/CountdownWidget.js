import UIComponent from '../UIComponent.js';

export default class CountdownWidget extends UIComponent {
  constructor(config = {}) { super({ id: config.id, title: 'До путешествия', icon: '◷' }); this.storageKey = `voyager-countdown-${this.id}`; this.trip = this.readTrip(); this.interval = null; }
  readTrip() { try { return JSON.parse(localStorage.getItem(this.storageKey) || 'null'); } catch { return null; } }
  persist() { if (this.trip) localStorage.setItem(this.storageKey, JSON.stringify(this.trip)); else localStorage.removeItem(this.storageKey); }
  render() {
    const card = this.createShell('countdown-widget'); const body = card.querySelector('.widget-content');
    body.innerHTML = `<form class="trip-form"><label class="field-label">НАЗВАНИЕ ПОЕЗДКИ<input name="name" placeholder="Например, Лето в Лиссабоне" maxlength="60" required></label><label class="field-label">ДАТА ОТПРАВЛЕНИЯ<input name="date" type="date" required></label><button class="primary-button convert-button" type="submit">Сохранить поездку <span>→</span></button></form><div class="countdown-display" aria-live="polite"></div>`;
    const form = body.querySelector('form');
    if (this.trip) { form.elements.name.value = this.trip.name; form.elements.date.value = this.trip.date; }
    this.listen(form, 'submit', (event) => { event.preventDefault(); this.trip = { name: form.elements.name.value.trim(), date: form.elements.date.value }; this.persist(); this.showCountdown(); });
    this.showCountdown(); return card;
  }
  showCountdown() {
    const display = this.element.querySelector('.countdown-display');
    if (this.interval) { clearInterval(this.interval); this.intervals.delete(this.interval); this.interval = null; }
    if (!this.trip) { display.innerHTML = '<div class="empty-state">Добавьте дату, чтобы начать обратный отсчёт</div>'; return; }
    const update = () => {
      const target = new Date(`${this.trip.date}T00:00:00`); const remaining = Math.ceil((target - new Date()) / 86400000);
      display.innerHTML = `<div class="trip-title">${this.escape(this.trip.name)}</div><div class="countdown-number">${Math.max(remaining, 0)}<span>${remaining === 1 ? 'ДЕНЬ' : 'ДНЕЙ'}</span></div><div class="countdown-caption">${remaining < 0 ? 'Эта поездка уже началась — хорошего пути!' : remaining === 0 ? 'Сегодня — день отправления!' : `до ${new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(target)}`}</div>`;
    };
    update(); this.interval = this.trackInterval(setInterval(update, 60000));
  }
  escape(value) { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
}
