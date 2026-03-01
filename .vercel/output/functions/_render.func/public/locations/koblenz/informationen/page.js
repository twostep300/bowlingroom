function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || '';
}

function setHtml(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = value || '';
}

function setHref(id, value) {
  const el = document.getElementById(id);
  if (el) el.href = value || '#';
}

function setSrc(id, value) {
  const el = document.getElementById(id);
  if (el) el.src = value || '';
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

function getOpenStatus(pricing) {
  const schedule = normalizeWeekSchedule(pricing);
  if (!schedule) return { text: 'Öffnungszeiten siehe unten', open: false };

  const JS_DAY_TO_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
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

function buildGroupedPricingItems(items) {
  const groups = [];
  const groupByName = new Map();

  function ensureGroup(name) {
    if (!groupByName.has(name)) {
      const group = { name, rows: [] };
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
    group.rows.push({
      label: isFamily ? 'Familientarif' : (item.info || ''),
      price: item.price || '',
      isFamily,
      info: item.info || '',
    });
  });

  return groups;
}

function linkItem(item) {
  if (typeof item === 'string') return { label: item, href: '#' };
  return { label: item?.label || '', href: item?.href || '#' };
}

function render(data) {
  setSrc('logo-image', data.site?.logoImage);

  const navLinks = document.getElementById('nav-links');
  navLinks.innerHTML = (data.nav?.links || []).map((item) => {
    const label = typeof item === 'string' ? item : (item?.label || '');
    const href = typeof item === 'string' ? '#' : (item?.href || '#');
    const activeClass = label.toLowerCase() === 'informationen' ? 'text-[#FF3E00]' : '';
    return `<a href="${href}" class="text-sm font-bold uppercase tracking-widest hover:text-[#FF3E00] transition-colors ${activeClass}">${label}</a>`;
  }).join('');
  setText('nav-cta', data.nav?.cta?.label);
  setHref('nav-cta', data.nav?.cta?.href);
  const openStatus = getOpenStatus(data.pricing);
  const navStatus = document.getElementById('nav-open-status');
  if (navStatus) {
    navStatus.innerHTML = `<span class="w-2 h-2 rounded-full ${openStatus.open ? 'bg-green-500' : 'bg-zinc-400'}"></span><span>${openStatus.text}</span>`;
  }

  const groupedPricing = buildGroupedPricingItems(data.pricing?.items);
  document.getElementById('price-list').innerHTML = `
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
      </div>
    `).join('')}
    <p class="mt-5 text-sm text-zinc-500 italic">${data.pricing?.note || ''}</p>
  `;

  document.getElementById('opening-hours').innerHTML = buildHoursRows(data.pricing).map((row) => `
    <div class="flex justify-between border-b border-black/10 pb-2"><span class="font-bold uppercase text-xs tracking-widest">${row.day}</span><span class="font-medium">${row.time}</span></div>
  `).join('');

  setSrc('location-map-image', data.location?.mapImage);
  setHref('map-link', data.location?.mapLink);
  setHtml('location-address', data.location?.address);
  setText('location-phone', data.location?.phone);
  setText('location-info', data.location?.info);
  const siteUrl = data.location?.website || 'https://www.bowlingroom.com/koblenz/';
  setText('location-website', siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''));
  setHref('location-website', siteUrl);

  setText('footer-logo', data.footer?.logo);
  setText('footer-text', data.footer?.text);
  setText('copyright-text', data.footer?.copyright);

  document.getElementById('footer-locations').innerHTML = (data.footer?.locations || []).map((item) => {
    const link = linkItem(item);
    return `<li><a href="${link.href}" class="hover:text-[#FF3E00] transition-colors">${link.label}</a></li>`;
  }).join('');
  document.getElementById('footer-support').innerHTML = (data.footer?.support || []).map((item) => {
    const link = linkItem(item);
    return `<li><a href="${link.href}" class="hover:text-[#FF3E00] transition-colors">${link.label}</a></li>`;
  }).join('');
  setHref('footer-imprint-link', data.footer?.links?.imprint);
  setHref('footer-privacy-link', data.footer?.links?.privacy);
  setHref('footer-agb-link', data.footer?.links?.agb);
  renderMarketingBar(data.marketingBar);
}

async function init() {
  const res = await fetch('/api/content/koblenz', { cache: 'no-store' });
  if (!res.ok) throw new Error('Konnte Inhalte nicht laden.');
  const data = await res.json();
  render(data);
}

init().catch((error) => {
  console.error('Informationen-Seite konnte nicht geladen werden:', error);
});
