// ============================================
// data.js — Estado, persistência e cálculos
// ============================================
const STORAGE_KEY = 'fincat_v2';

const defaultData = {
  renda: 0,
  categorias: [
    { id: 1, nome: 'Contas Fixas',  icon: '🏠', perc: 50 },
    { id: 2, nome: 'Alimentação',   icon: '🛒', perc: 20 },
    { id: 3, nome: 'Transporte',    icon: '🚗', perc: 10 },
    { id: 4, nome: 'Lazer',         icon: '🎮', perc: 10 },
    { id: 5, nome: 'Investimentos', icon: '📈', perc: 10 },
  ],
  gastos: [],
  fixos: [],       // gastos fixos e parcelados
  historico: [],   // meses encerrados
  mesAtual: null,  // 'YYYY-MM'
  setupFeito: false,
  tema: 'dark',
};

let state = JSON.parse(JSON.stringify(defaultData));

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) state = { ...defaultData, ...JSON.parse(saved) };
    if (!state.fixos) state.fixos = [];
    if (!state.historico) state.historico = [];
  } catch(e) { console.warn(e); }
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
}

// ---- Cálculos ----
function getLimite(cat) { return (state.renda * cat.perc) / 100; }

function getGastosCat(catId, gastos) {
  const g = gastos || state.gastos;
  return g.filter(x => x.catId === catId).reduce((a,x) => a + x.valor, 0);
}

function getTotalGasto(gastos) {
  const g = gastos || state.gastos;
  return g.reduce((a,x) => a + x.valor, 0);
}

function getSaldoDisponivel() { return state.renda - getTotalGasto(); }

function getStatusCat(cat, gastos) {
  const gasto = getGastosCat(cat.id, gastos);
  const limite = getLimite(cat);
  if (limite === 0) return 'ok';
  const r = gasto / limite;
  if (r >= 1.0) return 'perigo';
  if (r >= 0.8) return 'alerta';
  return 'ok';
}

function getDiaMes() { return new Date().getDate(); }

function getMesAtualKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function getMesNome(key) {
  if (!key) key = getMesAtualKey();
  const [y,m] = key.split('-');
  return new Date(+y, +m-1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function nextCatId() { return Date.now(); }

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function fmt(val) {
  return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---- Fixos: gerar gastos automáticos do mês ----
function gerarGastosFixosDoMes() {
  const mesKey = getMesAtualKey();
  state.fixos.forEach(f => {
    // Já gerou pra esse mês?
    const jaExiste = state.gastos.find(g => g.fixoId === f.id && g.mesKey === mesKey);
    if (jaExiste) return;
    if (f.tipo === 'fixo') {
      state.gastos.push({
        id: `auto_${f.id}_${mesKey}`,
        fixoId: f.id,
        mesKey,
        desc: f.desc + ' (fixo)',
        valor: f.valor,
        catId: f.catId,
        tipo: 'fixo',
        data: `01/${mesKey.split('-')[1]}/${mesKey.split('-')[0]}`,
      });
    } else if (f.tipo === 'parcela' && f.parcelasRestantes > 0) {
      const atual = f.totalParcelas - f.parcelasRestantes + 1;
      state.gastos.push({
        id: `auto_${f.id}_${mesKey}`,
        fixoId: f.id,
        mesKey,
        desc: `${f.desc} (${atual}/${f.totalParcelas})`,
        valor: f.valor,
        catId: f.catId,
        tipo: 'parcela',
        data: `01/${mesKey.split('-')[1]}/${mesKey.split('-')[0]}`,
      });
      f.parcelasRestantes--;
      if (f.parcelasRestantes <= 0) {
        f.ativa = false;
      }
    }
  });
  saveState();
}

loadState();
