// ============================================
// ui.js — Renderização da interface
// ============================================

/* ---------- TEMA ---------- */
function aplicarTema(tema) {
  document.documentElement.setAttribute('data-theme', tema);
  const btn = document.getElementById('btn-tema');
  if (btn) btn.textContent = tema === 'dark' ? '☀️' : '🌙';
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
      <span class="card-perc-tag">${cat.perc}%</span>
      <div class="card-icon">${cat.icon}</div>
      <div class="card-nome">${cat.nome}</div>
      <div class="card-gasto">${fmt(gasto)}</div>
      <div class="card-limite">de ${fmt(limite)}</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${perc}%"></div></div>
    `;
    container.appendChild(card);
  });
}

/* ---------- TABELA DE GASTOS ---------- */
function renderTabela() {
  const tbody = document.getElementById('tabela-gastos');
  const vazio = document.getElementById('tabela-vazia');
  if (!tbody) return;
  tbody.innerHTML = '';
  const gastos = [...state.gastos].reverse();
  if (gastos.length === 0) { vazio?.classList.remove('hidden'); return; }
  vazio?.classList.add('hidden');
  gastos.forEach(g => {
    const cat = state.categorias.find(c => c.id === g.catId);
    const tipoTag = g.tipo === 'fixo' ? '<span class="tipo-tag fixo">fixo</span>'
                  : g.tipo === 'parcela' ? '<span class="tipo-tag parcela">parcela</span>'
                  : '';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${g.data}</td>
      <td>${g.desc}</td>
      <td><span class="td-cat">${cat ? cat.icon+' '+cat.nome : '?'}</span></td>
      <td>${tipoTag}</td>
      <td class="td-valor">- ${fmt(g.valor)}</td>
      <td>${g.tipo ? '' : `<button class="btn-remove-gasto" onclick="removerGasto('${g.id}')">✕</button>`}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ---------- ÚLTIMOS GASTOS MINI ---------- */
function renderUltimosGastos() {
  const el = document.getElementById('ultimos-gastos');
  if (!el) return;
  const gastos = [...state.gastos].reverse().slice(0, 6);
  if (gastos.length === 0) {
    el.innerHTML = '<p class="empty-msg">Nenhum gasto ainda 😺</p>';
    return;
  }
  el.innerHTML = gastos.map(g => {
    const cat = state.categorias.find(c => c.id === g.catId);
    return `<div class="gasto-mini-item">
      <div>
        <div class="gasto-mini-desc">${g.desc}</div>
        <div class="gasto-mini-cat">${cat ? cat.icon+' '+cat.nome : ''}</div>
      </div>
      <div class="gasto-mini-val">- ${fmt(g.valor)}</div>
    </div>`;
  }).join('');
}

/* ---------- LISTA DE FIXOS ---------- */
function renderListaFixos() {
  const el = document.getElementById('lista-fixos');
  if (!el) return;
  const ativos = state.fixos.filter(f => f.ativa !== false);
  if (ativos.length === 0) {
    el.innerHTML = '<p class="empty-msg">Nenhum gasto recorrente cadastrado ainda 📌</p>';
    return;
  }
  el.innerHTML = ativos.map(f => {
    const cat = state.categorias.find(c => c.id === f.catId);
    const info = f.tipo === 'parcela'
      ? `${f.parcelasRestantes}/${f.totalParcelas} parcelas restantes`
      : 'Gasto fixo mensal';
    return `<div class="fixo-item">
      <div class="fixo-icon">${cat?.icon || '📌'}</div>
      <div class="fixo-info">
        <div class="fixo-nome">${f.desc}</div>
        <div class="fixo-meta">${cat?.nome || ''} · ${info}</div>
      </div>
      <div class="fixo-valor">${fmt(f.valor)}/mês</div>
      <button class="btn-remove-gasto" onclick="removerFixo('${f.id}')">✕</button>
    </div>`;
  }).join('');
}

/* ---------- SELECT CAT ---------- */
function populateSelectCat() {
  ['gasto-cat', 'fixo-cat'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = state.categorias.map(c =>
      `<option value="${c.id}">${c.icon} ${c.nome}</option>`
    ).join('');
  });
}

/* ---------- CONFIG CATS ---------- */
function renderConfigCats() {
  const container = document.getElementById('config-cats');
  if (!container) return;
  container.innerHTML = state.categorias.map((cat, i) => `
    <div class="cat-row">
      <input type="text" value="${cat.nome}" oninput="updateCatConfig(${i},'nome',this.value)" placeholder="Nome..."/>
      <input class="perc-input" type="number" value="${cat.perc}" oninput="updateCatConfig(${i},'perc',+this.value)" min="0" max="100" placeholder="%"/>
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
      <input type="text" value="${cat.nome}" oninput="updateCatSetup(${i},'nome',this.value)" placeholder="Nome..."/>
      <input class="perc-input" type="number" value="${cat.perc}" oninput="updateCatSetup(${i},'perc',+this.value)" min="0" max="100" placeholder="%"/>
      <button class="btn-remove" onclick="removeCatSetup(${i})">✕</button>
    </div>
  `).join('');
  atualizarPercSetup();
}

function updateCatSetup(i, campo, val) {
  state.categorias[i][campo] = campo === 'perc' ? Number(val) : val;
  atualizarPercSetup();
}
function removeCatSetup(i) { state.categorias.splice(i, 1); renderSetupCats(); }
function atualizarPercSetup() {
  const total = state.categorias.reduce((a, c) => a + (c.perc||0), 0);
  const el = document.getElementById('perc-total-span');
  const av = document.getElementById('perc-aviso');
  if (el) el.textContent = total;
  if (av) {
    if (total < 100) { av.textContent=`(faltam ${100-total}%)`; av.style.color='var(--yellow)'; }
    else if (total > 100) { av.textContent=`(${total-100}% a mais!)`; av.style.color='var(--red)'; }
    else { av.textContent='✓ perfeito!'; av.style.color='var(--green)'; }
  }
}
function updateCatConfig(i, campo, val) {
  state.categorias[i][campo] = campo === 'perc' ? Number(val) : val;
  atualizarPercConfig();
}
function removeCatConfig(i) { state.categorias.splice(i, 1); renderConfigCats(); }
function atualizarPercConfig() {
  const total = state.categorias.reduce((a, c) => a + (c.perc||0), 0);
  const el = document.getElementById('perc-total-config');
  const av = document.getElementById('perc-aviso-config');
  if (el) el.textContent = total;
  if (av) {
    if (total < 100) { av.textContent=`(faltam ${100-total}%)`; av.style.color='var(--yellow)'; }
    else if (total > 100) { av.textContent=`(${total-100}% a mais!)`; av.style.color='var(--red)'; }
    else { av.textContent='✓'; av.style.color='var(--green)'; }
  }
}

/* ---------- HEADER ---------- */
function renderHeader() {
  const badge = document.getElementById('badge-renda');
  const mesLabel = document.getElementById('mes-label');
  const resumo = document.getElementById('resumo-header');
  if (badge) badge.textContent = fmt(state.renda);
  if (mesLabel) mesLabel.textContent = capitalize(getMesNome());
  if (resumo) {
    const saldo = getSaldoDisponivel();
    resumo.textContent = saldo >= 0
      ? `Saldo disponível: ${fmt(saldo)}`
      : `⚠️ Orçamento estourado em ${fmt(Math.abs(saldo))}`;
    resumo.style.color = saldo >= 0 ? 'var(--text-secondary)' : 'var(--red)';
  }
}

/* ---------- GATO HUMOR ---------- */
function updateCatMood() {
  const speechEl = document.getElementById('cat-fala');
  if (!speechEl) return;

  const dia = getDiaMes();
  const percGasto = state.renda > 0 ? getTotalGasto() / state.renda : 0;
  const saldo = getSaldoDisponivel();
  const catEmPerigo = state.categorias.find(c => getStatusCat(c) === 'perigo');
  const catEmAlerta = state.categorias.find(c => getStatusCat(c) === 'alerta');

  let mood = 'ok';
  let fala = '';

  if (state.renda === 0) {
    mood = 'ok';
    fala = 'Configure sua renda para eu poder te ajudar! 🐾';
  } else if (percGasto >= 1 || catEmPerigo) {
    mood = 'bravo';
    fala = catEmPerigo
      ? `Estourou "${catEmPerigo.nome}"! Segura as garras! 😾`
      : `Orçamento estourado em ${fmt(Math.abs(saldo))}! Miau de reprovação! 😾`;
  } else if (catEmAlerta || percGasto >= 0.8) {
    mood = 'alerta';
    fala = catEmAlerta
      ? `"${catEmAlerta.nome}" está quase no limite. Cuidado! ⚠️`
      : `Já foi ${Math.round(percGasto*100)}% da renda. Vai com calma!`;
  } else if (percGasto < 0.4) {
    mood = 'feliz';
    fala = dia <= 10
      ? `Início de mês perfeito! ${fmt(saldo)} disponível. Tô orgulhoso! 😸`
      : `Ainda muito bem! ${fmt(saldo)} sobrando. Continue assim! 😸`;
  } else {
    mood = 'ok';
    fala = `Tudo sob controle. Sobra ${fmt(saldo)} este mês.`;
  }

  speechEl.textContent = fala;

  // Atualizar SVG em todos os pontos de humor
  if (window.setCatMood) window.setCatMood(mood);

  // Atualizar cor do card de status
  const card = document.querySelector('.cat-status-card');
  if (card) {
    card.dataset.mood = mood;
  }
}

/* ---------- HISTÓRICO ---------- */
function renderHistorico() {
  const container = document.getElementById('historico-container');
  if (!container) return;
  if (state.historico.length === 0) {
    container.innerHTML = `<div class="historico-vazio">
      <div class="fincat-mood hist-vazio-cat" style="opacity:.35"></div>
      <p>Nenhum mês encerrado ainda.<br>Feche o mês atual para ver o histórico aqui! 🐾</p>
    </div>`;
    // injetar svg
    const hvc = container.querySelector('.hist-vazio-cat');
    if (hvc && window.CatSVG) hvc.innerHTML = window.CatSVG.ok;
    return;
  }
  const meses = [...state.historico].reverse();
  container.innerHTML = meses.map(m => {
    const saldo = m.renda - m.totalGasto;
    const okClass = saldo >= 0 ? 'azul' : 'vermelho';
    const emoji = saldo >= 0 ? '😸' : '😿';
    const totalFixo = (m.gastos || []).filter(g => g.tipo === 'fixo' || g.tipo === 'parcela').reduce((a,g)=>a+g.valor,0);
    const totalLivre = (m.gastos || []).filter(g => !g.tipo).reduce((a,g)=>a+g.valor,0);
    return `<div class="historico-card ${okClass}">
      <div class="hist-header">
        <div class="hist-mes">${capitalize(getMesNome(m.mesKey))}</div>
        <div class="hist-emoji">${emoji}</div>
        <div class="hist-saldo ${okClass}">${saldo >= 0 ? '+' : ''}${fmt(saldo)}</div>
      </div>
      <div class="hist-stats">
        <div class="hist-stat"><span class="hs-label">Renda</span><span class="hs-val">${fmt(m.renda)}</span></div>
        <div class="hist-stat"><span class="hs-label">Total gasto</span><span class="hs-val red">${fmt(m.totalGasto)}</span></div>
        <div class="hist-stat"><span class="hs-label">Fixos/Parcelas</span><span class="hs-val">${fmt(totalFixo)}</span></div>
        <div class="hist-stat"><span class="hs-label">Gastos livres</span><span class="hs-val">${fmt(totalLivre)}</span></div>
      </div>
      <div class="hist-cats">
        ${(m.categorias || []).map(cat => {
          const gasto = (m.gastos||[]).filter(g=>g.catId===cat.id).reduce((a,g)=>a+g.valor,0);
          const limite = (m.renda * cat.perc) / 100;
          const pct = limite > 0 ? Math.min(gasto/limite*100,100) : 0;
          const st = gasto >= limite*1 ? 'perigo' : gasto >= limite*0.8 ? 'alerta' : 'ok';
          return `<div class="hist-cat-row">
            <span>${cat.icon} ${cat.nome}</span>
            <div class="hist-mini-bar"><div class="hist-mini-fill ${st}" style="width:${pct}%"></div></div>
            <span class="hist-cat-val">${fmt(gasto)} / ${fmt(limite)}</span>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
}

/* ---------- MODAL FECHAMENTO ---------- */
function abrirModalFechamento() {
  const modal = document.getElementById('modal-fechamento');
  const badge = document.getElementById('fechamento-badge');
  const titulo = document.getElementById('fechamento-titulo');
  const subtit = document.getElementById('fechamento-subtitulo');
  const stats  = document.getElementById('fechamento-stats');
  const cats   = document.getElementById('fechamento-cats');

  const saldo = getSaldoDisponivel();
  const totalG = getTotalGasto();
  const ok = saldo >= 0;

  badge.textContent = ok ? '✅ Mês no azul!' : '❌ Mês estourado';
  badge.className = 'fechamento-badge ' + (ok ? 'ok' : 'bad');
  titulo.textContent = `Resumo: ${capitalize(getMesNome())}`;
  subtit.textContent = ok
    ? `Parabéns! Você economizou ${fmt(saldo)} este mês. 😸`
    : `Você gastou ${fmt(Math.abs(saldo))} a mais do que recebeu. 😾`;

  stats.innerHTML = `
    <div class="fech-stat"><span>💰 Renda</span><strong>${fmt(state.renda)}</strong></div>
    <div class="fech-stat"><span>💸 Total gasto</span><strong class="red">${fmt(totalG)}</strong></div>
    <div class="fech-stat"><span>${ok?'🟢':'🔴'} Saldo final</span><strong class="${ok?'green':'red'}">${fmt(saldo)}</strong></div>
  `;

  cats.innerHTML = state.categorias.map(cat => {
    const gasto = getGastosCat(cat.id);
    const limite = getLimite(cat);
    const st = getStatusCat(cat);
    const icon = st==='ok'?'✅':st==='alerta'?'⚠️':'❌';
    return `<div class="fech-cat">
      <span>${cat.icon} ${cat.nome}</span>
      <span>${icon} ${fmt(gasto)} / ${fmt(limite)}</span>
    </div>`;
  }).join('');

  modal.classList.remove('hidden');
}

/* ---------- ALERTA ---------- */
function mostrarAlerta(msg, tipo = 'ok') {
  const el = document.createElement('div');
  el.className = `alert-banner ${tipo}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* ---------- NAVEGAÇÃO ---------- */
function showView(nome) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const view = document.getElementById(`view-${nome}`);
  const btn  = document.querySelector(`[data-view="${nome}"]`);
  if (view) view.classList.add('active');
  if (btn)  btn.classList.add('active');
  if (nome === 'config') {
    const inp = document.getElementById('config-renda');
    if (inp) inp.value = state.renda;
    renderConfigCats();
  }
  if (nome === 'historico') renderHistorico();
  if (nome === 'fixos') { renderListaFixos(); populateSelectCat(); }
}
