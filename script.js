const chat = document.getElementById('chat');
const messageInput = document.getElementById('messageInput');

// URL pública do webhook do n8n
const N8N_WEBHOOK_URL = "https://applications-n8n.ky0uhm.easypanel.host/webhook/chat_livraria";

/**
 * Converte o "markdownzinho" da IA em HTML:
 * - #, ##, ### títulos  -> <strong>...</strong> (pode estilizar via CSS)
 * - **negrito**         -> <strong>...</strong>
 * - quebras de linha    -> <br>
 * - "- " no começo da linha -> "• " (bullet simples)
 */
function formatAssistantMessage(text) {
  if (!text) return "";

  // 1) Escapar HTML básico
  let safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2) Títulos markdown (#, ##, ###) no início da linha
  safe = safe.replace(/^###\s+(.*)$/gm, "<strong>$1</strong>");
  safe = safe.replace(/^##\s+(.*)$/gm, "<strong>$1</strong>");
  safe = safe.replace(/^#\s+(.*)$/gm, "<strong>$1</strong>");

  // 3) Listas: "- " no começo da linha -> "• "
  safe = safe.replace(/^- /gm, "• ");

  // 4) **negrito**
  safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // 5) Quebras de linha
  safe = safe.replace(/\n/g, "<br>");

  return safe;
}

function displayMessage(message, sender = 'user') {
  const el = document.createElement('div');
  el.classList.add('message', sender);

  if (sender === 'assistant') {
    // IA: interpreta markdown básico
    el.innerHTML = formatAssistantMessage(message);
  } else {
    // Usuário: mostra exatamente o que digitou
    el.textContent = message;
  }

  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
}

async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  // mensagem do usuário
  displayMessage(message, 'user');
  messageInput.value = '';

  // bolha "Digitando..."
  const typing = document.createElement('div');
  typing.classList.add('message', 'assistant');
  typing.innerText = 'Digitando...';
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error('Erro HTTP ' + response.status + ' - ' + text);
    }

    const data = await response.json();

    // pega o campo que vem do n8n (output / reply / message)
    const reply = data.output || data.reply || data.message || 'Sem resposta da IA.';

    typing.remove();
    displayMessage(reply, 'assistant');
  } catch (err) {
    console.error(err);
    typing.remove();
    displayMessage('Ops, houve um erro ao falar com a IA. ' + err.message, 'assistant');
  }
}

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
  }
});

