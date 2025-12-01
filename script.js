const chat = document.getElementById('chat');
const messageInput = document.getElementById('messageInput');

// URL pública do webhook do n8n
const N8N_WEBHOOK_URL = "https://applications-n8n.ky0uhm.easypanel.host/webhook/chat_livraria";

function displayMessage(message, sender = 'user') {
  const el = document.createElement('div');
  el.classList.add('message', sender);
  el.innerText = message;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
}

async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  displayMessage(message, 'user');
  messageInput.value = '';

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

    if (!response.ok) throw new Error('Erro HTTP: ' + response.status);

    const data = await response.json();
  const reply = data.output || data.reply || data.message || JSON.stringify(data);

    typing.remove();
    displayMessage(reply, 'assistant');
  } catch (err) {
    console.error(err);
    typing.remove();
    displayMessage('Ops, houve um erro ao falar com a IA.', 'assistant');
  }
}

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
  }
});

