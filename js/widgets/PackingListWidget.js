import UIComponent from '../UIComponent.js';

export default class PackingListWidget extends UIComponent {
  constructor(config = {}) { super({ id: config.id, title: 'Список вещей', icon: '▤' }); this.storageKey = `voyager-packing-list-${this.id}`; this.storageAvailable = true; this.items = this.readItems(); }
  readItems() { try { return JSON.parse(localStorage.getItem(this.storageKey) || '[]'); } catch { this.storageAvailable = false; return []; } }
  persist() { try { localStorage.setItem(this.storageKey, JSON.stringify(this.items)); this.storageAvailable = true; } catch { this.storageAvailable = false; } }
  makeId() { return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  render() {
    const card = this.createShell('packing-widget'); const body = card.querySelector('.widget-content');
    body.innerHTML = `<form class="inline-form"><label class="sr-only" for="${this.id}-item">Новая вещь</label><input id="${this.id}-item" name="item" placeholder="Добавить вещь…" maxlength="80" required><button class="primary-button" type="submit" aria-label="Добавить вещь">＋</button></form><div class="packing-list"></div><div class="list-footer"><span class="packing-progress"></span><button class="text-button clear-packed" type="button">Убрать отмеченное</button></div><div class="storage-note" hidden>Браузер не разрешил локальное сохранение — список останется до закрытия страницы.</div>`;
    const form = body.querySelector('form'); this.listen(form, 'submit', (event) => { event.preventDefault(); const value = form.elements.item.value.trim(); if (!value) return; this.items.push({ id: this.makeId(), text: value, done: false }); form.reset(); this.persist(); this.renderItems(); });
    this.listen(body.querySelector('.packing-list'), 'click', (event) => { const row = event.target.closest('[data-item-id]'); if (!row) return; const item = this.items.find((entry) => entry.id === row.dataset.itemId); if (!item) return; if (event.target.closest('[data-remove]')) this.items = this.items.filter((entry) => entry.id !== item.id); else if (event.target.matches('input[type="checkbox"]')) item.done = event.target.checked; this.persist(); this.renderItems(); });
    this.listen(body.querySelector('.clear-packed'), 'click', () => { this.items = this.items.filter((item) => !item.done); this.persist(); this.renderItems(); });
    this.renderItems(); return card;
  }
  renderItems() {
    const list = this.element.querySelector('.packing-list'), done = this.items.filter((item) => item.done).length;
    list.innerHTML = this.items.length ? this.items.map((item) => `<div class="packing-item ${item.done ? 'is-done' : ''}" data-item-id="${item.id}"><label><input type="checkbox" ${item.done ? 'checked' : ''}><span>${this.escape(item.text)}</span></label><button type="button" data-remove aria-label="Удалить ${this.escape(item.text)}">×</button></div>`).join('') : '<div class="empty-list">Здесь пока пусто — добавьте первую вещь</div>';
    this.element.querySelector('.packing-progress').textContent = `${done} из ${this.items.length} собрано`;
    this.element.querySelector('.storage-note').hidden = this.storageAvailable;
  }
  escape(value) { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
}
