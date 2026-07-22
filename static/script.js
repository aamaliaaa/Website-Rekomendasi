
// ubah angka jd format mata uang
function formatRupiah(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}
function formatInputRupiah(el) {
  let angka = el.value.replace(/[^0-9]/g, '');
  el.value = angka ? 'Rp ' + parseInt(angka).toLocaleString('id-ID') : '';
}

// tampilan rating jd bintang
function renderStars(rating) {
  let html = '<div class="stars">';
  for (let i = 1; i <= 5; i++) {
    const full = i <= Math.floor(rating);
    const half = !full && i <= rating + 0.5;
    html += `<svg class="star ${full || half ? '' : 'empty'}" viewBox="0 0 20 20"><path d="M10 1l2.39 7.26H19l-5.45 3.97 2.1 7.27L10 15.27l-5.65 4.23 2.1-7.27L1 8.26h6.61z"/></svg>`;
  }
  html += '</div>';
  return html;
}

// filter tipe tempat
function badgeType(type) {
  if (type === 'indoor') return '<span class="card-type-badge badge-indoor">Indoor</span>';
  if (type === 'outdoor') return '<span class="card-type-badge badge-outdoor">Outdoor</span>';
  return '<span class="card-type-badge badge-both">In & Outdoor</span>';
}
// filter fasilitas
function facilityChip(label, has) {
  return `<span class="mini-chip ${has ? 'has' : 'no'}">${label}</span>`;
}

// tampilan UI tempat makan
function renderCard(r) {
  const imgEl = r.image
    ? `<img class="card-img" src="${r.image}" alt="${r.name}" loading="lazy" />`
    : `<div class="card-img-placeholder">${r.emoji}</div>`;
 
  const menuBtn = r.menuLink
    ? `<a class="btn-menu" href="${r.menuLink}" target="_blank" rel="noopener">Lihat Menu ↗</a>`
    : '';
 
  return `
  <div class="card">
    ${imgEl}
    <div class="card-body">
      <div class="card-top">
        <div class="card-name">${r.name}</div>
        ${badgeType(r.type)}
      </div>
      <div class="card-rating">
        ${renderStars(r.rating)}
        <span class="rating-num">${r.rating.toFixed(1)}</span>
      </div>
      <div class="card-price">
         <strong>${formatRupiah(r.priceMin)} – ${formatRupiah(r.priceMax)}</strong> / orang
      </div>
      <div class="card-chips">
        ${facilityChip('Wi-Fi', r.wifi)}
        ${facilityChip('AC', r.ac)}
        ${facilityChip('Musholla', r.musholla)}
        ${facilityChip('Parkir Motor', r.parkirMotor)}
        ${facilityChip('Parkir Mobil', r.parkirMobil)}
      </div>
            <div class="card-time">
        Jam Operasional: ${r.jam}
      </div>
    </div>
    <div class="card-footer">
      <div class="card-address"> ${r.address}</div>
      ${menuBtn}
    </div>
  </div>`;
}

// input harga
function cleanNumber(val) {
  return parseInt(val.replace(/[^0-9]/g, '')) || 0;
}
// ambil nilai filter
function getFilters() {
  return {
    type: document.getElementById('filter-type').value,
    rating: parseFloat(document.getElementById('filter-rating').value) || 0,

    priceMin: cleanNumber(document.getElementById('filter-price-min').value),
    priceMax: cleanNumber(document.getElementById('filter-price-max').value) || 0,

    wifi: document.getElementById('filter-wifi').checked,
    ac: document.getElementById('filter-ac').checked,
    musholla: document.getElementById('filter-musholla').checked,
    parkirMotor: document.getElementById('filter-parkir-motor').checked,
    parkirMobil: document.getElementById('filter-parkir-mobil').checked,
    
    sort: document.getElementById('sort-select').value
  };
}

function applyFilters() {
  const f = getFilters();

  fetch('/recommend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(f)
  })
  .then(res => res.json())
  .then(results => {

    const grid = document.getElementById('cards-grid');
    const countEl = document.getElementById('results-count');
    const tagsEl = document.getElementById('active-filters');

    // jumlah hasil
    countEl.innerHTML = `Menampilkan <strong>${results.length}</strong> tempat makan`;

    // TAG FILTER
    const tags = [];

    if (f.type) tags.push({label: {indoor:'Indoor',outdoor:'Outdoor',both:'In & Outdoor'}[f.type]});
    if (f.rating > 0) tags.push({ label: `${f.rating}+ bintang` });
    if (f.priceMin > 0) tags.push({label: `Min ${formatRupiah(f.priceMin)}`});
    if (f.priceMax > 0) tags.push({label: `Max ${formatRupiah(f.priceMax)}`});
    if (f.wifi) tags.push({label: 'Wi-Fi'});
    if (f.ac) tags.push({label: 'AC'});
    if (f.musholla) tags.push({label: 'Musholla'});
    if (f.parkirMotor) tags.push({label: 'Parkir Motor'});
    if (f.parkirMobil) tags.push({label: 'Parkir Mobil'});

    tagsEl.innerHTML = tags.map(t =>
      `<span class="filter-tag">${t.label}</span>`
    ).join('');

    // tampilkan hasil
    if (results.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>Pencarian Tidak ditemukan</h3>
          <p>Coba ubah filter pencarianmu.</p>
        </div>`;
    } else {
      grid.innerHTML = results.map(r => renderCard(r)).join('');
    }

  })
  .catch(err => console.error('Error:', err));
}

function clearFilter(key) {
  const map = {
    type: () => { document.getElementById('filter-type').value = ''; },
    rating: () => { document.getElementById('filter-rating').value = '0'; },
    priceMin: () => { document.getElementById('filter-price-min').value = ''; },
    priceMax: () => { document.getElementById('filter-price-max').value = ''; },
    wifi: () => { document.getElementById('filter-wifi').checked = false; document.getElementById('chip-wifi').classList.remove('active'); },
    ac: () => { document.getElementById('filter-ac').checked = false; document.getElementById('chip-ac').classList.remove('active'); },
    musholla: () => { document.getElementById('filter-musholla').checked = false; document.getElementById('chip-musholla').classList.remove('active'); },
    parkirMotor: () => { document.getElementById('filter-parkir-motor').checked = false; document.getElementById('chip-parkir-motor').classList.remove('active'); },
    parkirMobil: () => { document.getElementById('filter-parkir-mobil').checked = false; document.getElementById('chip-parkir-mobil').classList.remove('active'); },
  };
  if (map[key]) { map[key](); applyFilters(); }
}
 
function resetFilters() {
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-rating').value = '0';
  document.getElementById('filter-price-min').value = '';
  document.getElementById('filter-price-max').value = '';
  ['wifi','ac','musholla','parkir-motor','parkir-mobil'].forEach(id => {
    document.getElementById('filter-' + id).checked = false;
  });
  ['chip-wifi','chip-ac','chip-musholla','chip-parkir-motor','chip-parkir-mobil'].forEach(id => {
    document.getElementById(id).classList.remove('active');
  });
  applyFilters();
}
 
// Toggle chip active state
['wifi','ac','musholla','parkir-motor','parkir-mobil'].forEach(id => {
  const input = document.getElementById('filter-' + id);
  const chip = document.getElementById('chip-' + id);
  input.addEventListener('change', () => {
    chip.classList.toggle('active', input.checked);
  });
});

document.getElementById('filter-price-min')
  .addEventListener('input', function() {
    formatInputRupiah(this);
  });

document.getElementById('filter-price-max')
  .addEventListener('input', function() {
    formatInputRupiah(this);
  });
document.getElementById('sort-select')
  .addEventListener('change', applyFilters);
  
// Initial state 
resetFilters();