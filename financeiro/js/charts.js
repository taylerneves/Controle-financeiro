// charts.js
const CORES = ['#4f8ef7','#3dd68c','#a78bfa','#2dd4bf','#fb923c','#f5c542','#f472b6','#60a5fa','#34d399','#fbbf24'];
let modoGrafico = 'real';

function toggleGrafico(modo) {
  modoGrafico = modo;
  document.getElementById('btn-real')?.classList.toggle('active', modo==='real');
  document.getElementById('btn-ideal')?.classList.toggle('active', modo==='ideal');
  desenharGrafico();
}

function desenharGrafico() {
  const canvas = document.getElementById('grafico-pizza');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  const cx=W/2, cy=H/2, r=Math.min(W,H)/2-16;

  let dados;
  if (modoGrafico==='ideal') {
    dados = state.categorias.map((c,i) => ({ label:c.nome, valor:c.perc, cor:CORES[i%CORES.length] }));
    const tp = dados.reduce((a,d)=>a+d.valor,0);
    if (tp<100) dados.push({ label:'Não alocado', valor:100-tp, cor:'#262840' });
  } else {
    const total = getTotalGasto();
    if (total===0) {
      ctx.fillStyle='var(--border,#262840)';
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#555b78'; ctx.font='12px Space Grotesk'; ctx.textAlign='center';
      ctx.fillText('Sem gastos ainda',cx,cy+4);
      document.getElementById('chart-legend').innerHTML=''; return;
    }
    dados = state.categorias.map((c,i) => ({
      label:c.nome, valor:getGastosCat(c.id), cor:CORES[i%CORES.length]
    })).filter(d=>d.valor>0);
    const saldo = getSaldoDisponivel();
    if (saldo>0) dados.push({ label:'Disponível', valor:saldo, cor:'#1e2235' });
  }

  const total = dados.reduce((a,d)=>a+d.valor,0);
  if (!total) return;
  let angle = -Math.PI/2;
  const gap = 0.025;
  dados.forEach(d => {
    const slice = (d.valor/total)*(Math.PI*2-gap*dados.length);
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,angle+gap/2,angle+slice+gap/2);
    ctx.closePath(); ctx.fillStyle=d.cor; ctx.fill();
    angle+=slice+gap;
  });
  // Donut
  ctx.beginPath(); ctx.arc(cx,cy,r*0.52,0,Math.PI*2);
  const isDark = document.documentElement.getAttribute('data-theme')==='dark';
  ctx.fillStyle = isDark ? '#14161f' : '#f0f2f8';
  ctx.fill();
  // Texto
  ctx.fillStyle = isDark ? '#e8eaf2' : '#1a1c2e';
  ctx.font='bold 13px Space Mono'; ctx.textAlign='center';
  if (modoGrafico==='real') {
    ctx.fillText(fmt(getTotalGasto()),cx,cy-4);
    ctx.fillStyle='#8890b0'; ctx.font='10px Space Grotesk';
    ctx.fillText('gasto no mês',cx,cy+12);
  } else {
    ctx.font='bold 14px Space Grotesk';
    ctx.fillText('Ideal',cx,cy-4);
    ctx.fillStyle='#8890b0'; ctx.font='10px Space Grotesk';
    ctx.fillText('distribuição',cx,cy+12);
  }

  const legend = document.getElementById('chart-legend');
  if (legend) legend.innerHTML = dados.map(d=>`
    <div class="legend-item">
      <div class="legend-dot" style="background:${d.cor}"></div>
      <span class="legend-name">${d.label}</span>
      <span class="legend-val">${modoGrafico==='real'?fmt(d.valor):d.valor+'%'}</span>
    </div>`).join('');
}
