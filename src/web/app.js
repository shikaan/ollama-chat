const LOCAL_OLLAMA = 'http://127.0.0.1:11434';
const HISTORY_LENGTH = 100;
// prevent overdrawing while streaming the content
const throttledDrawFeed = throttle(drawFeed, 120); 

const state = {
  model: null,
  models: [],
  messages: []
}

const $body = document.body;
let $chat;
let $feed;
let $prompt;
let $submit;
let $models;

window.addEventListener('DOMContentLoaded', () => {
  $chat = document.getElementById('chat');
  $feed = document.getElementById('feed');
  $prompt = document.getElementById('prompt');
  $submit = $chat.querySelector('[type="submit"]');
  $models = document.getElementById('models');

  // Submit with Ctrl/Cmd+Enter
  $body.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void submit();
    }
  })

  $chat.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submit();
  })

  $models.addEventListener('change', (e) => {
    state.model = e.target.value;
  })

  getModels();
})

// Let a function run at most once every `limit` ms
function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function () {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function () {
        if ((Date.now() - lastRan) >= limit) {
          // Only execute the function if enough time has passed since it was last run
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

// Draws the chat feed reading from the state
function drawFeed() {
  $feed.innerHTML = '';

  for (const message of state.messages) {
    const $message = document.createElement('div');
    $message.classList.add("message");
    $message.classList.add(message.role == "user" ? "message__user" : "message__assistant")
    const $title = document.createElement('h4');
    $title.innerHTML = message.role == "user" ? "You" : `🤖 Assistant <i>(${message.model})</i>`;
    const $body = document.createElement('p')
    $body.innerHTML = marked.parse(message.content, { gfm: false });
    $message.appendChild($title)
    $message.appendChild($body);
    $feed.appendChild($message)
  }
}

// Clears the chatbox
function clearPrompt() {
  $prompt.value = '';
}

// Starts/stops the loading state
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

// Calls local Ollama and submits the message currently in the chatbox
async function submit() {
  const data = new FormData($chat);

  const message = {
    role: "user",
    content: data.get('prompt')
  }

  state.messages.push(message);
  if (state.messages.length > HISTORY_LENGTH) {
    state.messages.shift()
  }

  drawFeed();
  clearPrompt();
  setLoading(true);

  try {
    const res = await fetch(LOCAL_OLLAMA + `/api/chat`, {
      method: 'POST',
      body: JSON.stringify({
        model: state.model,
        messages: state.messages,
        stream: true
      })
    })

    const reader = res.body.getReader();
    const responseMessage = { role: 'assistant', content: '', model: state.model }
    state.messages.push(responseMessage)

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = JSON.parse(new TextDecoder('utf-8').decode(value));
      responseMessage.content += chunk.message.content;
      throttledDrawFeed();
    }
  } finally {
    setLoading(false);
  }
}

// Draws the model picker with models from the state
function drawModelPicker() {
  $models.innerHTML = '';

  for (const model of state.models) {
    const $opt = document.createElement('option');
    $opt.innerText = model;
    $opt.value = model;
    $models.appendChild($opt);
  }
}

// Retrieves a list of locally isntalled models and updates the state
async function getModels() {
  setLoading(true)
  const res = await fetch(LOCAL_OLLAMA + `/api/tags`);
  const body = await res.json();
  state.models = body.models.map(m => m.name);
  state.model = state.model ?? state.models[0];
  drawModelPicker();
  setLoading(false)
}
