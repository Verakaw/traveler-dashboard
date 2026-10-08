/** Общая оболочка виджета. Базовый класс нельзя использовать напрямую. */
export default class UIComponent {
  constructor({ id, title, icon }) {
    if (new.target === UIComponent) throw new TypeError('UIComponent — абстрактный класс.');
    this.id = id || `${this.constructor.name.toLowerCase()}-${crypto.randomUUID()}`;
    this.title = title;
    this.icon = icon;
    this.element = null;
    this.listeners = [];
    this.intervals = new Set();
    this.controllers = new Set();
    this.minimized = false;
  }

  render() { throw new Error(`${this.constructor.name} должен реализовать render().`); }

  /** Регистрирует слушатель так, чтобы destroy() мог гарантированно его снять. */
  listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    this.listeners.push({ target, type, handler, options });
    return handler;
  }
  trackInterval(id) { this.intervals.add(id); return id; }
  createController() { const controller = new AbortController(); this.controllers.add(controller); return controller; }
  releaseController(controller) { this.controllers.delete(controller); }
  minimize() { this.minimized = !this.minimized; this.element?.classList.toggle('is-minimized', this.minimized); }
  close() { this.destroy(); }
  destroy() {
    this.listeners.forEach(({ target, type, handler, options }) => target.removeEventListener(type, handler, options));
    this.listeners = [];
    this.intervals.forEach(clearInterval);
    this.intervals.clear();
    this.controllers.forEach((controller) => controller.abort());
    this.controllers.clear();
    this.element?.remove();
    this.element = null;
  }

  /** Создаёт единый каркас карточки; содержимое задают дочерние классы. */
  createShell(contentClass = '') {
    const card = document.createElement('article');
    card.className = `widget-card ${contentClass}`;
    card.dataset.widgetId = this.id;
    card.innerHTML = `<header class="widget-header"><div class="widget-heading"><span class="widget-icon">${this.icon}</span><h3>${this.title}</h3></div><div class="widget-tools"><button class="widget-tool" data-action="minimize" aria-label="Свернуть виджет" title="Свернуть">−</button><button class="widget-tool close-tool" data-action="close" aria-label="Закрыть виджет" title="Закрыть">×</button></div></header><div class="widget-content"></div>`;
    this.element = card;
    return card;
  }
}
