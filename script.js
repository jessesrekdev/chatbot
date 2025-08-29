// chat.js — Conversations persisted in IndexedDB (with localStorage fallback)
// Keeps original UI & functionality intact while moving storage to IndexedDB
// - Conversations are stored in the "conversations" objectStore
// - There is a graceful localStorage fallback if IndexedDB is unavailable
// - This file tries to preserve your original UI, event handlers, and function names

(() => {
  // ===== State =====
  let conversations = []; // in-memory cache (array)
  let currentConversationId = null;
  let conversationToDelete = null;

  // ===== DOM elements (query first) =====
  const newChat = document.getElementById("newChat");
  const chatBox = document.getElementById("chatBox");
  const input = document.querySelector(".composer-input");
  const sendButton = document.getElementById("sendButton");
  const menuButton = document.getElementById("menuButton");
  const sideMenu = document.getElementById("sideMenu");
  const closeMenu = document.getElementById("closeMenu");
  const menuNewChat = document.getElementById("menuNewChat");
  const menuTelegram = document.getElementById("menuTelegram");
  const menuSearchBtn = document.getElementById("menuSearchBtn");
  const menuSearchSection = document.getElementById("menuSearchSection");
  const closeSearchBtn = document.getElementById("closeSearchBtn");
  const searchInput = document.getElementById("searchInput");
  const conversationList = document.getElementById("conversationList");
  const modelSelect = document.getElementById("modelSelect");
  const cancelDeleteBtn = document.getElementById("cancelDelete");
  const confirmDeleteBtn = document.getElementById("confirmDelete");
  const deleteDialog = document.getElementById("deleteDialog");
  const deleteMessage = document.getElementById("deleteMessage");
  const bubble = document.getElementById("bubble");

  // ===== IndexedDB setup =====
  const DB_NAME = "crazy-chat-db";
  const DB_VERSION = 1;
  const STORE_CONV = "conversations";
  let dbInstance = null;
  let indexedDBAvailable = true;

  function openDB() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        indexedDBAvailable = false;
        return reject(new Error("IndexedDB not available"));
      }
      if (dbInstance) return resolve(dbInstance);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (ev) => {
        const db = ev.target.result;
        if (!db.objectStoreNames.contains(STORE_CONV)) {
          db.createObjectStore(STORE_CONV, { keyPath: "id" });
        }
      };
      req.onsuccess = (ev) => {
        dbInstance = ev.target.result;
        resolve(dbInstance);
      };
      req.onerror = (ev) => {
        indexedDBAvailable = false;
        reject(req.error || new Error("Failed to open IndexedDB"));
      };
    });
  }

  async function putConversationToDB(conv) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_CONV, "readwrite");
        const store = tx.objectStore(STORE_CONV);
        const req = store.put(conv);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e);
      });
    } catch (e) {
      indexedDBAvailable = false;
      return false;
    }
  }

  async function deleteConversationFromDB(id) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_CONV, "readwrite");
        const store = tx.objectStore(STORE_CONV);
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e);
      });
    } catch (e) {
      indexedDBAvailable = false;
      return false;
    }
  }

  async function getAllConversationsFromDB() {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_CONV, "readonly");
        const store = tx.objectStore(STORE_CONV);
        const req = store.getAll();
        req.onsuccess = (ev) => resolve(ev.target.result || []);
        req.onerror = (e) => reject(e);
      });
    } catch (e) {
      indexedDBAvailable = false;
      return [];
    }
  }

  async function clearConversationsStore() {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_CONV, "readwrite");
        const store = tx.objectStore(STORE_CONV);
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e);
      });
    } catch (e) {
      indexedDBAvailable = false;
      return false;
    }
  }

  // ===== LocalStorage fallback helpers =====
  function localLoadConversations() {
    try {
      const raw = localStorage.getItem("conversations");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
  function localSaveConversations(arr) {
    try {
      localStorage.setItem("conversations", JSON.stringify(arr));
      return true;
    } catch (e) {
      return false;
    }
  }

  // ===== API: load & save conversations (use DB, fallback to localStorage) =====
  async function loadConversations() {
    // attempt DB load
    try {
      const dbConvs = await getAllConversationsFromDB();
      if (dbConvs && dbConvs.length) {
        conversations = dbConvs.sort((a, b) => b.id - a.id);
        // ensure currentConversationId is valid
        if (currentConversationId && !conversations.find(c => c.id === currentConversationId)) {
          currentConversationId = null;
        }
        return;
      }
    } catch (e) {
      // fallthrough to localStorage
    }
    // fallback
    conversations = localLoadConversations();
    conversations = conversations.sort((a, b) => b.id - a.id);
  }

  async function saveConversations() {
    // Save into IndexedDB: replace all conversations by clearing the store and putting each conversation
    if (indexedDBAvailable) {
      try {
        await clearConversationsStore();
        for (const conv of conversations) {
          await putConversationToDB(conv);
        }
        // Also mirror a tiny version to localStorage for quick access / fallback (titles + ids)
        try {
          const tiny = conversations.map(c => ({ id: c.id, title: c.title }));
          localStorage.setItem("conversations_index", JSON.stringify(tiny));
        } catch (e) { }
        return true;
      } catch (err) {
        // On DB errors, fallback to localStorage and continue
        indexedDBAvailable = false;
      }
    }
    // fallback to localStorage
    const ok = localSaveConversations(conversations);
    if (!ok) {
      // try pruning oldest conversations to fit into storage
      try {
        let arr = conversations.slice().sort((a, b) => a.id - b.id); // oldest first
        while (arr.length > 1) {
          arr.shift(); // remove oldest
          if (localSaveConversations(arr)) {
            conversations = arr;
            return true;
          }
        }
      } catch (e) { }
    }
    return ok;
  }

  // ===== Utilities used by UI =====
  function getCurrentConversation() {
    return conversations.find(c => c.id === currentConversationId) || null;
  }

  function setActiveConversation(convId) {
    currentConversationId = convId;
    renderConversationMessages();
  }

  function showBubble(text) {
    if (!bubble) return;
    bubble.textContent = text;
    bubble.style.display = "block";
    setTimeout(() => { bubble.style.display = "none"; }, 3000);
  }

  function renderBold(text) {
    if (!text) return "";
    return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  }

  function parseBotResponse(text) {
    const segments = [];
    if (typeof text !== "string") {
      segments.push({ type: "text", content: String(text) });
      return segments;
    }
    let remaining = text;
    while (remaining.includes("```")) {
      const start = remaining.indexOf("```");
      if (start > 0) segments.push({ type: "text", content: remaining.slice(0, start) });
      remaining = remaining.slice(start + 3);
      const end = remaining.indexOf("```");
      if (end === -1) {
        segments.push({ type: "text", content: remaining });
        remaining = "";
        break;
      }
      let codeLang = "";
      const firstLineBreak = remaining.indexOf("\n");
      if (firstLineBreak !== -1 && firstLineBreak < end) {
        codeLang = remaining.slice(0, firstLineBreak).trim();
        remaining = remaining.slice(firstLineBreak + 1);
      }
      const codeContent = remaining.slice(0, end);
      segments.push({ type: "code", content: codeContent, lang: codeLang });
      remaining = remaining.slice(end + 3);
    }
    if (remaining) segments.push({ type: "text", content: remaining });
    return segments;
  }

  // ===== Helper to create bot message actions (extracted to reuse in streaming) =====
  function createBotActions(textRaw) {
    const actions = document.createElement("div");
    actions.className = "response-actions";

    const likeBtn = document.createElement("button");
    likeBtn.className = "action-like";
    likeBtn.innerHTML = `<svg width="20" height="20" fill="none" stroke="#6e6e80" stroke-width="2" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5c0-2.5 2-4.5 4.5-4.5 2.04 0 3.81 1.23 4.5 3.09C13.69 5.23 15.46 4 17.5 4 20 4 22 6 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
    const dislikeBtn = document.createElement("button");
    dislikeBtn.className = "action-dislike";
    dislikeBtn.innerHTML = `<svg width="20" height="20" fill="none" stroke="#6e6e80" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2.65l1.45 1.32C18.6 8.64 22 11.72 22 15.5c0 2.5-2 4.5-4.5 4.5-2.04 0-3.81-1.23-4.5-3.09C10.31 18.77 8.54 20 6.5 20 4 20 2 18 2 15.5c0-3.78 3.4-6.86 8.55-11.54L12 2.65z"/></svg>`;
    likeBtn.onclick = () => { likeBtn.classList.toggle("selected"); dislikeBtn.classList.remove("selected"); };
    dislikeBtn.onclick = () => { dislikeBtn.classList.toggle("selected"); likeBtn.classList.remove("selected"); };

    const copyBtn = document.createElement("button");
    copyBtn.className = "action-copy";
    copyBtn.innerHTML = `<svg width="18" height="18" fill="none" stroke="#10a37f" stroke-width="2" viewBox="0 0 20 20"><rect x="4" y="4" width="12" height="12" rx="2" stroke="#10a37f" fill="none"/><rect x="8" y="8" width="8" height="8" rx="2" stroke="#10a37f" fill="none"/></svg> <span>Copy</span>`;
    const successBtn = document.createElement("button");
    successBtn.className = "code-copied-btn";
    successBtn.style.display = "none";
    successBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 10.5l3 3 7-7" stroke="#10a37f" stroke-width="2" fill="none"/></svg> <span>Copied</span>`;
    copyBtn.onclick = () => handleCopyClick(textRaw, copyBtn, successBtn);

    const regenBtn = document.createElement("button");
    regenBtn.className = "action-regenerate";
    regenBtn.innerHTML = `<svg width="18" height="18" fill="none" stroke="#6e6e80" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v2m0 10v2m6.364-6.364l1.415 1.414m-12.728 0l-1.414-1.414m12.728-7.072l-1.414 1.414m-7.072 0l-1.414-1.414"/></svg> <span>Regenerate</span>`;
    regenBtn.disabled = true;
    regenBtn.onmouseover = regenBtn.onclick = () => showBubble("Feature coming soon");

    actions.appendChild(likeBtn);
    actions.appendChild(dislikeBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(successBtn);
    actions.appendChild(regenBtn);

    return actions;
  }

  // ===== Rendering conversations & messages (keeps your UI) =====
  function renderConversations(list = conversations) {
    if (!conversationList) return;
    conversationList.innerHTML = "";
    const sorted = [...list].sort((a, b) => b.id - a.id);
    sorted.forEach(conv => {
      const div = document.createElement("div");
      div.className = "conversation-item";
      div.dataset.renaming = "false";
      div.style.background = (conv.id === currentConversationId) ? "var(--bg-tertiary)" : "";
      div.innerHTML = `
        <span class="conv-title">${conv.title}</span>
        <div class="conv-actions">
          <button class="rename-btn" title="Rename">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="#10a37f" stroke-width="2" viewBox="0 0 24 24">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
            </svg>
          </button>
          <button class="delete-btn" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="#ff4b5c" stroke-width="2" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      `;
      const titleSpan = div.querySelector(".conv-title");
      const convActions = div.querySelector(".conv-actions");
      const renameBtn = convActions.querySelector(".rename-btn");
      const deleteBtn = convActions.querySelector(".delete-btn");

      div.addEventListener("click", (e) => {
        if (div.dataset.renaming === "true") return;
        if (e.target.closest(".rename-btn") || e.target.closest(".delete-btn")) return;
        setActiveConversation(conv.id);
        renderConversations();
        sideMenu && sideMenu.classList.remove("open");
      });

      renameBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        div.dataset.renaming = "true";
        renameBtn.style.display = "none";
        deleteBtn.style.display = "none";
        const inputEl = document.createElement("input");
        inputEl.type = "text";
        inputEl.value = conv.title;
        inputEl.className = "conv-rename-input";
        inputEl.style.width = (titleSpan.offsetWidth + 20) + "px";

        const saveBtn = document.createElement("button");
        saveBtn.className = "save-btn";
        saveBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="#10a37f" stroke-width="2" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>`;
        saveBtn.title = "Save";

        const cancelBtn = document.createElement("button");
        cancelBtn.className = "cancel-btn";
        cancelBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="#ff4b5c" stroke-width="2" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>`;
        cancelBtn.title = "Cancel";

        div.replaceChild(inputEl, titleSpan);
        convActions.prepend(cancelBtn);
        convActions.prepend(saveBtn);

        inputEl.focus();

        saveBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          conv.title = inputEl.value.trim() || conv.title;
          saveConversations();
          renderConversations();
        });

        cancelBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          renderConversations();
        });
      });

      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        conversationToDelete = conv;
        if (deleteMessage) deleteMessage.textContent = `Do you really want to delete "${conv.title}"?`;
        if (deleteDialog) deleteDialog.classList.add("open");
      });

      conversationList.appendChild(div);
    });
  }

  // ===== Message renderers (kept close to original) =====
  function appendBotMessage(textRaw) {
    if (!chatBox) return;
    const msg = document.createElement("div");
    msg.className = "chat-message bot-message";
    msg.style.alignSelf = "flex-start";

    const segments = parseBotResponse(textRaw);
    const contentDiv = document.createElement("div");
    contentDiv.className = "bot-content";

    segments.forEach((seg) => {
      if (seg.type === "text") {
        const textHtml = renderBold(seg.content).replace(/\n/g, "<br>");
        const textSpan = document.createElement("span");
        textSpan.innerHTML = textHtml;
        contentDiv.appendChild(textSpan);
        console.log(seg);
      }


      else if (seg.type === "code") {
        const wrapper = document.createElement("div");
        wrapper.className = "xcode-window";

        wrapper.innerHTML = `
    <div class="xcode-titlebar">
      <div class="xcode-buttons">
        <div class="xcode-btn xcode-btn-close"></div>
        <div class="xcode-btn xcode-btn-min"></div>
        <div class="xcode-btn xcode-btn-max"></div>
      </div>
      <div class="xcode-filename">${seg.lang || "Crazy Code"}</div>
    </div>
    <div class="xcode-editor">
      <pre><code class="language-${seg.lang || "plaintext"}"></code></pre>
    </div>
  `;

        const codeEl = wrapper.querySelector("code");
        codeEl.textContent = seg.content; // just raw code

        // // ✅ Use Prism.js or Highlight.js
        // if (window.Prism) {
        //   Prism.highlightElement(codeEl);
        // } else if (window.hljs) {
        //   hljs.highlightElement(codeEl);
        // }
        hljs.highlightElement(codeEl);


        contentDiv.appendChild(wrapper);
      }


    });

    msg.appendChild(contentDiv);

    // Actions (like/dislike/copy/regenerate) - extracted helper used here
    const actions = createBotActions(textRaw);
    msg.appendChild(actions);

    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function appendUserMessage(text) {
    if (!chatBox) return;
    const msgWrapper = document.createElement("div");
    msgWrapper.className = "chat-message-wrapper";
    msgWrapper.style.alignSelf = "flex-end";

    const msg = document.createElement("div");
    msg.className = "chat-message user-message";
    msg.innerHTML = renderBold(text);
    msgWrapper.appendChild(msg);

    const actions = document.createElement("div");
    actions.className = "response-actions user-actions";

    const copyBtn = document.createElement("button");
    copyBtn.className = "action-copy";
    copyBtn.innerHTML = `<svg width="18" height="18" fill="none" stroke="#10a37f" stroke-width="2" viewBox="0 0 20 20">
      <rect x="4" y="4" width="12" height="12" rx="2" stroke="#10a37f" fill="none"/>
      <rect x="8" y="8" width="8" height="8" rx="2" stroke="#10a37f" fill="none"/>
    </svg> <span>Copy</span>`;

    const successBtn = document.createElement("button");
    successBtn.className = "code-copied-btn";
    successBtn.style.display = "none";
    successBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M5 10.5l3 3 7-7" stroke="#10a37f" stroke-width="2" fill="none"/>
    </svg> <span>Copied</span>`;

    const editBtn = document.createElement("button");
    editBtn.className = "action-edit";
    editBtn.innerHTML = `<svg width="18" height="18" fill="none" stroke="#6e6e80" stroke-width="2" viewBox="0 0 24 24">
      <path d="M4 20h4l10-10a2.828 2.828 0 0 0-4-4L4 16v4z"/>
    </svg> <span>Edit</span>`;
    editBtn.disabled = true;
    editBtn.onclick = () => showBubble("Feature coming soon");

    copyBtn.onclick = () => {
      const textToCopy = msg.innerText;
      handleCopyClick(textToCopy, copyBtn, successBtn);
    };

    actions.appendChild(copyBtn);
    actions.appendChild(successBtn);
    actions.appendChild(editBtn);

    msgWrapper.appendChild(actions);
    chatBox.appendChild(msgWrapper);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // ===== Copy utilities =====
  function copyToClipboard(text) {
    if (!text) return false;
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text)
        .then(() => true)
        .catch(err => {
          console.error("Failed to copy using Clipboard API:", err);
          return false;
        });
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, 99999);
      try {
        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);
        return successful;
      } catch (err) {
        console.error("Failed to copy text:", err);
        document.body.removeChild(textarea);
        return false;
      }
    }
  }

  const handleCopyClick = (text, copyBtn, successBtn) => {
    const result = copyToClipboard(text);
    if (result instanceof Promise) {
      result.then(success => {
        if (success) {
          copyBtn.style.display = "none";
          successBtn.style.display = "flex";
          setTimeout(() => {
            successBtn.style.display = "none";
            copyBtn.style.display = "flex";
          }, 3000);
        } else {
          showBubble("Copy failed. Please select and copy manually.");
        }
      });
    } else {
      if (result) {
        copyBtn.style.display = "none";
        successBtn.style.display = "flex";
        setTimeout(() => {
          successBtn.style.display = "none";
          copyBtn.style.display = "flex";
        }, 3000);
      } else {
        showBubble("Copy failed. Please select and copy manually.");
      }
    }
  };

  // ===== Typing indicator =====
  function createTypingIndicator() {
    const container = document.createElement("span");
    container.className = "typing-indicator";
    container.innerHTML = `
      <svg class="typing-dots" viewBox="0 0 30 16">
        <circle class="typing-dot" cx="5" cy="8" r="4"/>
        <circle class="typing-dot" cx="15" cy="8" r="4"/>
        <circle class="typing-dot" cx="25" cy="8" r="4"/>
      </svg>
      <span style="margin-left:6px;color:#10a37f;font-weight:500;">Thinking</span>
    `;
    return container;
  }

  // ===== Helper: consume responses from puter.ai (supports streams, promises, strings) =====
  async function consumeAIResponse(response) {
    if (response == null) return { text: "" };
    if (typeof response === "string") return { text: response };
    if (typeof response[Symbol.asyncIterator] === "function") {
      let text = "";
      try {
        for await (const part of response) {
          if (!part) continue;
          if (typeof part === "string") { text += part; }
          else if (part.text) text += part.text;
        }
      } catch (err) {
        console.warn("Stream consume error", err);
      }
      return { text };
    }
    if (typeof response.then === "function") {
      const awaited = await response;
      return consumeAIResponse(awaited);
    }
    if (typeof response.text === "function") {
      try {
        const txt = await response.text();
        return { text: txt };
      } catch (e) {
        return { text: "" };
      }
    }
    return { text: String(response) };
  }




// ===== sendPrompt (STREAMING VERSION) =====
async function sendPrompt(text) {
  if (!currentConversationId) {
    const newConv = {
      id: Date.now(),
      title: `Chat ${new Date().toLocaleString()}`,
      messages: []
    };
    conversations.unshift(newConv);
    currentConversationId = newConv.id;
    await saveConversations();
    renderConversations();
  }

  const conv = getCurrentConversation();

  // Save + render user message
  conv.messages.push({ text, fromUser: true });
  await saveConversations();
  appendUserMessage(text);

  if (input) input.value = "";
  if (sendButton) sendButton.style.display = "none";

  // --- Create bot bubble container ---
  const msg = document.createElement("div");
  msg.className = "chat-message bot-message";
  const contentDiv = document.createElement("div");
  contentDiv.className = "bot-content";
  msg.appendChild(contentDiv);
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Typing indicator
  const typing = createTypingIndicator();
  contentDiv.appendChild(typing);

  let fullResponse = "";
  let codeBuffer = "";
  let inCodeBlock = false;
  let currentLang = "";

  try {
    const response = await puter.ai.chat(text, {
      model: (modelSelect ? modelSelect.value : "gpt-5-nano"),
      stream: true
    });

    for await (const part of response) {
      if (part?.text) {
        if (typing.parentNode) typing.remove();

        fullResponse += part.text;

        // --- Process streaming chunks ---
        const lines = part.text.split("\n");
        for (let line of lines) {
          if (line.trim().startsWith("```")) {
            if (!inCodeBlock) {
              // Entering code block
              inCodeBlock = true;
              currentLang = line.trim().replace("```", "").trim() || "plaintext";
              codeBuffer = "";
            } else {
              // Closing code block -> render
              const pre = document.createElement("pre");
              pre.className = "xcode-window";
              const codeEl = document.createElement("code");
              codeEl.className = `language-${currentLang}`;
              codeEl.textContent = codeBuffer.trim();
              pre.appendChild(codeEl);
              contentDiv.appendChild(pre);
              hljs.highlightElement(codeEl);

              inCodeBlock = false;
              currentLang = "";
              codeBuffer = "";
            }
          } else if (inCodeBlock) {
            codeBuffer += line + "\n";
          } else {
            // Normal text
            contentDiv.innerHTML = renderBold(fullResponse.replace(/```[\s\S]*```/g, ""))
              .replace(/\n/g, "<br>");
          }
        }

        chatBox.scrollTop = chatBox.scrollHeight;
      }
    }

    // Save final bot response
    conv.messages.push({ text: fullResponse, fromUser: false });
    await saveConversations();

    // Append actions to the streaming message so they appear immediately (fixes the bug)
    const actions = createBotActions(fullResponse);
    msg.appendChild(actions);

  } catch (err) {
    console.error("Streaming error:", err);
    const errorText = "❌ Failed to fetch response.";
    contentDiv.textContent = errorText;
    conv.messages.push({ text: errorText, fromUser: false });
    await saveConversations();
    showBubble(errorText);

    // Still append actions so the user can at least copy/error-interact
    const actions = createBotActions(errorText);
    msg.appendChild(actions);

  } finally {
    if (typing.parentNode) typing.remove();
    chatBox.scrollTop = chatBox.scrollHeight;
    if (sendButton) {
      sendButton.disabled = false;
      sendButton.style.display = (input && input.value.trim()) ? "flex" : "none";
    }
  }
}






  // ===== Event handlers =====
  if (newChat) newChat.addEventListener("click", async () => {
    const newConv = { id: Date.now(), title: `Chat ${new Date().toLocaleString()}`, messages: [] };
    conversations.unshift(newConv);
    currentConversationId = newConv.id;
    await saveConversations();
    renderConversations();
    renderConversationMessages();
  });

  if (sendButton) sendButton.addEventListener("click", () => {
    const text = input ? input.value.trim() : "";
    if (!text) return;
    sendPrompt(text);
  });

  if (menuButton) menuButton.addEventListener("click", () => sideMenu.classList.add("open"));
  if (closeMenu) closeMenu.addEventListener("click", () => sideMenu.classList.remove("open"));
  if (menuTelegram) menuTelegram.addEventListener("click", () => window.open("https://t.me/jesse_pro", "_blank"));
  if (menuNewChat) menuNewChat.addEventListener("click", async () => {
    const newConv = { id: Date.now(), title: `Chat ${new Date().toLocaleString()}`, messages: [] };
    conversations.unshift(newConv);
    currentConversationId = newConv.id;
    await saveConversations();
    renderConversations();
    renderConversationMessages();
    sideMenu.classList.remove("open");
  });
  if (modelSelect) modelSelect.addEventListener("change", (e) => console.log("Selected model:", e.target.value));

  if (menuSearchBtn) menuSearchBtn.addEventListener("click", () => {
    menuSearchSection && menuSearchSection.classList.remove("hidden");
    searchInput && searchInput.focus();
  });
  if (closeSearchBtn) closeSearchBtn.addEventListener("click", () => {
    menuSearchSection && menuSearchSection.classList.add("hidden");
    if (searchInput) searchInput.value = "";
    renderConversations();
  });
  if (searchInput) searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = conversations.filter(c => c.title.toLowerCase().includes(query));
    renderConversations(filtered);
  });

  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", () => {
    deleteDialog && deleteDialog.classList.remove("open");
    conversationToDelete = null;
  });

  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", async () => {
    if (!conversationToDelete) return;
    conversations = conversations.filter(c => c.id !== conversationToDelete.id);
    if (currentConversationId === conversationToDelete.id) {
      currentConversationId = null;
      renderConversationMessages();
    }
    await saveConversations();
    renderConversations();
    deleteDialog && deleteDialog.classList.remove("open");
    conversationToDelete = null;
  });

  if (input) input.addEventListener("input", () => {
    if (!sendButton) return;
    sendButton.style.display = input.value.trim() ? "flex" : "none";
  });

  // Prevent double tap / pinch zoom
  document.addEventListener("gesturestart", function (e) { e.preventDefault(); });
  document.addEventListener("dblclick", function (e) { e.preventDefault(); });

  // ===== Render conversation messages (initial & on change) =====
  function renderConversationMessages() {
    if (!chatBox) return;
    chatBox.innerHTML = "";
    const conv = getCurrentConversation();
    if (!conv || !conv.messages || conv.messages.length === 0) {
      chatBox.innerHTML = `
        <h1 class="title">Crazy Chat</h1>
        <p class="subtitle">This chat won't appear in history or be used to train our models. For safety purposes, we may keep a copy of this chat for up to 30 days.</p>
      `;
      return;
    }
    conv.messages.forEach(msg => {
      if (msg.fromUser) {
        appendUserMessage(msg.text);
      } else {
        appendBotMessage(msg.text);
      }
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // ===== Initialization: load conversations from DB (or fallback) and render =====
  async function init() {
    try {
      await openDB();
    } catch (e) {
      console.warn("IndexedDB not available, falling back to localStorage.");
      indexedDBAvailable = false;
    }
    await loadConversations();
    renderConversations();
    renderConversationMessages();
  }

  // Kick off initialization
  init();

  // ===== Export some functions for debugging (optional) =====
  window.__crazyChat = {
    getConversations: () => conversations,
    saveConversations
  };
})();