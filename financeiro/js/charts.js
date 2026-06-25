// ============================================
// charts.js — Gráfico de pizza com Canvas
// ============================================

const CORES_AZUL = [
  '#4f8ef7', '#3dd68c', '#a78bfa', '#2dd4bf',
  '#fb923c', '#f5c542', '#f472b6', '#60a5fa',
];

let modoGrafico = 'real'; // 'real' ou 'ideal'

function toggleGrafico(modo) {
  modoGrafico = modo;
  document.getElementById('btn-real').classList.toggle('active', modo === 'real');
  document.getElementById('btn-ideal').classList.toggle('active', modo === 'ideal');
  desenharGrafico();
}

function desenharGrafico() {
  const canvas = document.getElementById('grafico-pizza');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2;
  const cy = H / 2;
  const r = Math.min(W, H) / 2 - 20;

  let dados;

  if (modoGrafico === 'ideal') {
    dados = state.categorias.map((cat, i) => ({
      label: cat.nome,
      valor: cat.perc,
      cor: CORES_AZUL[i % CORES_AZUL.length],
    }));
    const totalPerc = dados.reduce((a, d) => a + d.valor, 0);
    if (totalPerc < 100) {
      dados.push({ label: 'Não alocado', valor: 100 - totalPerc, cor: '#262840' });
    }
  } else {
    const totalGasto = getTotalGasto();
    if (totalGasto === 0) {
      ctx.fillStyle = '#262840';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#555b78';
      ctx.font = '13px Space Grotesk';
      ctx.textAlign = 'center';
      ctx.fillText('Sem gastos ainda', cx, cy + 5);
      renderLegenda([]);
      return;
    }
    dados = state.categorias.map((cat, i) => ({
      label: cat.nome,
      valor: getGastosCat(cat.id),
      cor: CORES_AZUL[i % CORES_AZUL.length],
    })).filter(d => d.valor > 0);

    const limite = state.renda - totalGasto;
    if (limite > 0) {
      dados.push({ label: 'Disponível', valor: limite, cor: '#262840' });
    }
  }

  const total = dados.reduce((a, d) => a + d.valor, 0);
  if (total === 0) return;

  let startAngle = -Math.PI / 2;
  const gap = 0.02;

  dados.forEach((d) => {
    const slice = (d.valor / total) * (Math.PI * 2 - gap * dados.length);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle + gap / 2, startAngle + slice + gap / 2);
    ctx.closePath();
    ctx.fillStyle = d.cor;
    ctx.fill();
    startAngle += slice + gap;
  });

  // Buraco central (donut)
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.52, 0, Math.PI * 2);
  ctx.fillStyle = '#14161f';
  ctx.fill();

  // Texto central
  ctx.fillStyle = '#e8eaf2';
  ctx.font = 'bold 14px Space Mono';
  ctx.textAlign = 'center';
  if (modoGrafico === 'real') {
    ctx.fillText(fmt(getTotalGasto()), cx, cy - 6);
    ctx.fillStyle = '#8890b0';
    ctx.font = '11px Space Grotesk';
    ctx.fillText('gasto no mês', cx, cy + 12);
  } else {
    ctx.fillText('Ideal', cx, cy - 6);
    ctx.fillStyle = '#8890b0';
    ctx.font = '11px Space Grotesk';
    ctx.fillText('distribuição', cx, cy + 12);
  }

  renderLegenda(dados, total);
}

function renderLegenda(dados, total) {
  const el = document.getElementById('chart-legend');
  if (!el) return;
  if (dados.length === 0) { el.innerHTML = ''; return; }

  el.innerHTML = dados.map(d => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${d.cor}"></div>
      <span class="legend-name">${d.label}</span>
      <span class="legend-val">${modoGrafico === 'real' ? fmt(d.valor) : d.valor + '%'}</span>
    </div>
  `).join('');
}
