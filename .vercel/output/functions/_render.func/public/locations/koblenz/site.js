(function () {
  const NAV = [
    { label: 'Übersicht', href: '/locations/koblenz' },
    { label: 'Bowling', href: '/locations/koblenz/bowling' },
    { label: 'Restaurant & Bar', href: '/locations/koblenz/restaurant_bar' },
    { label: 'Arcade', href: '/locations/koblenz/arcade' },
    { label: 'Billard & Dart', href: '/locations/koblenz/billard_dart' },
    { label: 'Kindergeburtstag', href: '/locations/koblenz/kindergeburtstag' },
    { label: 'Firmenfeier', href: '/locations/koblenz/firmenfeier' },
    { label: 'Junggesellenabschied', href: '/locations/koblenz/junggesellenabschied' },
    { label: 'Schulklassen', href: '/locations/koblenz/schulklassen' },
    { label: 'Teens-Birthday', href: '/locations/koblenz/teens-birthday' },
    { label: 'Party Pakete', href: '/locations/koblenz/party_pakete' },
    { label: 'Events', href: '/locations/koblenz/events' },
    { label: 'Zeiten & Preise', href: '/locations/koblenz/offnungszeiten-preise' },
    { label: 'Standort & Kontakt', href: '/locations/koblenz/standort-kontakt' },
    { label: 'Reservieren', href: '/locations/koblenz/reservieren' }
  ];

  function detectSlug() {
    const p = location.pathname.replace(/\/+$/, '');
    const m = p.match(/\/locations\/koblenz(?:\/(.+))?$/);
    if (!m || !m[1]) return 'home';
    return m[1];
  }

  function esc(text) {
    return String(text || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  function renderSection(section) {
    const cards = Array.isArray(section.cards)
      ? `<div class="grid">${section.cards.map((c) => `
        <article class="card">
          <div>
            <h3>${esc(c.title)}</h3>
            <p>${esc(c.text)}</p>
          </div>
          ${c.badge ? `<span class="badge">${esc(c.badge)}</span>` : ''}
        </article>
      `).join('')}</div>`
      : '';

    const table = Array.isArray(section.table)
      ? `<div class="table">
          <div class="row header"><span>Tag / Tarif</span><span>Zeit</span><span>Preis</span></div>
          ${section.table.map((r) => `<div class="row"><span>${esc(r[0])}</span><span>${esc(r[1])}</span><span>${esc(r[2])}</span></div>`).join('')}
        </div>`
      : '';

    const list = Array.isArray(section.list)
      ? `<ul class="list">${section.list.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`
      : '';

    return `
      <section class="section">
        <div class="container">
          ${section.kicker ? `<div class="kicker">${esc(section.kicker)}</div>` : ''}
          <h2 class="font-display">${esc(section.title)}</h2>
          ${section.lead ? `<p class="lead">${esc(section.lead)}</p>` : ''}
          ${cards}
          ${table}
          ${list}
        </div>
      </section>
    `;
  }

  function renderEventSlider(events) {
    if (!Array.isArray(events) || events.length === 0) return '';

    const slides = events.map((e) => `
      <article class="event-slide">
        <div class="image" style="background-image:url('${e.image || ''}')"></div>
        <div class="content">
          <div class="event-date">${esc(e.date || '')}</div>
          <h3 class="event-title">${esc(e.title || '')}</h3>
          <p class="event-text">${esc(e.text || '')}</p>
          ${e.ctaLabel ? `<div><a class="cta" href="${e.ctaHref || '#'}">${esc(e.ctaLabel)}</a></div>` : ''}
        </div>
      </article>
    `).join('');

    const dots = events.map((_, i) => `<button class="slider-dot ${i === 0 ? 'active' : ''}" data-slide-dot="${i}" aria-label="Slide ${i + 1}"></button>`).join('');

    return `
      <section class="event-slider">
        <div class="container">
          <div class="head">
            <div>
              <div class="kicker">Events Highlights</div>
              <h2 class="font-display">Kommende Event Deals</h2>
            </div>
          </div>
          <div class="track-wrap">
            <div class="track" data-slider-track>${slides}</div>
          </div>
          <div class="slider-controls">
            <div class="slider-buttons">
              <button class="slider-btn" type="button" data-slide-prev aria-label="Vorheriger Slide">‹</button>
              <button class="slider-btn" type="button" data-slide-next aria-label="Nächster Slide">›</button>
            </div>
            <div class="slider-dots">${dots}</div>
          </div>
        </div>
      </section>
    `;
  }

  function initSlider() {
    const track = document.querySelector('[data-slider-track]');
    if (!track) return;

    const slides = Array.from(track.children);
    const prev = document.querySelector('[data-slide-prev]');
    const next = document.querySelector('[data-slide-next]');
    const dots = Array.from(document.querySelectorAll('[data-slide-dot]'));
    if (slides.length <= 1) return;

    let index = 0;
    let timer = null;

    function setSlide(newIndex) {
      index = (newIndex + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
    }

    function restartAuto() {
      if (timer) clearInterval(timer);
      timer = setInterval(() => setSlide(index + 1), 6500);
    }

    prev.addEventListener('click', () => {
      setSlide(index - 1);
      restartAuto();
    });
    next.addEventListener('click', () => {
      setSlide(index + 1);
      restartAuto();
    });
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        setSlide(Number(dot.dataset.slideDot));
        restartAuto();
      });
    });

    setSlide(0);
    restartAuto();
  }

  function renderPage(page, slug) {
    document.title = `${page.title} | Bowlingroom Koblenz`;

    const navLinks = NAV.map((n) => `<a class="${n.href.endsWith('/' + slug) || (slug === 'home' && n.href === '/locations/koblenz') ? 'active' : ''}" href="${n.href}">${n.label}</a>`).join('');

    const quickLinks = NAV.filter((n) => n.href !== '/locations/koblenz').map((n) => {
      const active = (n.href.endsWith('/' + slug));
      return `<li><a class="${active ? 'active' : ''}" href="${n.href}">${n.label}</a></li>`;
    }).join('');

    const ctas = Array.isArray(page.ctas)
      ? `<div class="cta-row">${page.ctas.map((c, i) => i === 0
        ? `<a class="cta" href="${c.href}">${esc(c.label)}</a>`
        : `<a class="ghost" href="${c.href}">${esc(c.label)}</a>`).join('')}</div>`
      : '';

    const html = `
      <link rel="preconnect" href="https://api.fontshare.com">
      <link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,900&f[]=satoshi@400,500,700&display=swap" rel="stylesheet">
      <nav class="nav">
        <div class="container nav-inner">
          <a href="/" class="brand font-display">BOWLING<span>ROOM</span></a>
          <div class="nav-links">${navLinks}</div>
          <a class="cta" href="/locations/koblenz/reservieren">Jetzt reservieren</a>
        </div>
      </nav>
      <header class="hero">
        <div class="hero-bg" style="background-image:url('${page.heroImage || ''}')"></div>
        <div class="container hero-content">
          <div class="breadcrumb">Startseite / Koblenz / ${esc(page.title)}</div>
          <div class="kicker">${esc(page.kicker || 'Koblenz')}</div>
          <h1 class="font-display">${esc(page.title)}</h1>
          <p class="subtitle">${esc(page.subtitle || '')}</p>
          ${ctas}
        </div>
      </header>
      ${slug === 'home' ? renderEventSlider(page.eventHighlights) : ''}
      <div class="quick-links"><div class="container"><ul>${quickLinks}</ul></div></div>
      ${Array.isArray(page.sections) ? page.sections.map(renderSection).join('') : ''}
      <footer class="footer">
        <div class="container">© 2026 Bowlingroom Koblenz · Neuer CI Relaunch auf Basis der bisherigen Koblenz-Inhalte</div>
      </footer>
    `;

    document.getElementById('app').innerHTML = html;
    initSlider();
  }

  const slug = detectSlug();
  const page = (window.KO_PAGES && window.KO_PAGES[slug]) || (window.KO_PAGES && window.KO_PAGES.home);

  if (!page) {
    document.getElementById('app').innerHTML = '<div class="container" style="padding:40px">Seite nicht gefunden.</div>';
    return;
  }

  renderPage(page, slug);
})();
