function byId(id) {
  return document.getElementById(id);
}

async function loadBrand() {
  const res = await fetch('/api/content/brand');
  if (!res.ok) throw new Error('Brand content not found');
  const data = await res.json();

  document.title = data.title || 'Bohnigen | Standorte';
  byId('brand-logo').textContent = data.logoText || 'BOHNIGEN';
  byId('brand-subtitle').textContent = data.subtitle || '';

  byId('brand-links').innerHTML = (data.links || []).map((item) => `
    <a href="${item.href}" class="group block bg-white/5 border border-white/10 p-8 hover:border-[#ff3e00] transition-colors">
      <div class="text-xs uppercase tracking-[0.28em] text-zinc-500 mb-3">Standort</div>
      <div class="font-display text-4xl md:text-5xl font-black uppercase tracking-tight group-hover:text-[#ff3e00] transition-colors">${item.label}</div>
    </a>
  `).join('');
}

loadBrand().catch((error) => {
  console.error(error);
});
