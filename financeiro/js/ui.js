// ============================================
// ui.js — Renderização da interface
// ============================================

/* ---------- CAT SVG (Gato Preto) ---------- */
function catSVG(olhos = 'normal') {
  const eyeMap = {
    normal:   '<circle cx="18" cy="21" r="2.5" fill="#333"/><circle cx="30" cy="21" r="2.5" fill="#333"/><circle cx="19" cy="20.5" r="1" fill="#7aabff"/><circle cx="31" cy="20.5" r="1" fill="#7aabff"/>',
    feliz:    '<path d="M16,21 Q18,19 20,21" stroke="#333" stroke-width="1.5" fill="none"/><path d="M28,21 Q30,19 32,21" stroke="#333" stroke-width="1.5" fill="none"/>',
    alerta:   '<ellipse cx="18" cy="21" rx="2" ry="3" fill="#f5c542"/><ellipse cx="30" cy="21" rx="2" ry="3" fill="#f5c542"/>',
    bravo:    '<ellipse cx="18" cy="21" rx="3" ry="2" fill="#f55c5c"/><ellipse cx="30" cy="21" rx="3" ry="2" fill="#f55c5c"/><line x1="15" y1="18" x2="21" y2="20" stroke="#f55c5c" stroke-width="1.5"/><line x1="27" y1="20" x2="33" y2="18" stroke="#f55c5c" stroke-width="1.5"/>',
    pensando: '<circle cx="18" cy="21" r="2.5" fill="#333"/><circle cx="30" cy="21" r="2.5" fill="#333"/><circle cx="28" cy="19" r="1.2" fill="#a78bfa"/><circle cx="31" cy="17.5" r="0.8" fill="#a78bfa"/>',
  };

  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <!-- Orelhas -->
    <polygon points="8,20 14,4 20,18" fill="#1a1a2e"/>
    <polygon points="28,18 34,4 40,20" fill="#1a1a2e"/>
    <polygon points="9,19 13,7 18,18" fill="#2d2d4d"/>
    <polygon points="30,18 35,7 39,19" fill="#2d2d4d"/>
    <!-- Cabeça -->
    <ellipse cx="24" cy="26" rx="16" ry="15" fill="#1a1a2e"/>
    <!-- Manchas -->
    <ellipse cx="24" cy="29" rx="9" ry="7" fill="#222240"/>
    <!-- Olhos -->
    ${eyeMap[olhos] || eyeMap.normal}
    <!-- Nariz -->
    <ellipse cx="24" cy="28" rx="1.5" ry="1" fill="#f472b6"/>
    <!-- Boca -->
    <path d="M21,30 Q24,33 27,30" stroke="#555" stroke-width="1.2" fill="none"/>
    <!-- Bigodes E -->
    <line x1="4" y1="27" x2="15" y2="27" stroke="#aaa" stroke-width="0.8" opacity="0.6"/>
    <line x1="5" y1="30" x2="15" y2="29" stroke="#aaa" stroke-width="0.8" opacity="0.6"/>
    <!-- Bigodes D -->
    <line x1="33" y1="27" x2="44" y2="27" stroke="#aaa" stroke-width="0.8" opacity="0.6"/>
    <line x1="33" y1="29" x2="43" y2="30" stroke="#aaa" stroke-width="0.8" opacity="0.6"/>
    <!-- Pontinhos brilhantes -->
    <circle cx="16" cy="19.5" r="0.8" fill="rgba(122,171,255,0.7)"/>
    <circle cx="28" cy="19.5" r="0.8" fill="rgba(122,171,255,0.7)"/>
  </svg>`;
}

function renderCats() {
  const ids = ['cat-modal', 'cat-logo', 'cat-sidebar'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = catSVG('normal');
  });
}

function updateCatMood() {
  const catEl = document.getElementById('cat-sidebar');
  const speechEl = document.getElementById('cat-fala');
  if (!catEl || !speechEl) return;

  const dia = getDiaMes();
  const total = getTotalGasto();
  const renda = state.renda;
  const saldo = getSaldoDisponivel();
  const percGasto = renda > 0 ? total / renda : 0;

  // Verificar se alguma categoria estourou
  const catEmPerigo = state.categorias.find(c => getStatusCat(c) === 'perigo');
  const catEmAlerta = state.categorias.find(c => getStatusCat(c) === 'alerta');

  let olhos = 'normal';
  let fala = '';

  if (renda === 0) {
    olhos = 'pensando';
    fala = 'Configure sua renda primeiro para eu poder te ajudar! 🐾';
  } else if (catEmPerigo) {
    olhos = 'bravo';
    fala = `Ei! Você estourou o limite de "${catEmPerigo.nome}"! 🚨 Hora de controlar os gastos!`;
  } else if (catEmAlerta) {
    olhos = 'alerta';
    fala = `Atenção! "${catEmAlerta.nome}" está quase no limite (80%+). Vai com calma! ⚠️`;
  } else if (percGasto < 0.3 && dia <= 10) {
    olhos = 'feliz';
    fala = `Início de mês e tudo dentro do orçamento. Tá ótimo, pode relaxar! 😸`;
  } else if (percGasto < 0.5) {
    olhos = 'feliz';
    fala = `Tudo sob controle! Você ainda tem ${fmt(saldo)} disponível este mês. 💙`;
  } else if (percGasto < 0.8) {
    olhos = 'normal';
    fala = `Já gastou ${Math.round(percGasto * 100)}% da renda. Fique de olho nos próximos gastos!`;
  } else if (percGasto < 1.0) {
    olhos = 'alerta';
    fala = `Quase no limite! Só ${fmt(saldo)} restando. Evite gastos desnecessários! ⚠️`;
  } else {
    olhos = 'bravo';
    fala = `ESTOUROU o orçamento do mês! Está ${fmt(Math.abs(saldo))} acima do limite! 😾`;
  }

  catEl.innerHTML = catSVG(olhos);
  speechEl.textContent = fala;
}

/* ---------- CARDS DAS CATEGORIAS ---------- */
function renderCards() {
  const container = document.getElementById('cards-categorias');
  if (!container) return;
  container.innerHTML = '';

  state.categorias.forEach(cat => {
    const gasto = getGastosCat(cat.id);
    const limite = getLimite(cat);
    const status = getStatusCat(cat);
    const perc = limite > 0 ? Math.min((gasto / limite) * 100, 100) : 0;

    const card = document.createElement('div');
    card.className = `cat-card ${status}`;
    card.innerHTML = `
      <span class="card-perc-tag">${cat.perc}% da renda</span>
      <div class="card-icon">${cat.icon}</div>
      <div class="card-nome">${cat.nome}</div>
      <div class="card-gasto">${fmt(gasto)}</div>
      <div class="card-limite">Limite: ${fmt(limite)}</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${perc}%"></div>
      </div>
    `;
    container.appendChild(card);
  });
}

/* ---------- LISTA DE GASTOS ---------- */
function renderTabela() {
  const tbody = document.getElementById('tabela-gastos');
  const vazio = document.getElementById('tabela-vazia');
  if (!tbody) return;

  tbody.innerHTML = '';
  const gastos = [...state.gastos].reverse();

  if (gastos.length === 0) {
    vazio?.classList.remove('hidden');
    return;
  }
  vazio?.classList.add('hidden');

  gastos.forEach(g => {
    const cat = state.categorias.find(c => c.id === g.catId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${g.data}</td>
      <td>${g.desc}</td>
      <td><span class="td-cat">${cat ? cat.icon + ' ' + cat.nome : '?'}</span></td>
      <td class="td-valor">- ${fmt(g.valor)}</td>
      <td><button class="btn-remove-gasto" onclick="removerGasto('${g.id}')">✕</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderUltimosGastos() {
  const el = document.getElementById('ultimos-gastos');
  if (!el) return;
  const gastos = [...state.gastos].reverse().slice(0, 5);

  if (gastos.length === 0) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:.82rem;text-align:center;padding:20px">Nenhum gasto ainda</p>';
    return;
  }

  el.innerHTML = gastos.map(g => {
    const cat = state.categorias.find(c => c.id === g.catId);
    return `
      <div class="gasto-mini-item">
        <div>
          <div class="gasto-mini-desc">${g.desc}</div>
          <div class="gasto-mini-cat">${cat ? cat.icon + ' ' + cat.nome : ''}</div>
        </div>
        <div class="gasto-mini-val">- ${fmt(g.valor)}</div>
      </div>
    `;
  }).join('');
}

/* ---------- SELECT DE CATEGORIAS ---------- */
function populateSelectCat() {
  const sel = document.getElementById('gasto-cat');
  if (!sel) return;
  sel.innerHTML = state.categorias.map(c =>
    `<option value="${c.id}">${c.icon} ${c.nome}</option>`
  ).join('');
}

/* ---------- CONFIG CATEGORIAS ---------- */
function renderConfigCats() {
  const container = document.getElementById('config-cats');
  if (!container) return;

  container.innerHTML = state.categorias.map((cat, i) => `
    <div class="cat-row">
      <input type="text" value="${cat.nome}" oninput="updateCatConfig(${i},'nome',this.value)" placeholder="Nome..." />
      <input class="perc-input" type="number" value="${cat.perc}" oninput="updateCatConfig(${i},'perc',+this.value)" min="0" max="100" placeholder="%" />
      <button class="btn-remove" onclick="removeCatConfig(${i})">✕</button>
    </div>
  `).join('');
  atualizarPercConfig();
}

function renderSetupCats() {
  const container = document.getElementById('lista-categorias');
  if (!container) return;
  container.innerHTML = state.categorias.map((cat, i) => `
    <div class="cat-row">
      <input type="text" value="${cat.nome}" oninput="updateCatSetup(${i},'nome',this.value)" placeholder="Nome..." />
      <input class="perc-input" type="number" value="${cat.perc}" oninput="updateCatSetup(${i},'perc',+this.value)" min="0" max="100" placeholder="%" />
      <button class="btn-remove" onclick="removeCatSetup(${i})">✕</button>
    </div>
  `).join('');
  atualizarPercSetup();
}

function updateCatSetup(i, campo, val) {
  state.categorias[i][campo] = campo === 'perc' ? Number(val) : val;
  atualizarPercSetup();
}

function removeCatSetup(i) {
  state.categorias.splice(i, 1);
  renderSetupCats();
}

function atualizarPercSetup() {
  const total = state.categorias.reduce((a, c) => a + (c.perc || 0), 0);
  const el = document.getElementById('perc-total-span');
  const av = document.getElementById('perc-aviso');
  if (el) el.textContent = total;
  if (av) {
    if (total < 100) { av.textContent = `(faltam ${100 - total}%)`; av.style.color = 'var(--yellow)'; }
    else if (total > 100) { av.textContent = `(${total - 100}% a mais!)`; av.style.color = 'var(--red)'; }
    else { av.textContent = '✓ perfeito!'; av.style.color = 'var(--green)'; }
  }
}

function updateCatConfig(i, campo, val) {
  state.categorias[i][campo] = campo === 'perc' ? Number(val) : val;
  atualizarPercConfig();
}

function removeCatConfig(i) {
  state.categorias.splice(i, 1);
  renderConfigCats();
}

function atualizarPercConfig() {
  const total = state.categorias.reduce((a, c) => a + (c.perc || 0), 0);
  const el = document.getElementById('perc-total-config');
  const av = document.getElementById('perc-aviso-config');
  if (el) el.textContent = total;
  if (av) {
    if (total < 100) { av.textContent = `(faltam ${100 - total}%)`; av.style.color = 'var(--yellow)'; }
    else if (total > 100) { av.textContent = `(${total - 100}% a mais!)`; av.style.color = 'var(--red)'; }
    else { av.textContent = '✓'; av.style.color = 'var(--green)'; }
  }
}

/* ---------- HEADER / BADGES ---------- */
function renderHeader() {
  const badge = document.getElementById('badge-renda');
  const mesLabel = document.getElementById('mes-label');
  const resumo = document.getElementById('resumo-header');
  if (badge) badge.textContent = fmt(state.renda);
  if (mesLabel) mesLabel.textContent = capitalize(getMesNome());
  if (resumo) {
    const saldo = getSaldoDisponivel();
    const s = saldo >= 0 ? `Saldo disponível: ${fmt(saldo)}` : `⚠️ Orçamento estourado em ${fmt(Math.abs(saldo))}`;
    resumo.textContent = s;
    resumo.style.color = saldo >= 0 ? 'var(--text-secondary)' : 'var(--red)';
  }
}

/* ---------- ALERTA ---------- */
function mostrarAlerta(msg, tipo = 'alerta') {
  const el = document.createElement('div');
  el.className = `alert-banner ${tipo}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

/* ---------- NAVEGAÇÃO ---------- */
function showView(nome) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const view = document.getElementById(`view-${nome}`);
  const btn = document.querySelector(`[data-view="${nome}"]`);
  if (view) view.classList.add('active');
  if (btn) btn.classList.add('active');

  if (nome === 'config') {
    const inp = document.getElementById('config-renda');
    if (inp) inp.value = state.renda;
    renderConfigCats();
  }
}

/* ---------- UTILS ---------- */
function fmt(val) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
