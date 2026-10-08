import WeatherWidget from './widgets/WeatherWidget.js';
import CountryInfoWidget from './widgets/CountryInfoWidget.js';
import CurrencyConverterWidget from './widgets/CurrencyConverterWidget.js';
import PackingListWidget from './widgets/PackingListWidget.js';
import CountdownWidget from './widgets/CountdownWidget.js';

/** Реестр экземпляров и единственная точка управления карточками. */
export default class Dashboard {
  constructor(container) {
    this.container = container;
    this.widgets = new Map();
    this.factories = { weather: WeatherWidget, country: CountryInfoWidget, currency: CurrencyConverterWidget, packing: PackingListWidget, countdown: CountdownWidget };
    this.handleControls = this.handleControls.bind(this);
    this.container.addEventListener('click', this.handleControls);
  }
  addWidget(type, config = {}) {
    const Widget = this.factories[type];
    if (!Widget) throw new Error(`Неизвестный тип виджета: ${type}`);
    const widget = new Widget(config);
    const element = widget.render();
    this.widgets.set(widget.id, widget);
    this.container.append(element);
    this.updateCount();
    return widget;
  }
  handleControls(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const card = button.closest('[data-widget-id]');
    const widget = this.widgets.get(card?.dataset.widgetId);
    if (!widget) return;
    if (button.dataset.action === 'minimize') widget.minimize();
    if (button.dataset.action === 'close') this.removeWidget(widget.id);
  }
  removeWidget(id) { const widget = this.widgets.get(id); if (!widget) return; widget.destroy(); this.widgets.delete(id); this.updateCount(); }
  updateCount() { const node = document.querySelector('#widget-count'); if (node) node.textContent = String(this.widgets.size).padStart(2, '0'); }
  destroy() { this.container.removeEventListener('click', this.handleControls); [...this.widgets.keys()].forEach((id) => this.removeWidget(id)); }
}
