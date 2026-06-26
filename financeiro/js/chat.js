// chat.js — Consulta inteligente ao FinCat
async function consultarGato() {
  const itemEl   = document.getElementById('chat-item');
  const precoEl  = document.getElementById('chat-preco');
  const motivoEl = document.getElementById('chat-motivo');
  const respEl   = document.getElementById('chat-resposta');
  const btnText  = document.getElementById('chat-btn-text');

  const item   = itemEl?.value?.trim();
  const preco  = parseFloat(precoEl?.value) || 0;
  const motivo = motivoEl?.value?.trim();

  if (!item)  { mostrarAlerta('Diga o que quer comprar!', 'alerta'); return; }
  if (!preco || preco <= 0) { mostrarAlerta('Informe o valor do item!', 'alerta'); return; }

  respEl.classList.remove('hidden');
  respEl.innerHTML = '<div class="chat-loading"><span class="spinner"></span> FinCat está analisando...</div>';
  if (btnText) btnText.textContent = 'Analisando... 🐾';

  const saldo   = getSaldoDisponivel();
  const total   = getTotalGasto();
  const dia     = getDiaMes();

  // Identifica a categoria mais provável para o item
  const catMaisLivre = state.categorias.reduce((best, cat) => {
    const gasto = getGastosCat(cat.id);
    const limite = getLimite(cat);
    const livre = limite - gasto;
    return livre > (getLimite(best) - getGastosCat(best.id)) ? cat : best;
  }, state.categorias[0]);

  const ctx = [
    `Renda mensal: ${fmt(state.renda)}`,
    `Total já gasto este mês: ${fmt(total)}`,
    `Saldo disponível (renda - gastos): ${fmt(saldo)}`,
    `Dia atual do mês: ${dia}/31`,
    `Dias restantes no mês: ~${31 - dia} dias`,
    '',
    'Status por categoria:',
    ...state.categorias.map(c => {
      const g = getGastosCat(c.id), l = getLimite(c), livre = l - g;
      const st = getStatusCat(c);
      return `  ${c.icon} ${c.nome}: gasto ${fmt(g)} de ${fmt(l)} — sobra ${fmt(Math.max(livre,0))} [${st.toUpperCase()}]`;
    }),
    '',
    `Fixos mensais comprometidos: ${fmt(state.fixos.filter(f=>f.ativa!==false&&f.tipo==='fixo').reduce((a,f)=>a+f.valor,0))}`,
    `Parcelas ativas: ${state.fixos.filter(f=>f.ativa!==false&&f.tipo==='parcela').length}`,
  ].join('\n');

  const motivoTexto = motivo ? `Motivo/finalidade: "${motivo}"` : 'Motivo: não informado';

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content:
`Você é o FinCat, assistente financeiro com personalidade de gato sábio e simpático. Fale em português do Brasil.

SITUAÇÃO FINANCEIRA ATUAL:
${ctx}

ITEM AVALIADO:
- Item: "${item}"
- Valor: ${fmt(preco)}
- ${motivoTexto}

Responda em JSON puro (sem markdown, sem explicações fora do JSON) com esta estrutura exata:
{
  "veredicto": "VIÁVEL" ou "NÃO VIÁVEL" ou "COM CAUTELA",
  "emoji": "😸" ou "😿" ou "🙀",
  "impacto_saldo": ${preco} subtraído de ${saldo} como número,
  "percentual_saldo": percentual que ${preco} representa de ${saldo} como número inteiro,
  "analise_curta": "frase direta em 1 linha dizendo se pode ou não",
  "motivo": "2-3 frases explicando o raciocínio, considerando o dia do mês (${dia}), saldo, categorias e motivo da compra",
  "dica": "1 dica prática do FinCat para essa situação específica"
}`
        }]
      })
    });

    if (!res.ok) throw new Error();
    const data = await res.json();
    const texto = data.content?.find(b => b.type === 'text')?.text || '';

    let parsed;
    try {
      parsed = JSON.parse(texto.replace(/```json|```/g, '').trim());
    } catch {
      respEl.innerHTML = `<div class="chat-msg-simples">🐾 <em>${texto}</em></div>`;
      return;
    }

    const corVeredicto = parsed.veredicto === 'VIÁVEL' ? 'verde'
      : parsed.veredicto === 'NÃO VIÁVEL' ? 'vermelho' : 'amarelo';

    const saldoApos = saldo - preco;
    const saldoClass = saldoApos >= 0 ? 'positivo' : 'negativo';

    respEl.innerHTML = `
      <div class="chat-card">
        <div class="chat-veredicto ${corVeredicto}">
          <span class="chat-emoji">${parsed.emoji}</span>
          <span class="chat-veredicto-texto">${parsed.veredicto}</span>
        </div>
        <div class="chat-analise">${parsed.analise_curta}</div>
        <div class="chat-numeros">
          <div class="chat-num-item">
            <span class="chat-num-label">Valor do item</span>
            <span class="chat-num-val vermelho">- ${fmt(preco)}</span>
          </div>
          <div class="chat-num-item">
            <span class="chat-num-label">Saldo atual</span>
            <span class="chat-num-val">${fmt(saldo)}</span>
          </div>
          <div class="chat-num-item">
            <span class="chat-num-label">Saldo após compra</span>
            <span class="chat-num-val ${saldoClass}">${fmt(saldoApos)}</span>
          </div>
          <div class="chat-num-item">
            <span class="chat-num-label">% do saldo usado</span>
            <span class="chat-num-val">${parsed.percentual_saldo}%</span>
          </div>
        </div>
        <div class="chat-motivo-box">
          <span class="chat-motivo-icon">🐱</span>
          <p>${parsed.motivo}</p>
        </div>
        <div class="chat-dica">
          <span>💡</span>
          <p>${parsed.dica}</p>
        </div>
      </div>
    `;

  } catch {
    respEl.innerHTML = '<div class="chat-msg-simples">😿 Erro de conexão. Tente novamente!</div>';
  } finally {
    if (btnText) btnText.textContent = 'Perguntar ao FinCat 🐾';
  }
}

// Enter nos campos dispara a consulta
document.addEventListener('DOMContentLoaded', () => {
  ['chat-item','chat-preco','chat-motivo'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') consultarGato();
    });
  });
});
