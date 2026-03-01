const pageSelect = document.getElementById('pageSelect');
const openPageLink = document.getElementById('openPage');
const previewFrame = document.getElementById('previewFrame');
const previewPane = document.getElementById('previewPane');
const layoutMain = document.getElementById('layoutMain');
const statusEl = document.getElementById('status');
const structuredRoot = document.getElementById('structuredRoot');
const jsonRoot = document.getElementById('jsonRoot');
const jsonEditor = document.getElementById('jsonEditor');
const tabStructured = document.getElementById('tabStructured');
const tabJson = document.getElementById('tabJson');
const saveBtn = document.getElementById('save');

const query = new URLSearchParams(window.location.search);
const initialPageFromQuery = (query.get('page') || '').toLowerCase();
const isEmbeddedMode = query.get('embedded') === '1';
const hidePreviewInBuilder = query.get('hidePreview') === '1';
const panelMode = query.get('panel') || 'all';
let currentPage = initialPageFromQuery || 'koblenz';
let currentData = {};
let mode = 'structured';
let jsonTimer = null;
let selectedSectionId = 'slider';
let sectionFilterMode = 'all';
const collapsedFields = new Set();
const DEFAULT_COLLAPSED_KEYS = ['hero', 'sections', 'section-editor', 'event-center', 'footer', 'marketing'];
let historyVersions = [];
let historyLoading = false;
let historyDiffFrom = '';
let historyDiffTo = 'live';
let historyDiffResult = null;

const SECTION_LABELS = {
  slider: 'Top Deals Slider',
  about: 'Das volle Programm',
  pricing: 'Preise & Zeiten',
  groups: 'Gruppen & Events',
  location: 'Wo du uns findest',
  events: 'Kommende Events',
  instagram: 'Instagram',
};
const DEFAULT_ORDER = ['slider', 'about', 'pricing', 'groups', 'location', 'events', 'instagram'];
const WEEK_DAYS = [
  { key: 'mon', label: 'Montag' },
  { key: 'tue', label: 'Dienstag' },
  { key: 'wed', label: 'Mittwoch' },
  { key: 'thu', label: 'Donnerstag' },
  { key: 'fri', label: 'Freitag' },
  { key: 'sat', label: 'Samstag' },
  { key: 'sun', label: 'Sonntag' },
];
const EVENT_DAY_OPTIONS = WEEK_DAYS
  .filter((d) => ['wed', 'thu', 'fri', 'sat', 'sun'].includes(d.key))
  .map((d) => ({ value: d.key, label: d.label }));

function isSectionVisible(value) {
  return !(value === false || value === 'false' || value === 0 || value === '0');
}

function pagePath(page) {
  if (page === 'brand') return '/';
  return `/locations/${page}`;
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#fda4af' : '#9ca3af';
}

function formatDateTime(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (e) {
    return iso;
  }
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function setByPath(obj, path, value) {
  const keys = path.split('.');
  let ref = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (typeof ref[key] !== 'object' || ref[key] === null) ref[key] = {};
    ref = ref[key];
  }
  ref[keys[keys.length - 1]] = value;
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureArray(path, fallback = []) {
  const value = getByPath(currentData, path);
  if (!Array.isArray(value)) setByPath(currentData, path, fallback);
  return getByPath(currentData, path);
}

function ensureObject(path, fallback = {}) {
  const value = getByPath(currentData, path);
  if (!value || typeof value !== 'object' || Array.isArray(value)) setByPath(currentData, path, fallback);
  return getByPath(currentData, path);
}

function timeOptions() {
  const options = [];
  for (let h = 0; h < 24; h += 1) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const t = `${hh}:${mm}`;
      options.push({ value: t, label: t });
    }
  }
  return options;
}

function ensureContentShape() {
  ensureObject('hero');
  ensureArray('hero.badges', []);
  ensureObject('heroSlider');
  ensureArray('heroSlider.slides', []);
  ensureObject('about');
  ensureArray('about.cards', []);
  ensureObject('pricing');
  ensureArray('pricing.items', []);
  ensureArray('pricing.hours', []);
  ensureObject('pricing.weekSchedule', {});
  WEEK_DAYS.forEach(({ key, label }) => {
    const day = currentData.pricing.weekSchedule[key];
    if (!day || typeof day !== 'object') {
      currentData.pricing.weekSchedule[key] = { label, closed: false, open: '11:00', close: '22:00' };
    } else {
      day.label = day.label || label;
      day.closed = Boolean(day.closed);
      day.open = day.open || '11:00';
      day.close = day.close || '22:00';
    }
  });
  ensureObject('groups');
  ensureObject('groups.cta');
  ensureArray('groups.items', []);
  ensureObject('location');
  ensureObject('events');
  ensureArray('events.items', []);
  ensureObject('eventCenter');
  ensureObject('eventCenter.views');
  ensureObject('eventCenter.headings');
  ensureArray('eventCenter.weeklyEvents', []);
  ensureArray('eventCenter.specialEvents', []);
  if (!currentData.eventCenter.title) currentData.eventCenter.title = 'Events in Koblenz';
  if (!currentData.eventCenter.subtitle) currentData.eventCenter.subtitle = 'Alle kommenden Events im Überblick.';
  const defaultViews = { highlights: true, weeklyOverview: true, table: true, calendar: true, upcoming: true };
  delete currentData.eventCenter.views.table;
  delete currentData.eventCenter.views.calendar;
  Object.keys(defaultViews).forEach((k) => {
    if (k === 'table' || k === 'calendar') return;
    if (typeof currentData.eventCenter.views[k] !== 'boolean') currentData.eventCenter.views[k] = defaultViews[k];
  });
  const defaultHeadings = {
    highlights: 'Event Highlights',
    weeklyOverview: 'Wochenevents',
    upcoming: 'Kommende Sonderevents',
  };
  Object.keys(defaultHeadings).forEach((k) => {
    if (!currentData.eventCenter.headings[k]) currentData.eventCenter.headings[k] = defaultHeadings[k];
  });
  currentData.eventCenter.weeklyEvents = currentData.eventCenter.weeklyEvents.map((event, idx) => ({
    id: event?.id || `weekly-${idx + 1}`,
    day: event?.day || 'fri',
    title: event?.title || 'Wochenevent',
    subtitle: event?.subtitle || '',
    startTime: event?.startTime || '18:00',
    endTime: event?.endTime || '22:00',
    image: event?.image || '',
    ctaLabel: event?.ctaLabel || 'Jetzt reservieren',
    ctaHref: event?.ctaHref || '/locations/koblenz/reservieren',
    highlight: Boolean(event?.highlight),
  }));
  currentData.eventCenter.specialEvents = currentData.eventCenter.specialEvents.map((event, idx) => ({
    id: event?.id || `special-${idx + 1}`,
    date: event?.date || '',
    title: event?.title || 'Sonderevent',
    subtitle: event?.subtitle || '',
    startTime: event?.startTime || '18:00',
    endTime: event?.endTime || '22:00',
    image: event?.image || '',
    ctaLabel: event?.ctaLabel || 'Jetzt reservieren',
    ctaHref: event?.ctaHref || '/locations/koblenz/reservieren',
    highlight: Boolean(event?.highlight),
  }));
  ensureObject('instagram');
  ensureArray('instagram.posts', []);
  ensureObject('footer');
  ensureObject('footer.links');
  ensureArray('footer.locations', []);
  ensureArray('footer.support', []);
  ensureObject('marketingBar');
  currentData.marketingBar.enabled = Boolean(currentData.marketingBar.enabled);
  currentData.marketingBar.text = currentData.marketingBar.text || '2 für 1 Aktion heute';
  currentData.marketingBar.ctaLabel = currentData.marketingBar.ctaLabel || 'Deal sichern';
  currentData.marketingBar.ctaHref = currentData.marketingBar.ctaHref || '/locations/koblenz/reservieren';

  currentData.footer.locations = currentData.footer.locations.map((item) => (
    typeof item === 'string' ? { label: item, href: '#' } : { label: item?.label || '', href: item?.href || '#' }
  ));
  currentData.footer.support = currentData.footer.support.map((item) => (
    typeof item === 'string' ? { label: item, href: '#' } : { label: item?.label || '', href: item?.href || '#' }
  ));
}

function ensureLayoutSections() {
  if (!currentData.layout) currentData.layout = {};

  if (Array.isArray(currentData.layout.sections) && currentData.layout.sections.length > 0) {
    const sections = currentData.layout.sections;
    // Keep array/object references stable so UI event handlers never point to stale items.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const s = sections[i];
      if (!s || typeof s !== 'object') {
        sections.splice(i, 1);
        continue;
      }
      s.source = s.source || s.id;
      if (!s.source) {
        sections.splice(i, 1);
        continue;
      }
      s.id = s.id || `${s.source}-${i}`;
      s.visible = isSectionVisible(s.visible);
    }
    if (sections.length === 0) {
      sections.push({ id: 'slider', source: 'slider', visible: true });
    }
    return currentData.layout.sections;
  }

  const order = Array.isArray(currentData.layout.sectionOrder) && currentData.layout.sectionOrder.length > 0
    ? currentData.layout.sectionOrder.filter((k) => SECTION_LABELS[k])
    : DEFAULT_ORDER;

  currentData.layout.sections = order.map((source) => ({ id: source, source, visible: true }));
  currentData.layout.sectionOrder = order;
  return currentData.layout.sections;
}

function resetCollapsedState() {
  collapsedFields.clear();
  const keys = panelMode === 'history' ? ['history'] : DEFAULT_COLLAPSED_KEYS;
  keys.forEach((k) => collapsedFields.add(k));
}

function openSectionEditorPanel() {
  collapsedFields.delete('section-editor');
}

function getSelectedSection() {
  const sections = ensureLayoutSections();
  return sections.find((s) => s.id === selectedSectionId) || sections[0] || null;
}

function getSelectedSectionSource() {
  return getSelectedSection()?.source || 'slider';
}

function ensureSelectedSectionId() {
  const sections = ensureLayoutSections();
  if (!sections.some((s) => s.id === selectedSectionId)) {
    selectedSectionId = sections[0]?.id || 'slider';
  }
}

function syncLegacyOrder() {
  const sections = ensureLayoutSections();
  currentData.layout.sectionOrder = sections.map((s) => s.source);
}

function sendPreviewData() {
  syncLegacyOrder();
  if (previewFrame && previewFrame.contentWindow && !hidePreviewInBuilder) {
    previewFrame.contentWindow.postMessage({ type: 'cms-preview-data', page: currentPage, data: currentData }, '*');
  }
  if (isEmbeddedMode && window.parent !== window) {
    window.parent.postMessage({ type: 'legacy-builder-draft', page: currentPage, data: currentData }, '*');
  }
}

function sendSelectedSection() {
  const section = getSelectedSectionSource();
  if (previewFrame && previewFrame.contentWindow && !hidePreviewInBuilder) {
    previewFrame.contentWindow.postMessage({ type: 'cms-select-section', section }, '*');
  }
  if (isEmbeddedMode && window.parent !== window) {
    window.parent.postMessage({ type: 'legacy-builder-section', page: currentPage, section }, '*');
  }
}

function updateJsonEditor() {
  syncLegacyOrder();
  jsonEditor.value = JSON.stringify(currentData, null, 2);
}

function refreshPreviewUrl() {
  const target = `${pagePath(currentPage)}?cmsPreview=1`;
  openPageLink.href = pagePath(currentPage);
  if (previewFrame && !hidePreviewInBuilder) {
    previewFrame.src = target;
  }
}

async function loadHistory() {
  try {
    historyLoading = true;
    const res = await fetch(`/api/history/${currentPage}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Historie konnte nicht geladen werden.');
    const payload = await res.json();
    historyVersions = Array.isArray(payload.versions) ? payload.versions : [];
    if (!historyDiffFrom && historyVersions.length > 0) historyDiffFrom = historyVersions[0].id;
  } catch (error) {
    historyVersions = [];
    setStatus(`Historie Fehler: ${error.message}`, true);
  } finally {
    historyLoading = false;
  }
}

async function createNamedSnapshot(label) {
  try {
    setStatus('Erstelle Snapshot ...');
    const res = await fetch(`/api/history/${currentPage}/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Snapshot erstellen fehlgeschlagen');
    }
    await loadHistory();
    renderStructuredEditor();
    setStatus('Snapshot erstellt.');
  } catch (error) {
    setStatus(`Fehler: ${error.message}`, true);
  }
}

async function loadHistoryDiff() {
  if (!historyDiffFrom) {
    setStatus('Bitte zuerst eine Ausgangsversion wählen.', true);
    return;
  }
  try {
    setStatus('Lade Diff ...');
    const toValue = historyDiffTo || 'live';
    const res = await fetch(`/api/history/${currentPage}/diff?from=${encodeURIComponent(historyDiffFrom)}&to=${encodeURIComponent(toValue)}`, { cache: 'no-store' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Diff laden fehlgeschlagen');
    }
    historyDiffResult = await res.json();
    renderStructuredEditor();
    setStatus('Diff geladen.');
  } catch (error) {
    historyDiffResult = null;
    setStatus(`Fehler: ${error.message}`, true);
  }
}

async function restoreHistoryVersion(versionId) {
  if (!versionId) return;
  try {
    setStatus(`Wiederherstellen: ${versionId} ...`);
    const res = await fetch(`/api/history/${currentPage}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: versionId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Wiederherstellen fehlgeschlagen');
    }
    const payload = await res.json();
    currentData = payload.data || {};
    ensureContentShape();
    ensureLayoutSections();
    ensureSelectedSectionId();
    renderStructuredEditor();
    updateJsonEditor();
    sendPreviewData();
    sendSelectedSection();
    await loadHistory();
    renderStructuredEditor();
    setStatus(`Wiederhergestellt: ${formatDateTime(historyVersions[0]?.createdAt || new Date().toISOString())}`);
  } catch (error) {
    setStatus(`Fehler: ${error.message}`, true);
  }
}

function makeField(title, inner, options = {}) {
  const wrap = document.createElement('section');
  wrap.className = 'field';
  const key = options.key;
  const collapsible = Boolean(key);
  const collapsed = collapsible && collapsedFields.has(key);

  if (collapsible) {
    const head = document.createElement('div');
    head.className = 'field-title';
    head.style.display = 'flex';
    head.style.justifyContent = 'space-between';
    head.style.alignItems = 'center';

    const text = document.createElement('span');
    text.textContent = title;
    head.appendChild(text);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.textContent = collapsed ? 'Ausklappen' : 'Einklappen';
    toggle.style.padding = '4px 7px';
    toggle.style.fontSize = '11px';
    toggle.addEventListener('click', () => {
      if (collapsedFields.has(key)) collapsedFields.delete(key);
      else collapsedFields.add(key);
      renderStructuredEditor();
    });
    head.appendChild(toggle);
    wrap.appendChild(head);
  } else {
    wrap.innerHTML = `<div class="field-title">${title}</div>`;
  }

  inner.style.display = collapsed ? 'none' : '';
  wrap.appendChild(inner);
  return wrap;
}

function makeInput(label, value, onInput, multiline = false) {
  const group = document.createElement('label');
  group.className = 'hint';
  group.style.display = 'grid';
  group.style.gap = '6px';
  group.textContent = label;

  const input = multiline ? document.createElement('textarea') : document.createElement('input');
  if (!multiline) input.type = 'text';
  input.value = value || '';
  if (multiline) input.rows = 3;

  input.addEventListener('input', () => onInput(input.value));
  group.appendChild(input);
  return group;
}

function makeSelect(label, value, options, onChange) {
  const group = document.createElement('label');
  group.className = 'hint';
  group.style.display = 'grid';
  group.style.gap = '6px';
  group.textContent = label;

  const select = document.createElement('select');
  select.innerHTML = options.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join('');
  select.value = value || options[0]?.value || '';
  select.addEventListener('change', () => onChange(select.value));
  group.appendChild(select);
  return group;
}

function makeCheckbox(label, checked, onChange) {
  const group = document.createElement('label');
  group.className = 'hint';
  group.style.display = 'flex';
  group.style.alignItems = 'center';
  group.style.gap = '8px';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = Boolean(checked);
  input.addEventListener('change', () => onChange(input.checked));

  const text = document.createElement('span');
  text.textContent = label;

  group.appendChild(input);
  group.appendChild(text);
  return group;
}

function makeActionButton(label, onClick, isPrimary = false) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  if (isPrimary) btn.classList.add('primary');
  btn.addEventListener('click', onClick);
  return btn;
}

function makeEventListEditor(title, listRef, isWeekly) {
  const wrap = document.createElement('div');
  wrap.className = 'field-grid';
  const timeList = timeOptions();

  function rerender() {
    wrap.innerHTML = '';
    listRef.forEach((event, index) => {
      const card = document.createElement('div');
      card.className = 'slide-card';

      const head = document.createElement('div');
      head.className = 'slide-head';
      head.innerHTML = `<span>${title} ${index + 1}</span>`;
      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '6px';
      const copyBtn = makeActionButton('Kopieren', () => {
        listRef.splice(index + 1, 0, { ...event, id: uid(isWeekly ? 'weekly' : 'special') });
        rerender();
        sendPreviewData();
        updateJsonEditor();
      });
      copyBtn.style.padding = '4px 7px';
      actions.appendChild(copyBtn);
      const removeBtn = makeActionButton('Entfernen', () => {
        listRef.splice(index, 1);
        rerender();
        sendPreviewData();
        updateJsonEditor();
      });
      removeBtn.style.padding = '4px 7px';
      actions.appendChild(removeBtn);
      head.appendChild(actions);
      card.appendChild(head);

      const grid = document.createElement('div');
      grid.className = 'field-grid';
      if (isWeekly) {
        grid.appendChild(makeSelect('Wochentag', event.day || 'fri', EVENT_DAY_OPTIONS, (v) => {
          event.day = v;
          sendPreviewData();
          updateJsonEditor();
        }));
      } else {
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.value = event.date || '';
        dateInput.addEventListener('input', () => {
          event.date = dateInput.value;
          sendPreviewData();
          updateJsonEditor();
        });
        grid.appendChild(makeField('Datum', dateInput));
      }
      grid.appendChild(makeInput('Event Titel', event.title || '', (v) => { event.title = v; sendPreviewData(); updateJsonEditor(); }));
      grid.appendChild(makeInput('Subtext', event.subtitle || '', (v) => { event.subtitle = v; sendPreviewData(); updateJsonEditor(); }, true));
      const timeGrid = document.createElement('div');
      timeGrid.className = 'field-grid two';
      timeGrid.appendChild(makeSelect('Start', event.startTime || '18:00', timeList, (v) => { event.startTime = v; sendPreviewData(); updateJsonEditor(); }));
      timeGrid.appendChild(makeSelect('Ende', event.endTime || '22:00', timeList, (v) => { event.endTime = v; sendPreviewData(); updateJsonEditor(); }));
      grid.appendChild(timeGrid);
      grid.appendChild(makeInput('Bild URL', event.image || '', (v) => { event.image = v; sendPreviewData(); updateJsonEditor(); }));
      const ctaGrid = document.createElement('div');
      ctaGrid.className = 'field-grid two';
      ctaGrid.appendChild(makeInput('CTA Label', event.ctaLabel || '', (v) => { event.ctaLabel = v; sendPreviewData(); updateJsonEditor(); }));
      ctaGrid.appendChild(makeInput('CTA Link', event.ctaHref || '', (v) => { event.ctaHref = v; sendPreviewData(); updateJsonEditor(); }));
      grid.appendChild(ctaGrid);
      grid.appendChild(makeCheckbox('Als Highlight markieren', event.highlight, (checked) => {
        event.highlight = checked;
        sendPreviewData();
        updateJsonEditor();
      }));
      card.appendChild(grid);
      wrap.appendChild(card);
    });
  }

  rerender();
  const outer = document.createElement('div');
  outer.className = 'field-grid';
  outer.appendChild(wrap);
  outer.appendChild(makeActionButton(`${title} hinzufügen`, () => {
    listRef.push(isWeekly
      ? {
          id: uid('weekly'),
          day: 'fri',
          title: 'Neues Wochenevent',
          subtitle: '',
          startTime: '18:00',
          endTime: '22:00',
          image: '',
          ctaLabel: 'Jetzt reservieren',
          ctaHref: '/locations/koblenz/reservieren',
          highlight: false,
        }
      : {
          id: uid('special'),
          date: '',
          title: 'Neues Sonderevent',
          subtitle: '',
          startTime: '18:00',
          endTime: '22:00',
          image: '',
          ctaLabel: 'Jetzt reservieren',
          ctaHref: '/locations/koblenz/reservieren',
          highlight: false,
        });
    rerender();
    sendPreviewData();
    updateJsonEditor();
  }));
  return outer;
}

function makeObjectListEditor(title, listRef, fields, createDefault) {
  const wrap = document.createElement('div');
  wrap.className = 'field-grid';

  function rerender() {
    wrap.innerHTML = '';
    listRef.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'slide-card';

      const head = document.createElement('div');
      head.className = 'slide-head';
      head.innerHTML = `<span>${title} ${index + 1}</span>`;

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '6px';

      const copyBtn = makeActionButton('Kopieren', () => {
        listRef.splice(index + 1, 0, JSON.parse(JSON.stringify(item)));
        rerender();
        sendPreviewData();
        updateJsonEditor();
      });
      copyBtn.style.padding = '4px 7px';
      actions.appendChild(copyBtn);

      const removeBtn = makeActionButton('Entfernen', () => {
        listRef.splice(index, 1);
        rerender();
        sendPreviewData();
        updateJsonEditor();
      });
      removeBtn.style.padding = '4px 7px';
      actions.appendChild(removeBtn);

      head.appendChild(actions);
      card.appendChild(head);

      const grid = document.createElement('div');
      grid.className = 'field-grid';
      fields.forEach((field) => {
        const value = item[field.key] || '';
        grid.appendChild(makeInput(field.label, value, (v) => {
          item[field.key] = v;
          sendPreviewData();
          updateJsonEditor();
        }, Boolean(field.multiline)));
      });
      card.appendChild(grid);
      wrap.appendChild(card);
    });
  }

  rerender();

  const outer = document.createElement('div');
  outer.className = 'field-grid';
  outer.appendChild(wrap);
  outer.appendChild(makeActionButton(`${title} hinzufügen`, () => {
    listRef.push(createDefault());
    rerender();
    sendPreviewData();
    updateJsonEditor();
  }));
  return outer;
}

function makeWeekScheduleEditor() {
  const schedule = ensureObject('pricing.weekSchedule');
  const options = timeOptions();
  const wrap = document.createElement('div');
  wrap.className = 'field-grid';

  WEEK_DAYS.forEach(({ key, label }) => {
    const row = schedule[key];
    const card = document.createElement('div');
    card.className = 'slide-card';

    const head = document.createElement('div');
    head.className = 'slide-head';
    head.innerHTML = `<span>${label}</span>`;
    card.appendChild(head);

    const grid = document.createElement('div');
    grid.className = 'field-grid two';

    grid.appendChild(makeCheckbox('Geschlossen', row.closed, (checked) => {
      row.closed = checked;
      sendPreviewData();
      updateJsonEditor();
      renderStructuredEditor();
    }));
    grid.appendChild(makeInput('Label (optional)', row.label || label, (v) => {
      row.label = v;
      sendPreviewData();
      updateJsonEditor();
    }));

    const openSelect = makeSelect('Öffnet', row.open || '11:00', options, (v) => {
      row.open = v;
      sendPreviewData();
      updateJsonEditor();
    });
    const closeSelect = makeSelect('Schließt', row.close || '22:00', options, (v) => {
      row.close = v;
      sendPreviewData();
      updateJsonEditor();
    });

    openSelect.style.display = row.closed ? 'none' : 'grid';
    closeSelect.style.display = row.closed ? 'none' : 'grid';
    grid.appendChild(openSelect);
    grid.appendChild(closeSelect);

    card.appendChild(grid);
    wrap.appendChild(card);
  });

  return wrap;
}

function renderSectionOrderEditor() {
  const sections = ensureLayoutSections();
  const root = document.createElement('div');
  root.className = 'drag-list';

  ensureSelectedSectionId();

  let dragIndex = -1;

  function rerenderRows() {
    root.innerHTML = '';

    sections.forEach((item, index) => {
      if (sectionFilterMode === 'visible' && !item.visible) return;
      if (sectionFilterMode === 'hidden' && item.visible) return;

      const row = document.createElement('div');
      row.className = `drag-item ${item.id === selectedSectionId ? 'active' : ''}`;
      row.draggable = true;

      const label = document.createElement('span');
      const base = SECTION_LABELS[item.source] || item.source;
      const copySuffix = item.id !== item.source ? ' (Copy)' : '';
      label.textContent = `${base}${copySuffix}`;
      row.appendChild(label);

      const right = document.createElement('div');
      right.style.display = 'flex';
      right.style.gap = '6px';
      right.style.alignItems = 'center';

      const state = document.createElement('span');
      state.textContent = item.visible ? 'Live' : 'Versteckt';
      state.style.fontSize = '10px';
      state.style.fontWeight = '700';
      state.style.letterSpacing = '0.08em';
      state.style.textTransform = 'uppercase';
      state.style.padding = '4px 7px';
      state.style.border = '1px solid';
      state.style.borderColor = item.visible ? 'rgba(34, 197, 94, 0.35)' : 'rgba(244, 63, 94, 0.35)';
      state.style.color = item.visible ? '#4ade80' : '#fda4af';
      state.style.borderRadius = '999px';
      right.appendChild(state);

      const eye = document.createElement('button');
      eye.type = 'button';
      eye.textContent = item.visible ? '👁' : '🙈';
      eye.title = item.visible ? 'Section ausblenden' : 'Section einblenden';
      eye.style.padding = '4px 7px';
      eye.addEventListener('click', (e) => {
        e.stopPropagation();
        item.visible = !item.visible;
        rerenderRows();
        sendPreviewData();
        updateJsonEditor();
      });
      right.appendChild(eye);

      const copy = document.createElement('button');
      copy.type = 'button';
      copy.textContent = 'Kopieren';
      copy.style.padding = '4px 7px';
      copy.addEventListener('click', (e) => {
        e.stopPropagation();
        const clone = { id: uid(item.source), source: item.source, visible: true };
        sections.splice(index + 1, 0, clone);
        rerenderRows();
        sendPreviewData();
        updateJsonEditor();
      });
      right.appendChild(copy);

      const edit = document.createElement('button');
      edit.type = 'button';
      edit.textContent = 'Bearbeiten';
      edit.style.padding = '4px 7px';
      edit.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedSectionId = item.id;
        openSectionEditorPanel();
        rerenderRows();
        renderStructuredEditor();
        sendSelectedSection();
      });
      right.appendChild(edit);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Entfernen';
      remove.style.padding = '4px 7px';
      remove.addEventListener('click', (e) => {
        e.stopPropagation();
        const removedWasSelected = item.id === selectedSectionId;
        sections.splice(index, 1);
        if (sections.length === 0) sections.push({ id: 'about', source: 'about', visible: true });
        if (removedWasSelected || !sections.some((s) => s.id === selectedSectionId)) {
          selectedSectionId = sections[Math.min(index, sections.length - 1)].id;
        }
        rerenderRows();
        renderStructuredEditor();
        sendPreviewData();
        sendSelectedSection();
        updateJsonEditor();
      });
      right.appendChild(remove);

      row.appendChild(right);

      row.addEventListener('click', () => {
        selectedSectionId = item.id;
        openSectionEditorPanel();
        rerenderRows();
        renderStructuredEditor();
        sendSelectedSection();
      });

      row.addEventListener('dragstart', () => {
        dragIndex = index;
        row.classList.add('dragging');
      });
      row.addEventListener('dragend', () => row.classList.remove('dragging'));
      row.addEventListener('dragover', (e) => e.preventDefault());
      row.addEventListener('drop', (e) => {
        e.preventDefault();
        if (dragIndex < 0 || dragIndex === index) return;
        const [moved] = sections.splice(dragIndex, 1);
        sections.splice(index, 0, moved);
        ensureSelectedSectionId();
        rerenderRows();
        sendPreviewData();
        sendSelectedSection();
        updateJsonEditor();
      });

      root.appendChild(row);
    });
  }

  rerenderRows();

  const toolsWrap = document.createElement('div');
  toolsWrap.style.display = 'flex';
  toolsWrap.style.gap = '8px';
  toolsWrap.style.marginBottom = '8px';

  const helper = document.createElement('div');
  helper.className = 'hint';
  helper.textContent = 'Section auswählen und mit "Bearbeiten" den Inhalts-Editor öffnen.';
  helper.style.marginBottom = '8px';

  const filterSelect = document.createElement('select');
  filterSelect.innerHTML = [
    '<option value="all">Alle Sections</option>',
    '<option value="visible">Nur sichtbare</option>',
    '<option value="hidden">Nur versteckte</option>',
  ].join('');
  filterSelect.value = sectionFilterMode;
  filterSelect.addEventListener('change', () => {
    sectionFilterMode = filterSelect.value;
    rerenderRows();
  });
  toolsWrap.appendChild(filterSelect);

  const addWrap = document.createElement('div');
  addWrap.style.display = 'flex';
  addWrap.style.gap = '8px';
  addWrap.style.marginTop = '8px';

  const addSelect = document.createElement('select');
  addSelect.innerHTML = Object.keys(SECTION_LABELS)
    .map((key) => `<option value="${key}">${SECTION_LABELS[key]}</option>`)
    .join('');
  addWrap.appendChild(addSelect);

  const addBtn = makeActionButton('Section hinzufügen', () => {
    const added = { id: uid(addSelect.value), source: addSelect.value, visible: true };
    sections.push(added);
    selectedSectionId = added.id;
    openSectionEditorPanel();
    rerenderRows();
    renderStructuredEditor();
    sendPreviewData();
    sendSelectedSection();
    updateJsonEditor();
  });
  addWrap.appendChild(addBtn);

  const box = document.createElement('div');
  box.appendChild(helper);
  box.appendChild(toolsWrap);
  box.appendChild(root);
  box.appendChild(addWrap);

  return makeField('Sections Übersicht (Auge / Kopieren / Entfernen / Drag)', box, { key: 'sections' });
}

function renderHeroSliderEditor() {
  if (!currentData.heroSlider) currentData.heroSlider = {};
  if (!Array.isArray(currentData.heroSlider.slides)) currentData.heroSlider.slides = [];

  const box = document.createElement('div');
  box.className = 'field-grid';

  box.appendChild(makeInput('Kicker', currentData.heroSlider.kicker || '', (v) => {
    currentData.heroSlider.kicker = v;
    sendPreviewData();
    updateJsonEditor();
  }));

  box.appendChild(makeInput('Heading (HTML erlaubt)', currentData.heroSlider.heading || '', (v) => {
    currentData.heroSlider.heading = v;
    sendPreviewData();
    updateJsonEditor();
  }, true));

  const slidesWrap = document.createElement('div');
  let dragIndex = -1;

  function renderSlides() {
    slidesWrap.innerHTML = '';

    currentData.heroSlider.slides.forEach((slide, index) => {
      const card = document.createElement('div');
      card.className = 'slide-card';
      card.draggable = true;

      card.addEventListener('dragstart', () => {
        dragIndex = index;
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
      card.addEventListener('dragover', (e) => e.preventDefault());
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        if (dragIndex < 0 || dragIndex === index) return;
        const arr = currentData.heroSlider.slides;
        const [moved] = arr.splice(dragIndex, 1);
        arr.splice(index, 0, moved);
        renderSlides();
        sendPreviewData();
        updateJsonEditor();
      });

      const head = document.createElement('div');
      head.className = 'slide-head';
      head.innerHTML = `<span>Slide ${index + 1}</span>`;

      const headActions = document.createElement('div');
      headActions.style.display = 'flex';
      headActions.style.gap = '6px';

      const copyBtn = makeActionButton('Kopieren', () => {
        const clone = JSON.parse(JSON.stringify(slide));
        currentData.heroSlider.slides.splice(index + 1, 0, clone);
        renderSlides();
        sendPreviewData();
        updateJsonEditor();
      });
      copyBtn.style.padding = '4px 7px';
      headActions.appendChild(copyBtn);

      const removeBtn = makeActionButton('Entfernen', () => {
        currentData.heroSlider.slides.splice(index, 1);
        renderSlides();
        sendPreviewData();
        updateJsonEditor();
      });
      removeBtn.style.padding = '4px 7px';
      headActions.appendChild(removeBtn);

      head.appendChild(headActions);
      card.appendChild(head);

      const grid = document.createElement('div');
      grid.className = 'field-grid';
      grid.appendChild(makeInput('Datum', slide.date || '', (v) => { slide.date = v; sendPreviewData(); updateJsonEditor(); }));
      grid.appendChild(makeInput('Titel', slide.title || '', (v) => { slide.title = v; sendPreviewData(); updateJsonEditor(); }));
      grid.appendChild(makeInput('Subtext', slide.text || '', (v) => { slide.text = v; sendPreviewData(); updateJsonEditor(); }, true));
      grid.appendChild(makeInput('Bild URL', slide.image || '', (v) => { slide.image = v; sendPreviewData(); updateJsonEditor(); }));

      const ctaGrid = document.createElement('div');
      ctaGrid.className = 'field-grid two';
      ctaGrid.appendChild(makeInput('CTA Label', slide.cta || '', (v) => { slide.cta = v; sendPreviewData(); updateJsonEditor(); }));
      ctaGrid.appendChild(makeInput('CTA Link', slide.href || '', (v) => { slide.href = v; sendPreviewData(); updateJsonEditor(); }));
      grid.appendChild(ctaGrid);

      card.appendChild(grid);
      slidesWrap.appendChild(card);
    });
  }

  renderSlides();
  box.appendChild(slidesWrap);

  box.appendChild(makeActionButton('Slide hinzufügen', () => {
    currentData.heroSlider.slides.push({
      date: 'Neues Datum',
      title: 'Neuer Eventtitel',
      text: 'Kurzer Eventtext',
      cta: 'Jetzt buchen',
      href: '/locations/koblenz/reservieren',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop',
    });
    renderSlides();
    sendPreviewData();
    updateJsonEditor();
  }, true));

  return makeField('Top Deals Slider', box, { key: 'section-editor' });
}

function renderSectionSpecificEditor() {
  ensureContentShape();
  const selectedSectionSource = getSelectedSectionSource();
  if (selectedSectionSource === 'slider') return renderHeroSliderEditor();

  const wrap = document.createElement('div');
  wrap.className = 'field-grid';
  const addPathInput = (path, label, multiline = false) => {
    wrap.appendChild(makeInput(label, getByPath(currentData, path) || '', (v) => {
      setByPath(currentData, path, v);
      sendPreviewData();
      updateJsonEditor();
    }, multiline));
  };

  if (selectedSectionSource === 'about') {
    addPathInput('about.title', 'Überschrift (HTML erlaubt)', true);
    addPathInput('about.text', 'Text', true);
    wrap.appendChild(makeObjectListEditor(
      'Karte',
      currentData.about.cards,
      [
        { key: 'icon', label: 'Icon (z. B. lucide:trophy)' },
        { key: 'title', label: 'Titel' },
        { key: 'subtitle', label: 'Subtitel' },
        { key: 'image', label: 'Bild URL' },
      ],
      () => ({ icon: 'lucide:star', title: 'Neuer Titel', subtitle: 'Neuer Subtitel', image: '' }),
    ));
  } else if (selectedSectionSource === 'pricing') {
    addPathInput('pricing.title', 'Überschrift (HTML erlaubt)', true);
    addPathInput('pricing.note', 'Hinweis', true);
    wrap.appendChild(makeObjectListEditor(
      'Preiszeile',
      currentData.pricing.items,
      [
        { key: 'name', label: 'Name' },
        { key: 'info', label: 'Info' },
        { key: 'price', label: 'Preis' },
        { key: 'unit', label: 'Einheit' },
      ],
      () => ({ name: 'Neuer Tarif', info: '', price: '0,00 EUR', unit: 'pro Einheit' }),
    ));
    wrap.appendChild(makeField('Öffnungszeiten Woche (Mo-So)', makeWeekScheduleEditor()));
  } else if (selectedSectionSource === 'groups') {
    addPathInput('groups.title', 'Überschrift (HTML erlaubt)', true);
    addPathInput('groups.text', 'Text', true);
    addPathInput('groups.image', 'Bild URL');
    addPathInput('groups.cta.label', 'CTA Label');
    addPathInput('groups.cta.href', 'CTA Link');
    wrap.appendChild(makeObjectListEditor(
      'Gruppenkarte',
      currentData.groups.items,
      [
        { key: 'icon', label: 'Icon' },
        { key: 'title', label: 'Titel' },
        { key: 'text', label: 'Text', multiline: true },
      ],
      () => ({ icon: 'lucide:users', title: 'Neuer Typ', text: 'Beschreibung' }),
    ));
  } else if (selectedSectionSource === 'location') {
    addPathInput('location.title', 'Überschrift (HTML erlaubt)', true);
    addPathInput('location.mapImage', 'Kartenbild URL');
    addPathInput('location.mapLink', 'Kartenlink');
    addPathInput('location.website', 'Website URL');
    addPathInput('location.address', 'Adresse (HTML erlaubt)', true);
    addPathInput('location.phone', 'Telefon');
    addPathInput('location.info', 'Infotext', true);
  } else if (selectedSectionSource === 'events') {
    addPathInput('events.title', 'Überschrift (HTML erlaubt)', true);
    wrap.appendChild(makeObjectListEditor(
      'Event',
      currentData.events.items,
      [
        { key: 'badge', label: 'Badge' },
        { key: 'time', label: 'Zeit' },
        { key: 'title', label: 'Titel' },
        { key: 'text', label: 'Text', multiline: true },
        { key: 'cta', label: 'CTA Label' },
        { key: 'href', label: 'CTA Link' },
        { key: 'image', label: 'Bild URL' },
      ],
      () => ({ badge: '', time: '', title: 'Neues Event', text: '', cta: 'Mehr erfahren', href: '#', image: '' }),
    ));
  } else if (selectedSectionSource === 'instagram') {
    addPathInput('instagram.title', 'Überschrift (HTML erlaubt)', true);
    addPathInput('instagram.handle', 'Handle');
    addPathInput('instagram.profile', 'Profil Link');
    wrap.appendChild(makeObjectListEditor(
      'Post',
      currentData.instagram.posts,
      [
        { key: 'image', label: 'Bild URL' },
        { key: 'likes', label: 'Likes' },
        { key: 'comments', label: 'Kommentare' },
        { key: 'text', label: 'Text', multiline: true },
      ],
      () => ({ image: '', likes: '0', comments: '0', text: '' }),
    ));
  }

  return makeField(`Section bearbeiten: ${SECTION_LABELS[selectedSectionSource] || selectedSectionSource}`, wrap, { key: 'section-editor' });
}

function renderFooterEditor() {
  ensureContentShape();
  const wrap = document.createElement('div');
  wrap.className = 'field-grid';

  const addPathInput = (path, label, multiline = false) => {
    wrap.appendChild(makeInput(label, getByPath(currentData, path) || '', (v) => {
      setByPath(currentData, path, v);
      sendPreviewData();
      updateJsonEditor();
    }, multiline));
  };

  addPathInput('footer.logo', 'Footer Logo Text');
  addPathInput('footer.text', 'Footer Text', true);
  addPathInput('footer.copyright', 'Copyright Text');
  addPathInput('footer.links.imprint', 'Impressum Link');
  addPathInput('footer.links.privacy', 'Datenschutz Link');
  addPathInput('footer.links.agb', 'AGB Link');

  wrap.appendChild(makeObjectListEditor(
    'Footer Location Link',
    currentData.footer.locations,
    [{ key: 'label', label: 'Label' }, { key: 'href', label: 'Link' }],
    () => ({ label: 'Neuer Standort', href: '#' }),
  ));
  wrap.appendChild(makeObjectListEditor(
    'Footer Support Link',
    currentData.footer.support,
    [{ key: 'label', label: 'Label' }, { key: 'href', label: 'Link' }],
    () => ({ label: 'Neuer Support Link', href: '#' }),
  ));

  return makeField('Footer', wrap, { key: 'footer' });
}

function renderMarketingBarEditor() {
  ensureContentShape();
  const wrap = document.createElement('div');
  wrap.className = 'field-grid';

  wrap.appendChild(makeCheckbox('Floating Bar aktiv', currentData.marketingBar.enabled, (checked) => {
    currentData.marketingBar.enabled = checked;
    sendPreviewData();
    updateJsonEditor();
    renderStructuredEditor();
  }));

  wrap.appendChild(makeInput('Text', currentData.marketingBar.text || '', (v) => {
    currentData.marketingBar.text = v;
    sendPreviewData();
    updateJsonEditor();
  }));
  wrap.appendChild(makeInput('CTA Label', currentData.marketingBar.ctaLabel || '', (v) => {
    currentData.marketingBar.ctaLabel = v;
    sendPreviewData();
    updateJsonEditor();
  }));
  wrap.appendChild(makeInput('CTA Link', currentData.marketingBar.ctaHref || '', (v) => {
    currentData.marketingBar.ctaHref = v;
    sendPreviewData();
    updateJsonEditor();
  }));

  return makeField('Floating Bar (Sticky unten)', wrap, { key: 'marketing' });
}

function renderEventCenterEditor() {
  ensureContentShape();
  const ec = currentData.eventCenter;
  const wrap = document.createElement('div');
  wrap.className = 'field-grid';

  wrap.appendChild(makeInput('Events Haupttitel', ec.title || '', (v) => {
    ec.title = v;
    sendPreviewData();
    updateJsonEditor();
  }));
  wrap.appendChild(makeInput('Events Subtitel', ec.subtitle || '', (v) => {
    ec.subtitle = v;
    sendPreviewData();
    updateJsonEditor();
  }, true));

  const viewGrid = document.createElement('div');
  viewGrid.className = 'field-grid two';
  [
    ['highlights', 'Highlights anzeigen'],
    ['weeklyOverview', 'Wochenevents anzeigen'],
    ['upcoming', 'Kommende Events anzeigen'],
  ].forEach(([key, label]) => {
    viewGrid.appendChild(makeCheckbox(label, ec.views[key], (checked) => {
      ec.views[key] = checked;
      sendPreviewData();
      updateJsonEditor();
    }));
  });
  wrap.appendChild(makeField('Event-Ansichten', viewGrid));

  const headingGrid = document.createElement('div');
  headingGrid.className = 'field-grid two';
  [
    ['highlights', 'Heading Highlights'],
    ['weeklyOverview', 'Heading Wochenevents'],
    ['upcoming', 'Heading Kommende'],
  ].forEach(([key, label]) => {
    headingGrid.appendChild(makeInput(label, ec.headings[key] || '', (v) => {
      ec.headings[key] = v;
      sendPreviewData();
      updateJsonEditor();
    }));
  });
  wrap.appendChild(makeField('Section-Headings', headingGrid));

  wrap.appendChild(makeField('Wochenevents (Mittwoch-Sonntag etc.)', makeEventListEditor('Wochenevent', ec.weeklyEvents, true)));
  wrap.appendChild(makeField('Sonderevents (Datum-basiert)', makeEventListEditor('Sonderevent', ec.specialEvents, false)));

  return makeField('Event Center (zentral)', wrap, { key: 'event-center' });
}

function renderHistoryEditor() {
  const wrap = document.createElement('div');
  wrap.className = 'field-grid';

  const hint = document.createElement('div');
  hint.className = 'hint';
  hint.textContent = 'Automatische Snapshots werden bei jedem Speichern erstellt.';
  wrap.appendChild(hint);

  const reloadBtn = makeActionButton('Historie neu laden', async () => {
    await loadHistory();
    renderStructuredEditor();
  });
  const snapshotInput = document.createElement('input');
  snapshotInput.type = 'text';
  snapshotInput.placeholder = 'Snapshot Name (optional)';
  snapshotInput.style.minWidth = '180px';

  const snapshotBtn = makeActionButton('Snapshot erstellen', async () => {
    await createNamedSnapshot(snapshotInput.value.trim());
  });

  const topActions = document.createElement('div');
  topActions.style.display = 'flex';
  topActions.style.gap = '8px';
  topActions.style.flexWrap = 'wrap';
  topActions.appendChild(reloadBtn);
  topActions.appendChild(snapshotInput);
  topActions.appendChild(snapshotBtn);
  wrap.appendChild(topActions);

  if (historyLoading) {
    const loading = document.createElement('div');
    loading.className = 'hint';
    loading.textContent = 'Historie wird geladen...';
    wrap.appendChild(loading);
    return makeField('Historie / Rückgängig', wrap, { key: 'history' });
  }

  if (!historyVersions.length) {
    const empty = document.createElement('div');
    empty.className = 'hint';
    empty.textContent = 'Noch keine gespeicherten Stände vorhanden.';
    wrap.appendChild(empty);
    return makeField('Historie / Rückgängig', wrap, { key: 'history' });
  }

  const list = document.createElement('div');
  list.className = 'field-grid';
  historyVersions.slice(0, 25).forEach((version) => {
    const row = document.createElement('div');
    row.className = 'slide-card';
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    row.style.gap = '8px';
    row.style.marginBottom = '0';

    const meta = document.createElement('div');
    meta.className = 'hint';
    meta.style.display = 'grid';
    meta.style.gap = '4px';
    meta.innerHTML = `
      <span style="font-weight:700;color:#d1d5db">${formatDateTime(version.createdAt)}</span>
      <span style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em">${version.reason || 'snapshot'}</span>
    `;
    row.appendChild(meta);

    const restoreBtn = makeActionButton('Wiederherstellen', async () => {
      await restoreHistoryVersion(version.id);
    });
    restoreBtn.style.padding = '6px 9px';
    row.appendChild(restoreBtn);

    list.appendChild(row);
  });
  wrap.appendChild(list);

  const diffBox = document.createElement('div');
  diffBox.className = 'slide-card';
  diffBox.style.marginBottom = '0';

  const diffTitle = document.createElement('div');
  diffTitle.className = 'slide-head';
  diffTitle.innerHTML = '<span>Diff Ansicht</span>';
  diffBox.appendChild(diffTitle);

  const diffControls = document.createElement('div');
  diffControls.className = 'field-grid';
  diffControls.style.gap = '8px';

  const fromSelect = document.createElement('select');
  fromSelect.innerHTML = historyVersions.map((v) => `<option value="${v.id}">${formatDateTime(v.createdAt)} (${v.reason || 'snapshot'})</option>`).join('');
  fromSelect.value = historyDiffFrom || historyVersions[0]?.id || '';
  fromSelect.addEventListener('change', () => { historyDiffFrom = fromSelect.value; });
  diffControls.appendChild(makeField('Von Version', fromSelect));

  const toSelect = document.createElement('select');
  toSelect.innerHTML = [
    '<option value="live">Aktueller Live-Stand</option>',
    ...historyVersions.map((v) => `<option value="${v.id}">${formatDateTime(v.createdAt)} (${v.reason || 'snapshot'})</option>`),
  ].join('');
  toSelect.value = historyDiffTo || 'live';
  toSelect.addEventListener('change', () => { historyDiffTo = toSelect.value; });
  diffControls.appendChild(makeField('Zu Version', toSelect));

  const diffBtn = makeActionButton('Diff laden', async () => {
    historyDiffFrom = fromSelect.value;
    historyDiffTo = toSelect.value;
    await loadHistoryDiff();
  });
  diffControls.appendChild(diffBtn);
  diffBox.appendChild(diffControls);

  if (historyDiffResult) {
    const summary = document.createElement('div');
    summary.className = 'hint';
    summary.style.marginTop = '10px';
    summary.textContent = `Änderungen: ${historyDiffResult.summary?.total || 0} (neu: ${historyDiffResult.summary?.added || 0}, entfernt: ${historyDiffResult.summary?.removed || 0}, geändert: ${historyDiffResult.summary?.changed || 0})`;
    diffBox.appendChild(summary);

    const changes = document.createElement('div');
    changes.className = 'field-grid';
    changes.style.marginTop = '8px';
    (historyDiffResult.changes || []).slice(0, 80).forEach((c) => {
      const row = document.createElement('div');
      row.className = 'hint';
      row.style.padding = '6px 8px';
      row.style.border = '1px solid #303545';
      row.style.borderRadius = '8px';
      row.textContent = `${c.type.toUpperCase()}: ${c.path}`;
      changes.appendChild(row);
    });
    diffBox.appendChild(changes);
  }

  wrap.appendChild(diffBox);
  return makeField('Historie / Rückgängig', wrap, { key: 'history' });
}

function renderStructuredEditor() {
  structuredRoot.innerHTML = '';

  if (panelMode === 'history') {
    structuredRoot.appendChild(renderHistoryEditor());
    return;
  }

  if (currentPage === 'brand') {
    const info = document.createElement('div');
    info.className = 'field';
    info.innerHTML = '<div class="field-title">Hinweis</div><div class="hint">Für die Brand-Seite nutze den JSON-Editor für Inhalte.</div>';
    structuredRoot.appendChild(info);
    return;
  }
  ensureContentShape();

  const heroWrap = document.createElement('div');
  heroWrap.className = 'field-grid';
  heroWrap.appendChild(makeInput('Hero Titel', currentData.hero?.title || '', (v) => {
    setByPath(currentData, 'hero.title', v);
    sendPreviewData();
    updateJsonEditor();
  }));
  heroWrap.appendChild(makeInput('Hero Subtitel', currentData.hero?.subtitle || '', (v) => {
    setByPath(currentData, 'hero.subtitle', v);
    sendPreviewData();
    updateJsonEditor();
  }, true));
  heroWrap.appendChild(makeInput('Hero Bild URL', currentData.hero?.image || '', (v) => {
    setByPath(currentData, 'hero.image', v);
    sendPreviewData();
    updateJsonEditor();
  }));

  const collapseBar = document.createElement('div');
  collapseBar.style.display = 'flex';
  collapseBar.style.gap = '8px';
  collapseBar.style.marginBottom = '10px';
  collapseBar.appendChild(makeActionButton('Alle ausklappen', () => {
    collapsedFields.clear();
    renderStructuredEditor();
  }));
  collapseBar.appendChild(makeActionButton('Alle einklappen', () => {
    resetCollapsedState();
    renderStructuredEditor();
  }));
  structuredRoot.appendChild(collapseBar);

  structuredRoot.appendChild(makeField('Hero', heroWrap, { key: 'hero' }));
  structuredRoot.appendChild(renderSectionOrderEditor());
  structuredRoot.appendChild(renderSectionSpecificEditor());
  structuredRoot.appendChild(renderEventCenterEditor());
  structuredRoot.appendChild(renderFooterEditor());
  structuredRoot.appendChild(renderMarketingBarEditor());
}

function setMode(nextMode) {
  mode = nextMode;
  const structured = mode === 'structured';
  structuredRoot.style.display = structured ? '' : 'none';
  jsonRoot.style.display = structured ? 'none' : '';
  tabStructured.classList.toggle('active', structured);
  tabJson.classList.toggle('active', !structured);
}

async function loadPages() {
  const res = await fetch('/api/pages');
  const data = await res.json();
  const pages = data.pages || [];

  pageSelect.innerHTML = pages.map((p) => `<option value="${p}">${p}</option>`).join('');
  if (initialPageFromQuery && pages.includes(initialPageFromQuery)) currentPage = initialPageFromQuery;
  else currentPage = pages.includes('koblenz') ? 'koblenz' : pages[0] || 'brand';
  pageSelect.value = currentPage;
}

async function loadContent() {
  setStatus(`Lade Inhalte: ${currentPage} ...`);
  const res = await fetch(`/api/content/${currentPage}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Seite ${currentPage} konnte nicht geladen werden.`);

  currentData = await res.json();
  ensureContentShape();
  ensureLayoutSections();
  ensureSelectedSectionId();
  historyDiffResult = null;
  historyDiffFrom = '';
  historyDiffTo = 'live';
  await loadHistory();
  resetCollapsedState();
  renderStructuredEditor();
  updateJsonEditor();
  refreshPreviewUrl();
  setStatus(`Inhalte geladen: ${currentPage}`);
}

async function saveContent() {
  if (saveBtn.disabled) return;
  try {
    saveBtn.disabled = true;
    saveBtn.classList.add('saving');
    saveBtn.textContent = 'Speichert...';

    if (mode === 'json') currentData = JSON.parse(jsonEditor.value);
    ensureContentShape();
    ensureLayoutSections();
    ensureSelectedSectionId();

    setStatus(`Speichere ${currentPage} ...`);
    const res = await fetch(`/api/content/${currentPage}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Speichern fehlgeschlagen');
    }

    const verifyRes = await fetch(`/api/content/${currentPage}`, { cache: 'no-store' });
    if (!verifyRes.ok) throw new Error('Konnte gespeicherte Daten nicht erneut laden.');
    currentData = await verifyRes.json();
    ensureContentShape();
    ensureLayoutSections();
    ensureSelectedSectionId();
    await loadHistory();
    renderStructuredEditor();
    updateJsonEditor();
    sendPreviewData();
    sendSelectedSection();

    saveBtn.classList.remove('saving');
    saveBtn.classList.add('saved');
    saveBtn.textContent = 'Gespeichert';
    setStatus(`Gespeichert: ${currentPage}`);
    setTimeout(() => {
      saveBtn.classList.remove('saved');
      saveBtn.textContent = 'Speichern';
      saveBtn.disabled = false;
    }, 900);
  } catch (error) {
    saveBtn.classList.remove('saving', 'saved');
    saveBtn.textContent = 'Speichern';
    saveBtn.disabled = false;
    setStatus(`Fehler: ${error.message}`, true);
  }
}

jsonEditor.addEventListener('input', () => {
  if (jsonTimer) clearTimeout(jsonTimer);
  jsonTimer = setTimeout(() => {
    try {
      currentData = JSON.parse(jsonEditor.value);
      ensureContentShape();
      ensureLayoutSections();
      renderStructuredEditor();
      sendPreviewData();
      sendSelectedSection();
      setStatus(`JSON aktualisiert (${currentPage})`);
    } catch (e) {
      setStatus(`JSON Fehler: ${e.message}`, true);
    }
  }, 300);
});

pageSelect.addEventListener('change', async () => {
  currentPage = pageSelect.value;
  selectedSectionId = 'slider';
  historyDiffResult = null;
  historyDiffFrom = '';
  historyDiffTo = 'live';
  try {
    await loadContent();
  } catch (error) {
    setStatus(`Fehler: ${error.message}`, true);
  }
});

document.getElementById('reload').addEventListener('click', () => {
  loadContent().catch((error) => setStatus(`Fehler: ${error.message}`, true));
});
saveBtn.addEventListener('click', saveContent);

if (previewFrame) {
  previewFrame.addEventListener('load', () => {
    sendPreviewData();
    sendSelectedSection();
  });
}

window.addEventListener('message', (event) => {
  const payload = event.data;
  if (!payload || payload.type !== 'cms-section-selected') return;
  if (!SECTION_LABELS[payload.section]) return;
  const sections = ensureLayoutSections();
  const match = sections.find((s) => s.source === payload.section);
  if (match) selectedSectionId = match.id;
  ensureSelectedSectionId();
  renderStructuredEditor();
  sendSelectedSection();
});

tabStructured.addEventListener('click', () => setMode('structured'));
tabJson.addEventListener('click', () => setMode('json'));

(async function init() {
  try {
    if (hidePreviewInBuilder) {
      if (previewPane) previewPane.style.display = 'none';
      if (layoutMain) layoutMain.style.gridTemplateColumns = '1fr';
    }
    if (panelMode === 'history') {
      if (tabJson) tabJson.style.display = 'none';
      setMode('structured');
    }
    await loadPages();
    await loadContent();
    setMode('structured');
  } catch (error) {
    setStatus(`Fehler: ${error.message}`, true);
  }
})();
