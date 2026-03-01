function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || '';
}

function setHref(id, value) {
  const el = document.getElementById(id);
  if (el) el.href = value || '#';
}

function setSrc(id, value) {
  const el = document.getElementById(id);
  if (el) el.src = value || '';
}

function fmtDate(value) {
  if (!value) return '';
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
}

const DAY_MAP = {
  mon: 'Montag',
  tue: 'Dienstag',
  wed: 'Mittwoch',
  thu: 'Donnerstag',
  fri: 'Freitag',
  sat: 'Samstag',
  sun: 'Sonntag',
};
const WEEKLY_STRIP_DAYS = ['wed', 'thu', 'fri', 'sat', 'sun'];
const FALLBACK_EVENT_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop stop-color='%23111111' offset='0'/><stop stop-color='%23FF3E00' offset='1'/></linearGradient></defs><rect width='1200' height='800' fill='url(%23g)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='54' font-family='Arial'>Event Bild</text></svg>";

function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return FALLBACK_EVENT_IMAGE;
  const trimmed = url.trim();
  if (!trimmed) return FALLBACK_EVENT_IMAGE;
  if (trimmed.includes('images.unsplash.com') && !trimmed.includes('auto=format')) {
    return `${trimmed}${trimmed.includes('?') ? '&' : '?'}auto=format&fit=crop`;
  }
  return trimmed;
}

function imgTag(url, alt, classes) {
  const src = normalizeImageUrl(url);
  const safeAlt = String(alt || '').replace(/"/g, '&quot;');
  return `<img src="${src}" class="${classes}" alt="${safeAlt}" onerror="this.onerror=null;this.src='${FALLBACK_EVENT_IMAGE}'">`;
}

function normalizeEventCenter(data) {
  const ec = data.eventCenter || {};
  const weekly = Array.isArray(ec.weeklyEvents) ? ec.weeklyEvents : [];
  const special = Array.isArray(ec.specialEvents) ? ec.specialEvents : [];
  const normalizedWeekly = weekly.map((e, i) => ({
    id: e?.id || `w-${i + 1}`,
    type: 'Woche',
    day: e?.day || 'fri',
    dayLabel: DAY_MAP[e?.day] || 'Wochenevent',
    date: '',
    dateLabel: DAY_MAP[e?.day] || 'Wochenevent',
    title: e?.title || 'Wochenevent',
    subtitle: e?.subtitle || '',
    startTime: e?.startTime || '18:00',
    endTime: e?.endTime || '22:00',
    image: e?.image || '',
    ctaLabel: e?.ctaLabel || 'Jetzt reservieren',
    ctaHref: e?.ctaHref || '#',
    highlight: Boolean(e?.highlight),
  }));
  const normalizedSpecial = special.map((e, i) => ({
    id: e?.id || `s-${i + 1}`,
    type: 'Special',
    day: '',
    dayLabel: '',
    date: e?.date || '',
    dateLabel: fmtDate(e?.date),
    title: e?.title || 'Sonderevent',
    subtitle: e?.subtitle || '',
    startTime: e?.startTime || '18:00',
    endTime: e?.endTime || '22:00',
    image: e?.image || '',
    ctaLabel: e?.ctaLabel || 'Jetzt reservieren',
    ctaHref: e?.ctaHref || '#',
    highlight: Boolean(e?.highlight),
  })).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  return {
    title: ec.title || 'Events',
    subtitle: ec.subtitle || '',
    views: {
      highlights: ec?.views?.highlights !== false,
      weeklyOverview: ec?.views?.weeklyOverview !== false,
      upcoming: ec?.views?.upcoming !== false,
    },
    headings: {
      highlights: ec?.headings?.highlights || 'Event Highlights',
      weeklyOverview: ec?.headings?.weeklyOverview || 'Wochenevents',
      upcoming: ec?.headings?.upcoming || 'Kommende Sonderevents',
    },
    weekly: normalizedWeekly,
    special: normalizedSpecial,
    all: [...normalizedSpecial, ...normalizedWeekly],
  };
}

function renderOpenStatus(pricing) {
  const badge = document.getElementById('nav-open-status');
  if (!badge) return;
  const now = new Date();
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const key = dayKeys[now.getDay()];
  const day = pricing?.weekSchedule?.[key];
  if (!day || day.closed) {
    badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-zinc-400"></span><span>Aktuell geschlossen</span>`;
    return;
  }
  const [h, m] = (day.close || '22:00').split(':').map(Number);
  const closeMin = (h * 60) + m;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (nowMin < closeMin) badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-green-500"></span><span>Geöffnet bis ${day.close} Uhr</span>`;
  else badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-zinc-400"></span><span>Öffnet ab ${day.open} Uhr</span>`;
}

function mountViewVisibility(ec) {
  const map = [
    ['events-highlights-section', ec.views.highlights],
    ['events-weekly-section', ec.views.weeklyOverview],
    ['events-upcoming-section', ec.views.upcoming],
  ];
  map.forEach(([id, visible]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? '' : 'none';
  });
}

function initHighlightsSlider(events) {
  const track = document.getElementById('events-highlight-track');
  const dotsWrap = document.getElementById('events-highlight-dots');
  const prev = document.getElementById('events-highlight-prev');
  const next = document.getElementById('events-highlight-next');
  if (!track || !dotsWrap) return;

  if (!events.length) {
    track.innerHTML = '<div class="p-8 text-zinc-400">Keine Highlights vorhanden.</div>';
    return;
  }

  track.innerHTML = events.map((e) => `
    <article class="min-w-full grid grid-cols-1 lg:grid-cols-2">
      <div class="h-[260px] md:h-[360px] overflow-hidden">${imgTag(e.image, e.title, 'w-full h-full object-cover brightness-75')}</div>
      <div class="p-8 md:p-10 flex flex-col justify-center">
        <span class="text-xs font-bold uppercase tracking-[0.2em] text-[#FF3E00] mb-4">${e.dateLabel || e.dayLabel}</span>
        <h3 class="font-display text-4xl md:text-6xl font-black uppercase leading-[0.92] mb-4">${e.title}</h3>
        <p class="text-zinc-400 mb-7">${e.subtitle}</p>
        <a href="${e.ctaHref}" class="inline-flex bg-[#FF3E00] text-white px-7 py-3 font-display font-bold uppercase tracking-tighter hover:bg-white hover:text-black transition-all">${e.ctaLabel}</a>
      </div>
    </article>
  `).join('');

  dotsWrap.innerHTML = events.map((_, i) => `<button class="w-2.5 h-2.5 rounded-full border ${i === 0 ? 'bg-[#FF3E00] border-[#FF3E00]' : 'border-white/40'}" data-dot="${i}"></button>`).join('');
  const dots = Array.from(dotsWrap.querySelectorAll('[data-dot]'));
  let index = 0;
  function setSlide(i) {
    index = (i + events.length) % events.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, j) => d.className = `w-2.5 h-2.5 rounded-full border ${j === index ? 'bg-[#FF3E00] border-[#FF3E00]' : 'border-white/40'}`);
  }
  dots.forEach((d) => d.addEventListener('click', () => setSlide(Number(d.dataset.dot))));
  if (prev) prev.addEventListener('click', () => setSlide(index - 1));
  if (next) next.addEventListener('click', () => setSlide(index + 1));
  setSlide(0);
}

function render(data) {
  setSrc('logo-image', data.site?.logoImage);
  const navLinks = document.getElementById('nav-links');
  navLinks.innerHTML = (data.nav?.links || []).map((item) => {
    const label = typeof item === 'string' ? item : (item?.label || '');
    const href = typeof item === 'string' ? '#' : (item?.href || '#');
    const active = label.toLowerCase() === 'events' ? 'text-[#FF3E00]' : '';
    return `<a href="${href}" class="text-sm font-bold uppercase tracking-widest hover:text-[#FF3E00] transition-colors ${active}">${label}</a>`;
  }).join('');
  setText('nav-cta', data.nav?.cta?.label);
  setHref('nav-cta', data.nav?.cta?.href);

  renderOpenStatus(data.pricing);
  const ec = normalizeEventCenter(data);
  setText('events-main-title', ec.title);
  setText('events-main-subtitle', ec.subtitle);
  setText('events-highlights-heading', ec.headings.highlights);
  setText('events-weekly-heading', ec.headings.weeklyOverview);
  setText('events-upcoming-heading', ec.headings.upcoming);
  mountViewVisibility(ec);

  const highlights = ec.special.filter((e) => e.highlight).slice(0, 6);
  initHighlightsSlider(highlights);

  const weeklyByDay = new Map();
  ec.weekly.forEach((event) => {
    if (!weeklyByDay.has(event.day)) weeklyByDay.set(event.day, []);
    weeklyByDay.get(event.day).push(event);
  });
  const todayJsDay = new Date().getDay();
  const jsToKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = jsToKey[todayJsDay];

  document.getElementById('events-weekly-grid').innerHTML = WEEKLY_STRIP_DAYS.map((dayKey) => {
    const dayLabel = DAY_MAP[dayKey];
    const dayEvents = weeklyByDay.get(dayKey) || [];
    const primary = dayEvents[0];
    const isToday = todayKey === dayKey;

    if (!primary) {
      return `
      <article class="border ${isToday ? 'border-[#FF3E00]' : 'border-white/10'} bg-zinc-950 overflow-hidden">
        <div class="p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="text-[11px] uppercase tracking-[0.14em] ${isToday ? 'text-[#FF3E00]' : 'text-zinc-400'}">${dayLabel}</div>
            ${isToday ? '<span class="text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-1 bg-[#FF3E00] text-white">Heute</span>' : ''}
          </div>
          ${imgTag('', 'Kein Event', 'h-32 w-full object-cover brightness-75 mb-3')}
          <div class="text-[11px] uppercase tracking-[0.12em] text-zinc-500 mb-2">-</div>
          <h3 class="font-display text-2xl font-black uppercase mb-2 text-zinc-300">Kein Event</h3>
          <p class="text-zinc-500 text-sm">Für diesen Tag ist aktuell kein Wochenevent hinterlegt.</p>
        </div>
      </article>
      `;
    }

    return `
    <article class="border ${isToday ? 'border-[#FF3E00]' : 'border-white/10'} bg-zinc-950 overflow-hidden">
      <div class="p-5">
        <div class="flex items-center justify-between mb-2">
          <div class="text-[11px] uppercase tracking-[0.14em] ${isToday ? 'text-[#FF3E00]' : 'text-zinc-400'}">${dayLabel}</div>
          ${isToday ? '<span class="text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-1 bg-[#FF3E00] text-white">Heute</span>' : ''}
        </div>
        ${imgTag(primary.image, primary.title, 'h-32 w-full object-cover brightness-75 mb-3')}
        <div class="text-[11px] uppercase tracking-[0.12em] text-zinc-400 mb-2">${primary.startTime} - ${primary.endTime} Uhr</div>
        <h3 class="font-display text-2xl font-black uppercase mb-2">${primary.title}</h3>
        <p class="text-zinc-400 text-sm mb-4">${primary.subtitle}</p>
        ${dayEvents.length > 1 ? `<div class="text-[10px] uppercase tracking-[0.1em] text-zinc-500 mb-3">+${dayEvents.length - 1} weiteres Event</div>` : ''}
        <a href="${primary.ctaHref}" class="text-sm font-bold uppercase tracking-[0.1em] hover:text-[#FF3E00]">${primary.ctaLabel}</a>
      </div>
    </article>
  `;
  }).join('');

  const upcomingGrid = document.getElementById('events-upcoming-grid');
  const moreBtn = document.getElementById('events-upcoming-more');
  let visibleCount = 6;
  function renderUpcoming() {
    upcomingGrid.innerHTML = ec.special.slice(0, visibleCount).map((e) => `
    <article class="border border-white/10 bg-zinc-950 overflow-hidden">
      ${imgTag(e.image, e.title, 'h-44 w-full object-cover')}
      <div class="p-6">
        <div class="text-xs uppercase tracking-[0.12em] text-[#FF3E00] mb-2">${e.dateLabel} · ${e.startTime} - ${e.endTime}</div>
        <h3 class="font-display text-3xl font-black uppercase mb-3">${e.title}</h3>
        <p class="text-zinc-400 text-sm mb-5">${e.subtitle}</p>
        <a href="${e.ctaHref}" class="inline-block border border-[#FF3E00] text-[#FF3E00] px-5 py-2 font-bold uppercase text-xs tracking-[0.1em] hover:bg-[#FF3E00] hover:text-white transition-all">${e.ctaLabel}</a>
      </div>
    </article>
  `).join('');
    if (!moreBtn) return;
    moreBtn.style.display = visibleCount >= ec.special.length ? 'none' : '';
  }
  renderUpcoming();
  if (moreBtn) {
    moreBtn.onclick = () => {
      visibleCount += 6;
      renderUpcoming();
    };
  }

  setText('footer-logo', data.footer?.logo);
  setText('footer-text', data.footer?.text);
  setText('copyright-text', data.footer?.copyright);
  const linkItem = (item) => typeof item === 'string' ? { label: item, href: '#' } : { label: item?.label || '', href: item?.href || '#' };
  document.getElementById('footer-locations').innerHTML = (data.footer?.locations || []).map((item) => {
    const l = linkItem(item); return `<li><a href="${l.href}" class="hover:text-[#FF3E00] transition-colors">${l.label}</a></li>`;
  }).join('');
  document.getElementById('footer-support').innerHTML = (data.footer?.support || []).map((item) => {
    const l = linkItem(item); return `<li><a href="${l.href}" class="hover:text-[#FF3E00] transition-colors">${l.label}</a></li>`;
  }).join('');
  setHref('footer-imprint-link', data.footer?.links?.imprint);
  setHref('footer-privacy-link', data.footer?.links?.privacy);
  setHref('footer-agb-link', data.footer?.links?.agb);
}

async function init() {
  const res = await fetch('/api/content/koblenz', { cache: 'no-store' });
  if (!res.ok) throw new Error('Konnte Inhalte nicht laden.');
  const data = await res.json();
  render(data);
}

window.addEventListener('message', (event) => {
  const payload = event.data;
  if (!payload) return;
  if (payload.type === 'cms-preview-data' && payload.data && typeof payload.data === 'object') {
    render(payload.data);
  }
});

init().catch((error) => {
  console.error('Events-Seite konnte nicht geladen werden:', error);
});
