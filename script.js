const chat = document.getElementById('chat');
const messageInput = document.getElementById('messageInput');

// URL pública do webhook do n8n
const N8N_WEBHOOK_URL = "https://applications-n8n.ky0uhm.easypanel.host/webhook/chat_livraria";

/**
 * Converte o "markdownzinho" da IA em HTML:
 * - **negrito**  -> <strong>
 * - quebras de linha -> <br>
 * e escapa HTML perigoso antes.
 */
function formatAssistantMessage(text) {
  // 1) Escapar HTML básico
  let safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2) **negrito**
  safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // 3) Quebras de linha
  safe = safe.replace(/\n/g, "<br>");

  return safe;
}

function displayMessage(message, sender = 'user') {
  const el = document.createElement('div');
  el.classList.add('message', sender);

  if (sender === 'assistant') {
    // IA: interpreta negrito e quebras de linha
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

