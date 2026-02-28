const pageSelect = document.getElementById('pageSelect');
const openPageLink = document.getElementById('openPage');
const previewFrame = document.getElementById('previewFrame');
const statusEl = document.getElementById('status');
const structuredRoot = document.getElementById('structuredRoot');
const jsonRoot = document.getElementById('jsonRoot');
const jsonEditor = document.getElementById('jsonEditor');
const tabStructured = document.getElementById('tabStructured');
const tabJson = document.getElementById('tabJson');
const saveBtn = document.getElementById('save');
const reloadBtn = document.getElementById('reload');

let currentPage = 'heyreply';
let currentData = {};
let mode = 'structured';
let historyVersions = [];

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#fda4af' : '#9ca3af';
}

function pagePath() {
  return '/heyreply';
}

function ensureShape() {
  if (!currentData || typeof currentData !== 'object' || Array.isArray(currentData)) currentData = {};
  if (!currentData.site || typeof currentData.site !== 'object') currentData.site = {};
  if (!currentData.template || typeof currentData.template !== 'object') currentData.template = {};
  if (!currentData.layout || typeof currentData.layout !== 'object') currentData.layout = {};
  if (!Array.isArray(currentData.sections)) currentData.sections = [];
  if (!Array.isArray(currentData.layout.sectionOrder)) currentData.layout.sectionOrder = [];

  currentData.sections = currentData.sections
    .filter((s) => s && typeof s === 'object')
    .map((s, i) => ({
      id: (s.id || `section-${i + 1}`).toString(),
      name: (s.name || `Section ${i + 1}`).toString(),
      visible: !(s.visible === false || s.visible === 'false' || s.visible === 0 || s.visible === '0'),
      classes: (s.classes || '').toString(),
      html: (s.html || '').toString(),
    }));

  const known = new Set(currentData.sections.map((s) => s.id));
  const ordered = [];
  currentData.layout.sectionOrder.forEach((id) => {
    if (known.has(id) && !ordered.includes(id)) ordered.push(id);
  });
  currentData.sections.forEach((s) => {
    if (!ordered.includes(s.id)) ordered.push(s.id);
  });
  currentData.layout.sectionOrder = ordered;

  if (!currentData.floatingBar || typeof currentData.floatingBar !== 'object') currentData.floatingBar = {};
  currentData.floatingBar.enabled = Boolean(currentData.floatingBar.enabled);
  currentData.floatingBar.text = currentData.floatingBar.text || '14 Tage kostenlos testen';
  currentData.floatingBar.ctaLabel = currentData.floatingBar.ctaLabel || 'Jetzt starten';
  currentData.floatingBar.ctaHref = currentData.floatingBar.ctaHref || 'https://www.heyreply.de';
  currentData.floatingBar.background = currentData.floatingBar.background || '#111111';
  currentData.floatingBar.textColor = currentData.floatingBar.textColor || '#ffffff';
  currentData.floatingBar.accent = currentData.floatingBar.accent || '#ec4f04';
}

function syncOrder() {
  currentData.layout.sectionOrder = currentData.sections.map((s) => s.id);
}

function sendPreviewData() {
  syncOrder();
  if (!previewFrame.contentWindow) return;
  previewFrame.contentWindow.postMessage({ type: 'cms-preview-data', page: currentPage, data: currentData }, '*');
}

function updateJsonEditor() {
  syncOrder();
  jsonEditor.value = JSON.stringify(currentData, null, 2);
}

function makeInput(label, value, onInput, multiline = false) {
  const wrap = document.createElement('label');
  wrap.style.display = 'grid';
  wrap.style.gap = '6px';

  const title = document.createElement('div');
  title.className = 'field-title';
  title.textContent = label;
  wrap.appendChild(title);

  const input = multiline ? document.createElement('textarea') : document.createElement('input');
  if (!multiline) input.type = 'text';
  input.value = value || '';
  input.addEventListener('input', () => onInput(input.value));
  wrap.appendChild(input);
  return wrap;
}

function makeCheckbox(label, checked, onChange) {
  const wrap = document.createElement('label');
  wrap.className = 'row';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = Boolean(checked);
  input.style.width = '16px';
  input.addEventListener('change', () => onChange(input.checked));
  const text = document.createElement('span');
  text.textContent = label;
  text.className = 'hint';
  wrap.appendChild(input);
  wrap.appendChild(text);
  return wrap;
}

function renderHistoryBox() {
  const box = document.createElement('div');
  box.className = 'panel';
  const title = document.createElement('div');
  title.className = 'field-title';
  title.textContent = 'Historie';
  box.appendChild(title);

  if (!historyVersions.length) {
    const empty = document.createElement('div');
    empty.className = 'hint';
    empty.textContent = 'Noch keine gespeicherten Stände vorhanden.';
    box.appendChild(empty);
    return box;
  }

  historyVersions.slice(0, 20).forEach((v) => {
    const row = document.createElement('div');
    row.className = 'row';
    const meta = document.createElement('div');
    meta.className = 'hint grow';
    meta.textContent = `${new Date(v.createdAt).toLocaleString('de-DE')} • ${v.reason || 'snapshot'}`;
    row.appendChild(meta);
    const btn = document.createElement('button');
    btn.textContent = 'Restore';
    btn.addEventListener('click', async () => {
      try {
        const res = await fetch(`/api/history/${currentPage}/restore`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: v.id }),
        });
        if (!res.ok) throw new Error('Restore fehlgeschlagen');
        const payload = await res.json();
        currentData = payload.data || {};
        ensureShape();
        renderStructured();
        updateJsonEditor();
        sendPreviewData();
        await loadHistory();
        renderStructured();
        setStatus('Version wiederhergestellt.');
      } catch (error) {
        setStatus(`Fehler: ${error.message}`, true);
      }
    });
    row.appendChild(btn);
    box.appendChild(row);
  });

  return box;
}

function renderStructured() {
  structuredRoot.innerHTML = '';

  const intro = document.createElement('div');
  intro.className = 'hint';
  intro.textContent = 'Eigenständiges HeyReply-CMS (komplett getrennt von Bowling).';
  structuredRoot.appendChild(intro);
  structuredRoot.appendChild(renderHistoryBox());

  const sectionsPanel = document.createElement('div');
  sectionsPanel.className = 'panel';
  const sectionsTitle = document.createElement('div');
  sectionsTitle.className = 'field-title';
  sectionsTitle.textContent = 'Sections';
  sectionsPanel.appendChild(sectionsTitle);

  currentData.sections.forEach((section, index) => {
    const card = document.createElement('div');
    card.className = 'section-card';

    const actions = document.createElement('div');
    actions.className = 'row';
    const label = document.createElement('strong');
    label.className = 'grow';
    label.textContent = section.name || section.id;
    actions.appendChild(label);

    const up = document.createElement('button');
    up.textContent = '↑';
    up.addEventListener('click', () => {
      if (index === 0) return;
      const tmp = currentData.sections[index - 1];
      currentData.sections[index - 1] = currentData.sections[index];
      currentData.sections[index] = tmp;
      syncOrder();
      renderStructured();
      updateJsonEditor();
      sendPreviewData();
    });
    actions.appendChild(up);

    const down = document.createElement('button');
    down.textContent = '↓';
    down.addEventListener('click', () => {
      if (index >= currentData.sections.length - 1) return;
      const tmp = currentData.sections[index + 1];
      currentData.sections[index + 1] = currentData.sections[index];
      currentData.sections[index] = tmp;
      syncOrder();
      renderStructured();
      updateJsonEditor();
      sendPreviewData();
    });
    actions.appendChild(down);

    const dup = document.createElement('button');
    dup.textContent = 'Dupl.';
    dup.addEventListener('click', () => {
      const copy = JSON.parse(JSON.stringify(section));
      copy.id = `${copy.id}-copy-${Math.random().toString(36).slice(2, 6)}`;
      copy.name = `${copy.name} (Kopie)`;
      currentData.sections.splice(index + 1, 0, copy);
      syncOrder();
      renderStructured();
      updateJsonEditor();
      sendPreviewData();
    });
    actions.appendChild(dup);

    const del = document.createElement('button');
    del.textContent = 'Löschen';
    del.addEventListener('click', () => {
      currentData.sections.splice(index, 1);
      syncOrder();
      renderStructured();
      updateJsonEditor();
      sendPreviewData();
    });
    actions.appendChild(del);

    card.appendChild(actions);
    card.appendChild(makeInput('ID', section.id, (v) => { section.id = v.trim() || `section-${index + 1}`; syncOrder(); updateJsonEditor(); sendPreviewData(); }));
    card.appendChild(makeInput('Titel (CMS)', section.name, (v) => { section.name = v; updateJsonEditor(); }));
    card.appendChild(makeCheckbox('Sichtbar', section.visible, (checked) => { section.visible = checked; updateJsonEditor(); sendPreviewData(); }));
    card.appendChild(makeInput('Section HTML', section.html, (v) => { section.html = v; updateJsonEditor(); sendPreviewData(); }, true));

    sectionsPanel.appendChild(card);
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'primary';
  addBtn.textContent = 'Section hinzufügen';
  addBtn.addEventListener('click', () => {
    const i = currentData.sections.length + 1;
    currentData.sections.push({
      id: `new-section-${i}`,
      name: `Neue Section ${i}`,
      visible: true,
      classes: '',
      html: '<section><div style="padding:40px;max-width:1200px;margin:0 auto;"><h2>Neue Section</h2><p>Inhalt einfügen.</p></div></section>',
    });
    syncOrder();
    renderStructured();
    updateJsonEditor();
    sendPreviewData();
  });
  sectionsPanel.appendChild(addBtn);
  structuredRoot.appendChild(sectionsPanel);

  const barPanel = document.createElement('div');
  barPanel.className = 'panel';
  const barTitle = document.createElement('div');
  barTitle.className = 'field-title';
  barTitle.textContent = 'Floating Bar';
  barPanel.appendChild(barTitle);
  barPanel.appendChild(makeCheckbox('Aktiv', currentData.floatingBar.enabled, (checked) => { currentData.floatingBar.enabled = checked; updateJsonEditor(); sendPreviewData(); }));
  barPanel.appendChild(makeInput('Text', currentData.floatingBar.text, (v) => { currentData.floatingBar.text = v; updateJsonEditor(); sendPreviewData(); }));
  barPanel.appendChild(makeInput('CTA Label', currentData.floatingBar.ctaLabel, (v) => { currentData.floatingBar.ctaLabel = v; updateJsonEditor(); sendPreviewData(); }));
  barPanel.appendChild(makeInput('CTA Link', currentData.floatingBar.ctaHref, (v) => { currentData.floatingBar.ctaHref = v; updateJsonEditor(); sendPreviewData(); }));
  barPanel.appendChild(makeInput('Hintergrund', currentData.floatingBar.background, (v) => { currentData.floatingBar.background = v; updateJsonEditor(); sendPreviewData(); }));
  barPanel.appendChild(makeInput('Textfarbe', currentData.floatingBar.textColor, (v) => { currentData.floatingBar.textColor = v; updateJsonEditor(); sendPreviewData(); }));
  barPanel.appendChild(makeInput('Akzent', currentData.floatingBar.accent, (v) => { currentData.floatingBar.accent = v; updateJsonEditor(); sendPreviewData(); }));
  structuredRoot.appendChild(barPanel);
}

function setMode(next) {
  mode = next;
  const structured = mode === 'structured';
  structuredRoot.style.display = structured ? '' : 'none';
  jsonRoot.style.display = structured ? 'none' : '';
  tabStructured.classList.toggle('active', structured);
  tabJson.classList.toggle('active', !structured);
}

async function loadPages() {
  const res = await fetch('/api/pages');
  const payload = await res.json();
  const pages = payload.pages || [];
  pageSelect.innerHTML = pages.map((p) => `<option value="${p}">${p}</option>`).join('');
  currentPage = pages.includes('heyreply') ? 'heyreply' : (pages[0] || 'heyreply');
  pageSelect.value = currentPage;
}

async function loadHistory() {
  const res = await fetch(`/api/history/${currentPage}`, { cache: 'no-store' });
  if (!res.ok) {
    historyVersions = [];
    return;
  }
  const payload = await res.json();
  historyVersions = Array.isArray(payload.versions) ? payload.versions : [];
}

async function loadContent() {
  setStatus(`Lade ${currentPage} ...`);
  const res = await fetch(`/api/content/${currentPage}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Inhalt konnte nicht geladen werden.');
  currentData = await res.json();
  ensureShape();
  await loadHistory();
  renderStructured();
  updateJsonEditor();
  openPageLink.href = pagePath();
  previewFrame.src = `${pagePath()}?cmsPreview=1`;
  setStatus('Inhalt geladen.');
}

async function saveContent() {
  if (saveBtn.disabled) return;
  try {
    saveBtn.disabled = true;
    if (mode === 'json') currentData = JSON.parse(jsonEditor.value);
    ensureShape();

    setStatus('Speichere ...');
    const res = await fetch(`/api/content/${currentPage}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentData),
    });
    if (!res.ok) throw new Error('Speichern fehlgeschlagen');

    await loadContent();
    sendPreviewData();
    setStatus('Gespeichert.');
  } catch (error) {
    setStatus(`Fehler: ${error.message}`, true);
  } finally {
    saveBtn.disabled = false;
  }
}

tabStructured.addEventListener('click', () => setMode('structured'));
tabJson.addEventListener('click', () => setMode('json'));

jsonEditor.addEventListener('input', () => {
  if (mode !== 'json') return;
  try {
    currentData = JSON.parse(jsonEditor.value);
    ensureShape();
    sendPreviewData();
    setStatus('JSON gültig.');
  } catch (error) {
    setStatus(`JSON Fehler: ${error.message}`, true);
  }
});

pageSelect.addEventListener('change', async () => {
  currentPage = pageSelect.value;
  await loadContent().catch((e) => setStatus(`Fehler: ${e.message}`, true));
});

reloadBtn.addEventListener('click', () => {
  loadContent().catch((e) => setStatus(`Fehler: ${e.message}`, true));
});

saveBtn.addEventListener('click', saveContent);

previewFrame.addEventListener('load', () => {
  sendPreviewData();
});

(async function init() {
  try {
    await loadPages();
    await loadContent();
    setMode('structured');
  } catch (error) {
    setStatus(`Fehler: ${error.message}`, true);
  }
})();
