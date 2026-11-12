'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.08 });
  $$('.reveal').forEach(el => observer.observe(el));
}

// Menu examples are illustrative; no prices or availability claims are made.
const dishes = [
  {name:'Шашлык с огня',text:'Аромат углей, пряные травы и повод собраться за одним столом.',image:'hero.webp',position:'52% 55%',tag:'С ОГНЯ',category:'fire'},
  {name:'Хачапури по-аджарски',text:'Румяная лодочка с сыром — для тех, кто любит отламывать по кусочку.',image:'bread.webp',position:'center',tag:'ИЗ ПЕЧИ',category:'bakery'},
  {name:'Хинкали',text:'Любимая кавказская классика. Осталось выбрать хорошую компанию.',image:'khinkali.webp',position:'center',tag:'ЛЮБИМАЯ КЛАССИКА',category:'classic'}
];
function renderDishes(filter = 'all') {
  const visible = filter === 'all' ? dishes : dishes.filter(d => d.category === filter);
  $('#dish-grid').innerHTML = visible.map(d => `<article class="dish-card"><div class="dish-image"><img src="assets/${d.image}" width="720" height="720" loading="lazy" alt="Иллюстрация блюда: ${d.name}" style="object-position:${d.position}"><span class="dish-tag">${d.tag}</span></div><div class="dish-details"><div class="dish-title"><h3>${d.name}</h3><span aria-hidden="true">↗</span></div><p>${d.text}</p></div></article>`).join('');
}
renderDishes();
$$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  $$('[data-filter]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
  renderDishes(button.dataset.filter);
}));

const events = {
  'Свадьба': ['Самое тёплое «да».', 'Соберите близких за одним столом. Обсудим меню, сервировку и детали вечера, который будет только вашим.'],
  'День рождения': ['Ещё один повод обнять.', 'Пусть рядом будут любимые люди, а на столе — любимые блюда. Расскажите, каким вы представляете свой праздник.'],
  'Корпоратив': ['Встретимся без рабочих вопросов.', 'Вечер для команды, разговоров и общих воспоминаний. Начнём с количества гостей и пожеланий к меню.']
};
function chooseEvent(name) {
  $$('[data-event]').forEach(b => { const active = b.dataset.event === name; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
  if (events[name]) { $('#event-title').textContent = events[name][0]; $('#event-copy').textContent = events[name][1]; }
}
$$('[data-event]').forEach(button => button.addEventListener('click', () => { chooseEvent(button.dataset.event); $('#occasion').value = button.dataset.event; }));
$('#occasion').addEventListener('change', event => { if(events[event.target.value]) chooseEvent(event.target.value); });

const menuToggle = $('.menu-toggle');
function closeMenu() { $('#mobile-nav').hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Открыть меню'); }
menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(expanded));
  menuToggle.setAttribute('aria-label', expanded ? 'Закрыть меню' : 'Открыть меню');
  $('#mobile-nav').hidden = !expanded;
});
$$('#mobile-nav a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('#mobile-nav').hidden) { closeMenu(); menuToggle.focus(); } });
document.addEventListener('click', event => { if (!$('#mobile-nav').hidden && !event.target.closest('.header,.mobile-nav')) closeMenu(); });

let previousFocus;
function openDialog(dialog) { closeMenu(); previousFocus = document.activeElement; dialog.showModal(); document.body.classList.add('scroll-locked'); }
$$('[data-open]').forEach(button => button.addEventListener('click', () => openDialog(document.getElementById(button.dataset.open))));
$$('dialog').forEach(dialog => {
  $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => { document.body.classList.remove('scroll-locked'); previousFocus?.focus(); });
});

const today = new Date();
const localISO = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
$('#event-date').min = localISO;
$$('[data-step]').forEach(button => button.addEventListener('click', () => {
  const field = $('#guests');
  field.value = Math.max(Number(field.min), Math.min(Number(field.max), (Number(field.value) || 2) + Number(button.dataset.step)));
}));
$('#event-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const dateValue = $('#event-date').value;
  const formatted = dateValue ? new Date(`${dateValue}T12:00:00`).toLocaleDateString('ru-RU', {day:'numeric',month:'long',year:'numeric'}).replace(/\.$/, '') : 'дату пока выбираем';
  $('#inquiry-text').value = `Здравствуйте! Хотим обсудить встречу в «Сис-Акан».\n\nПовод: ${$('#occasion').value}.\nДата: ${formatted}.\nКоличество гостей: ${$('#guests').value}.\n\nПодскажите, пожалуйста, возможно ли размещение, какие есть варианты меню и условия?`;
  $('#copy-status').textContent = '';
  $('#copy-inquiry').innerHTML = 'Скопировать текст <span aria-hidden="true">↗</span>';
  openDialog($('#inquiry-dialog'));
});
$('#copy-inquiry').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('#inquiry-text').value);
    $('#copy-status').textContent = 'Текст скопирован. Теперь его можно отправить в кафе.';
    $('#copy-inquiry').innerHTML = 'Текст скопирован <span aria-hidden="true">✓</span>';
  } catch {
    $('#inquiry-text').focus(); $('#inquiry-text').select();
    $('#copy-status').textContent = 'Выделили текст. Скопируйте его через меню устройства.';
  }
});
