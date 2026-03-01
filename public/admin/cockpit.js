const moduleGroups = [
  {
    label: 'Seiten',
    modules: [
      { key: 'builder', label: 'Page Builder' },
      { key: 'content', label: 'Pages Content' },
      { key: 'pages', label: 'Pages SEO' },
      { key: 'locations', label: 'Locations' },
      { key: 'global', label: 'Global Content' }
    ]
  },
  {
    label: 'Events',
    modules: [
      { key: 'weekly', label: 'Wochenevents' },
      { key: 'special', label: 'Sonderevents' }
    ]
  },
  {
    label: 'Marketing',
    modules: [
      { key: 'deals', label: 'Deals' },
      { key: 'campaigns', label: 'Kampagnen' }
    ]
  },
  {
    label: 'Formulare',
    modules: [
      { key: 'forms', label: 'Form Builder' },
      { key: 'leads', label: 'Leads Inbox' }
    ]
  },
  {
    label: 'Einstellungen',
    modules: [
      { key: 'platform', label: 'CMS Plattform' },
      { key: 'history', label: 'Historie / Undo' },
      { key: 'settings', label: 'Tracking & Pixel' },
      { key: 'redirects', label: 'Redirects' }
    ]
  }
];

const modules = moduleGroups.flatMap((group) => group.modules);
const ADMIN_LOGIN_ENDPOINT = '/api/admin/me';

let activeModule = 'builder';
let csrfToken = '';
let authToken = localStorage.getItem('br_admin_token') || '';
let pageKeys = [];
let currentPage = 'koblenz';
const FORCE_LOCAL_ADMIN = ['localhost', '127.0.0.1'].includes(window.location.hostname);
let outerPreviewEnabled = true;

const el = (id) => document.getElementById(id);
function showLogin() {
  const wrap = el('loginWrap');
  if (!wrap) return;
  wrap.classList.remove('hidden');
  wrap.style.display = 'flex';
}

function hideLogin() {
  const wrap = el('loginWrap');
  if (!wrap) return;
  wrap.classList.add('hidden');
  wrap.style.display = 'none';
}

function isAuthEndpoint(path) {
  return path === '/api/admin/login' || path === '/api/admin/login/' || path === '/api/admin/session' || path === '/api/admin/session/' || path === '/api/admin/me' || path === '/api/admin/me/';
}

function setStatus(msg, isError = false) {
  const s = el('status');
  s.textContent = msg || '';
  s.className = isError ? 'status err' : 'status';
}

function setLoginStatus(msg, isError = false) {
  const s = el('loginStatus');
  s.textContent = msg || '';
  s.style.color = isError ? '#fda4af' : '#94a3b8';
}

function pagePath(key) {
  return key === 'brand' ? '/' : `/locations/${key}`;
}

function refreshPreview() {
  const iframe = el('previewFrame');
  if (!iframe) return;
  iframe.src = `${pagePath(currentPage)}?cmsPreview=1&ts=${Date.now()}`;
}

function postPreviewData(payload) {
  const iframe = el('previewFrame');
  if (!iframe || !iframe.contentWindow) return;
  iframe.contentWindow.postMessage({ type: 'cms-preview-data', page: currentPage, data: payload }, '*');
}

function updatePreviewToggleLabel() {
  const btn = el('togglePreviewBtn');
  if (!btn) return;
  btn.disabled = false;
  btn.textContent = outerPreviewEnabled ? 'Live Vorschau ausblenden' : 'Live Vorschau einblenden';
}

function applyPreviewVisibility() {
  const work = document.querySelector('.work');
  if (!work) return;
  const hide = !outerPreviewEnabled;
  work.classList.toggle('preview-hidden', hide);
  updatePreviewToggleLabel();
}

async function loadCockpitPreferences() {
  try {
    const data = await api('/api/admin/settings');
    const saved = data?.settings?.['cockpit.outerPreviewEnabled'];
    if (typeof saved === 'boolean') outerPreviewEnabled = saved;
  } catch {
    // keep defaults
  }
}

async function saveOuterPreviewPreference() {
  try {
    await api('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ key: 'cockpit.outerPreviewEnabled', value: outerPreviewEnabled })
    });
  } catch (e) {
    setStatus(`Preview-Einstellung konnte nicht gespeichert werden: ${String(e.message || e)}`, true);
  }
}

async function api(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const requestOnce = async (requestPath) => {
    const headers = { ...(options.headers || {}) };
    if (authToken && !headers.Authorization && !isAuthEndpoint(requestPath)) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && requestPath.startsWith('/api/admin/') && !isAuthEndpoint(requestPath)) {
      if (!csrfToken) await refreshCsrf();
      if (!csrfToken) throw new Error('CSRF Token fehlt. Bitte neu einloggen.');
      headers['x-csrf-token'] = csrfToken;
    }

    const res = await fetch(requestPath, { ...options, headers, credentials: 'same-origin' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `API ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  };

  try {
    return await requestOnce(path);
  } catch (error) {
    const shouldRetryWithSlash =
      path.startsWith('/api/admin/') &&
      !path.endsWith('/') &&
      Number(error?.status || 0) === 404;
    if (!shouldRetryWithSlash) throw error;
    return requestOnce(`${path}/`);
  }
}

async function refreshCsrf() {
  if (authToken) {
    csrfToken = 'bearer-mode';
    return;
  }
  const r = await fetch('/api/admin/csrf', { cache: 'no-store', credentials: 'same-origin' });
  const d = await r.json().catch(() => ({}));
  csrfToken = d.csrfToken || '';
}

function renderMenu() {
  const menu = el('menu');
  menu.innerHTML = moduleGroups
    .map((group) => `
      <div class="menu-group">
        <div class="group-title">${group.label}</div>
        ${group.modules.map((m) => `<button data-mod="${m.key}" class="${m.key === activeModule ? 'active' : ''}">${m.label}</button>`).join('')}
      </div>
    `)
    .join('');
  menu.querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      activeModule = b.dataset.mod;
      renderMenu();
      renderModule();
    });
  });
}

async function loadPagesSelect() {
  const data = await api('/api/pages');
  pageKeys = data.pages || [];
  if (!pageKeys.includes(currentPage)) currentPage = pageKeys.includes('koblenz') ? 'koblenz' : (pageKeys[0] || 'brand');
  el('pageSelect').innerHTML = pageKeys.map((p) => `<option value="${p}">${p}</option>`).join('');
  el('pageSelect').value = currentPage;
  el('openPage').href = pagePath(currentPage);
  refreshPreview();
}

function sectionTitle(title, subtitle = '') {
  return `<div class="card"><div style="font-weight:800;text-transform:uppercase;letter-spacing:.08em">${title}</div><div class="hint">${subtitle}</div></div>`;
}

function splitLayout(listHtml, editorHtml) {
  return `<div class="split"><div class="card"><div class="list">${listHtml}</div></div><div class="card">${editorHtml}</div></div>`;
}

function parseIds(text) {
  return String(text || '').split(',').map((x) => x.trim()).filter(Boolean);
}

async function renderContentModule() {
  const page = await api(`/api/content/${currentPage}`);
  const root = el('content');
  root.innerHTML = `${sectionTitle('Pages Content', 'Kompletter Content-JSON pro Seite mit Live-Preview Draft Layer')}<div class="card grid"><textarea id="contentJson"></textarea><div class="row"><button id="previewContent">Live Preview aktualisieren</button><button id="saveContent" class="primary">Speichern</button></div></div>`;
  el('contentJson').value = JSON.stringify(page, null, 2);
  const syncDraftToPreview = () => {
    try {
      const payload = JSON.parse(el('contentJson').value || '{}');
      postPreviewData(payload);
      setStatus(`Draft Preview aktiv (${currentPage})`);
    } catch {
      // ignore parse errors while typing
    }
  };
  let timer = null;
  el('contentJson').addEventListener('input', () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(syncDraftToPreview, 220);
  });
  el('previewContent').onclick = syncDraftToPreview;
  el('saveContent').onclick = async () => {
    try {
      const payload = JSON.parse(el('contentJson').value || '{}');
      await api(`/api/content/${currentPage}`, { method: 'PUT', body: JSON.stringify(payload) });
      setStatus(`Content gespeichert (${currentPage})`);
      refreshPreview();
    } catch (e) {
      setStatus(String(e.message || e), true);
    }
  };
}

async function renderBuilderModule() {
  const root = el('content');
  const src = `/admin/legacy-builder.html?page=${encodeURIComponent(currentPage)}&from=cockpit&embedded=1&hidePreview=1&panel=builder&ts=${Date.now()}`;
  root.innerHTML = `
    ${sectionTitle('Page Builder', 'Seitenstruktur bearbeiten: Sections sortieren, aktivieren/deaktivieren und Inhalte pro Section bearbeiten')}
    <div class="card grid">
      <div class="row">
        <button id="openBuilderTab">Builder im Tab öffnen</button>
        <button id="reloadBuilder">Builder neu laden</button>
      </div>
      <div class="hint">Workflow: Seite wählen -> Section auswählen -> Inhalte bearbeiten -> Speichern. Live-Vorschau läuft rechts zentral im Cockpit.</div>
      <iframe id="builderFrame" src="${src}" style="width:100%;height:72vh;border:1px solid #2a3140;border-radius:10px;background:#0f141e;"></iframe>
    </div>
  `;

  el('openBuilderTab').onclick = () => {
    window.open(`/admin/legacy-builder.html?page=${encodeURIComponent(currentPage)}`, '_blank', 'noopener,noreferrer');
  };
  el('reloadBuilder').onclick = () => {
    const frame = el('builderFrame');
    if (!frame) return;
    frame.src = `/admin/legacy-builder.html?page=${encodeURIComponent(currentPage)}&from=cockpit&embedded=1&hidePreview=1&panel=builder&ts=${Date.now()}`;
  };
}

async function renderHistoryModule() {
  const root = el('content');
  const src = `/admin/legacy-builder.html?page=${encodeURIComponent(currentPage)}&from=cockpit&embedded=1&hidePreview=1&panel=history&ts=${Date.now()}`;
  root.innerHTML = `
    ${sectionTitle('Historie / Rückgängig', 'Versionen ansehen, Snapshots erstellen und Stände wiederherstellen')}
    <div class="card grid">
      <div class="row">
        <button id="openHistoryTab">Historie im Tab öffnen</button>
        <button id="reloadHistory">Historie neu laden</button>
      </div>
      <div class="hint">Dieser Bereich ist absichtlich vom Page Builder getrennt.</div>
      <iframe id="historyFrame" src="${src}" style="width:100%;height:72vh;border:1px solid #2a3140;border-radius:10px;background:#0f141e;"></iframe>
    </div>
  `;

  el('openHistoryTab').onclick = () => {
    window.open(`/admin/legacy-builder.html?page=${encodeURIComponent(currentPage)}&panel=history`, '_blank', 'noopener,noreferrer');
  };
  el('reloadHistory').onclick = () => {
    const frame = el('historyFrame');
    if (!frame) return;
    frame.src = `/admin/legacy-builder.html?page=${encodeURIComponent(currentPage)}&from=cockpit&embedded=1&hidePreview=1&panel=history&ts=${Date.now()}`;
  };
}

async function renderLeadsModule() {
  const root = el('content');
  root.innerHTML = `
    ${sectionTitle('Leads Inbox', 'Anfragen filtern, prüfen und als CSV exportieren')}
    <div class="card grid">
      <div class="grid two">
        <input id="leadsFormSlug" placeholder="Form Slug (optional)" />
        <select id="leadsStatus">
          <option value="">Alle Status</option>
          <option value="NEW">NEW</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="QUALIFIED">QUALIFIED</option>
          <option value="SPAM">SPAM</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>
      <div class="row">
        <button id="leadsReload">Leads laden</button>
        <button id="leadsExport">CSV Export</button>
      </div>
      <div id="leadsResult" class="hint">Noch nicht geladen.</div>
    </div>
  `;

  const renderRows = (rows) => {
    const wrap = el('leadsResult');
    if (!rows.length) {
      wrap.innerHTML = '<div class="hint">Keine Leads gefunden.</div>';
      return;
    }
    const tableRows = rows.map((r) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #2a3140">${r.createdAt || '-'}</td>
        <td style="padding:8px;border-bottom:1px solid #2a3140">${r.formSlug || '-'}</td>
        <td style="padding:8px;border-bottom:1px solid #2a3140">${r.status || '-'}</td>
        <td style="padding:8px;border-bottom:1px solid #2a3140;max-width:480px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.payload || '{}'}</td>
      </tr>
    `).join('');
    wrap.innerHTML = `
      <div class="hint" style="margin-bottom:8px">${rows.length} Leads geladen</div>
      <div style="overflow:auto;max-height:58vh;border:1px solid #2a3140;border-radius:8px">
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #2a3140">Zeit</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #2a3140">Form</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #2a3140">Status</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #2a3140">Payload</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    `;
  };

  const collectQuery = () => {
    const formSlug = (el('leadsFormSlug').value || '').trim();
    const status = el('leadsStatus').value || '';
    const qs = new URLSearchParams();
    if (formSlug) qs.set('formSlug', formSlug);
    if (status) qs.set('status', status);
    return qs;
  };

  const loadLeads = async () => {
    try {
      const qs = collectQuery();
      const out = await api(`/api/admin/leads${qs.toString() ? `?${qs.toString()}` : ''}`);
      renderRows(out.leads || []);
      setStatus('Leads geladen');
    } catch (e) {
      setStatus(String(e.message || e), true);
    }
  };

  el('leadsReload').onclick = loadLeads;
  el('leadsExport').onclick = async () => {
    try {
      const qs = collectQuery();
      qs.set('format', 'csv');
      const headers = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const res = await fetch(`/api/admin/leads?${qs.toString()}`, { headers, credentials: 'same-origin' });
      if (!res.ok) throw new Error(`CSV Export fehlgeschlagen (${res.status})`);
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${currentPage}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus('CSV Export erstellt');
    } catch (e) {
      setStatus(String(e.message || e), true);
    }
  };

  await loadLeads();
}

async function renderGlobalModule() {
  const root = el('content');
  const brand = await api('/api/content/brand');
  root.innerHTML = `
    ${sectionTitle('Global Content', 'Brand Header/Footer/CTA + globale Slots')}
    <div class='card grid'>
      <div class='grid two'>
        <input id='g_title' placeholder='Brand Titel' value='${brand.title || ''}' />
        <input id='g_logoText' placeholder='Logo Text' value='${brand.logoText || ''}' />
      </div>
      <textarea id='g_subtitle' placeholder='Brand Subtitel'>${brand.subtitle || ''}</textarea>
      <textarea id='g_links' placeholder='Navigation Links JSON'>${JSON.stringify(brand.links || [], null, 2)}</textarea>
      <div class='row'>
        <button id='g_preview'>Brand Preview</button>
        <button id='g_save' class='primary'>Global speichern</button>
      </div>
    </div>
  `;

  const payloadFromInputs = () => ({
    title: el('g_title').value || '',
    logoText: el('g_logoText').value || '',
    subtitle: el('g_subtitle').value || '',
    links: JSON.parse(el('g_links').value || '[]')
  });

  el('g_preview').onclick = () => {
    try {
      const payload = payloadFromInputs();
      if (currentPage === 'brand') postPreviewData(payload);
      setStatus('Global Draft Preview aktualisiert');
    } catch (e) {
      setStatus(`Global Preview Fehler: ${String(e.message || e)}`, true);
    }
  };
  el('g_save').onclick = async () => {
    try {
      const payload = payloadFromInputs();
      await api('/api/content/brand', { method: 'PUT', body: JSON.stringify(payload) });
      setStatus('Global Content gespeichert');
      if (currentPage === 'brand') refreshPreview();
    } catch (e) {
      setStatus(String(e.message || e), true);
    }
  };
}

async function renderPagesModule() {
  const data = await api('/api/admin/pages');
  const rows = data.pages || [];
  let selected = rows[0] || null;

  const root = el('content');
  function draw() {
    const listHtml = rows.map((p) => `<div class="item ${selected && p.id===selected.id?'active':''}" data-id="${p.id}"><div><b>${p.title}</b></div><div class="hint">/${p.slug}</div></div>`).join('');
    const e = selected ? `
      <div class="grid two">
        <input id="pTitle" value="${selected.title || ''}" placeholder="Titel" />
        <input id="pSlug" value="${selected.slug || ''}" placeholder="Slug" />
      </div>
      <div class="grid two">
        <input id="pSeoTitle" value="${selected.seoTitle || ''}" placeholder="SEO Title" />
        <input id="pCanonical" value="${selected.canonicalUrl || ''}" placeholder="Canonical URL" />
      </div>
      <textarea id="pMeta" placeholder="Meta Description">${selected.metaDescription || ''}</textarea>
      <div class="grid two">
        <select id="pStatus"><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select>
        <label class="hint"><input type="checkbox" id="pIndex" ${selected.indexable ? 'checked' : ''}/> indexierbar</label>
      </div>
      <textarea id="pContent">${JSON.stringify(selected.content || {}, null, 2)}</textarea>
      <div class="row"><button id="pSave" class="primary">Speichern</button><button id="pDelete">Löschen</button></div>
    ` : '<div class="hint">Keine Page vorhanden</div>';

    root.innerHTML = sectionTitle('Pages SEO', 'SEO + Publishing + JSON Content') + splitLayout(listHtml, e + '<hr style="border-color:#2a3140"/><div class="row"><button id="pNew">Neue Page</button></div>');

    root.querySelectorAll('.item').forEach((i) => i.onclick = () => { selected = rows.find((r) => r.id === i.dataset.id); draw(); });
    const statusEl = el('pStatus'); if (statusEl && selected) statusEl.value = selected.status || 'DRAFT';

    if (el('pSave')) {
      el('pSave').onclick = async () => {
        try {
          const payload = {
            title: el('pTitle').value,
            slug: el('pSlug').value,
            seoTitle: el('pSeoTitle').value || null,
            canonicalUrl: el('pCanonical').value || null,
            metaDescription: el('pMeta').value || null,
            status: el('pStatus').value,
            indexable: el('pIndex').checked,
            content: JSON.parse(el('pContent').value || '{}')
          };
          const out = await api(`/api/admin/pages/${selected.id}`, { method: 'PUT', body: JSON.stringify(payload) });
          const idx = rows.findIndex((r) => r.id === selected.id);
          rows[idx] = out.page;
          selected = out.page;
          draw();
          setStatus('Page gespeichert');
          refreshPreview();
        } catch (e) { setStatus(String(e.message || e), true); }
      };
    }

    if (el('pDelete')) {
      el('pDelete').onclick = async () => {
        if (!confirm('Page löschen?')) return;
        try {
          await api(`/api/admin/pages/${selected.id}`, { method: 'DELETE' });
          const idx = rows.findIndex((r) => r.id === selected.id);
          if (idx >= 0) rows.splice(idx, 1);
          selected = rows[0] || null;
          draw();
          setStatus('Page gelöscht');
        } catch (e) { setStatus(String(e.message || e), true); }
      };
    }

    el('pNew').onclick = async () => {
      try {
        const slug = prompt('Slug? (z.B. neue-seite)');
        if (!slug) return;
        const out = await api('/api/admin/pages', { method: 'POST', body: JSON.stringify({ title: slug, slug, status: 'DRAFT' }) });
        rows.unshift(out.page);
        selected = out.page;
        draw();
        setStatus('Neue Page erstellt');
      } catch (e) { setStatus(String(e.message || e), true); }
    };
  }
  draw();
}

async function renderSimpleCrud({ title, subtitle, listPath, createPath, updatePath, deletePath, fields, normalize }) {
  const data = await api(listPath);
  const key = Object.keys(data).find((k) => Array.isArray(data[k])) || 'items';
  const rows = data[key] || [];
  let selected = rows[0] || null;
  const root = el('content');

  function makeInputs(obj) {
    return fields.map((f) => {
      const v = obj?.[f.key];
      if (f.type === 'textarea') return `<label class='hint'>${f.label}<textarea id='f_${f.key}'>${v == null ? '' : String(v)}</textarea></label>`;
      if (f.type === 'checkbox') return `<label class='hint'><input type='checkbox' id='f_${f.key}' ${v ? 'checked' : ''}/> ${f.label}</label>`;
      if (f.type === 'select') return `<label class='hint'>${f.label}<select id='f_${f.key}'>${f.options.map((o)=>`<option ${o===v?'selected':''}>${o}</option>`).join('')}</select></label>`;
      return `<label class='hint'>${f.label}<input id='f_${f.key}' value='${v == null ? '' : String(v).replace(/'/g, '&#39;')}' /></label>`;
    }).join('');
  }

  function readInputs() {
    const out = {};
    fields.forEach((f) => {
      const node = el(`f_${f.key}`);
      if (!node) return;
      if (f.type === 'checkbox') out[f.key] = node.checked;
      else if (f.type === 'number') out[f.key] = node.value ? Number(node.value) : null;
      else out[f.key] = node.value === '' ? null : node.value;
    });
    return normalize ? normalize(out) : out;
  }

  function draw() {
    const listHtml = rows.map((r) => `<div class='item ${selected && r.id===selected.id?'active':''}' data-id='${r.id}'><b>${r.title || r.name || r.slug || r.headline || r.id}</b><div class='hint'>${r.slug || r.type || ''}</div></div>`).join('');
    const editor = selected ? `${makeInputs(selected)}<div class='row'><button id='saveBtn' class='primary'>Speichern</button><button id='delBtn'>Löschen</button></div>` : '<div class="hint">Keine Einträge</div>';
    root.innerHTML = sectionTitle(title, subtitle) + splitLayout(listHtml, editor + "<hr style='border-color:#2a3140'/><button id='newBtn'>Neu anlegen</button>");

    root.querySelectorAll('.item').forEach((it) => it.onclick = () => { selected = rows.find((r) => r.id === it.dataset.id); draw(); });

    if (el('saveBtn')) {
      el('saveBtn').onclick = async () => {
        try {
          const payload = readInputs();
          const out = await api(updatePath(selected.id), { method: 'PUT', body: JSON.stringify(payload) });
          const updated = out.weeklyEvent || out.specialEvent || out.deal || out.campaign || out.redirect || out.form || out.location || out.page || out.item || out;
          const idx = rows.findIndex((r) => r.id === selected.id);
          rows[idx] = updated;
          selected = updated;
          draw();
          setStatus('Gespeichert');
        } catch (e) { setStatus(String(e.message || e), true); }
      };
    }

    if (el('delBtn')) {
      el('delBtn').onclick = async () => {
        if (!confirm('Eintrag löschen?')) return;
        try {
          await api(deletePath(selected.id), { method: 'DELETE' });
          const idx = rows.findIndex((r) => r.id === selected.id);
          if (idx >= 0) rows.splice(idx, 1);
          selected = rows[0] || null;
          draw();
          setStatus('Gelöscht');
        } catch (e) { setStatus(String(e.message || e), true); }
      };
    }

    el('newBtn').onclick = async () => {
      try {
        const payload = readInputs();
        const out = await api(createPath, { method: 'POST', body: JSON.stringify(payload) });
        const created = out.weeklyEvent || out.specialEvent || out.deal || out.campaign || out.redirect || out.form || out.location || out.page || out.item || out;
        rows.unshift(created);
        selected = created;
        draw();
        setStatus('Neu erstellt');
      } catch (e) { setStatus(String(e.message || e), true); }
    };
  }
  draw();
}

async function renderWeeklyModule() {
  return renderSimpleCrud({
    title: 'Wochenevents', subtitle: 'Mi-So Events mit Sortierung und Location-Zuordnung',
    listPath: '/api/admin/events/weekly', createPath: '/api/admin/events/weekly',
    updatePath: (id) => `/api/admin/events/weekly/${id}`, deletePath: (id) => `/api/admin/events/weekly/${id}`,
    fields: [
      { key: 'title', label: 'Titel' }, { key: 'slug', label: 'Slug' },
      { key: 'descriptionShort', label: 'Kurzbeschreibung', type: 'textarea' },
      { key: 'descriptionLong', label: 'Langbeschreibung', type: 'textarea' },
      { key: 'weekdays', label: 'Wochentage (CSV, z.B. wed,thu,fri)' },
      { key: 'startTime', label: 'Startzeit' }, { key: 'endTime', label: 'Endzeit' },
      { key: 'image', label: 'Bild URL' }, { key: 'ctaLabel', label: 'CTA Label' }, { key: 'ctaUrl', label: 'CTA URL' },
      { key: 'status', label: 'Status', type: 'select', options: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
      { key: 'sortOrder', label: 'Sortierung', type: 'number' },
      { key: 'locationIds', label: 'Location IDs (CSV)' }
    ],
    normalize: (p) => ({ ...p, weekdays: parseIds(p.weekdays || ''), locationIds: parseIds(p.locationIds || ''), sortOrder: p.sortOrder == null ? 100 : Number(p.sortOrder) })
  });
}

async function renderLocationsModule() {
  return renderSimpleCrud({
    title: 'Locations', subtitle: 'Standorte, Kontakt, Öffnungszeiten, SEO',
    listPath: '/api/admin/locations', createPath: '/api/admin/locations',
    updatePath: (id) => `/api/admin/locations/${id}`, deletePath: (id) => `/api/admin/locations/${id}`,
    fields: [
      { key: 'slug', label: 'Slug' }, { key: 'name', label: 'Name' },
      { key: 'city', label: 'Stadt' }, { key: 'country', label: 'Land' },
      { key: 'addressLine1', label: 'Adresse 1' }, { key: 'addressLine2', label: 'Adresse 2' },
      { key: 'postalCode', label: 'PLZ' }, { key: 'phone', label: 'Telefon' }, { key: 'email', label: 'E-Mail' },
      { key: 'websiteUrl', label: 'Website URL' },
      { key: 'description', label: 'Beschreibung', type: 'textarea' },
      { key: 'openingHours', label: 'Öffnungszeiten JSON', type: 'textarea' },
      { key: 'images', label: 'Bilder JSON', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
      { key: 'seoTitle', label: 'SEO Title' }, { key: 'metaDescription', label: 'Meta Description', type: 'textarea' }
    ],
    normalize: (p) => {
      ['openingHours', 'images'].forEach((k) => { if (p[k]) p[k] = JSON.parse(p[k]); else p[k] = null; });
      return p;
    }
  });
}

async function renderSpecialModule() {
  return renderSimpleCrud({
    title: 'Sonderevents', subtitle: 'Datumsbasierte Events + Highlights',
    listPath: '/api/admin/events/special', createPath: '/api/admin/events/special',
    updatePath: (id) => `/api/admin/events/special/${id}`, deletePath: (id) => `/api/admin/events/special/${id}`,
    fields: [
      { key: 'title', label: 'Titel' }, { key: 'slug', label: 'Slug' },
      { key: 'startDateTime', label: 'Start (YYYY-MM-DDTHH:mm:ssZ)' }, { key: 'endDateTime', label: 'Ende (optional)' },
      { key: 'description', label: 'Beschreibung', type: 'textarea' }, { key: 'image', label: 'Bild URL' },
      { key: 'ctaLabel', label: 'CTA Label' }, { key: 'ctaUrl', label: 'CTA URL' },
      { key: 'status', label: 'Status', type: 'select', options: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
      { key: 'highlight', label: 'Highlight', type: 'checkbox' }, { key: 'priority', label: 'Priority', type: 'number' },
      { key: 'locationIds', label: 'Location IDs (CSV)' }
    ],
    normalize: (p) => ({ ...p, locationIds: parseIds(p.locationIds || ''), priority: p.priority == null ? 0 : Number(p.priority) })
  });
}

async function renderDealsModule() {
  return renderSimpleCrud({
    title: 'Deals', subtitle: 'Header/Burger/Section Deals mit Laufzeit',
    listPath: '/api/admin/deals', createPath: '/api/admin/deals',
    updatePath: (id) => `/api/admin/deals/${id}`, deletePath: (id) => `/api/admin/deals/${id}`,
    fields: [
      { key: 'title', label: 'Titel' }, { key: 'label', label: 'Label' }, { key: 'shortText', label: 'Kurztext', type: 'textarea' },
      { key: 'ctaLabel', label: 'CTA Label' }, { key: 'ctaUrl', label: 'CTA URL' }, { key: 'image', label: 'Bild URL' },
      { key: 'status', label: 'Status', type: 'select', options: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
      { key: 'startAt', label: 'Start (ISO)' }, { key: 'endAt', label: 'Ende (ISO)' },
      { key: 'priority', label: 'Priority', type: 'number' },
      { key: 'showOn', label: 'showOn JSON', type: 'textarea' },
      { key: 'deviceTargeting', label: 'deviceTargeting JSON', type: 'textarea' },
      { key: 'trackingEventNames', label: 'trackingEventNames JSON', type: 'textarea' },
      { key: 'locationId', label: 'Location ID' }
    ],
    normalize: (p) => {
      ['showOn', 'deviceTargeting', 'trackingEventNames'].forEach((k) => { if (p[k]) p[k] = JSON.parse(p[k]); else p[k] = null; });
      p.priority = p.priority == null ? 0 : Number(p.priority);
      return p;
    }
  });
}

async function renderCampaignsModule() {
  return renderSimpleCrud({
    title: 'Kampagnen', subtitle: 'Popup / Floating Bar inkl. Trigger & Frequency',
    listPath: '/api/admin/campaigns', createPath: '/api/admin/campaigns',
    updatePath: (id) => `/api/admin/campaigns/${id}`, deletePath: (id) => `/api/admin/campaigns/${id}`,
    fields: [
      { key: 'type', label: 'Typ', type: 'select', options: ['POPUP', 'FLOATING_BAR'] },
      { key: 'headline', label: 'Headline' }, { key: 'text', label: 'Text', type: 'textarea' }, { key: 'image', label: 'Bild URL' },
      { key: 'ctaLabel', label: 'CTA Label' }, { key: 'ctaUrl', label: 'CTA URL' },
      { key: 'status', label: 'Status', type: 'select', options: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
      { key: 'trigger', label: 'Trigger', type: 'select', options: ['DELAY', 'SCROLL', 'EXIT_INTENT'] },
      { key: 'triggerValue', label: 'Trigger Wert', type: 'number' },
      { key: 'scheduleJson', label: 'Schedule JSON', type: 'textarea' },
      { key: 'frequencyJson', label: 'Frequency JSON', type: 'textarea' },
      { key: 'pageTargeting', label: 'Page Targeting JSON', type: 'textarea' },
      { key: 'deviceTargeting', label: 'Device Targeting JSON', type: 'textarea' },
      { key: 'trackingEvents', label: 'Tracking Events JSON', type: 'textarea' },
      { key: 'locationId', label: 'Location ID' }
    ],
    normalize: (p) => {
      ['scheduleJson', 'frequencyJson', 'pageTargeting', 'deviceTargeting', 'trackingEvents'].forEach((k) => { if (p[k]) p[k] = JSON.parse(p[k]); else p[k] = null; });
      p.triggerValue = p.triggerValue == null ? null : Number(p.triggerValue);
      return p;
    }
  });
}

async function renderRedirectsModule() {
  return renderSimpleCrud({
    title: 'Redirects', subtitle: '301/302 Management',
    listPath: '/api/admin/redirects', createPath: '/api/admin/redirects',
    updatePath: (id) => `/api/admin/redirects/${id}`, deletePath: (id) => `/api/admin/redirects/${id}`,
    fields: [
      { key: 'fromPath', label: 'Von Pfad' }, { key: 'toPath', label: 'Zu Pfad' },
      { key: 'statusCode', label: 'Status Code', type: 'number' }, { key: 'isActive', label: 'Aktiv', type: 'checkbox' }
    ],
    normalize: (p) => ({ ...p, statusCode: p.statusCode == null ? 301 : Number(p.statusCode) })
  });
}

async function renderFormsModule() {
  const data = await api('/api/admin/forms');
  const forms = data.forms || [];
  let selectedForm = forms[0] || null;
  let selectedField = (selectedForm?.fields || [])[0] || null;
  const root = el('content');

  function formPayloadFromUI() {
    let targetPageSlugs = null;
    try {
      targetPageSlugs = el('fm_targets').value ? JSON.parse(el('fm_targets').value) : null;
    } catch {
      throw new Error('Zielseiten muss valides JSON sein (z.B. ["/locations/koblenz"]).');
    }
    return {
      name: el('fm_name').value,
      slug: el('fm_slug').value,
      status: el('fm_status').value,
      targetPageSlugs,
      trackingEventName: el('fm_tracking').value || null,
      redirectUrl: el('fm_redirect').value || null,
      recipientEmail: el('fm_recipient').value || null,
      webhookUrl: el('fm_webhook').value || null,
      zendeskMode: el('fm_zendesk').value || null,
      prevoEnabled: el('fm_prevo').checked,
      prevoListTag: el('fm_prevoTag').value || null,
      locationId: el('fm_location').value || null
    };
  }

  function fieldPayloadFromUI() {
    return {
      type: el('fd_type').value,
      name: el('fd_name').value,
      label: el('fd_label').value,
      placeholder: el('fd_placeholder').value || null,
      helpText: el('fd_helpText').value || null,
      required: el('fd_required').checked,
      regexPattern: el('fd_regex').value || null,
      minValue: el('fd_min').value ? Number(el('fd_min').value) : null,
      maxValue: el('fd_max').value ? Number(el('fd_max').value) : null,
      sortOrder: el('fd_sort').value ? Number(el('fd_sort').value) : 100,
      options: el('fd_options').value ? JSON.parse(el('fd_options').value) : null,
      conditionalJson: el('fd_conditional').value ? JSON.parse(el('fd_conditional').value) : null
    };
  }

  function draw() {
    const formsList = forms.map((f) => `<div class='item ${selectedForm&&f.id===selectedForm.id?'active':''}' data-form-id='${f.id}'><b>${f.name}</b><div class='hint'>${f.slug}</div></div>`).join('');
    const fields = selectedForm?.fields || [];
    if (!selectedField && fields.length > 0) selectedField = fields[0];
    if (selectedField && !fields.find((x) => x.id === selectedField.id)) selectedField = fields[0] || null;
    const fieldsList = fields.map((fd) => `<div class='item ${selectedField&&fd.id===selectedField.id?'active':''}' data-field-id='${fd.id}'><b>${fd.label}</b><div class='hint'>${fd.name} · ${fd.type}</div></div>`).join('');

    const editor = selectedForm ? `
      <div class='grid two'>
        <input id='fm_name' value='${selectedForm.name || ''}' placeholder='Name'/>
        <input id='fm_slug' value='${selectedForm.slug || ''}' placeholder='Slug'/>
      </div>
      <div class='grid two'>
        <select id='fm_status'><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select>
        <input id='fm_tracking' value='${selectedForm.trackingEventName || ''}' placeholder='Tracking Event Name'/>
      </div>
      <textarea id='fm_targets' placeholder='Zielseiten JSON (Array)'>${JSON.stringify(selectedForm.targetPageSlugs || null, null, 2)}</textarea>
      <div class='grid two'>
        <input id='fm_redirect' value='${selectedForm.redirectUrl || ''}' placeholder='Redirect URL'/>
        <input id='fm_recipient' value='${selectedForm.recipientEmail || ''}' placeholder='Empfänger E-Mail'/>
      </div>
      <div class='grid two'>
        <input id='fm_webhook' value='${selectedForm.webhookUrl || ''}' placeholder='Webhook URL'/>
        <input id='fm_prevoTag' value='${selectedForm.prevoListTag || ''}' placeholder='Prevo Tag'/>
      </div>
      <div class='grid two'>
        <input id='fm_location' value='${selectedForm.locationId || ''}' placeholder='Location ID (optional)'/>
        <input id='fm_zendesk' value='${selectedForm.zendeskMode || ''}' placeholder='Zendesk Mode (optional)'/>
      </div>
      <label class='hint'><input type='checkbox' id='fm_prevo' ${selectedForm.prevoEnabled ? 'checked' : ''}/> Prevo aktiv</label>
      <div class='row'><button id='fm_save' class='primary'>Form speichern</button><button id='fm_delete'>Form löschen</button></div>

      <hr style='border-color:#2a3140'/>
      <div style='font-weight:700'>Felder & Validierung</div>
      <div class='split'>
        <div class='list'>${fieldsList || '<div class="hint">Keine Felder</div>'}</div>
        <div class='grid'>
          <div class='grid two'>
            <input id='fd_name' value='${selectedField?.name || ''}' placeholder='Field Name' />
            <input id='fd_label' value='${selectedField?.label || ''}' placeholder='Label' />
          </div>
          <div class='grid two'>
            <select id='fd_type'>${['TEXT','TEXTAREA','EMAIL','PHONE','NUMBER','DROPDOWN','CHECKBOX','RADIO','DATE','TIME','HIDDEN','CONSENT'].map((t)=>`<option ${selectedField?.type===t?'selected':''}>${t}</option>`).join('')}</select>
            <input id='fd_sort' type='number' value='${selectedField?.sortOrder ?? 100}' placeholder='Sortierung' />
          </div>
          <div class='grid two'>
            <input id='fd_placeholder' value='${selectedField?.placeholder || ''}' placeholder='Placeholder' />
            <label class='hint'><input type='checkbox' id='fd_required' ${selectedField?.required ? 'checked' : ''}/> Pflichtfeld</label>
          </div>
          <input id='fd_helpText' value='${selectedField?.helpText || ''}' placeholder='Hilfetext' />
          <div class='grid two'>
            <input id='fd_regex' value='${selectedField?.regexPattern || ''}' placeholder='Regex (optional)' />
            <div class='grid two'><input id='fd_min' type='number' value='${selectedField?.minValue ?? ''}' placeholder='Min'/><input id='fd_max' type='number' value='${selectedField?.maxValue ?? ''}' placeholder='Max'/></div>
          </div>
          <textarea id='fd_options' placeholder='Options JSON (für Dropdown/Radio/Checkbox)'>${JSON.stringify(selectedField?.options || null, null, 2)}</textarea>
          <textarea id='fd_conditional' placeholder='Conditional Logic JSON'>${JSON.stringify(selectedField?.conditionalJson || null, null, 2)}</textarea>
          <div class='row'>
            <button id='fd_new'>Neues Feld</button>
            <button id='fd_save' class='primary' ${selectedField ? '' : 'disabled'}>Feld speichern</button>
            <button id='fd_delete' ${selectedField ? '' : 'disabled'}>Feld löschen</button>
          </div>
        </div>
      </div>
    ` : '<div class="hint">Keine Form vorhanden</div>';

    root.innerHTML = sectionTitle('Formulare', 'Form Builder + Feld-Validierung') + splitLayout(formsList, editor + "<hr style='border-color:#2a3140'/><button id='form_new'>Neue Form</button>");

    const statusSelect = el('fm_status');
    if (statusSelect && selectedForm) statusSelect.value = selectedForm.status || 'DRAFT';

    root.querySelectorAll('[data-form-id]').forEach((n) => n.onclick = () => {
      selectedForm = forms.find((f) => f.id === n.dataset.formId);
      selectedField = (selectedForm?.fields || [])[0] || null;
      draw();
    });

    root.querySelectorAll('[data-field-id]').forEach((n) => n.onclick = () => {
      selectedField = (selectedForm?.fields || []).find((f) => f.id === n.dataset.fieldId) || null;
      draw();
    });

    const formNew = el('form_new');
    if (formNew) formNew.onclick = async () => {
      const slug = prompt('Form slug?'); if (!slug) return;
      const out = await api('/api/admin/forms', { method: 'POST', body: JSON.stringify({ name: slug, slug, status: 'DRAFT' }) });
      forms.unshift({ ...out.form, fields: [] });
      selectedForm = forms[0];
      selectedField = null;
      draw();
      setStatus('Neue Form erstellt');
    };

    const formSave = el('fm_save');
    if (formSave) formSave.onclick = async () => {
      try {
        const out = await api(`/api/admin/forms/${selectedForm.id}`, { method: 'PUT', body: JSON.stringify(formPayloadFromUI()) });
        Object.assign(selectedForm, out.form);
        draw();
        setStatus('Form gespeichert');
      } catch (e) { setStatus(String(e.message || e), true); }
    };

    const formDelete = el('fm_delete');
    if (formDelete) formDelete.onclick = async () => {
      if (!confirm('Form löschen?')) return;
      await api(`/api/admin/forms/${selectedForm.id}`, { method: 'DELETE' });
      const idx = forms.findIndex((f) => f.id === selectedForm.id);
      if (idx >= 0) forms.splice(idx, 1);
      selectedForm = forms[0] || null;
      selectedField = (selectedForm?.fields || [])[0] || null;
      draw();
      setStatus('Form gelöscht');
    };

    const fieldNew = el('fd_new');
    if (fieldNew && selectedForm) fieldNew.onclick = async () => {
      try {
        const payload = fieldPayloadFromUI();
        if (!payload.name) payload.name = `field_${Date.now()}`;
        if (!payload.label) payload.label = payload.name;
        const out = await api(`/api/admin/forms/${selectedForm.id}/fields`, { method: 'POST', body: JSON.stringify(payload) });
        selectedForm.fields = [...(selectedForm.fields || []), out.field];
        selectedField = out.field;
        draw();
        setStatus('Feld erstellt');
      } catch (e) { setStatus(String(e.message || e), true); }
    };

    const fieldSave = el('fd_save');
    if (fieldSave && selectedForm && selectedField) fieldSave.onclick = async () => {
      try {
        const out = await api(`/api/admin/forms/${selectedForm.id}/fields/${selectedField.id}`, { method: 'PUT', body: JSON.stringify(fieldPayloadFromUI()) });
        const idx = selectedForm.fields.findIndex((f) => f.id === selectedField.id);
        if (idx >= 0) selectedForm.fields[idx] = out.field;
        selectedField = out.field;
        draw();
        setStatus('Feld gespeichert');
      } catch (e) { setStatus(String(e.message || e), true); }
    };

    const fieldDelete = el('fd_delete');
    if (fieldDelete && selectedForm && selectedField) fieldDelete.onclick = async () => {
      if (!confirm('Feld löschen?')) return;
      await api(`/api/admin/forms/${selectedForm.id}/fields/${selectedField.id}`, { method: 'DELETE' });
      selectedForm.fields = (selectedForm.fields || []).filter((f) => f.id !== selectedField.id);
      selectedField = (selectedForm.fields || [])[0] || null;
      draw();
      setStatus('Feld gelöscht');
    };
  }

  draw();
}

async function renderSettingsModule() {
  const data = await api('/api/admin/settings');
  const s = data.settings || {};
  const root = el('content');
  root.innerHTML = `
    ${sectionTitle('Tracking & Pixel', 'GA4 / Meta Pixel / Marketing Defaults')}
    <div class='card grid'>
      <input id='st_ga4' placeholder='GA4 Measurement ID' value='${s['tracking.ga4MeasurementId'] || ''}' />
      <input id='st_meta' placeholder='Meta Pixel ID' value='${s['tracking.metaPixelId'] || ''}' />
      <textarea id='st_marketing' placeholder='Default Floating Bar JSON'>${JSON.stringify(s['marketing.defaults'] || {}, null, 2)}</textarea>
      <div class='row'><button id='st_save' class='primary'>Speichern</button></div>
    </div>
  `;

  el('st_save').onclick = async () => {
    try {
      await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ key: 'tracking.ga4MeasurementId', value: el('st_ga4').value || '' }) });
      await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ key: 'tracking.metaPixelId', value: el('st_meta').value || '' }) });
      await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ key: 'marketing.defaults', value: JSON.parse(el('st_marketing').value || '{}') }) });
      setStatus('Settings gespeichert');
    } catch (e) { setStatus(String(e.message || e), true); }
  };
}

async function renderPlatformModule() {
  const root = el('content');
  let health = null;
  let runtime = null;
  let probe = null;
  let payload = null;
  try {
    health = await api('/api/health');
  } catch {
    health = null;
  }
  try {
    const out = await api('/api/admin/cms-platform');
    runtime = out.runtime || null;
    probe = out.payloadProbe || null;
    payload = out.payload || null;
  } catch {
    runtime = null;
    probe = null;
    payload = null;
  }

  const platform = runtime?.cmsPlatform || health?.cmsPlatform || 'custom';
  const readMode = runtime?.payloadReadMode || health?.cmsPayloadReadMode || 'preview-only';
  const configSource = runtime?.source || health?.cmsConfigSource || 'env';
  const isPayload = platform === 'payload';
  root.innerHTML = `
    ${sectionTitle('CMS Plattform', 'Hier kannst du zwischen Custom CMS und Payload Testmodus umschalten (ohne Neustart).')}
    <div class='card grid'>
      <div class='hint'>Aktive Plattform</div>
      <div style="font-size:22px;font-weight:800;letter-spacing:.04em">${platform.toUpperCase()}</div>
      <div class='grid two'>
        <label class='hint'>Plattform
          <select id='cmsPlatformSelect'>
            <option value='custom' ${platform === 'custom' ? 'selected' : ''}>Custom</option>
            <option value='payload' ${platform === 'payload' ? 'selected' : ''}>Payload</option>
          </select>
        </label>
        <label class='hint'>Payload Read Mode
          <select id='cmsReadModeSelect'>
            <option value='preview-only' ${readMode === 'preview-only' ? 'selected' : ''}>preview-only</option>
            <option value='all' ${readMode === 'all' ? 'selected' : ''}>all</option>
          </select>
        </label>
      </div>
      <div class='hint'>
        ${isPayload
          ? 'Payload Read-Mode ist aktiv. Inhalte werden aus Payload gelesen (je nach Read-Mode).'
          : 'Aktuell ist das Custom CMS live aktiv. Payload ist als nächste Plattform vorbereitet, aber noch nicht als Haupt-Backend umgeschaltet.'}
      </div>
      <div class='hint'>Konfigurationsquelle: <b>${configSource}</b></div>
      <div class='hint'>Payload URL: <code>${payload?.baseUrl || 'n/a'}</code></div>
      <div class='hint'>Payload API Status: ${payload ? (payload.apiReachable ? 'erreichbar' : 'nicht erreichbar') : 'nicht geprüft'}</div>
      <div class='hint'>Payload Probe: ${probe ? (probe.reachable ? `Importdaten gefunden (${probe.pageCount} Seiten)` : 'keine Payload-Seiten gefunden oder API nicht erreichbar') : 'nicht geprüft'}</div>
      <div class='hint'>Payload-Code liegt unter <code>apps/cms</code>. Import-Tool: <code>npm run cms:import</code>.</div>
      <div class='row'>
        <button id='platformSave' class='primary'>Plattform speichern</button>
        <button id='platformTestPage'>Aktuelle Seite testen</button>
        <button id='platformOpenPayload'>Payload Admin öffnen</button>
        <button id='platformReload'>Status neu laden</button>
      </div>
    </div>
  `;

  el('platformSave').onclick = async () => {
    try {
      const cmsPlatform = el('cmsPlatformSelect').value;
      const payloadReadMode = el('cmsReadModeSelect').value;
      await api('/api/admin/cms-platform', {
        method: 'PUT',
        body: JSON.stringify({ cmsPlatform, payloadReadMode })
      });
      await renderPlatformModule();
      refreshPreview();
      setStatus(`CMS Plattform gespeichert: ${cmsPlatform} (${payloadReadMode})`);
    } catch (e) {
      setStatus(String(e.message || e), true);
    }
  };

  el('platformTestPage').onclick = async () => {
    try {
      const res = await fetch(`/api/content/${currentPage}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Test fehlgeschlagen (${res.status})`);
      const body = await res.json().catch(() => ({}));
      const keys = body && typeof body === 'object' ? Object.keys(body).slice(0, 6).join(', ') : '';
      setStatus(`Test OK (${currentPage}) - Felder: ${keys || 'keine'}`);
      refreshPreview();
    } catch (e) {
      setStatus(`Plattform-Test fehlgeschlagen: ${String(e.message || e)}`, true);
    }
  };
  el('platformOpenPayload').onclick = () => {
    const url = payload?.adminUrl || 'http://127.0.0.1:4000/admin';
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  el('platformReload').onclick = () => renderPlatformModule();
}

async function renderModule() {
  setStatus('Lade Modul ...');
  try {
    if (activeModule === 'builder') await renderBuilderModule();
    else if (activeModule === 'content') await renderContentModule();
    else if (activeModule === 'global') await renderGlobalModule();
    else if (activeModule === 'pages') await renderPagesModule();
    else if (activeModule === 'locations') await renderLocationsModule();
    else if (activeModule === 'weekly') await renderWeeklyModule();
    else if (activeModule === 'special') await renderSpecialModule();
    else if (activeModule === 'deals') await renderDealsModule();
    else if (activeModule === 'campaigns') await renderCampaignsModule();
    else if (activeModule === 'forms') await renderFormsModule();
    else if (activeModule === 'leads') await renderLeadsModule();
    else if (activeModule === 'platform') await renderPlatformModule();
    else if (activeModule === 'history') await renderHistoryModule();
    else if (activeModule === 'settings') await renderSettingsModule();
    else if (activeModule === 'redirects') await renderRedirectsModule();
    applyPreviewVisibility();
    setStatus('Bereit');
  } catch (e) {
    setStatus(String(e.message || e), true);
  }
}

async function ensureAuth() {
  if (FORCE_LOCAL_ADMIN) {
    hideLogin();
    return true;
  }
  try {
    await api('/api/admin/me');
    hideLogin();
    return true;
  } catch {
    showLogin();
    return false;
  }
}

async function performLogin() {
  if (FORCE_LOCAL_ADMIN) {
    hideLogin();
    await refreshCsrf();
    await renderModule();
    return;
  }
  const btn = el('loginBtn');
  btn.disabled = true;
  setLoginStatus('Einloggen ...');
  try {
    const loginResult = await api(ADMIN_LOGIN_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ email: el('loginEmail').value, password: el('loginPassword').value })
    });
    if (loginResult?.token) {
      authToken = loginResult.token;
      localStorage.setItem('br_admin_token', authToken);
    }
    await refreshCsrf();
    if (!csrfToken) throw new Error('Login erfolgreich, aber CSRF-Token fehlt. Seite neu laden.');
    hideLogin();
    setLoginStatus('');
    await renderModule();
  } catch (e) {
    setLoginStatus(String(e.message || e), true);
  } finally {
    btn.disabled = false;
  }
}

async function tryLocalAutoLogin() {
  const isLocal = FORCE_LOCAL_ADMIN;
  if (!isLocal) return false;
  try {
    const loginResult = await api(ADMIN_LOGIN_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@bowlingroom.local', password: 'ChangeMe123!' })
    });
    if (loginResult?.token) {
      authToken = loginResult.token;
      localStorage.setItem('br_admin_token', authToken);
    }
    await refreshCsrf();
    return true;
  } catch {
    return false;
  }
}

async function boot() {
  if (FORCE_LOCAL_ADMIN) {
    hideLogin();
    setLoginStatus('');
  }
  renderMenu();
  await loadPagesSelect();
  await loadCockpitPreferences();
  applyPreviewVisibility();

  el('loginEmail').value = 'admin@bowlingroom.local';
  el('loginPassword').value = 'ChangeMe123!';
  el('showPasswordToggle').addEventListener('change', (e) => {
    el('loginPassword').type = e.target.checked ? 'text' : 'password';
  });

  el('pageSelect').onchange = async () => {
    currentPage = el('pageSelect').value;
    el('openPage').href = pagePath(currentPage);
    refreshPreview();
    if (activeModule === 'content') await renderContentModule();
    if (activeModule === 'builder') await renderBuilderModule();
    applyPreviewVisibility();
  };

  window.addEventListener('message', (event) => {
    const payload = event.data;
    if (!payload || typeof payload !== 'object') return;
    if (payload.type === 'legacy-builder-draft' && payload.page === currentPage && payload.data) {
      postPreviewData(payload.data);
      return;
    }
    if (payload.type === 'legacy-builder-section' && payload.section) {
      const iframe = el('previewFrame');
      if (!iframe || !iframe.contentWindow) return;
      iframe.contentWindow.postMessage({ type: 'cms-select-section', section: payload.section }, '*');
    }
  });

  el('previewReloadBtn').onclick = refreshPreview;
  el('togglePreviewBtn').onclick = async () => {
    outerPreviewEnabled = !outerPreviewEnabled;
    applyPreviewVisibility();
    await saveOuterPreviewPreference();
  };
  el('reloadBtn').onclick = () => renderModule();
  el('logoutBtn').onclick = async () => {
    try { await api('/api/admin/logout', { method: 'POST' }); } catch (_) {}
    authToken = '';
    localStorage.removeItem('br_admin_token');
    location.reload();
  };
  el('loginBtn').onclick = performLogin;
  el('loginPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performLogin();
  });

  const ok = await ensureAuth();
  if (!ok) {
    setLoginStatus('Versuche Auto-Login ...');
    const autoOk = await tryLocalAutoLogin();
    if (!autoOk) {
      setLoginStatus('Bitte mit Admin-Zugang einloggen.', true);
      el('loginEmail').focus();
      return;
    }
    hideLogin();
    setLoginStatus('');
    await renderModule();
    return;
  }
  await refreshCsrf();
  if (FORCE_LOCAL_ADMIN) hideLogin();
  await renderModule();
}

boot().catch((e) => setStatus(String(e.message || e), true));
