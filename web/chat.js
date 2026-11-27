// Widget de l'assistant : appelle /api/chat sur le MEME domaine (pas de CORS a gerer)
const form = document.getElementById("chat-form");
const input = document.getElementById("question");
const messages = document.getElementById("messages");

function addMessage(text, who, sources = []) {
  const div = document.createElement("div");
  div.className = "msg " + who;
  // textContent et non innerHTML : la reponse du LLM n'est jamais interpretee comme du HTML (XSS)
  div.textContent = text;
  if (sources.length) {
    const s = document.createElement("small");
    s.textContent = "Sources : " + sources.join(", ");
    div.appendChild(s);
  }
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const question = input.value.trim();
  if (!question) return;
  addMessage(question, "user");
  input.value = "";
  const wait = addMessage("L'assistant réfléchit…", "bot pending");
  form.querySelector("button").disabled = true;
  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    wait.remove();
    if (r.status === 429) {
      addMessage("Trop de questions d'affilée, merci de patienter une minute.", "bot error");
    } else if (!r.ok) {
      addMessage("L'assistant est indisponible pour le moment.", "bot error");
    } else {
      const data = await r.json();
      addMessage(data.answer, "bot", data.sources || []);
    }
  } catch {
    wait.remove();
    addMessage("Erreur réseau.", "bot error");
  } finally {
    form.querySelector("button").disabled = false;
    input.focus();
  }
});
