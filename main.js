import Dashboard from './js/Dashboard.js';

// Создаём независимые экземпляры пяти виджетов для стартового дашборда.
const dashboard = new Dashboard(document.querySelector('#widget-grid'));
const defaults = [
  ['weather'], ['country'], ['currency'],
  ['packing', { id: 'packing-main' }], ['countdown', { id: 'countdown-main' }],
];
defaults.forEach(([type, config]) => dashboard.addWidget(type, config));

document.querySelector('#widget-selector').addEventListener('change', (event) => {
  if (event.target.value) dashboard.addWidget(event.target.value);
  event.target.value = '';
});

document.querySelector('#today-label').textContent = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
window.addEventListener('beforeunload', () => dashboard.destroy());
