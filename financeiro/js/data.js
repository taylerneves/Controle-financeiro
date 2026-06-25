// ============================================
// data.js — Estado e persistência local
// ============================================

const STORAGE_KEY = 'fincat_v1';

const defaultData = {
  renda: 0,
  categorias: [
    { id: 1, nome: 'Contas Fixas',    icon: '🏠', perc: 50 },
    { id: 2, nome: 'Alimentação',      icon: '🛒', perc: 20 },
    { id: 3, nome: 'Transporte',       icon: '🚗', perc: 10 },
    { id: 4, nome: 'Lazer',            icon: '🎮', perc: 10 },
    { id: 5, nome: 'Investimentos',    icon: '📈', perc: 10 },
  ],
  gastos: [],
  setupFeito: false,
};

let state = JSON.parse(JSON.stringify(defaultData));

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = { ...defaultData, ...JSON.parse(saved) };
    }
  } catch(e) {
    console.warn('Erro ao carregar dados:', e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch(e) {
    console.warn('Erro ao salvar dados:', e);
  }
}

function resetState() {
  state = JSON.parse(JSON.stringify(defaultData));
  saveState();
}

// Helpers de cálculo
function getLimite(cat) {
  return (state.renda * cat.perc) / 100;
}

function getGastosCat(catId) {
  return state.gastos
    .filter(g => g.catId === catId)
    .reduce((acc, g) => acc + g.valor, 0);
}

function getTotalGasto() {
  return state.gastos.reduce((acc, g) => acc + g.valor, 0);
}

function getSaldoDisponivel() {
  return state.renda - getTotalGasto();
}

function getStatusCat(cat) {
  const gasto = getGastosCat(cat.id);
  const limite = getLimite(cat);
  if (limite === 0) return 'ok';
  const ratio = gasto / limite;
  if (ratio >= 1.0) return 'perigo';
  if (ratio >= 0.8) return 'alerta';
  return 'ok';
}

function getDiaMes() {
  return new Date().getDate();
}

function getMesNome() {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function nextCatId() {
  return Date.now();
}

loadState();
