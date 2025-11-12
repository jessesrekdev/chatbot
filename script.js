// chat.js — Conversations persisted in localStorage only (no IndexedDB)
// Keeps original UI & functionality intact while moving storage to localStorage only
// - Conversations are stored in localStorage under the key "conversations"
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
  const menuOverlay = document.getElementById("menuOverlay");
  const closeMenuBtn = document.getElementById("closeMenu");
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
  const composer = document.querySelector(".composer");
  const deleteDialog = document.getElementById("deleteDialog");
  const deleteMessage = document.getElementById("deleteMessage");
  const bubble = document.getElementById("bubble");
  const voiceButton = document.getElementById("voiceButton");

  // ===== LocalStorage helpers =====
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

  // ===== API: load & save conversations (localStorage) =====
  async function loadConversations() {
    conversations = localLoadConversations();
    conversations = conversations.sort((a, b) => b.id - a.id);
    // ensure currentConversationId is valid
    if (currentConversationId && !conversations.find(c => c.id === currentConversationId)) {
      currentConversationId = null;
    }
  }

  async function saveConversations() {
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

  // ===== Auto-generate chat title (runs in background) =====
  async function generateChatTitle(conv) {
    // Only generate if conversation has at least 4 messages (2 user + 2 bot)
    if (!conv || conv.messages.length < 4) return;
    
    // Don't regenerate if title was already customized (not default format)
    if (!conv.title.startsWith('Chat ') && !conv.title.startsWith('New Chat')) return;
    
    try {
      // Get all messages for better context
      const messages = conv.messages.slice(0, 4); // First 4 messages
      const userMsg1 = messages.find(m => m.fromUser)?.text || '';
      const botMsg1 = messages.filter(m => !m.fromUser)[0]?.text || '';
      const userMsg2 = messages.filter(m => m.fromUser)[1]?.text || '';
      const botMsg2 = messages.filter(m => !m.fromUser)[1]?.text || '';
      
      if (!userMsg1) return;
      
      console.log('🎯 Generating title in background...');
      
      // Create a very specific prompt that forces only title output
      const titlePrompt = `Generate a short 3-5 word title for this chat. Reply with ONLY the title, nothing else. No quotes, no explanations, just the title.

User: ${userMsg1.substring(0, 100)}
Assistant: ${botMsg1.substring(0, 100)}
User: ${userMsg2.substring(0, 100)}
Assistant: ${botMsg2.substring(0, 100)}

Title:`;
      
      // Use streaming to get the response
      const response = await puter.ai.chat(titlePrompt, {
        model: 'gpt-4o-mini',
        stream: true
      });
      
      let title = '';
      
      // Collect the streamed response
      for await (const part of response) {
        if (part?.text) {
          title += part.text;
        }
      }
      
      title = title.trim();
      
      console.log('📝 Raw title response:', title);
      
      // Clean up the title aggressively
      title = title.replace(/^["'`]|["'`]$/g, ''); // Remove quotes
      title = title.replace(/^Title:\s*/i, ''); // Remove "Title:" prefix
      title = title.replace(/\n.*/g, ''); // Remove everything after first line
      title = title.substring(0, 60); // Limit length
      
      console.log('✨ Cleaned title:', title);
      
      if (title && title.length > 0 && title !== 'New Chat') {
        conv.title = title;
        await saveConversations();
        renderConversations();
        console.log('✅ Title updated successfully to:', title);
      }
    } catch (err) {
      console.error('❌ Failed to generate title:', err);
      // Silently fail - keep default title
    }
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

  function createBotActions(textRaw, messageIndex = -1) {
    const actions = document.createElement("div");
    actions.className = "response-actions";

    // Thumbs Up - Better SVG
    const likeBtn = document.createElement("button");
    likeBtn.className = "action-like";
    likeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
    </svg>`;
    
    // Thumbs Down - Better SVG
    const dislikeBtn = document.createElement("button");
    dislikeBtn.className = "action-dislike";
    dislikeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
    </svg>`;
    
    likeBtn.onclick = () => { 
      likeBtn.classList.toggle("selected"); 
      dislikeBtn.classList.remove("selected");
      if (likeBtn.classList.contains("selected")) {
        showBubble("👍 Thanks for your feedback!");
      }
    };
    dislikeBtn.onclick = () => { 
      dislikeBtn.classList.toggle("selected"); 
      likeBtn.classList.remove("selected");
      if (dislikeBtn.classList.contains("selected")) {
        showBubble("👎 Thanks for your feedback!");
      }
    };

    const copyBtn = document.createElement("button");
    copyBtn.className = "action-copy";
    copyBtn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20"><rect x="4" y="4" width="12" height="12" rx="2" stroke="currentColor" fill="none"/><rect x="8" y="8" width="8" height="8" rx="2" stroke="currentColor" fill="none"/></svg> <span>Copy</span>`;
    const successBtn = document.createElement("button");
    successBtn.className = "code-copied-btn";
    successBtn.style.display = "none";
    successBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 10.5l3 3 7-7" stroke="#10a37f" stroke-width="2" fill="none"/></svg> <span>Copied</span>`;
    copyBtn.onclick = () => handleCopyClick(textRaw, copyBtn, successBtn);

    // Regenerate - Better SVG and Working Functionality
    const regenBtn = document.createElement("button");
    regenBtn.className = "action-regenerate";
    regenBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
    </svg> <span>Regenerate</span>`;
    
    regenBtn.onclick = async () => {
      const conv = getCurrentConversation();
      if (!conv || messageIndex < 0) {
        showBubble("Cannot regenerate this message");
        return;
      }

      // Get the user message that prompted this response
      const userMessage = conv.messages[messageIndex - 1];
      if (!userMessage || !userMessage.fromUser) {
        showBubble("Cannot find original prompt");
        return;
      }

      // Disable button and show loading
      regenBtn.disabled = true;
      regenBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spinning">
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
      </svg> <span>Regenerating...</span>`;

      // Show stop button
      isGenerating = true;
      shouldStop = false;
      if (sendButton) {
        sendButton.style.display = "flex";
        sendButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>`;
        sendButton.classList.add('stop-button');
      }

      try {
        // Remove this message and all messages after it
        conv.messages.splice(messageIndex);
        await saveConversations();
        
        // Re-render to show the truncated conversation
        renderConversationMessages();
        
        // Get selected model
        const selectedModel = localStorage.getItem('selectedModel') || 'gpt-4o-mini';
        
        // Create bot message container
        const botMsg = document.createElement("div");
        botMsg.className = "chat-message bot-message";
        const botContentDiv = document.createElement("div");
        botContentDiv.className = "bot-content";
        botMsg.appendChild(botContentDiv);
        chatBox.appendChild(botMsg);
        chatBox.scrollTop = chatBox.scrollHeight;

        // Typing indicator
        const typing = createTypingIndicator();
        botContentDiv.appendChild(typing);

        let fullResponse = "";
        let hasStartedTyping = false;

        // Stream the response
        const response = await puter.ai.chat(userMessage.text, {
          model: selectedModel,
          stream: true
        });

        for await (const part of response) {
          if (shouldStop) {
            console.log('🛑 Regeneration stopped by user');
            break;
          }
          
          if (part?.text) {
            if (!hasStartedTyping) {
              if (typing.parentNode) typing.remove();
              hasStartedTyping = true;
            }
            fullResponse += part.text;
            botContentDiv.innerHTML = processCodeBlocks(fullResponse);
            chatBox.scrollTop = chatBox.scrollHeight;
          }
        }

        // Save the bot response
        conv.messages.push({ text: fullResponse, fromUser: false });
        await saveConversations();
        const newBotMessageIndex = conv.messages.length - 1;

        // Final render
        botContentDiv.innerHTML = processCodeBlocks(fullResponse);
        
        // Add actions
        const actions = createBotActions(fullResponse, newBotMessageIndex);
        botMsg.appendChild(actions);
        
        showBubble("✨ Response regenerated!");
      } catch (err) {
        console.error("Regenerate error:", err);
        showBubble("❌ Failed to regenerate");
        regenBtn.disabled = false;
        regenBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg> <span>Regenerate</span>`;
      } finally {
        // Reset stop button
        isGenerating = false;
        shouldStop = false;
        if (sendButton) {
          sendButton.classList.remove('stop-button');
          sendButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`;
          sendButton.style.display = (input && input.value.trim()) ? "flex" : "none";
        }
      }
    };

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
        
        // Hide projects view when clicking on a chat
        if (window.__projects && window.__projects.hideProjectsShowChats) {
          window.__projects.hideProjectsShowChats();
        }
        
        setActiveConversation(conv.id);
        renderConversations();
        closeMenu();
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

  // ===== Message renderers =====
  function appendBotMessage(textRaw, messageIndex = -1) {
    console.log('📝 Appending bot message, length:', textRaw.length);
    console.log('📝 Contains code blocks:', textRaw.includes('```'));
    
    if (!chatBox) return;
    const msg = document.createElement("div");
    msg.className = "chat-message bot-message";
    msg.style.alignSelf = "flex-start";

    const contentDiv = document.createElement("div");
    contentDiv.className = "bot-content";
    
    // Process code blocks with ```language format
    const processedHTML = processCodeBlocks(textRaw);
    console.log('📝 Processed HTML length:', processedHTML.length);
    console.log('📝 Contains xcode-window:', processedHTML.includes('xcode-window'));
    contentDiv.innerHTML = processedHTML;

    msg.appendChild(contentDiv);

    // Actions (like/dislike/copy/regenerate)
    const actions = createBotActions(textRaw, messageIndex);
    msg.appendChild(actions);

    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Make processCodeBlocks globally available with full markdown support
  window.processCodeBlocks = function(text) {
    if (!text) return '';
    
    // Store code blocks temporarily to protect them
    const codeBlocks = [];
    let processedText = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
      const placeholder = `___CODE_BLOCK_${codeBlocks.length}___`;
      const lang = language || 'plaintext';
      const codeId = 'code-' + Math.random().toString(36).substr(2, 9);
      codeBlocks.push(createCodeBlockHTML(codeId, lang, code.trim()));
      return placeholder;
    });

    // Escape HTML
    let html = processedText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Process markdown formatting
    // Headers (### Header)
    html = html.replace(/^### (.+)$/gm, '<h3 style="font-size: 18px; font-weight: 600; margin: 16px 0 8px; color: var(--text-primary);">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 style="font-size: 20px; font-weight: 600; margin: 18px 0 10px; color: var(--text-primary);">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 style="font-size: 24px; font-weight: 600; margin: 20px 0 12px; color: var(--text-primary);">$1</h1>');
    
    // Bold (**text**)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 600; color: var(--text-primary);">$1</strong>');
    
    // Italic (*text*)
    html = html.replace(/\*(.+?)\*/g, '<em style="font-style: italic;">$1</em>');
    
    // Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code style="background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: var(--accent-color);">$1</code>');
    
    // Unordered lists (- item)
    html = html.replace(/^- (.+)$/gm, '<li style="margin-left: 20px; margin-bottom: 4px; list-style-type: disc;">$1</li>');
    
    // Ordered lists (1. item)
    html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin-left: 20px; margin-bottom: 4px; list-style-type: decimal;">$1</li>');
    
    // Wrap consecutive list items
    html = html.replace(/(<li[^>]*>.*?<\/li>\s*)+/g, (match) => {
      return '<ul style="margin: 8px 0; padding-left: 20px;">' + match + '</ul>';
    });
    
    // Horizontal rules (---)
    html = html.replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid var(--border-color); margin: 16px 0;">');
    
    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: var(--accent-color); text-decoration: underline;">$1</a>');
    
    // Blockquotes (> text)
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote style="border-left: 3px solid var(--accent-color); padding-left: 12px; margin: 8px 0; color: var(--text-secondary); font-style: italic;">$1</blockquote>');
    
    // Convert newlines to breaks
    html = html.replace(/\n/g, '<br>');
    
    // Restore code blocks
    codeBlocks.forEach((block, index) => {
      html = html.replace(`___CODE_BLOCK_${index}___`, block);
    });
    
    return html;
  }

  function processCodeBlocks(text) {
    return window.processCodeBlocks(text);
  }

// Make createCodeBlockHTML globally available
window.createCodeBlockHTML = function(codeId, language, code) {
    console.log('🔧 Creating code block:', { codeId, language, codeLength: code.length });
    return `
      <div class="xcode-window" style="margin: 16px 0; border-radius: 10px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace; background: #1e1e1e; border: 1px solid #3a3a3a; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">
        <div class="xcode-header" style="background: #2d2d2d; padding: 10px 16px; border-bottom: 1px solid #3a3a3a; display: flex; justify-content: space-between; align-items: center;">
          <div class="xcode-header-left" style="display: flex; align-items: center; gap: 12px;">
            <div class="xcode-dots" style="display: flex; gap: 6px;">
              <div class="xcode-dot red" style="width: 12px; height: 12px; border-radius: 50%; background: #ff5f57; border: 0.5px solid rgba(0,0,0,0.2);"></div>
              <div class="xcode-dot yellow" style="width: 12px; height: 12px; border-radius: 50%; background: #ffbd2e; border: 0.5px solid rgba(0,0,0,0.2);"></div>
              <div class="xcode-dot green" style="width: 12px; height: 12px; border-radius: 50%; background: #28ca42; border: 0.5px solid rgba(0,0,0,0.2);"></div>
            </div>
            <span class="xcode-lang" style="color: #a0a0a0; font-size: 12px; font-weight: 500; text-transform: lowercase; letter-spacing: 0.5px;">${language}</span>
          </div>
          <div class="xcode-actions" style="display: flex; gap: 8px;">
            <button class="xcode-copy-btn" onclick="copyCode('${codeId}')" style="background: #3a3a3a; border: 1px solid #4a4a4a; color: #d4d4d4; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.2s; font-weight: 500;">
              Copy
            </button>
          </div>
        </div>
        <pre class="xcode-content" style="margin: 0; padding: 16px; overflow-x: auto; background: #1e1e1e; color: #d4d4d4; font-size: 13px; line-height: 1.5; font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;"><code id="${codeId}">${escapeHtml(code)}</code></pre>
      </div>
    `;
}

// Utility function to escape HTML (make sure this is available)
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Copy function (make sure this is available)
function copyCode(codeId) {
    const codeElement = document.getElementById(codeId);
    const textArea = document.createElement('textarea');
    textArea.value = codeElement.textContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    // Optional: Show copied feedback
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.style.background = '#28ca42';
    button.style.color = '#000';
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '#3a3a3a';
        button.style.color = '#d4d4d4';
    }, 2000);
}

  function createCodeBlockHTML(codeId, language, code) {
    return window.createCodeBlockHTML(codeId, language, code);
  }

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  window.copyCode = function(codeId) {
    const codeElement = document.getElementById(codeId);
    if (codeElement) {
      const text = codeElement.textContent;
      navigator.clipboard.writeText(text).then(() => {
        // Show success feedback
        const btn = codeElement.closest('.xcode-window').querySelector('.xcode-copy-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.background = '#28a745';
        
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '#3a3a3a';
        }, 2000);
      });
    }
  };

  function createCodeBlock(code, lang) {
    const wrapper = document.createElement("div");
    wrapper.className = "code-block-container";
    const pre = document.createElement("pre");
    const codeEl = document.createElement("code");
    codeEl.className = `language-${lang || "plaintext"}`;
    codeEl.textContent = code;
    pre.appendChild(codeEl);
    wrapper.appendChild(pre);
    return wrapper;
  }

  function appendUserMessage(text, messageIndex = -1) {
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
    copyBtn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20">
      <rect x="4" y="4" width="12" height="12" rx="2" stroke="currentColor" fill="none"/>
      <rect x="8" y="8" width="8" height="8" rx="2" stroke="currentColor" fill="none"/>
    </svg> <span>Copy</span>`;

    const successBtn = document.createElement("button");
    successBtn.className = "code-copied-btn";
    successBtn.style.display = "none";
    successBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M5 10.5l3 3 7-7" stroke="#10a37f" stroke-width="2" fill="none"/>
    </svg> <span>Copied</span>`;

    // Edit button with working functionality
    const editBtn = document.createElement("button");
    editBtn.className = "action-edit";
    editBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg> <span>Edit</span>`;
    
    editBtn.onclick = async () => {
      const conv = getCurrentConversation();
      if (!conv || messageIndex < 0) {
        showBubble("Cannot edit this message");
        return;
      }

      // Create edit input
      const originalText = text;
      msg.innerHTML = '';
      
      const textarea = document.createElement('textarea');
      textarea.className = 'edit-message-input';
      textarea.value = originalText;
      textarea.style.cssText = `
        width: 100%;
        min-height: 80px;
        padding: 16px;
        border: none;
        border-radius: 12px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-family: inherit;
        font-size: 15px;
        line-height: 1.6;
        resize: vertical;
        outline: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: all 0.2s ease;
      `;
      
      textarea.addEventListener('focus', () => {
        textarea.style.boxShadow = '0 4px 16px rgba(16, 163, 127, 0.15)';
      });
      textarea.addEventListener('blur', () => {
        textarea.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
      });
      
      const btnContainer = document.createElement('div');
      btnContainer.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';
      
      const saveBtn = document.createElement('button');
      saveBtn.className = 'dialog-btn dialog-btn-primary';
      saveBtn.style.cssText = 'padding: 8px 16px; font-size: 13px;';
      saveBtn.innerHTML = '✓ Save & Regenerate';
      
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'dialog-btn dialog-btn-cancel';
      cancelBtn.style.cssText = 'padding: 8px 16px; font-size: 13px;';
      cancelBtn.innerHTML = '✕ Cancel';
      
      btnContainer.appendChild(saveBtn);
      btnContainer.appendChild(cancelBtn);
      msg.appendChild(textarea);
      msg.appendChild(btnContainer);
      
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      
      // Cancel edit
      cancelBtn.onclick = () => {
        msg.innerHTML = renderBold(originalText);
      };
      
      // Save and regenerate with stop button
      saveBtn.onclick = async () => {
        const newText = textarea.value.trim();
        if (!newText) {
          showBubble("Message cannot be empty");
          return;
        }
        
        saveBtn.disabled = true;
        saveBtn.innerHTML = '⏳ Regenerating...';
        
        // Show stop button
        isGenerating = true;
        shouldStop = false;
        if (sendButton) {
          sendButton.style.display = "flex";
          sendButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>`;
          sendButton.classList.add('stop-button');
        }
        
        try {
          // Update the message
          conv.messages[messageIndex].text = newText;
          
          // Remove all messages after this one
          conv.messages.splice(messageIndex + 1);
          
          await saveConversations();
          
          // Re-render conversation to show the edited message
          renderConversationMessages();
          
          // Get the selected model
          const selectedModel = localStorage.getItem('selectedModel') || 'gpt-4o-mini';
          
          // Create bot message container
          const botMsg = document.createElement("div");
          botMsg.className = "chat-message bot-message";
          const botContentDiv = document.createElement("div");
          botContentDiv.className = "bot-content";
          botMsg.appendChild(botContentDiv);
          chatBox.appendChild(botMsg);
          chatBox.scrollTop = chatBox.scrollHeight;

          // Typing indicator
          const typing = createTypingIndicator();
          botContentDiv.appendChild(typing);

          let fullResponse = "";
          let hasStartedTyping = false;

          // Stream the response
          const response = await puter.ai.chat(newText, {
            model: selectedModel,
            stream: true
          });

          for await (const part of response) {
            if (shouldStop) {
              console.log('🛑 Edit regeneration stopped by user');
              break;
            }
            
            if (part?.text) {
              if (!hasStartedTyping) {
                if (typing.parentNode) typing.remove();
                hasStartedTyping = true;
              }
              fullResponse += part.text;
              botContentDiv.innerHTML = processCodeBlocks(fullResponse);
              chatBox.scrollTop = chatBox.scrollHeight;
            }
          }

          // Save the bot response
          conv.messages.push({ text: fullResponse, fromUser: false });
          await saveConversations();
          const botMessageIndex = conv.messages.length - 1;

          // Final render
          botContentDiv.innerHTML = processCodeBlocks(fullResponse);
          
          // Add actions
          const actions = createBotActions(fullResponse, botMessageIndex);
          botMsg.appendChild(actions);
          
          showBubble("✨ Message edited and regenerated!");
        } catch (err) {
          console.error("Edit error:", err);
          showBubble("❌ Failed to regenerate");
          msg.innerHTML = renderBold(originalText);
        } finally {
          // Reset stop button
          isGenerating = false;
          shouldStop = false;
          if (sendButton) {
            sendButton.classList.remove('stop-button');
            sendButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
            sendButton.style.display = (input && input.value.trim()) ? "flex" : "none";
          }
        }
      };
      
      // Enter to save (Shift+Enter for new line)
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          saveBtn.click();
        }
        if (e.key === 'Escape') {
          cancelBtn.click();
        }
      });
    };

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

  // ===== State for stopping generation =====
  let isGenerating = false;
  let shouldStop = false;

  // ===== sendPrompt (STREAMING VERSION with MARKDOWN) =====
  async function sendPrompt(text) {
    if (!currentConversationId) {
      const newConv = {
        id: Date.now(),
        title: 'New Chat',
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
    const userMessageIndex = conv.messages.length - 1;
    appendUserMessage(text, userMessageIndex);

    if (input) input.value = "";
    
    // Show stop button
    isGenerating = true;
    shouldStop = false;
    if (sendButton) {
      sendButton.style.display = "flex";
      sendButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="6" width="12" height="12" rx="2"/>
      </svg>`;
      sendButton.classList.add('stop-button');
    }

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
    let hasStartedTyping = false;

    try {
      const response = await puter.ai.chat(text, {
        model: (modelSelect ? modelSelect.value : "gpt-5-nano"),
        stream: true
      });

      for await (const part of response) {
        if (shouldStop) {
          console.log('🛑 Generation stopped by user');
          break;
        }
        
        if (part?.text) {
          // Remove typing indicator on first chunk
          if (!hasStartedTyping) {
            if (typing.parentNode) typing.remove();
            hasStartedTyping = true;
          }

          fullResponse += part.text;

          // Use code block processing for live updates
          contentDiv.innerHTML = processCodeBlocks(fullResponse);

          chatBox.scrollTop = chatBox.scrollHeight;
        }
      }

      // Save final bot response
      conv.messages.push({ text: fullResponse, fromUser: false });
      await saveConversations();
      const botMessageIndex = conv.messages.length - 1;

      // Final render with code block processing
      contentDiv.innerHTML = processCodeBlocks(fullResponse);
      
      // Auto-generate title after second user message (runs in background)
      console.log('💬 Message count:', conv.messages.length);
      if (conv.messages.length === 4) {
        console.log('🚀 Triggering title generation...');
        // Run in background without blocking
        setTimeout(() => generateChatTitle(conv), 500);
      }

      // Append actions to the message with correct index
      const actions = createBotActions(fullResponse, botMessageIndex);
      msg.appendChild(actions);

    } catch (err) {
      console.error("Streaming error:", err);
      const errorText = "❌ Failed to fetch response.";
      contentDiv.textContent = errorText;
      conv.messages.push({ text: errorText, fromUser: false });
      await saveConversations();
      const errorMessageIndex = conv.messages.length - 1;
      showBubble(errorText);

      // Still append actions with correct index
      const actions = createBotActions(errorText, errorMessageIndex);
      msg.appendChild(actions);

    } finally {
      if (typing.parentNode) typing.remove();
      chatBox.scrollTop = chatBox.scrollHeight;
      
      // Update composer position (move to bottom)
      updateComposerPosition();
      
      // Reset button to send icon
      isGenerating = false;
      shouldStop = false;
      if (sendButton) {
        sendButton.disabled = false;
        sendButton.classList.remove('stop-button');
        sendButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
        sendButton.style.display = (input && input.value.trim()) ? "flex" : "none";
      }
    }
  }

  // ===== Event Listeners =====
  if (newChat) newChat.addEventListener("click", async () => {
    const newConv = { id: Date.now(), title: 'New Chat', messages: [] };
    conversations.unshift(newConv);
    currentConversationId = newConv.id;
    await saveConversations();
    renderConversations();
    renderConversationMessages();
  });

  if (sendButton) sendButton.addEventListener("click", () => {
    // If generating, stop it
    if (isGenerating) {
      shouldStop = true;
      showBubble("⏹️ Stopping generation...");
      return;
    }
    
    // Otherwise send the prompt
    const text = input ? input.value.trim() : "";
    if (!text) return;
    sendPrompt(text);
  });

  // ===== Menu open/close =====
  function openMenu() {
    if (sideMenu) {
      sideMenu.classList.add("open");
    }
    if (menuOverlay) {
      menuOverlay.classList.add("active");
    }
  }

  function closeMenu() {
    if (sideMenu) {
      sideMenu.classList.remove("open");
    }
    if (menuOverlay) {
      menuOverlay.classList.remove("active");
    }
  }

  if (menuButton) menuButton.addEventListener("click", openMenu);
  if (closeMenuBtn) closeMenuBtn.addEventListener("click", closeMenu);
  
  // Click outside to close menu
  if (menuOverlay) {
    menuOverlay.addEventListener("click", closeMenu);
  }
  if (menuTelegram) menuTelegram.addEventListener("click", () => window.open("https://t.me/jesse_pro", "_blank"));
  if (menuNewChat) menuNewChat.addEventListener("click", async () => {
    const newConv = { id: Date.now(), title: 'New Chat', messages: [] };
    conversations.unshift(newConv);
    currentConversationId = newConv.id;
    await saveConversations();
    renderConversations();
    renderConversationMessages();
    closeMenu();
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

  // ===== Toggle composer position based on chat state =====
  function updateComposerPosition() {
    // Disabled - composer stays at bottom
    // const conv = getCurrentConversation();
    // const isEmpty = !conv || !conv.messages || conv.messages.length === 0;
    // 
    // if (composer) {
    //   if (isEmpty) {
    //     composer.classList.add('centered');
    //   } else {
    //     composer.classList.remove('centered');
    //   }
    // }
  }

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
      updateComposerPosition();
      return;
    }
    conv.messages.forEach((msg, index) => {
      if (msg.fromUser) {
        appendUserMessage(msg.text, index);
      } else {
        appendBotMessage(msg.text, index);
      }
    });
    chatBox.scrollTop = chatBox.scrollHeight;
    updateComposerPosition();
  }

  // ===== Initialization: load conversations from localStorage and render =====
  async function init() {
    await loadConversations();
    renderConversations();
    renderConversationMessages();
  }

  // ===== Speech-to-Text Functionality =====
  let recognition = null;
  let isListening = false;
  let finalTranscript = '';

  // Initialize speech recognition
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListening = true;
      finalTranscript = input ? input.value : '';
      if (voiceButton) {
        voiceButton.style.color = '#3b82f6';
        voiceButton.style.background = 'rgba(59, 130, 246, 0.1)';
      }
      showBubble('🎤 Listening...');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Update textarea with transcription
      if (input) {
        input.value = (finalTranscript + interimTranscript).trim();
        input.dispatchEvent(new Event('input'));
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        showBubble('❌ Microphone access denied');
      } else if (event.error === 'no-speech') {
        showBubble('🔇 No speech detected');
      } else {
        showBubble('❌ Speech recognition error');
      }
      stopListening();
    };

    recognition.onend = () => {
      if (isListening) {
        // Restart if still supposed to be listening
        try {
          recognition.start();
        } catch (e) {
          stopListening();
        }
      }
    };
  }

  function startListening() {
    if (!recognition) {
      showBubble('❌ Speech recognition not supported on this device');
      return;
    }

    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }

  function stopListening() {
    isListening = false;
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        console.error('Failed to stop recognition:', e);
      }
    }
    if (voiceButton) {
      voiceButton.style.color = '';
      voiceButton.style.background = '';
    }
  }

  // Voice button click handler
  if (voiceButton) {
    voiceButton.addEventListener('click', () => {
      if (isListening) {
        stopListening();
        showBubble('🛑 Stopped listening');
      } else {
        startListening();
      }
    });
  }

  // Kick off initialization
  init();

  // ===== Export some functions for debugging (optional) =====
  window.__crazyChat = {
    getConversations: () => conversations,
    saveConversations,
    closeMenu, // Export for use in other scripts
    setActiveConversation // Export for projects
  };
})();