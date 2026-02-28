function esc(value) {
  return String(value || '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function isVisible(value) {
  return !(value === false || value === 'false' || value === 0 || value === '0');
}

function buildOrder(data) {
  const sections = Array.isArray(data?.sections) ? data.sections : [];
  const byId = new Map(sections.map((s) => [s.id, s]));
  const order = Array.isArray(data?.layout?.sectionOrder) ? data.layout.sectionOrder : sections.map((s) => s.id);
  const ordered = [];
  const seen = new Set();

  order.forEach((id) => {
    const sec = byId.get(id);
    if (!sec || seen.has(id)) return;
    ordered.push(sec);
    seen.add(id);
  });

  sections.forEach((sec) => {
    if (!sec?.id || seen.has(sec.id)) return;
    ordered.push(sec);
  });

  return ordered;
}

function buildFloatingBar(bar) {
  if (!bar?.enabled) return '';
  const bg = bar.background || '#111111';
  const color = bar.textColor || '#ffffff';
  const accent = bar.accent || '#ec4f04';

  return `
<div id="floating-marketing-bar" style="position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:${bg};color:${color};padding:10px 14px;border-top:1px solid rgba(255,255,255,.18);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:1440px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="width:8px;height:8px;border-radius:999px;background:${accent};display:inline-block;"></span>
      <span style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">${esc(bar.text || '14 Tage kostenlos testen')}</span>
    </div>
    <a href="${esc(bar.ctaHref || '#')}" style="display:inline-flex;text-decoration:none;background:${accent};color:#fff;padding:8px 12px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">${esc(bar.ctaLabel || 'Jetzt starten')}</a>
  </div>
</div>`;
}

function annotateSections(html, section) {
  if (/data-cms-section-id=/.test(html)) return html;
  return html.replace('<section', `<section data-cms-section-id="${esc(section.id)}" data-cms-section-name="${esc(section.name || section.id)}"`);
}

function composeHtml(data) {
  const prefixHtml = data?.template?.prefixHtml || '<!doctype html><html><head><meta charset="utf-8"></head><body>';
  const suffixHtml = data?.template?.suffixHtml || '</body></html>';

  const sectionsHtml = buildOrder(data)
    .filter((sec) => sec && sec.id && isVisible(sec.visible))
    .map((sec) => annotateSections(String(sec.html || ''), sec))
    .join('');

  return `${prefixHtml}${sectionsHtml}${buildFloatingBar(data?.floatingBar)}${suffixHtml}`;
}

function sanitizeForPreview(html) {
  let out = String(html || '');
  // Keep markup/styles, but drop runtime scripts that can hide or reflow the page in iframe preview.
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '');
  out = out.replace(/<meta[^>]+name=["']robots["'][^>]*>/i, '');

  const forceVisibleCss = '<style id=\"cms-preview-force-visible\">html,body{opacity:1 !important;visibility:visible !important;display:block !important;}body{margin:0 !important;}</style>';
  if (/<\/head>/i.test(out)) out = out.replace(/<\/head>/i, `${forceVisibleCss}</head>`);
  else out = `${forceVisibleCss}${out}`;
  return out;
}

function applyPreviewHandles() {
  if (!new URLSearchParams(window.location.search).has('cmsPreview')) return;

  const style = document.createElement('style');
  style.textContent = `
    .cms-preview-outline{outline:2px dashed #ec4f04!important;outline-offset:-2px;position:relative}
    .cms-preview-chip{position:absolute;z-index:99999;top:8px;left:8px;background:rgba(0,0,0,.85);color:#fff;border:1px solid rgba(255,255,255,.25);padding:4px 7px;font:700 10px/1 sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}
    .cms-preview-chip:hover{border-color:#ec4f04;color:#ec4f04}
  `;
  document.head.appendChild(style);

  document.querySelectorAll('section[data-cms-section-id]').forEach((el) => {
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.classList.add('cms-preview-outline');
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'cms-preview-chip';
    chip.textContent = el.getAttribute('data-cms-section-name') || el.getAttribute('data-cms-section-id');
    chip.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      window.parent.postMessage({ type: 'cms-section-selected', section: el.getAttribute('data-cms-section-id') }, '*');
    });
    el.appendChild(chip);
  });
}

function renderData(data) {
  const html = sanitizeForPreview(composeHtml(data));
  document.open();
  document.write(html);
  document.close();
  applyPreviewHandles();

  // Safety: if no sections are present after render, show a readable diagnostic instead of white screen.
  const hasSection = document.querySelector('section');
  if (!hasSection && document.body) {
    const diag = document.createElement('pre');
    diag.style.whiteSpace = 'pre-wrap';
    diag.style.padding = '16px';
    diag.style.background = '#111';
    diag.style.color = '#fff';
    diag.textContent = 'Preview konnte nicht aufgebaut werden (keine Sections gefunden).';
    document.body.innerHTML = '';
    document.body.appendChild(diag);
  }
}

window.addEventListener('message', (event) => {
  const payload = event.data;
  if (!payload || payload.type !== 'cms-preview-data' || payload.page !== 'heyreply') return;
  renderData(payload.data || {});
});

async function boot() {
  const res = await fetch('/api/content/heyreply', { cache: 'no-store' });
  if (!res.ok) throw new Error('HeyReply content not found');
  const data = await res.json();
  renderData(data);
}

boot().catch((error) => {
  document.body.innerHTML = `<pre style="white-space:pre-wrap;padding:16px;color:#fff;background:#111;">Fehler beim Laden: ${esc(error.message)}</pre>`;
  console.error(error);
});
