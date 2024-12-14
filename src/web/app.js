window.addEventListener('DOMContentLoaded', () => {

  const LOCAL_OLLAMA = 'http://127.0.0.1:11434';

  const $chat = document.getElementById('chat');
  const $feed = document.getElementById('feed');
  const $prompt = document.getElementById('prompt');
  const $submit = $chat.querySelector('[type="submit"]');

  const state = {
    model: 'qwen2.5-coder:14b',
    messages: []
  }

  document.body.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.metaKey) {
      event.preventDefault();
      void submit();
    }
  })

  $chat.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submit();
  })

  function drawFeed() {
    $feed.innerHTML = '';

    for (const message of state.messages) {
      const $message = document.createElement('div');
      $message.classList.add("message");
      $message.classList.add(message.role == "user" ? "message__user" : "message__assistant")
      const $title = document.createElement('h4');
      $title.innerText = message.role == "user" ? "You" : "🤖 Assistant";
      const $body = document.createElement('p')
      $body.innerHTML = marked.parse(message.content, { gfm: false });
      $message.appendChild($title)
      $message.appendChild($body);
      $feed.appendChild($message)
    }
  }

  function clearPrompt() {
    $prompt.value = '';
  }

  function setLoading(value = true) {
    if (value) {
      $prompt.setAttribute('disabled', true)
      $prompt.value = 'Loading...'
      $submit.setAttribute('disabled', true)
    } else {
      $prompt.removeAttribute('disabled')
      $submit.removeAttribute('disabled')
      $prompt.value = ''
      $prompt.focus();
    }
  }

  async function submit() {
    const data = new FormData($chat);

    const message = {
      role: "user",
      content: data.get('prompt')
    }

    state.messages.push(message);
    if (state.messages.length > 100) {
      state.messages.shift()
    }

    drawFeed();
    clearPrompt();
    setLoading(true);

    const res = await fetch(LOCAL_OLLAMA + `/api/chat`, {
      method: 'POST',
      body: JSON.stringify({
        model: state.model,
        messages: state.messages,
        stream: false
      })
    })

    const body = await res.json();
    state.messages.push(body.message)
    setLoading(false);
    drawFeed();
  }
})
