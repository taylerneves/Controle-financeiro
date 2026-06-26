// ============================================
// app.js — Lógica principal
// ============================================

/* ===== SETUP ===== */
document.getElementById('btn-add-cat')?.addEventListener('click', () => {
  state.categorias.push({ id: nextCatId(), nome: '', icon: '📦', perc: 0 });
  renderSetupCats();
});
document.getElementById('btn-add-cat-config')?.addEventListener('click', () => {
  state.categorias.push({ id: nextCatId(), nome: '', icon: '📦', perc: 0 });
  renderConfigCats();
});

document.getElementById('btn-confirmar-setup')?.addEventListener('click', () => {
  const renda = parseFloat(document.getElementById('input-renda')?.value);
  if (!renda || renda <= 0) { mostrarAlerta('Informe sua renda do mês!', 'alerta'); return; }
  const total = state.categorias.reduce((a,c) => a+(c.perc||0), 0);
  if (total !== 100) { mostrarAlerta(`A soma precisa ser 100%. Atual: ${total}%`, 'perigo'); return; }
  if (state.categorias.find(c => !c.nome?.trim())) { mostrarAlerta('Todas as categorias precisam de nome!', 'alerta'); return; }
  state.renda = renda;
  state.setupFeito = true;
  state.mesAtual = getMesAtualKey();
  saveState();
  gerarGastosFixosDoMes();
  iniciarApp();
});

/* ===== NAV ===== */
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

/* ===== TEMA ===== */
document.getElementById('btn-tema')?.addEventListener('click', () => {
  state.tema = state.tema === 'dark' ? 'light' : 'dark';
  aplicarTema(state.tema);
  saveState();
});

/* ===== GASTOS ===== */
function adicionarGasto() {
  const desc  = document.getElementById('gasto-desc')?.value?.trim();
  const valor = parseFloat(document.getElementById('gasto-valor')?.value);
  const catId = parseInt(document.getElementById('gasto-cat')?.value);
  const data  = document.getElementById('gasto-data')?.value;
  if (!desc)  { mostrarAlerta('Informe a descrição!', 'alerta'); return; }
  if (!valor||valor<=0) { mostrarAlerta('Informe o valor!', 'alerta'); return; }
  state.gastos.push({
    id: Date.now().toString(),
    desc, valor, catId,
    data: data
      ? new Date(data+'T12:00:00').toLocaleDateString('pt-BR')
      : new Date().toLocaleDateString('pt-BR'),
  });
  saveState();
  const cat = state.categorias.find(c => c.id === catId);
  if (cat) {
    const st = getStatusCat(cat);
    if (st === 'perigo') mostrarAlerta(`😾 Estourou o limite de "${cat.nome}"!`, 'perigo');
    else if (st === 'alerta') mostrarAlerta(`⚠️ "${cat.nome}" acima de 80%!`, 'alerta');
  }
  document.getElementById('gasto-desc').value = '';
  document.getElementById('gasto-valor').value = '';
  renderTudo();
  mostrarAlerta(`✅ ${fmt(valor)} registrado!`);
}

function removerGasto(id) {
  state.gastos = state.gastos.filter(g => g.id !== id);
  saveState(); renderTudo();
}

function limparGastos() {
  if (!confirm('Apagar APENAS os gastos manuais? (fixos e parcelas são mantidos)')) return;
  state.gastos = state.gastos.filter(g => g.tipo);
  saveState(); renderTudo();
  mostrarAlerta('Gastos manuais removidos.', 'alerta');
}

/* ===== FIXOS ===== */
document.getElementById('fixo-tipo')?.addEventListener('change', function() {
  const pg = document.getElementById('parcelas-grupo');
  pg?.classList.toggle('hidden', this.value !== 'parcela');
});

function adicionarFixo() {
  const desc    = document.getElementById('fixo-desc')?.value?.trim();
  const valor   = parseFloat(document.getElementById('fixo-valor')?.value);
  const catId   = parseInt(document.getElementById('fixo-cat')?.value);
  const tipo    = document.getElementById('fixo-tipo')?.value;
  const parcelas= parseInt(document.getElementById('fixo-parcelas')?.value);
  if (!desc)  { mostrarAlerta('Informe a descrição!', 'alerta'); return; }
  if (!valor||valor<=0) { mostrarAlerta('Informe o valor!', 'alerta'); return; }
  if (tipo === 'parcela' && (!parcelas||parcelas<1)) { mostrarAlerta('Informe o número de parcelas!', 'alerta'); return; }
  const fixo = {
    id: Date.now().toString(),
    desc, valor, catId, tipo,
    ativa: true,
    totalParcelas: tipo === 'parcela' ? parcelas : null,
    parcelasRestantes: tipo === 'parcela' ? parcelas : null,
  };
  state.fixos.push(fixo);
  saveState();
  gerarGastosFixosDoMes();
  document.getElementById('fixo-desc').value = '';
  document.getElementById('fixo-valor').value = '';
  renderTudo();
  mostrarAlerta(`📌 "${desc}" adicionado aos recorrentes!`);
}

function removerFixo(id) {
  if (!confirm('Remover este gasto recorrente?')) return;
  state.fixos = state.fixos.filter(f => f.id !== id);
  state.gastos = state.gastos.filter(g => g.fixoId !== id);
  saveState(); renderTudo();
  mostrarAlerta('Recorrente removido.', 'alerta');
}

/* ===== CONFIG ===== */
function salvarRenda() {
  const val = parseFloat(document.getElementById('config-renda')?.value);
  if (!val||val<=0) { mostrarAlerta('Informe um valor válido!', 'alerta'); return; }
  state.renda = val;
  saveState(); renderTudo();
  mostrarAlerta('✅ Renda atualizada!');
}

function salvarConfig() {
  const total = state.categorias.reduce((a,c) => a+(c.perc||0), 0);
  if (total !== 100) { mostrarAlerta(`Soma precisa ser 100%. Atual: ${total}%`, 'perigo'); return; }
  saveState(); renderTudo();
  mostrarAlerta('✅ Configurações salvas!');
}

/* ===== FECHAMENTO DE MÊS ===== */
document.getElementById('btn-fechar-sem-salvar')?.addEventListener('click', () => {
  document.getElementById('modal-fechamento').classList.add('hidden');
});

document.getElementById('btn-fechar-mes')?.addEventListener('click', () => {
  const mesKey = getMesAtualKey();
  // Salvar no histórico
  state.historico.push({
    mesKey,
    renda: state.renda,
    totalGasto: getTotalGasto(),
    gastos: JSON.parse(JSON.stringify(state.gastos)),
    categorias: JSON.parse(JSON.stringify(state.categorias)),
  });
  // Limpar gastos do mês (manter fixos, mas remover entradas geradas)
  state.gastos = [];
  // Avançar mês
  const [y,m] = mesKey.split('-').map(Number);
  const proxMes = m === 12
    ? `${y+1}-01`
    : `${y}-${String(m+1).padStart(2,'0')}`;
  state.mesAtual = proxMes;
  saveState();
  gerarGastosFixosDoMes();
  document.getElementById('modal-fechamento').classList.add('hidden');
  renderTudo();
  mostrarAlerta(`🐾 Mês encerrado! Bem-vindo ao novo mês!`);
});

/* ===== RENDER GERAL ===== */
function renderTudo() {
  renderCards();
  renderTabela();
  renderUltimosGastos();
  renderListaFixos();
  populateSelectCat();
  renderHeader();
  desenharGrafico();
  updateCatMood();
}

/* ===== BOOT ===== */
function iniciarApp() {
  document.getElementById('modal-renda')?.classList.add('hidden');
  document.getElementById('app')?.classList.remove('hidden');
  const today = new Date().toISOString().slice(0,10);
  const di = document.getElementById('gasto-data');
  if (di) di.value = today;
  aplicarTema(state.tema || 'dark');
  renderTudo();
  showView('dashboard');
}

function boot() {
  // Inicializa gatos SVG
  if (window.setLogocat) window.setLogocat();
  if (window.setCatMood) window.setCatMood('ok');

  renderSetupCats();
  if (state.renda > 0) {
    const ri = document.getElementById('input-renda');
    if (ri) ri.value = state.renda;
  }
  aplicarTema(state.tema || 'dark');
  if (state.setupFeito && state.renda > 0) {
    gerarGastosFixosDoMes();
    iniciarApp();
  } else {
    document.getElementById('modal-renda')?.classList.remove('hidden');
    document.getElementById('app')?.classList.add('hidden');
  }
}

document.getElementById('input-renda')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-confirmar-setup')?.click();
});
document.getElementById('chat-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') consultarGato();
});

document.addEventListener('DOMContentLoaded', boot);
