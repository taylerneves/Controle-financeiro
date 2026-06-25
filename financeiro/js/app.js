// ============================================
// app.js — Lógica principal e inicialização
// ============================================

/* ========= SETUP MODAL ========= */

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
  if (!renda || renda <= 0) {
    mostrarAlerta('Por favor, informe sua renda do mês!', 'alerta');
    return;
  }
  const total = state.categorias.reduce((a, c) => a + (c.perc || 0), 0);
  if (total !== 100) {
    mostrarAlerta(`A soma das categorias precisa ser 100%. Atual: ${total}%`, 'perigo');
    return;
  }
  const semNome = state.categorias.find(c => !c.nome?.trim());
  if (semNome) {
    mostrarAlerta('Todas as categorias precisam ter um nome!', 'alerta');
    return;
  }

  state.renda = renda;
  state.setupFeito = true;
  saveState();
  iniciarApp();
});

/* ========= NAVEGAÇÃO ========= */

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

/* ========= GASTOS ========= */

function adicionarGasto() {
  const desc  = document.getElementById('gasto-desc')?.value?.trim();
  const valor = parseFloat(document.getElementById('gasto-valor')?.value);
  const catId = parseInt(document.getElementById('gasto-cat')?.value);
  const data  = document.getElementById('gasto-data')?.value;

  if (!desc) { mostrarAlerta('Informe a descrição do gasto!', 'alerta'); return; }
  if (!valor || valor <= 0) { mostrarAlerta('Informe o valor!', 'alerta'); return; }
  if (!catId) { mostrarAlerta('Selecione uma categoria!', 'alerta'); return; }

  const gasto = {
    id: Date.now().toString(),
    desc,
    valor,
    catId,
    data: data || new Date().toLocaleDateString('pt-BR'),
  };

  state.gastos.push(gasto);
  saveState();

  // Verificar alerta
  const cat = state.categorias.find(c => c.id === catId);
  if (cat) {
    const status = getStatusCat(cat);
    if (status === 'perigo') {
      mostrarAlerta(`😾 Você estourou o limite de "${cat.nome}"!`, 'perigo');
    } else if (status === 'alerta') {
      mostrarAlerta(`⚠️ "${cat.nome}" está acima de 80% do limite!`, 'alerta');
    }
  }

  // Limpar campos
  document.getElementById('gasto-desc').value = '';
  document.getElementById('gasto-valor').value = '';

  renderTudo();
  mostrarAlerta(`✅ Gasto de ${fmt(valor)} registrado!`);
}

function removerGasto(id) {
  state.gastos = state.gastos.filter(g => g.id !== id);
  saveState();
  renderTudo();
}

function limparGastos() {
  if (!confirm('Tem certeza que deseja apagar todos os gastos do mês?')) return;
  state.gastos = [];
  saveState();
  renderTudo();
  mostrarAlerta('Todos os gastos foram removidos.', 'alerta');
}

/* ========= CONFIG ========= */

function salvarRenda() {
  const val = parseFloat(document.getElementById('config-renda')?.value);
  if (!val || val <= 0) { mostrarAlerta('Informe um valor válido!', 'alerta'); return; }
  state.renda = val;
  saveState();
  renderTudo();
  mostrarAlerta('✅ Renda atualizada!');
}

function salvarConfig() {
  const total = state.categorias.reduce((a, c) => a + (c.perc || 0), 0);
  if (total !== 100) {
    mostrarAlerta(`A soma das categorias precisa ser 100%. Atual: ${total}%`, 'perigo');
    return;
  }
  saveState();
  renderTudo();
  mostrarAlerta('✅ Configurações salvas!');
}

/* ========= RENDER GERAL ========= */

function renderTudo() {
  renderCats();
  renderCards();
  renderTabela();
  renderUltimosGastos();
  populateSelectCat();
  renderHeader();
  desenharGrafico();
  updateCatMood();
}

/* ========= INICIALIZAÇÃO ========= */

function iniciarApp() {
  document.getElementById('modal-renda')?.classList.add('hidden');
  document.getElementById('app')?.classList.remove('hidden');

  // Data padrão no input
  const today = new Date().toISOString().slice(0, 10);
  const dataInput = document.getElementById('gasto-data');
  if (dataInput) dataInput.value = today;

  renderTudo();
  showView('dashboard');
}

function boot() {
  renderCats();
  renderSetupCats();

  const rendaInput = document.getElementById('input-renda');
  if (state.renda > 0 && rendaInput) rendaInput.value = state.renda;

  if (state.setupFeito && state.renda > 0) {
    iniciarApp();
  } else {
    document.getElementById('modal-renda')?.classList.remove('hidden');
    document.getElementById('app')?.classList.add('hidden');
  }
}

// Atalho Enter no campo de renda
document.getElementById('input-renda')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-confirmar-setup')?.click();
});

document.addEventListener('DOMContentLoaded', boot);
