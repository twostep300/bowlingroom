function setHtml(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = value || '';
}

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

function isSectionVisible(value) {
  return !(value === false || value === 'false' || value === 0 || value === '0');
}

const WEEK_DAYS = [
  { key: 'mon', label: 'Montag' },
  { key: 'tue', label: 'Dienstag' },
  { key: 'wed', label: 'Mittwoch' },
  { key: 'thu', label: 'Donnerstag' },
  { key: 'fri', label: 'Freitag' },
  { key: 'sat', label: 'Samstag' },
  { key: 'sun', label: 'Sonntag' },
];
const JS_DAY_TO_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function parseTimeToMinutes(timeValue) {
  if (!timeValue || typeof timeValue !== 'string') return null;
  const [h, m] = timeValue.split(':').map((v) => Number(v));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function isOpenInWindow(openMin, closeMin, nowMin) {
  if (openMin == null || closeMin == null) return false;
  if (openMin === closeMin) return true;
  if (openMin < closeMin) return nowMin >= openMin && nowMin < closeMin;
  return nowMin >= openMin || nowMin < closeMin;
}

function normalizeWeekSchedule(pricing) {
  const schedule = pricing?.weekSchedule;
  if (!schedule || typeof schedule !== 'object') return null;
  const out = {};
  WEEK_DAYS.forEach(({ key, label }) => {
    const day = schedule[key];
    out[key] = {
      label: day?.label || label,
      closed: Boolean(day?.closed),
      open: day?.open || '11:00',
      close: day?.close || '22:00',
    };
  });
  return out;
}

function buildHoursRows(pricing) {
  const schedule = normalizeWeekSchedule(pricing);
  if (schedule) {
    return WEEK_DAYS.map(({ key }) => {
      const day = schedule[key];
      return {
        day: day.label,
        time: day.closed ? 'Geschlossen' : `${day.open} - ${day.close} Uhr`,
      };
    });
  }
  return pricing?.hours || [];
}

function getOpenStatus(pricing) {
  const schedule = normalizeWeekSchedule(pricing);
  if (!schedule) return { text: 'Öffnungszeiten siehe unten', open: false };

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayKey = JS_DAY_TO_KEY[now.getDay()];
  const today = schedule[todayKey];

  const prevDate = new Date(now);
  prevDate.setDate(now.getDate() - 1);
  const prevKey = JS_DAY_TO_KEY[prevDate.getDay()];
  const prevDay = schedule[prevKey];

  const todayOpenMin = parseTimeToMinutes(today?.open);
  const todayCloseMin = parseTimeToMinutes(today?.close);
  const prevOpenMin = parseTimeToMinutes(prevDay?.open);
  const prevCloseMin = parseTimeToMinutes(prevDay?.close);

  if (prevDay && !prevDay.closed && prevOpenMin > prevCloseMin && nowMin < prevCloseMin) {
    return { text: `Geöffnet bis ${prevDay.close} Uhr`, open: true };
  }

  if (today && !today.closed && isOpenInWindow(todayOpenMin, todayCloseMin, nowMin)) {
    return { text: `Geöffnet bis ${today.close} Uhr`, open: true };
  }

  if (today && !today.closed && todayOpenMin < todayCloseMin && nowMin < todayOpenMin) {
    return { text: `Öffnet ab ${today.open} Uhr`, open: false };
  }

  if (today && !today.closed && todayOpenMin > todayCloseMin && nowMin >= todayCloseMin && nowMin < todayOpenMin) {
    return { text: `Öffnet ab ${today.open} Uhr`, open: false };
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() + offset);
    const key = JS_DAY_TO_KEY[d.getDay()];
    const day = schedule[key];
    if (day && !day.closed) {
      const prefix = offset === 1 ? 'Morgen' : day.label;
      return { text: `Öffnet ${prefix} ab ${day.open} Uhr`, open: false };
    }
  }

  return { text: 'Aktuell geschlossen', open: false };
}

function renderMarketingBar(marketingBar) {
  const existing = document.getElementById('floating-marketing-bar');
  if (!marketingBar?.enabled) {
    if (existing) existing.remove();
    return;
  }

  const text = marketingBar.text || 'Special Deal heute sichern';
  const ctaLabel = marketingBar.ctaLabel || 'Jetzt buchen';
  const ctaHref = marketingBar.ctaHref || '#';

  let bar = existing;
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'floating-marketing-bar';
    bar.style.position = 'fixed';
    bar.style.left = '0';
    bar.style.right = '0';
    bar.style.bottom = '0';
    bar.style.zIndex = '90';
    bar.style.padding = '10px 14px';
    bar.style.background = 'rgba(10,10,10,0.95)';
    bar.style.backdropFilter = 'blur(8px)';
    bar.style.borderTop = '1px solid rgba(255,255,255,0.12)';
    document.body.appendChild(bar);
  }

  bar.innerHTML = `
    <div style="max-width:1440px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;">
      <div style="display:flex;align-items:center;gap:10px;color:#fff;">
        <span style="width:8px;height:8px;border-radius:999px;background:#FF3E00;display:inline-block;"></span>
        <span style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${text}</span>
      </div>
      <a href="${ctaHref}" style="display:inline-flex;background:#FF3E00;color:#fff;padding:8px 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;">${ctaLabel}</a>
    </div>
  `;
}

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

const EVENT_DAY_META = {
  mon: { label: 'Montag', order: 1 },
  tue: { label: 'Dienstag', order: 2 },
  wed: { label: 'Mittwoch', order: 3 },
  thu: { label: 'Donnerstag', order: 4 },
  fri: { label: 'Freitag', order: 5 },
  sat: { label: 'Samstag', order: 6 },
  sun: { label: 'Sonntag', order: 7 },
};

function formatGermanDate(yyyyMmDd) {
  if (!yyyyMmDd) return '';
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  if (!y || !m || !d) return yyyyMmDd;
  return new Date(y, m - 1, d).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
}

function normalizeEventCenter(data) {
  const ec = data?.eventCenter || {};
  const weekly = Array.isArray(ec.weeklyEvents) ? ec.weeklyEvents : [];
  const special = Array.isArray(ec.specialEvents) ? ec.specialEvents : [];
  const normalizedWeekly = weekly.map((event, i) => ({
    id: event?.id || `weekly-${i + 1}`,
    category: 'weekly',
    day: event?.day || 'fri',
    dayLabel: EVENT_DAY_META[event?.day]?.label || 'Wochenevent',
    title: event?.title || 'Wochenevent',
    subtitle: event?.subtitle || '',
    startTime: event?.startTime || '18:00',
    endTime: event?.endTime || '22:00',
    image: event?.image || '',
    ctaLabel: event?.ctaLabel || 'Jetzt reservieren',
    ctaHref: event?.ctaHref || '#',
    highlight: Boolean(event?.highlight),
  }));
  const normalizedSpecial = special.map((event, i) => ({
    id: event?.id || `special-${i + 1}`,
    category: 'special',
    date: event?.date || '',
    dateLabel: formatGermanDate(event?.date),
    title: event?.title || 'Sonderevent',
    subtitle: event?.subtitle || '',
    startTime: event?.startTime || '18:00',
    endTime: event?.endTime || '22:00',
    image: event?.image || '',
    ctaLabel: event?.ctaLabel || 'Jetzt reservieren',
    ctaHref: event?.ctaHref || '#',
    highlight: Boolean(event?.highlight),
  })).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  return {
    title: ec.title || 'Events',
    subtitle: ec.subtitle || '',
    views: {
      highlights: ec?.views?.highlights !== false,
      weeklyOverview: ec?.views?.weeklyOverview !== false,
      table: ec?.views?.table !== false,
      calendar: ec?.views?.calendar !== false,
      upcoming: ec?.views?.upcoming !== false,
    },
    headings: {
      highlights: ec?.headings?.highlights || 'Event Highlights',
      weeklyOverview: ec?.headings?.weeklyOverview || 'Wochenevents',
      table: ec?.headings?.table || 'Event Tabelle',
      calendar: ec?.headings?.calendar || 'Monatskalender',
      upcoming: ec?.headings?.upcoming || 'Kommende Sonderevents',
    },
    weeklyEvents: normalizedWeekly,
    specialEvents: normalizedSpecial,
    allEvents: [...normalizedSpecial, ...normalizedWeekly],
  };
}

function buildGroupedPricingItems(items) {
  const groups = [];
  const groupByName = new Map();

  function ensureGroup(name) {
    if (!groupByName.has(name)) {
      const group = { name, unit: '', rows: [] };
      groupByName.set(name, group);
      groups.push(group);
    }
    return groupByName.get(name);
  }

  (items || []).forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const rawName = (item.name || '').trim() || 'Tarif';
    const isFamily = rawName.toLowerCase().includes('familien');
    const targetName = isFamily && groupByName.has('Sonntag') ? 'Sonntag' : rawName;
    const group = ensureGroup(targetName);
    if (!group.unit && item.unit) group.unit = item.unit;
    group.rows.push({
      label: isFamily ? 'Familientarif' : (item.info || ''),
      price: item.price || '',
      isFamily,
      info: item.info || '',
    });
  });

  return groups;
}

function getSectionLayoutItems(data) {
  if (Array.isArray(data?.layout?.sections) && data.layout.sections.length > 0) {
    return data.layout.sections
      .filter((s) => s && typeof s === 'object')
      .map((s, i) => ({
        id: s.id || `${s.source || 'section'}-${i}`,
        source: s.source || s.id || 'about',
        visible: isSectionVisible(s.visible),
      }));
  }
  if (Array.isArray(data?.layout?.sectionOrder) && data.layout.sectionOrder.length > 0) {
    return data.layout.sectionOrder.map((key) => ({ id: key, source: key, visible: true }));
  }
  return [
    { id: 'slider', source: 'slider', visible: true },
    { id: 'about', source: 'about', visible: true },
    { id: 'pricing', source: 'pricing', visible: true },
    { id: 'groups', source: 'groups', visible: true },
    { id: 'location', source: 'location', visible: true },
    { id: 'events', source: 'events', visible: true },
    { id: 'instagram', source: 'instagram', visible: true },
  ];
}

function applySectionLayout(layoutItems) {
  if (!Array.isArray(layoutItems) || layoutItems.length === 0) return;
  const main = document.querySelector('main');
  if (!main) return;

  main.querySelectorAll('[data-home-clone="1"]').forEach((el) => el.remove());

  const sectionMap = new Map();
  main.querySelectorAll('[data-home-section]').forEach((sectionEl) => {
    sectionMap.set(sectionEl.getAttribute('data-home-section'), sectionEl);
    // Start hidden; only explicitly active sections are shown.
    sectionEl.style.display = 'none';
    sectionEl.hidden = true;
    sectionEl.setAttribute('aria-hidden', 'true');
  });

  const appendedSources = new Set();
  layoutItems.forEach((item) => {
    const source = item.source;
    const sourceEl = sectionMap.get(source);
    if (!sourceEl || item.visible === false) return;

    const canReuseSourceElement = !appendedSources.has(source) && item.id === source;
    let el = sourceEl;
    if (!canReuseSourceElement) {
      el = sourceEl.cloneNode(true);
      el.dataset.homeClone = '1';
      el.dataset.homeSection = item.id;
      el.dataset.homeSource = source;
      el.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
    } else {
      sourceEl.dataset.homeSection = item.id;
      sourceEl.dataset.homeSource = source;
    }

    el.style.display = '';
    el.hidden = false;
    el.setAttribute('aria-hidden', 'false');
    appendedSources.add(source);
    main.appendChild(el);
  });
}

function isCmsPreviewMode() {
  const params = new URLSearchParams(window.location.search);
  return params.has('cmsPreview');
}

function applyCmsSectionHighlight(sectionKey) {
  document.querySelectorAll('[data-home-section]').forEach((el) => {
    const source = el.dataset.homeSource || el.getAttribute('data-home-section');
    if (source === sectionKey) {
      el.style.outline = '2px solid #FF3E00';
      el.style.outlineOffset = '-2px';
    } else {
      el.style.outline = '';
      el.style.outlineOffset = '';
    }
  });
}

function initCmsPreviewHandles() {
  if (!isCmsPreviewMode()) return;

  document.querySelectorAll('[data-home-section]').forEach((el) => {
    if (el.dataset.cmsHandleInit === '1') return;
    el.dataset.cmsHandleInit = '1';
    if (window.getComputedStyle(el).position === 'static') {
      el.style.position = 'relative';
    }

    const label = el.dataset.homeSource || el.getAttribute('data-home-section');
    const handle = document.createElement('button');
    handle.type = 'button';
    handle.textContent = `Section: ${label}`;
    handle.style.position = 'absolute';
    handle.style.left = '8px';
    handle.style.top = '8px';
    handle.style.zIndex = '60';
    handle.style.border = '1px solid rgba(255,255,255,0.25)';
    handle.style.background = 'rgba(10,10,10,0.88)';
    handle.style.color = '#fff';
    handle.style.fontSize = '10px';
    handle.style.fontWeight = '700';
    handle.style.letterSpacing = '0.08em';
    handle.style.textTransform = 'uppercase';
    handle.style.padding = '6px 8px';
    handle.style.cursor = 'pointer';
    handle.style.backdropFilter = 'blur(2px)';

    handle.addEventListener('mouseenter', () => {
      handle.style.borderColor = '#FF3E00';
      handle.style.color = '#FF3E00';
    });
    handle.addEventListener('mouseleave', () => {
      handle.style.borderColor = 'rgba(255,255,255,0.25)';
      handle.style.color = '#fff';
    });
    handle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      window.parent.postMessage({ type: 'cms-section-selected', section: label }, '*');
      applyCmsSectionHighlight(label);
    });

    el.appendChild(handle);
  });
}

function initHeroSlider(slides) {
  const track = document.getElementById('hero-slider-track');
  const dots = document.getElementById('hero-slider-dots');
  const prev = document.getElementById('hero-slider-prev');
  const next = document.getElementById('hero-slider-next');
  if (!track || !dots || !slides || slides.length === 0) return;

  let index = 0;
  let timer = null;

  track.innerHTML = slides.map((slide) => `
    <article class="min-w-full grid grid-cols-1 lg:grid-cols-2">
      <div class="h-[260px] md:h-[360px] lg:h-[420px] overflow-hidden">
        <img src="${normalizeImageUrl(slide.image)}" alt="${slide.title}" class="w-full h-full object-cover brightness-75" onerror="this.onerror=null;this.src='${FALLBACK_EVENT_IMAGE}'">
      </div>
      <div class="p-8 md:p-12 flex flex-col justify-center">
        <span class="text-xs font-bold uppercase tracking-[0.24em] text-[#FF3E00] mb-4">${slide.date}</span>
        <h3 class="font-display text-4xl md:text-6xl font-black uppercase leading-[0.92] tracking-tighter mb-5">${slide.title}</h3>
        <p class="text-zinc-400 text-base md:text-lg leading-relaxed mb-8">${slide.text}</p>
        <div>
          <a href="${slide.href}" class="inline-flex bg-[#FF3E00] text-white px-8 py-4 font-display font-bold uppercase tracking-tighter hover:bg-white hover:text-black transition-all transform hover:-translate-y-0.5">${slide.cta}</a>
        </div>
      </div>
    </article>
  `).join('');

  dots.innerHTML = slides.map((_, i) => `
    <button class="w-2.5 h-2.5 rounded-full border ${i === 0 ? 'bg-[#FF3E00] border-[#FF3E00]' : 'bg-transparent border-white/40'}" data-hero-dot="${i}" aria-label="Slide ${i + 1}"></button>
  `).join('');

  const dotEls = Array.from(dots.querySelectorAll('[data-hero-dot]'));

  function setSlide(nextIndex) {
    index = (nextIndex + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dotEls.forEach((dot, i) => {
      dot.className = `w-2.5 h-2.5 rounded-full border ${i === index ? 'bg-[#FF3E00] border-[#FF3E00]' : 'bg-transparent border-white/40'}`;
    });
  }

  function restartAuto() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => setSlide(index + 1), 6000);
  }

  dotEls.forEach((dot) => {
    dot.addEventListener('click', () => {
      setSlide(Number(dot.dataset.heroDot));
      restartAuto();
    });
  });

  if (prev) {
    prev.addEventListener('click', () => {
      setSlide(index - 1);
      restartAuto();
    });
  }
  if (next) {
    next.addEventListener('click', () => {
      setSlide(index + 1);
      restartAuto();
    });
  }

  setSlide(0);
  restartAuto();
}

function detectPageKey() {
  const fromBody = document.body?.dataset?.page;
  if (fromBody) return fromBody;

  const parts = location.pathname.split('/').filter(Boolean);
  const locationIndex = parts.indexOf('locations');
  if (locationIndex >= 0 && parts[locationIndex + 1]) {
    return parts[locationIndex + 1];
  }

  return 'koblenz';
}

function getDeviceKind() {
  return window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop';
}

let trackingConfigCache = null;
let gaLoaded = false;
let metaLoaded = false;

async function fetchTrackingConfig() {
  if (trackingConfigCache) return trackingConfigCache;
  const res = await fetch('/api/tracking/config', { cache: 'no-store' });
  if (!res.ok) return null;
  trackingConfigCache = await res.json();
  return trackingConfigCache;
}

async function fetchConsent() {
  const res = await fetch('/api/consent', { cache: 'no-store' });
  if (!res.ok) return null;
  const payload = await res.json();
  return payload?.consent || null;
}

async function saveConsent(consent) {
  const res = await fetch('/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(consent),
  });
  if (!res.ok) throw new Error('Consent speichern fehlgeschlagen');
  return res.json();
}

function ensureConsentBanner() {
  if (document.getElementById('consent-banner')) return document.getElementById('consent-banner');
  const el = document.createElement('div');
  el.id = 'consent-banner';
  el.style.position = 'fixed';
  el.style.left = '16px';
  el.style.right = '16px';
  el.style.bottom = '16px';
  el.style.zIndex = '110';
  el.style.background = 'rgba(10,10,10,0.96)';
  el.style.border = '1px solid rgba(255,255,255,0.15)';
  el.style.padding = '14px';
  el.style.backdropFilter = 'blur(10px)';
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px;max-width:1100px;margin:0 auto;">
      <div style="color:#fff;font-size:12px;line-height:1.5;">
        Wir nutzen Cookies für Analyse und Marketing. Du kannst deine Auswahl jederzeit ändern.
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button id="consent-accept-all" style="background:#FF3E00;color:#fff;border:0;padding:8px 12px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;">Alles akzeptieren</button>
        <button id="consent-essential-only" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.3);padding:8px 12px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;">Nur notwendige</button>
      </div>
    </div>
  `;
  document.body.appendChild(el);
  return el;
}

function loadGa4(measurementId) {
  if (gaLoaded || !measurementId) return;
  gaLoaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = window.gtag || gtag;
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
}

function loadMetaPixel(pixelId) {
  if (metaLoaded || !pixelId) return;
  metaLoaded = true;
  !(function(f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function() { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = true; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

async function trackEvent(name, category, payload = {}) {
  try {
    await fetch('/api/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, payload }),
    });
  } catch (_) {
    // no-op
  }
}

function canShowByFrequency(campaign) {
  const rules = campaign?.frequencyJson || {};
  const key = `br_campaign_seen_${campaign.id}`;
  const last = Number(localStorage.getItem(key) || '0');
  const cooldownHours = Number(rules.cooldownHours || 24);
  const minDelta = cooldownHours * 60 * 60 * 1000;
  if (Date.now() - last < minDelta) return false;
  localStorage.setItem(key, String(Date.now()));
  return true;
}

function renderCampaignFloatingBar(campaign) {
  const id = 'campaign-floating-bar';
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const bar = document.createElement('div');
  bar.id = id;
  bar.style.position = 'fixed';
  bar.style.left = '0';
  bar.style.right = '0';
  bar.style.bottom = '0';
  bar.style.zIndex = '105';
  bar.style.padding = '10px 14px';
  bar.style.background = 'rgba(0,0,0,0.95)';
  bar.style.borderTop = '1px solid rgba(255,255,255,0.12)';
  bar.innerHTML = `
    <div style="max-width:1440px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;">
      <div style="display:flex;align-items:center;gap:10px;color:#fff;">
        <span style="width:8px;height:8px;border-radius:999px;background:#FF3E00;display:inline-block;"></span>
        <span style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${campaign.headline || ''}</span>
      </div>
      <a id="campaign-floating-cta" href="${campaign.ctaUrl || '#'}" style="display:inline-flex;background:#FF3E00;color:#fff;padding:8px 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;">${campaign.ctaLabel || 'Mehr'}</a>
    </div>
  `;
  document.body.appendChild(bar);
  trackEvent('campaign_impression', 'marketing', { campaignId: campaign.id, type: campaign.type });
  const cta = document.getElementById('campaign-floating-cta');
  if (cta) {
    cta.addEventListener('click', () => trackEvent('campaign_click', 'marketing', { campaignId: campaign.id, type: campaign.type }));
  }
}

function renderCampaignPopup(campaign) {
  const id = 'campaign-popup';
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.6)';
  overlay.style.zIndex = '120';
  overlay.innerHTML = `
    <div style="max-width:560px;margin:10vh auto;background:#0f0f10;border:1px solid rgba(255,255,255,0.2);padding:20px;color:#fff;position:relative;">
      <button id="campaign-popup-close" style="position:absolute;right:10px;top:10px;background:transparent;border:0;color:#fff;font-size:18px;cursor:pointer;">×</button>
      ${campaign.image ? `<img src="${campaign.image}" alt="" style="width:100%;height:180px;object-fit:cover;margin-bottom:14px;" />` : ''}
      <h3 style="font-size:26px;font-weight:800;text-transform:uppercase;margin:0 0 8px;">${campaign.headline || ''}</h3>
      <p style="font-size:14px;color:#d4d4d8;line-height:1.6;margin:0 0 14px;">${campaign.text || ''}</p>
      <a id="campaign-popup-cta" href="${campaign.ctaUrl || '#'}" style="display:inline-flex;background:#FF3E00;color:#fff;padding:10px 14px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;text-decoration:none;">${campaign.ctaLabel || 'Mehr'}</a>
    </div>
  `;
  document.body.appendChild(overlay);
  trackEvent('campaign_impression', 'marketing', { campaignId: campaign.id, type: campaign.type });
  const close = document.getElementById('campaign-popup-close');
  if (close) close.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (event) => { if (event.target === overlay) overlay.remove(); });
  const cta = document.getElementById('campaign-popup-cta');
  if (cta) {
    cta.addEventListener('click', () => trackEvent('campaign_click', 'marketing', { campaignId: campaign.id, type: campaign.type }));
  }
}

function schedulePopup(campaign) {
  const trigger = campaign.trigger || 'DELAY';
  const triggerValue = Number(campaign.triggerValue || 5);
  if (trigger === 'DELAY') {
    setTimeout(() => renderCampaignPopup(campaign), Math.max(1, triggerValue) * 1000);
    return;
  }
  if (trigger === 'SCROLL') {
    const threshold = Math.min(95, Math.max(10, triggerValue || 40));
    const onScroll = () => {
      const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrolled >= threshold) {
        window.removeEventListener('scroll', onScroll);
        renderCampaignPopup(campaign);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return;
  }
  if (trigger === 'EXIT_INTENT') {
    const onLeave = (event) => {
      if (event.clientY <= 8) {
        document.removeEventListener('mouseout', onLeave);
        renderCampaignPopup(campaign);
      }
    };
    document.addEventListener('mouseout', onLeave);
  }
}

async function loadCampaigns(pageKey, consent) {
  try {
    if (!consent?.marketing) return;
    const params = new URLSearchParams({
      location: pageKey,
      path: location.pathname,
      device: getDeviceKind(),
    });
    const res = await fetch(`/api/campaigns?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const payload = await res.json();
    const campaigns = Array.isArray(payload?.campaigns) ? payload.campaigns : [];
    const active = campaigns.filter(canShowByFrequency);
    const floating = active.find((c) => c.type === 'FLOATING_BAR');
    const popup = active.find((c) => c.type === 'POPUP');
    if (floating) renderCampaignFloatingBar(floating);
    if (popup) schedulePopup(popup);
  } catch (_) {
    // no-op
  }
}

async function initConsentAndMarketing(pageKey) {
  const consent = await fetchConsent();
  const config = await fetchTrackingConfig();

  const applyConsent = async (value) => {
    await saveConsent(value);
    const banner = document.getElementById('consent-banner');
    if (banner) banner.remove();
    if (value.analytics) loadGa4(config?.ga4MeasurementId);
    if (value.marketing) loadMetaPixel(config?.metaPixelId);
    await loadCampaigns(pageKey, value);
  };

  if (!consent) {
    const banner = ensureConsentBanner();
    const accept = banner.querySelector('#consent-accept-all');
    const essential = banner.querySelector('#consent-essential-only');
    if (accept) accept.addEventListener('click', () => applyConsent({ necessary: true, analytics: true, marketing: true }));
    if (essential) essential.addEventListener('click', () => applyConsent({ necessary: true, analytics: false, marketing: false }));
    return;
  }

  if (consent.analytics) loadGa4(config?.ga4MeasurementId);
  if (consent.marketing) loadMetaPixel(config?.metaPixelId);
  await loadCampaigns(pageKey, consent);
}

function renderPage(data) {
  document.title = data.site?.title || document.title;
  setSrc('logo-image', data.site?.logoImage);

  const navLinks = document.getElementById('nav-links');
  if (navLinks) {
    navLinks.innerHTML = (data.nav?.links || []).map((item) => {
      const label = typeof item === 'string' ? item : (item?.label || '');
      const href = typeof item === 'string' ? '#' : (item?.href || '#');
      return `<a href="${href}" class="text-sm font-bold uppercase tracking-widest hover:text-[#FF3E00] transition-colors">${label}</a>`;
    }).join('');
  }
  const openStatus = getOpenStatus(data.pricing);
  const navStatus = document.getElementById('nav-open-status');
  if (navStatus) {
    navStatus.innerHTML = `<span class="w-2 h-2 rounded-full ${openStatus.open ? 'bg-green-500' : 'bg-zinc-400'}"></span><span>${openStatus.text}</span>`;
  }

  setText('nav-cta', data.nav?.cta?.label);
  setHref('nav-cta', data.nav?.cta?.href);

  setSrc('hero-image', data.hero?.image);
  setText('hero-title', data.hero?.title);
  setText('hero-subtitle', data.hero?.subtitle);

  const breadcrumbs = document.getElementById('breadcrumbs');
  breadcrumbs.innerHTML = (data.hero?.breadcrumbs || []).map((item, idx, arr) => {
    const label = idx === arr.length - 1 ? `<span class="text-white">${item}</span>` : `<span>${item}</span>`;
    return idx === 0 ? label : `<iconify-icon icon="lucide:chevron-right" class="text-sm"></iconify-icon>${label}`;
  }).join('');

  const badges = document.getElementById('hero-badges');
  const badgeItems = (data.hero?.badges || []);
  badges.innerHTML = badgeItems.map((item, idx) => `
    <span class="flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-bold">
      ${idx === 0 ? '<span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>' : ''}
      <span>${item}</span>
    </span>`).join('');

  const defaultHeroSlides = [
    {
      date: '14. März 2026',
      title: 'Hotdog All You Can Eat',
      text: 'Unbegrenzte Hotdogs, Drinks und Bowling-Action. Perfekt für den Abend mit deiner Crew.',
      cta: 'Jetzt reservieren',
      href: '/locations/koblenz/reservieren',
      image: 'https://images.unsplash.com/photo-1619740455993-c3379db61f01?q=80&w=2070&auto=format&fit=crop',
    },
    {
      date: '21. März 2026',
      title: 'Burger All You Can Eat',
      text: 'Smashed Burger satt und beste Entertainment-Vibes in Koblenz.',
      cta: 'Platz sichern',
      href: '/locations/koblenz/reservieren',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=2070&auto=format&fit=crop',
    },
    {
      date: '28. März 2026',
      title: 'Deal Aktion 2 für 1',
      text: 'Buche eine Aktivität und erhalte die zweite gratis. Ideal für Friends und Teams.',
      cta: 'Deal nutzen',
      href: '/locations/koblenz/reservieren',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop',
    },
  ];
  const ec = normalizeEventCenter(data);
  const centralHighlightSlides = ec.specialEvents
    .filter((event) => event.highlight)
    .slice(0, 6)
    .map((event) => ({
      date: event.dateLabel || event.dayLabel || '',
      title: event.title,
      text: event.subtitle,
      cta: event.ctaLabel,
      href: event.ctaHref,
      image: event.image,
    }));
  const heroSlides = centralHighlightSlides.length > 0 ? centralHighlightSlides : (data.heroSlider?.slides || defaultHeroSlides);
  setText('hero-slider-kicker', data.heroSlider?.kicker || 'Event Highlights');
  setHtml('hero-slider-heading', data.heroSlider?.heading || 'Top Deals<br/><span class="text-[#FF3E00]">Diese Woche</span>');
  initHeroSlider(heroSlides);

  setHtml('about-title', data.about?.title);
  setText('about-text', data.about?.text);
  document.getElementById('about-cards').innerHTML = (data.about?.cards || []).map((card) => `
    <div class="group relative aspect-video overflow-hidden bg-zinc-900 skew-hover cursor-pointer">
      <img src="${card.image}" class="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt="${card.title}">
      <div class="absolute inset-0 p-8 flex flex-col justify-between">
        <iconify-icon icon="${card.icon}" class="text-4xl text-[#FF3E00]"></iconify-icon>
        <div>
          <h3 class="font-display text-3xl font-black uppercase mb-2">${card.title}</h3>
          <p class="text-xs text-zinc-300 uppercase tracking-widest font-bold">${card.subtitle}</p>
        </div>
      </div>
    </div>`).join('');

  setHtml('prices-title', data.pricing?.title);

  const groupedPricing = buildGroupedPricingItems(data.pricing?.items);
  const priceListEl = document.getElementById('price-list');
  priceListEl.className = 'bg-zinc-100 p-12';
  priceListEl.innerHTML = `
    <h3 class="font-display text-3xl font-black uppercase mb-6 flex items-center gap-4"><iconify-icon icon="lucide:map-pin" class="text-[#FF3E00]"></iconify-icon>Preise Bowling</h3>
    ${groupedPricing.map((group) => `
    <div class="py-3 border-b border-black/10">
      <div class="mb-2">
        <span class="font-display text-xl md:text-2xl font-black uppercase">${group.name}</span>
      </div>
      <div class="space-y-1.5">
        ${group.rows.map((row) => `
          <div class="flex items-start justify-between gap-3">
            <div class="flex flex-col">
              <span class="text-[11px] font-bold text-zinc-700 uppercase tracking-[0.12em]">${row.label || '&nbsp;'}</span>
              ${row.isFamily ? `<span class="text-[10px] text-zinc-500">${row.info}</span>` : ''}
            </div>
            <span class="text-lg md:text-xl font-black font-display whitespace-nowrap">${row.price}</span>
          </div>
        `).join('')}
      </div>
    </div>`).join('')}
    <p class="mt-5 text-sm text-zinc-500 italic">${data.pricing?.note || ''}</p>
  `;

  document.getElementById('opening-hours').innerHTML = buildHoursRows(data.pricing).map((row) => `
    <div class="flex justify-between border-b border-black/10 pb-2"><span class="font-bold uppercase text-xs tracking-widest">${row.day}</span><span class="font-medium">${row.time}</span></div>
  `).join('');
  setText('opening-note', '');

  setHtml('groups-title', data.groups?.title);
  setText('groups-text', data.groups?.text);
  setSrc('groups-image', data.groups?.image);
  setText('groups-cta', data.groups?.cta?.label);
  setHref('groups-cta', data.groups?.cta?.href);

  document.getElementById('group-cards').innerHTML = (data.groups?.items || []).map((item) => `
    <div class="bg-white/10 p-6 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
      <iconify-icon icon="${item.icon}" class="text-3xl mb-4"></iconify-icon>
      <h4 class="font-bold uppercase tracking-widest text-sm mb-2">${item.title}</h4>
      <p class="text-xs opacity-75">${item.text}</p>
    </div>`).join('');

  setHtml('location-title', data.location?.title);
  setSrc('location-map-image', data.location?.mapImage);
  setHref('map-link', data.location?.mapLink);
  setHtml('location-address', data.location?.address);
  setText('location-phone', data.location?.phone);
  setText('location-info', data.location?.info);

  setHtml('events-title', data.events?.title);
  
  const homeEvents = ec.specialEvents.slice(0, 3).map((event) => ({
    badge: event.dateLabel || 'Sonderevent',
    time: `${event.startTime} - ${event.endTime} Uhr`,
    title: event.title,
    text: event.subtitle,
    cta: event.ctaLabel,
    href: event.ctaHref,
    image: event.image,
  }));
  const fallbackEvents = data.events?.items || [];
  const renderEvents = homeEvents.length > 0 ? homeEvents : fallbackEvents;
  if (ec.title) setHtml('events-title', `${ec.headings.upcoming}<br/><span class='text-[#FF3E00]'>${ec.title}</span>`);
  document.getElementById('events-grid').innerHTML = renderEvents.map((event, idx) => `
    <div class="group bg-zinc-950 border border-white/5 overflow-hidden flex flex-col h-full">
      <div class="relative aspect-video overflow-hidden">
        <img src="${normalizeImageUrl(event.image)}" alt="${event.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onerror="this.onerror=null;this.src='${FALLBACK_EVENT_IMAGE}'">
        <div class="absolute top-4 left-4 ${idx === 2 ? 'bg-white text-black' : 'bg-[#FF3E00] text-white'} px-3 py-1 text-[10px] font-black uppercase tracking-widest">${event.badge}</div>
      </div>
      <div class="p-8 flex flex-col flex-grow">
        <div class="flex items-center space-x-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">
          <iconify-icon icon="lucide:clock" class="text-[#FF3E00]"></iconify-icon>
          <span>${event.time}</span>
        </div>
        <h3 class="font-display text-3xl font-black uppercase mb-4 leading-tight group-hover:text-[#FF3E00] transition-colors">${event.title}</h3>
        <p class="text-zinc-400 text-sm leading-relaxed mb-8 flex-grow">${event.text}</p>
        <a href="${event.href || '#'}" class="inline-block w-full text-center border-2 border-[#FF3E00] text-[#FF3E00] px-6 py-3 font-display font-bold uppercase tracking-tighter hover:bg-[#FF3E00] hover:text-white transition-all transform hover:-translate-y-0.5">${event.cta}</a>
      </div>
    </div>`).join('');

  setHtml('insta-title', data.instagram?.title);
  setText('insta-handle-link', data.instagram?.handle);
  setHref('insta-handle-link', data.instagram?.profile);

  document.getElementById('insta-grid').innerHTML = (data.instagram?.posts || []).map((post) => `
    <div class="relative group aspect-square overflow-hidden bg-zinc-900">
      <img src="${post.image}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" alt="Instagram Post">
      <div class="absolute inset-0 bg-[#FF3E00]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div class="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
        <iconify-icon icon="mdi:instagram" class="text-white text-5xl mb-4"></iconify-icon>
        <div class="flex items-center space-x-6 text-white font-bold">
          <span class="flex items-center gap-2"><iconify-icon icon="mdi:heart" class="text-[#FF3E00]"></iconify-icon> ${post.likes}</span>
          <span class="flex items-center gap-2"><iconify-icon icon="mdi:comment"></iconify-icon> ${post.comments}</span>
        </div>
      </div>
      <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"><p class="text-[10px] text-white font-medium italic uppercase tracking-wide">${post.text}</p></div>
    </div>`).join('');

  setText('footer-logo', data.footer?.logo);
  setText('footer-text', data.footer?.text);
  setText('copyright-text', data.footer?.copyright);

  document.getElementById('footer-locations').innerHTML = (data.footer?.locations || []).map((item) => {
    const label = typeof item === 'string' ? item : (item?.label || '');
    const href = typeof item === 'string' ? '#' : (item?.href || '#');
    return `<li><a href="${href}" class="hover:text-[#FF3E00] transition-colors cursor-pointer">${label}</a></li>`;
  }).join('');
  document.getElementById('footer-support').innerHTML = (data.footer?.support || []).map((item) => {
    const label = typeof item === 'string' ? item : (item?.label || '');
    const href = typeof item === 'string' ? '#' : (item?.href || '#');
    return `<li><a href="${href}" class="hover:text-[#FF3E00] transition-colors cursor-pointer">${label}</a></li>`;
  }).join('');

  setHref('footer-imprint-link', data.footer?.links?.imprint);
  setHref('footer-privacy-link', data.footer?.links?.privacy);
  setHref('footer-agb-link', data.footer?.links?.agb);
  renderMarketingBar(data.marketingBar);

  const layoutItems = getSectionLayoutItems(data);
  applySectionLayout(layoutItems);
  initCmsPreviewHandles();
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function deepMergeClient(target, patch) {
  Object.entries(patch || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      target[key] = value.slice();
      return;
    }
    if (isObject(value)) {
      const base = isObject(target[key]) ? target[key] : {};
      target[key] = deepMergeClient({ ...base }, value);
      return;
    }
    target[key] = value;
  });
  return target;
}

function normalizePayloadLivePreviewData(payloadDoc) {
  if (!isObject(payloadDoc)) return null;
  const legacy = isObject(payloadDoc.legacyContent) ? JSON.parse(JSON.stringify(payloadDoc.legacyContent)) : null;
  if (!legacy) return null;
  const blocks = Array.isArray(payloadDoc.layout) ? payloadDoc.layout : [];
  const legacySections = blocks.filter((block) => block && block.blockType === 'legacySection');
  if (legacySections.length > 0) {
    const sections = legacySections.map((section, index) => ({
      id: section.sectionId || section.source || `section-${index + 1}`,
      source: section.source || 'about',
      visible: isSectionVisible(section.visible),
    }));

    legacy.layout = isObject(legacy.layout) ? legacy.layout : {};
    legacy.layout.sections = sections;
    legacy.layout.sectionOrder = sections.map((s) => s.source);

    legacySections.forEach((section) => {
      const source = String(section.source || '').toLowerCase();
      if (source === 'about') {
        legacy.about = isObject(legacy.about) ? legacy.about : {};
        if (section.titleOverride) legacy.about.title = section.titleOverride;
        if (section.textOverride) legacy.about.text = section.textOverride;
      } else if (source === 'pricing') {
        legacy.pricing = isObject(legacy.pricing) ? legacy.pricing : {};
        if (section.titleOverride) legacy.pricing.title = section.titleOverride;
        if (section.textOverride) legacy.pricing.note = section.textOverride;
      } else if (source === 'groups') {
        legacy.groups = isObject(legacy.groups) ? legacy.groups : {};
        if (section.titleOverride) legacy.groups.title = section.titleOverride;
        if (section.textOverride) legacy.groups.text = section.textOverride;
        if (section.imageOverride) legacy.groups.image = section.imageOverride;
        legacy.groups.cta = isObject(legacy.groups.cta) ? legacy.groups.cta : {};
        if (section.ctaLabelOverride) legacy.groups.cta.label = section.ctaLabelOverride;
        if (section.ctaHrefOverride) legacy.groups.cta.href = section.ctaHrefOverride;
      } else if (source === 'location') {
        legacy.location = isObject(legacy.location) ? legacy.location : {};
        if (section.titleOverride) legacy.location.title = section.titleOverride;
        if (section.textOverride) legacy.location.info = section.textOverride;
        if (section.imageOverride) legacy.location.mapImage = section.imageOverride;
        if (section.ctaHrefOverride) legacy.location.mapLink = section.ctaHrefOverride;
      } else if (source === 'events') {
        legacy.events = isObject(legacy.events) ? legacy.events : {};
        if (section.titleOverride) legacy.events.title = section.titleOverride;
        if (section.textOverride) legacy.events.subtitle = section.textOverride;
      } else if (source === 'instagram') {
        legacy.instagram = isObject(legacy.instagram) ? legacy.instagram : {};
        if (section.titleOverride) legacy.instagram.title = section.titleOverride;
        if (section.textOverride) legacy.instagram.handle = section.textOverride;
        if (section.ctaHrefOverride) legacy.instagram.profile = section.ctaHrefOverride;
      } else if (source === 'slider') {
        legacy.heroSlider = isObject(legacy.heroSlider) ? legacy.heroSlider : {};
        if (section.titleOverride) legacy.heroSlider.heading = section.titleOverride;
        if (section.textOverride) legacy.heroSlider.kicker = section.textOverride;
      }

      if (isObject(section.jsonPatch)) {
        deepMergeClient(legacy, section.jsonPatch);
      }
    });
  }
  return legacy;
}

async function loadPage() {
  const pageKey = detectPageKey();
  const res = await fetch(`/api/content/${pageKey}`);
  if (!res.ok) throw new Error(`Content for page '${pageKey}' not found`);
  const data = await res.json();
  try {
    const settingsRes = await fetch('/api/settings', { cache: 'no-store' });
    if (settingsRes.ok) {
      const settingsPayload = await settingsRes.json();
      const defaults = settingsPayload?.settings?.['marketing.defaults'];
      if (defaults && (!data.marketingBar || typeof data.marketingBar !== 'object')) {
        data.marketingBar = defaults;
      }
    }
  } catch (_) {
    // optional defaults only
  }
  renderPage(data);
  initConsentAndMarketing(pageKey).catch(() => {});
}

window.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'cms-preview-data') {
    if (!event.data.data || typeof event.data.data !== 'object') return;
    renderPage(event.data.data);
    return;
  }
  if (event.data.type === 'payload-live-preview') {
    const nextData = normalizePayloadLivePreviewData(event.data.data) || event.data.data?.legacyContent;
    if (!nextData || typeof nextData !== 'object') return;
    renderPage(nextData);
    return;
  }
  if (event.data.type === 'cms-select-section' && event.data.section) {
    applyCmsSectionHighlight(event.data.section);
    const target = document.querySelector(`[data-home-section=\"${event.data.section}\"]`);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

loadPage().catch((error) => {
  console.error('Could not load content:', error);
});
