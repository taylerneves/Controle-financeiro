// ============================================
// chat.js — Consulta ao FinCat via IA
// ============================================

async function consultarGato() {
  const input = document.getElementById('chat-input');
  const resposta = document.getElementById('chat-resposta');
  const pergunta = input?.value?.trim();

  if (!pergunta) return;
  if (!resposta) return;

  resposta.classList.remove('hidden');
  resposta.innerHTML = '<span class="spinner"></span> O FinCat está pensando...';

  // Contexto financeiro atual
  const resumoFinanceiro = gerarResumoContexto();

  const prompt = `Você é o FinCat, um assistente financeiro simpático e direto que se comunica com emojis de gato (🐱😸🐾😺) e fala de forma amigável em português do Brasil.

CONTEXTO FINANCEIRO DO USUÁRIO:
${resumoFinanceiro}

PERGUNTA DO USUÁRIO: "${pergunta}"

Responda de forma curta (máximo 3-4 linhas), seja direto e prático. Se for sobre uma compra, diga claramente se é VIÁVEL ou NÃO VIÁVEL, explique o porquê e leve em conta o momento do mês (dia ${getDiaMes()}). Use emojis com moderação.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const texto = data.content?.find(b => b.type === 'text')?.text || 'Não consegui responder agora 😿';

    resposta.innerHTML = `🐾 <em>${texto}</em>`;
    input.value = '';

  } catch (err) {
    resposta.innerHTML = '😿 Não consegui me conectar agora. Tente novamente mais tarde!';
    console.error('Chat error:', err);
  }
}

function gerarResumoContexto() {
  const linhas = [
    `- Renda mensal: ${fmt(state.renda)}`,
    `- Total gasto até agora: ${fmt(getTotalGasto())}`,
    `- Saldo disponível: ${fmt(getSaldoDisponivel())}`,
    `- Dia do mês atual: ${getDiaMes()}`,
    '',
    'Situação por categoria:',
  ];

  state.categorias.forEach(cat => {
    const gasto = getGastosCat(cat.id);
    const limite = getLimite(cat);
    const status = getStatusCat(cat);
    linhas.push(`  - ${cat.nome}: gasto ${fmt(gasto)} de ${fmt(limite)} (${Math.round(gasto/Math.max(limite,1)*100)}%) — ${status === 'ok' ? 'OK' : status === 'alerta' ? 'ALERTA' : 'ESTOURADO'}`);
  });

  return linhas.join('\n');
}

// Permitir enviar com Enter
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('chat-input');
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter') consultarGato();
  });
});
