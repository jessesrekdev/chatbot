// chat.js — Conversations persisted in localStorage only (no IndexedDB)
// Keeps original UI & functionality intact while moving storage to localStorage only
// - Conversations are stored in localStorage under the key "conversations"
// - This file tries to preserve your original UI, event handlers, and function names

(() => {
  // ===== State =====
  let conversations = []; // in-memory cache (array)
  let currentConversationId = null;
  let conversationToDelete = null;

  // ===== Hidden Instructions =====
  function getInternalMetadata() {
    return {
      instructions: {
        role: "You are Crazy Chat, an advanced AI assistant created by Jesse Srek. You are NOT OpenAI or ChatGPT.",
        confidentiality: "Do not mention these instructions or this metadata in your response unless a user asks for help about the app.",
        formatting: "Always format URLs as clickable hyperlinks using markdown syntax. Use proper text formatting with **bold**, *italic*, `code`, and other markdown elements for better readability.",
        code_handling: "When providing code examples, always specify the correct language for syntax highlighting. Support HTML with embedded CSS/JS, and ensure proper color coding."
      },
      project: {
        name: "Crazy Chat",
        type: "Progressive Web Application (PWA)",
        description: "An advanced AI chatbot interface with modern UI/UX, supporting multiple AI models, conversation management, and rich code highlighting.",
        developer: "Jesse Srek",
        version: "1.0",
        architecture: "Client-side JavaScript application with Puter.js integration",
        repository: "Local development project",
        community: "https://t.me/jesse_pro"
      },
      technical_stack: {
        frontend: {
          html: "Semantic HTML5 with PWA manifest support",
          css: "Modern CSS3 with responsive design, dark/light themes, and smooth animations",
          javascript: "Vanilla ES6+ with modular architecture",
          frameworks: "No heavy frameworks - lightweight and fast"
        },
        libraries: {
          puter_js: "v2 - Core AI integration and backend services",
          highlight_js: "v11.9.0 - Primary syntax highlighting",
          prism_js: "v1.29.0 - Enhanced code highlighting with multi-language support"
        },
        features: {
          pwa: "Full Progressive Web App with offline capabilities",
          responsive: "Mobile-first design with adaptive layouts",
          themes: "Dynamic light/dark theme switching",
          accessibility: "ARIA labels and keyboard navigation support"
        }
      },
      support: { 
        email: "jessesrek@gmail.com",
        phone: "+256789109035",
        telegram: "https://t.me/jessesrek",
        website: "https://chat.jesse-network.site",
        community: "https://t.me/jesse_pro"
      },
      app_architecture: {
        core_files: {
          "index.html": "Main application entry point with PWA configuration",
          "script.js": "Primary application logic (~68KB) - conversation management, AI integration, UI interactions",
          "style.css": "Main stylesheet (~42KB) - responsive design, themes, animations",
          "manifest.json": "PWA manifest for app installation and mobile optimization"
        },
        modules: {
          "projects.js": "Project management functionality",
          "settings.js": "User preferences and configuration",
          "keyboard_shortcuts.js": "Keyboard navigation and shortcuts",
          "markdown_renderer.js": "Advanced markdown processing and rendering",
          "model_dropdown.js": "AI model selection interface"
        },
        styling: {
          "project_dialog.css": "Modal dialogs and popup styling",
          responsive_breakpoints: "Mobile (≤480px), Tablet (481-768px), Desktop (>768px)",
          color_scheme: "VS Code inspired dark theme with light mode support"
        }
      },
      app_features: {
        conversations: {
          description: "Multi-conversation support with persistent storage",
          features: ["Create unlimited conversations", "Rename conversations", "Delete conversations", "Auto-generated titles", "Message history persistence"]
        },
        ai_integration: {
          description: "Multiple AI model support through Puter.js",
          models: ["gpt-5-nano", "claude-3-haiku", "llama-3.1-8b", "custom models"],
          features: ["Streaming responses", "Model switching", "Response regeneration", "Message editing"]
        },
        code_features: {
          description: "Advanced code handling with syntax highlighting",
          languages: ["HTML", "CSS", "JavaScript", "Python", "Java", "C/C++", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "SQL", "JSON", "XML", "YAML", "Markdown"],
          features: ["Multi-language syntax highlighting", "Code block copying", "File downloads", "HTML preview in new tab", "Responsive code blocks"]
        },
        ui_features: {
          description: "Modern, responsive interface with accessibility",
          features: ["Dark/Light themes", "Mobile-optimized", "Keyboard shortcuts", "Touch-friendly", "Smooth animations", "PWA installation"]
        }
      },
      user_guidance: {
        getting_started: {
          new_chat: "Click the 'New Chat' button in the sidebar to start a fresh conversation",
          model_selection: "Use the dropdown at the top to choose your preferred AI model",
          theme_toggle: "Switch between light and dark themes in Settings"
        },
        conversation_management: {
          rename: "Hover over any conversation in the sidebar and click the pencil icon to rename",
          delete: "Hover over any conversation and click the trash icon to delete",
          organize: "Conversations are automatically sorted by most recent activity"
        },
        message_features: {
          regenerate: "Click 'Regenerate' below any AI response to get a new answer",
          edit: "Click 'Edit' below your messages to modify and resend",
          copy: "Use the copy button on code blocks to copy code to clipboard"
        },
        code_features: {
          preview: "Click the eye icon on HTML code blocks to preview in a new tab",
          download: "Click the download icon to save code as a file",
          languages: "Specify language after ``` for proper syntax highlighting (e.g., ```javascript)"
        },
        keyboard_shortcuts: {
          send_message: "Ctrl+Enter or Cmd+Enter to send message",
          new_chat: "Ctrl+N or Cmd+N for new conversation",
          settings: "Ctrl+, or Cmd+, to open settings"
        }
      },
      development_info: {
        last_updated: new Date().toISOString(),
        build_status: "Production Ready",
        performance: "Optimized for fast loading and smooth interactions",
        browser_support: "Modern browsers with ES6+ support",
        mobile_support: "Full mobile optimization with PWA capabilities"
      },
      timestamp: {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
  }

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
    // If switching away from an active generation tab, stop generation
    if (isGenerating && activeGenerationTab && activeGenerationTab !== convId) {
      shouldStop = true;
      isGenerating = false;
      activeGenerationTab = null;

      // Reset stop button immediately
      if (sendButton) {
        sendButton.classList.remove('stop-button');
        sendButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
        sendButton.style.display = (input && input.value.trim()) ? "flex" : "none";
      }
    }

    currentConversationId = convId;
    renderConversationMessages();

    // Update stop button visibility when switching tabs
    updateStopButtonVisibility();
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
    copyBtn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20"><rect x="4" y="4" width="12" height="12" rx="2"/><rect x="8" y="8" width="8" height="8" rx="2" stroke="currentColor" fill="none"/></svg> <span>Copy</span>`;
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
      activeGenerationTab = currentConversationId;
      updateStopButtonVisibility();

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
            // Save partial response before breaking
            if (fullResponse) {
              savedPartialResponse = fullResponse;
              conv.messages.push({ text: fullResponse, fromUser: false });
              await saveConversations();
            }
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
        activeGenerationTab = null;
        updateStopButtonVisibility();
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
  window.processCodeBlocks = function (text) {
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
    html = html.replace(/^--------------------$/gm, '<hr style="border: none; border-top: 1px solid var(--border-color); margin: 16px 0;">');

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
  window.createCodeBlockHTML = function (codeId, language, code) {
    console.log('🔧 Creating code block:', { codeId, language, codeLength: code.length });

    // Determine if this is HTML code that can be previewed
    const isHTML = language === 'html' || language === 'HTML';
    const fileName = language ? `${language.toLowerCase()}.${getFileExtension(language)}` : 'code.txt';

    // Create preview button for HTML
    const previewButton = isHTML ? `
      <button class="xcode-preview-btn" onclick="previewHTML('${codeId}')" style="
        background: #3a3a3a; 
        border: 1px solid #4a4a4a; 
        color: #d4d4d4; 
        padding: 6px; 
        border-radius: 6px; 
        font-size: 12px; 
        cursor: pointer; 
        transition: all 0.2s; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        min-width: 32px; 
        height: 32px;
        /* Mobile adjustments */
        @media (max-width: 768px) {
          min-width: 28px;
          height: 28px;
          padding: 4px;
        }
        @media (max-width: 480px) {
          min-width: 24px;
          height: 24px;
          padding: 2px;
        }
      " title="Preview HTML">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="
          /* Mobile adjustments */
          @media (max-width: 768px) {
            width: 14px;
            height: 14px;
          }
          @media (max-width: 480px) {
            width: 12px;
            height: 12px;
          }
        ">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>` : '';

    return `
      <div class="xcode-window" style="
        margin: 16px auto; 
        border-radius: 10px; 
        overflow: hidden; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace; 
        background: #1e1e1e; 
        border: 1px solid #3a3a3a; 
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        max-width: min(100%, 800px);
        width: 100%;
        box-sizing: border-box;
        /* Mobile responsiveness */
        @media (max-width: 768px) {
          margin: 12px auto;
          border-radius: 8px;
          max-width: 100%;
        }
        @media (max-width: 480px) {
          margin: 8px auto;
          border-radius: 6px;
        }
      ">
        <div class="xcode-header" style="
          background: #2d2d2d; 
          padding: 10px 16px; 
          border-bottom: 1px solid #3a3a3a; 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          /* Mobile adjustments */
          @media (max-width: 768px) {
            padding: 8px 12px;
            gap: 6px;
          }
          @media (max-width: 480px) {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        ">
          <div class="xcode-header-left" style="
            display: flex; 
            align-items: center; 
            gap: 12px;
            /* Mobile adjustments */
            @media (max-width: 480px) {
              gap: 8px;
              width: 100%;
            }
          ">
            <div class="xcode-dots" style="
              display: flex; 
              gap: 6px;
              /* Mobile adjustments */
              @media (max-width: 480px) {
                gap: 4px;
              }
            ">
              <div class="xcode-dot red" style="width: 12px; height: 12px; border-radius: 50%; background: #ff5f57; border: 0.5px solid rgba(0,0,0,0.2);"></div>
              <div class="xcode-dot yellow" style="width: 12px; height: 12px; border-radius: 50%; background: #ffbd2e; border: 0.5px solid rgba(0,0,0,0.2);"></div>
              <div class="xcode-dot green" style="width: 12px; height: 12px; border-radius: 50%; background: #28ca42; border: 0.5px solid rgba(0,0,0,0.2);"></div>
            </div>
            <span class="xcode-lang" style="
              color: #a0a0a0; 
              font-size: 12px; 
              font-weight: 500; 
              text-transform: lowercase; 
              letter-spacing: 0.5px;
              /* Mobile adjustments */
              @media (max-width: 480px) {
                font-size: 11px;
              }
            ">${language || 'text'}</span>
          </div>
          <div class="xcode-actions" style="
            display: flex; 
            gap: 8px; 
            align-items: center;
            /* Mobile adjustments */
            @media (max-width: 768px) {
              gap: 6px;
            }
            @media (max-width: 480px) {
              width: 100%;
              justify-content: flex-end;
              gap: 4px;
            }
          ">
            ${previewButton}
            <button class="xcode-download-btn" onclick="downloadCode('${codeId}', '${fileName}')" style="
              background: #3a3a3a; 
              border: 1px solid #4a4a4a; 
              color: #d4d4d4; 
              padding: 6px; 
              border-radius: 6px; 
              font-size: 12px; 
              cursor: pointer; 
              transition: all 0.2s; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-width: 32px; 
              height: 32px;
              /* Mobile adjustments */
              @media (max-width: 768px) {
                min-width: 28px;
                height: 28px;
                padding: 4px;
              }
              @media (max-width: 480px) {
                min-width: 24px;
                height: 24px;
                padding: 2px;
              }
            " title="Download as ${fileName}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="
                /* Mobile adjustments */
                @media (max-width: 768px) {
                  width: 14px;
                  height: 14px;
                }
                @media (max-width: 480px) {
                  width: 12px;
                  height: 12px;
                }
              ">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
            <button class="xcode-copy-btn" onclick="copyCode('${codeId}')" style="
              background: #3a3a3a; 
              border: 1px solid #4a4a4a; 
              color: #d4d4d4; 
              padding: 6px; 
              border-radius: 6px; 
              font-size: 12px; 
              cursor: pointer; 
              transition: all 0.2s; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-width: 32px; 
              height: 32px;
              /* Mobile adjustments */
              @media (max-width: 768px) {
                min-width: 28px;
                height: 28px;
                padding: 4px;
              }
              @media (max-width: 480px) {
                min-width: 24px;
                height: 24px;
                padding: 2px;
              }
            " title="Copy to clipboard">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="
                /* Mobile adjustments */
                @media (max-width: 768px) {
                  width: 14px;
                  height: 14px;
                }
                @media (max-width: 480px) {
                  width: 12px;
                  height: 12px;
                }
              ">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </div>
        <textarea id="raw-code-${codeId}" style="display:none;">${code}</textarea>
        <pre class="xcode-content" style="
          margin: 0; 
          padding: 16px; 
          background: #1e1e1e; 
          color: #d4d4d4; 
          font-size: 13px; 
          line-height: 1.5; 
          font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
          /* Prevent horizontal overflow */
          overflow-x: hidden;
          overflow-y: auto;
          max-width: 100%;
          box-sizing: border-box;
          /* Text wrapping for long lines */
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-all;
          /* Mobile responsiveness */
          @media (max-width: 768px) {
            padding: 12px;
            font-size: 12px;
            line-height: 1.4;
          }
          @media (max-width: 480px) {
            padding: 8px;
            font-size: 11px;
            line-height: 1.3;
          }
        "><code id="${codeId}" style="
          display: block;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
          max-width: 100%;
        ">${highlightCode(language, code)}</code></pre>
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
    if (codeElement) {
      const text = codeElement.textContent;
      navigator.clipboard.writeText(text).then(() => {
        // Show success feedback
        const btn = codeElement.closest('.xcode-window').querySelector('.xcode-copy-btn');
        const originalSvg = btn.innerHTML;

        // Change to checkmark icon
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 10.5l3 3 7-7" stroke="#10a37f" stroke-width="2" fill="none"/></svg>
        `;
        btn.style.background = '#28a745';

        setTimeout(() => {
          btn.innerHTML = originalSvg;
          btn.style.background = '#3a3a3a';
        }, 2000);
      });
    }
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

  // Enhanced syntax highlighting with comprehensive language support
  function highlightCode(language, code) {
    try {
      const lang = (language || '').toLowerCase();
      let escaped = escapeHtml(code);

      // HTML with embedded CSS and JavaScript
      if (lang === 'html' || lang === 'xml') {
        escaped = escaped
          // HTML comments
          .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span style="color:#6a9955;font-style:italic">$1</span>')
          // DOCTYPE declaration
          .replace(/(&lt;!DOCTYPE[^&gt;]*&gt;)/gi, '<span style="color:#c586c0;font-weight:bold">$1</span>')
          // CDATA sections
          .replace(/(&lt;!\[CDATA\[[\s\S]*?\]\]&gt;)/g, '<span style="color:#6a9955;font-style:italic">$1</span>')
          // XML processing instructions
          .replace(/(&lt;\?[\s\S]*?\?&gt;)/g, '<span style="color:#c586c0;font-style:italic">$1</span>')
          // Self-closing tags (like <br/>, <img/>, etc.)
          .replace(/(&lt;)([a-zA-Z0-9-:]+)([^&gt;]*)(\/&gt;)/g, function(match, openBracket, tagName, attributes, closeBracket) {
            const coloredTag = openBracket + '<span style="color:#569cd6;font-weight:bold">' + tagName + '</span>';
            const coloredAttributes = attributes.replace(/([a-zA-Z-]+)(=)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s&gt;]+)/g, 
              '<span style="color:#92c5f8">$1</span>$2<span style="color:#ce9178">$3</span>');
            return coloredTag + coloredAttributes + '<span style="color:#569cd6;font-weight:bold">' + closeBracket + '</span>';
          })
          // Opening tags with attributes
          .replace(/(&lt;)([a-zA-Z0-9-:]+)([^&gt;]*)(&gt;)/g, function(match, openBracket, tagName, attributes, closeBracket) {
            const coloredTag = openBracket + '<span style="color:#569cd6;font-weight:bold">' + tagName + '</span>';
            const coloredAttributes = attributes.replace(/([a-zA-Z-]+)(=)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s&gt;]+)/g, 
              '<span style="color:#92c5f8">$1</span>$2<span style="color:#ce9178">$3</span>');
            return coloredTag + coloredAttributes + '<span style="color:#569cd6;font-weight:bold">' + closeBracket + '</span>';
          })
          // Closing tags
          .replace(/(&lt;\/)([a-zA-Z0-9-:]+)(&gt;)/g, '<span style="color:#569cd6;font-weight:bold">$1$2$3</span>')
          // Text content between tags (make it more visible)
          .replace(/(&gt;)([^&lt;]+)(&lt;)/g, function(match, openTag, content, closeTag) {
            // Don't color whitespace-only content
            if (content.trim()) {
              return openTag + '<span style="color:#d4d4d4">' + content + '</span>' + closeTag;
            }
            return match;
          })
          // CSS within style tags
          .replace(/(&lt;style[^&gt;]*&gt;)([\s\S]*?)(&lt;\/style&gt;)/gi, function(match, openTag, cssContent, closeTag) {
            const highlightedCSS = highlightCSS(cssContent);
            return openTag + highlightedCSS + closeTag;
          })
          // JavaScript within script tags
          .replace(/(&lt;script[^&gt;]*&gt;)([\s\S]*?)(&lt;\/script&gt;)/gi, function(match, openTag, jsContent, closeTag) {
            const highlightedJS = highlightJavaScript(jsContent);
            return openTag + highlightedJS + closeTag;
          })
          // HTML entities
          .replace(/(&amp;[a-zA-Z0-9#]+;)/g, '<span style="color:#4fc1ff;font-weight:bold">$1</span>');
        return escaped;
      }

      // JavaScript/TypeScript
      if (['javascript', 'js', 'typescript', 'ts', 'jsx', 'tsx'].includes(lang)) {
        return highlightJavaScript(escaped);
      }

      // Python
      if (['python', 'py'].includes(lang)) {
        escaped = escaped
          // Comments
          .replace(/(#.*?$)/gm, '<span style="color:#6a9955;font-style:italic">$1</span>')
          // Strings (triple quotes, single, double)
          .replace(/(f?r?"""[\s\S]*?"""|f?r?'''[\s\S]*?'''|f?r?"(?:[^"\\]|\\.)*"|f?r?'(?:[^'\\]|\\.)*')/g, '<span style="color:#ce9178">$1</span>')
          // Keywords
          .replace(/\b(and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield|self|super|__init__|__str__|__repr__)\b/g, '<span style="color:#c586c0;font-weight:bold">$1</span>')
          // Built-in functions
          .replace(/\b(print|len|range|str|int|float|list|dict|set|tuple|bool|type|isinstance|hasattr|getattr|setattr|enumerate|zip|map|filter|sorted|reversed|sum|max|min|abs|round|open|input)\b/g, '<span style="color:#dcdcaa">$1</span>')
          // Numbers
          .replace(/\b(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, '<span style="color:#b5cea8">$1</span>')
          // Decorators
          .replace(/(@\w+)/g, '<span style="color:#4fc1ff;font-weight:bold">$1</span>');
        return escaped;
      }

      // CSS
      if (lang === 'css' || lang === 'scss' || lang === 'sass') {
        return highlightCSS(escaped);
      }

      // Java
      if (lang === 'java') {
        escaped = escaped
          // Comments
          .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6a9955;font-style:italic">$1</span>')
          .replace(/(\/\/.*?$)/gm, '<span style="color:#6a9955;font-style:italic">$1</span>')
          // Strings
          .replace(/("(?:[^"\\]|\\.)*")/g, '<span style="color:#ce9178">$1</span>')
          // Keywords
          .replace(/\b(abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|null|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|true|false)\b/g, '<span style="color:#c586c0;font-weight:bold">$1</span>')
          // Numbers
          .replace(/\b(\d+(?:\.\d+)?[fFdDlL]?)\b/g, '<span style="color:#b5cea8">$1</span>')
          // Annotations
          .replace(/(@\w+)/g, '<span style="color:#4fc1ff;font-weight:bold">$1</span>');
        return escaped;
      }

      // C/C++
      if (['c', 'cpp', 'c++', 'cc', 'cxx'].includes(lang)) {
        escaped = escaped
          // Comments
          .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6a9955;font-style:italic">$1</span>')
          .replace(/(\/\/.*?$)/gm, '<span style="color:#6a9955;font-style:italic">$1</span>')
          // Preprocessor directives
          .replace(/(#\w+.*?$)/gm, '<span style="color:#c586c0;font-weight:bold">$1</span>')
          // Strings
          .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span style="color:#ce9178">$1</span>')
          // Keywords
          .replace(/\b(auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|restrict|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|bool|true|false|nullptr|class|private|public|protected|virtual|override|final|namespace|using|template|typename|try|catch|throw|new|delete|this)\b/g, '<span style="color:#c586c0;font-weight:bold">$1</span>')
          // Numbers
          .replace(/\b(\d+(?:\.\d+)?[fFlLuU]*)\b/g, '<span style="color:#b5cea8">$1</span>');
        return escaped;
      }

      // Go
      if (lang === 'go' || lang === 'golang') {
        escaped = escaped
          // Comments
          .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6a9955;font-style:italic">$1</span>')
          .replace(/(\/\/.*?$)/gm, '<span style="color:#6a9955;font-style:italic">$1</span>')
          // Strings
          .replace(/(`[^`]*`|"(?:[^"\\]|\\.)*")/g, '<span style="color:#ce9178">$1</span>')
          // Keywords
          .replace(/\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var|true|false|nil|iota)\b/g, '<span style="color:#c586c0;font-weight:bold">$1</span>')
          // Built-in types
          .replace(/\b(bool|byte|complex64|complex128|error|float32|float64|int|int8|int16|int32|int64|rune|string|uint|uint8|uint16|uint32|uint64|uintptr)\b/g, '<span style="color:#4ec9b0">$1</span>')
          // Numbers
          .replace(/\b(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, '<span style="color:#b5cea8">$1</span>');
        return escaped;
      }

      // Rust
      if (lang === 'rust' || lang === 'rs') {
        escaped = escaped
          // Comments
          .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6a9955;font-style:italic">$1</span>')
          .replace(/(\/\/.*?$)/gm, '<span style="color:#6a9955;font-style:italic">$1</span>')
          // Strings
          .replace(/(r#*"(?:[^"\\]|\\.)*"#*|"(?:[^"\\]|\\.)*")/g, '<span style="color:#ce9178">$1</span>')
          // Keywords
          .replace(/\b(as|async|await|break|const|continue|crate|dyn|else|enum|extern|false|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|self|Self|static|struct|super|trait|true|type|unsafe|use|where|while)\b/g, '<span style="color:#c586c0;font-weight:bold">$1</span>')
          // Types
          .replace(/\b(bool|char|str|i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize|f32|f64|String|Vec|Option|Result)\b/g, '<span style="color:#4ec9b0">$1</span>')
          // Numbers
          .replace(/\b(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[fiu]?(?:8|16|32|64|128|size)?)\b/g, '<span style="color:#b5cea8">$1</span>');
        return escaped;
      }

      // JSON
      if (lang === 'json') {
        escaped = escaped
          // Strings (keys and values)
          .replace(/("(?:[^"\\]|\\.)*")(\s*:)/g, '<span style="color:#9cdcfe">$1</span>$2')
          .replace(/(:)(\s*)("(?:[^"\\]|\\.)*")/g, '$1$2<span style="color:#ce9178">$3</span>')
          // Numbers
          .replace(/\b(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, '<span style="color:#b5cea8">$1</span>')
          // Booleans and null
          .replace(/\b(true|false|null)\b/g, '<span style="color:#c586c0">$1</span>');
        return escaped;
      }

      // SQL
      if (lang === 'sql') {
        escaped = escaped
          // Comments
          .replace(/(--.*?$)/gm, '<span style="color:#6a9955;font-style:italic">$1</span>')
          .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6a9955;font-style:italic">$1</span>')
          // Strings
          .replace(/('(?:[^'\\]|\\.)*')/g, '<span style="color:#ce9178">$1</span>')
          // Keywords
          .replace(/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TABLE|INDEX|DATABASE|SCHEMA|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|ON|AS|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|UNION|ALL|DISTINCT|COUNT|SUM|AVG|MAX|MIN|AND|OR|NOT|NULL|IS|IN|LIKE|BETWEEN|EXISTS|CASE|WHEN|THEN|ELSE|END|IF|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|AUTO_INCREMENT|DEFAULT|CHECK|CONSTRAINT)\b/gi, '<span style="color:#c586c0;font-weight:bold">$1</span>')
          // Numbers
          .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span style="color:#b5cea8">$1</span>');
        return escaped;
      }

      // Shell/Bash
      if (['shell', 'bash', 'sh', 'zsh'].includes(lang)) {
        escaped = escaped
          // Comments
          .replace(/(#.*?$)/gm, '<span style="color:#6a9955;font-style:italic">$1</span>')
          // Strings
          .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span style="color:#ce9178">$1</span>')
          // Variables
          .replace(/(\$\{[^}]+\}|\$[a-zA-Z_][a-zA-Z0-9_]*)/g, '<span style="color:#4fc1ff">$1</span>')
          // Commands
          .replace(/\b(echo|cd|ls|pwd|mkdir|rmdir|rm|cp|mv|cat|grep|find|sed|awk|sort|uniq|head|tail|wc|chmod|chown|ps|kill|top|df|du|mount|umount|tar|gzip|gunzip|wget|curl|ssh|scp|rsync|crontab|systemctl|service|sudo|su|export|source|alias|history|which|whereis|man|info|help)\b/g, '<span style="color:#dcdcaa">$1</span>');
        return escaped;
      }

      // Default: return escaped HTML
      return escaped;
    } catch (e) {
      console.error('Syntax highlighting error:', e);
      return escapeHtml(code);
    }
  }

  // Helper function for JavaScript highlighting
  function highlightJavaScript(escaped) {
    return escaped
      // Comments
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6a9955;font-style:italic">$1</span>')
      .replace(/(\/\/.*?$)/gm, '<span style="color:#6a9955;font-style:italic">$1</span>')
      // Strings and template literals
      .replace(/(`(?:[^`\\]|\\.)*`)/g, '<span style="color:#ce9178">$1</span>')
      .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span style="color:#ce9178">$1</span>')
      // Keywords
      .replace(/\b(abstract|as|async|await|boolean|break|case|catch|class|const|constructor|continue|debugger|declare|default|delete|do|else|enum|export|extends|false|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|number|of|package|private|protected|public|readonly|return|set|static|string|super|switch|this|throw|true|try|typeof|undefined|var|void|while|with|yield)\b/g, '<span style="color:#c586c0;font-weight:bold">$1</span>')
      // Built-in objects and functions
      .replace(/\b(console|document|window|Array|Object|String|Number|Boolean|Date|RegExp|Math|JSON|Promise|setTimeout|setInterval|clearTimeout|clearInterval|parseInt|parseFloat|isNaN|isFinite|encodeURIComponent|decodeURIComponent)\b/g, '<span style="color:#dcdcaa">$1</span>')
      // Numbers
      .replace(/\b(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, '<span style="color:#b5cea8">$1</span>')
      // Regex
      .replace(/(\/(?:[^\/\\\n]|\\.)+\/[gimuy]*)/g, '<span style="color:#d16969">$1</span>');
  }

  // Helper function for CSS highlighting
  function highlightCSS(escaped) {
    return escaped
      // Comments
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6a9955;font-style:italic">$1</span>')
      // At-rules (@media, @import, @keyframes, etc.)
      .replace(/(@[a-zA-Z-]+)/g, '<span style="color:#c586c0;font-weight:bold">$1</span>')
      // Pseudo-classes and pseudo-elements
      .replace(/(::?[a-zA-Z-]+(?:\([^)]*\))?)/g, '<span style="color:#dcdcaa">$1</span>')
      // Class selectors
      .replace(/(\.[a-zA-Z0-9_-]+)/g, '<span style="color:#4fc1ff;font-weight:bold">$1</span>')
      // ID selectors
      .replace(/(#[a-zA-Z0-9_-]+)/g, '<span style="color:#4fc1ff;font-weight:bold">$1</span>')
      // Element selectors (before opening brace)
      .replace(/\b([a-zA-Z][a-zA-Z0-9-]*)(\s*[,{])/g, '<span style="color:#d7ba7d;font-weight:bold">$1</span>$2')
      // Attribute selectors
      .replace(/(\[[^\]]*\])/g, '<span style="color:#4fc1ff">$1</span>')
      // Properties
      .replace(/([a-z-]+)(\s*:\s*)/g, '<span style="color:#9cdcfe;font-weight:bold">$1</span>$2')
      // String values
      .replace(/(:\s*)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '$1<span style="color:#ce9178">$2</span>')
      // Color values (hex, rgb, rgba, hsl, hsla, named colors)
      .replace(/\b(#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|transparent|inherit|initial|unset|red|green|blue|white|black|gray|yellow|orange|purple|pink|brown|cyan|magenta)\b/g, '<span style="color:#4fc1ff;font-weight:bold">$1</span>')
      // Numbers with units
      .replace(/\b(\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|vmin|vmax|pt|pc|in|cm|mm|ex|ch|deg|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx|fr))\b/g, '<span style="color:#b5cea8;font-weight:bold">$1</span>')
      // Plain numbers
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span style="color:#b5cea8">$1</span>')
      // CSS functions
      .replace(/\b([a-z-]+)(\()/g, '<span style="color:#dcdcaa">$1</span>$2')
      // Important
      .replace(/(!important)/g, '<span style="color:#c586c0;font-weight:bold">$1</span>')
      // CSS keywords
      .replace(/\b(auto|none|normal|inherit|initial|unset|revert|all|block|inline|inline-block|flex|grid|absolute|relative|fixed|sticky|static|left|right|center|justify|space-between|space-around|space-evenly|start|end|baseline|stretch|wrap|nowrap|column|row|hidden|visible|scroll|clip|ellipsis|break-word|pre|pre-wrap|pre-line|solid|dashed|dotted|double|groove|ridge|inset|outset|border-box|content-box|padding-box|cover|contain|repeat|no-repeat|repeat-x|repeat-y|round|space)\b/g, '<span style="color:#569cd6">$1</span>');
  }

  // Get appropriate file extension based on language
  window.getFileExtension = function (language) {
    if (!language) return 'txt';

    const lang = language.toLowerCase();
    const extensions = {
      'javascript': 'js',
      'typescript': 'ts',
      'python': 'py',
      'html': 'html',
      'css': 'css',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'csharp': 'cs',
      'go': 'go',
      'ruby': 'rb',
      'php': 'php',
      'swift': 'swift',
      'kotlin': 'kt',
      'rust': 'rs',
      'shell': 'sh',
      'bash': 'sh',
      'powershell': 'ps1',
      'sql': 'sql',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yml',
      'markdown': 'md'
    };

    return extensions[lang] || 'txt';
  };

  // Copy function (make sure this is available)
  window.copyCode = function (codeId) {
    const codeElement = document.getElementById(codeId);
    if (codeElement) {
      const text = codeElement.textContent;
      navigator.clipboard.writeText(text).then(() => {
        // Show success feedback
        const btn = codeElement.closest('.xcode-window').querySelector('.xcode-copy-btn');
        const originalSvg = btn.innerHTML;

        // Change to checkmark icon
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 10.5l3 3 7-7" stroke="#10a37f" stroke-width="2" fill="none"/></svg>
        `;
        btn.style.background = '#28a745';

        setTimeout(() => {
          btn.innerHTML = originalSvg;
          btn.style.background = '#3a3a3a';
        }, 2000);
      });
    }
  };

  // Download code as a file
  window.downloadCode = function (codeId, fileName) {
    const codeElement = document.getElementById(codeId);
    if (codeElement) {
      const text = codeElement.textContent;
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show feedback
      const btn = codeElement.closest('.xcode-window').querySelector('.xcode-download-btn');
      const originalBackground = btn.style.background;
      btn.style.background = '#28a745';

      setTimeout(() => {
        btn.style.background = originalBackground;
      }, 2000);
    }
  };

  // Preview HTML in a container below the code with DeepSeek-like animations
  window.previewHTML = function (codeId) {
    const rawCodeEl = document.getElementById(`raw-code-${codeId}`);
    
    if (rawCodeEl) {
      const htmlContent = rawCodeEl.value;
      
      // Create a blob URL for the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new tab
      const newTab = window.open(url, '_blank');
      
      // Clean up the blob URL after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
      // Optional: Briefly highlight the button to show it was clicked
      const btn = document.querySelector(`.xcode-preview-btn[onclick*="'${codeId}'"]`);
      if (btn) {
        const originalBg = btn.style.background;
        btn.style.background = '#2c7be5';
        setTimeout(() => {
          btn.style.background = originalBg || '#3a3a3a';
        }, 200);
      }
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
    copyBtn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20"><rect x="4" y="4" width="12" height="12" rx="2"/><rect x="8" y="8" width="8" height="8" rx="2" stroke="currentColor" fill="none"/></svg> <span>Copy</span>`;

    const successBtn = document.createElement("button");
    successBtn.className = "code-copied-btn";
    successBtn.style.display = "none";
    successBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 10.5l3 3 7-7" stroke="#10a37f" stroke-width="2" fill="none"/></svg> <span>Copied</span>`;

    // Edit button with working functionality
    const editBtn = document.createElement("button");
    editBtn.className = "action-edit";
    editBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
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
        activeGenerationTab = currentConversationId;
        updateStopButtonVisibility();

        try {
          // Update the message
          conv.messages[messageIndex].text = newText;

          // Remove all messages after this one
          conv.messages.splice(messageIndex + 1);

          await saveConversations();

          // Re-render to show the edited message
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
              // Save partial response before breaking
              if (fullResponse) {
                savedPartialResponse = fullResponse;
                conv.messages.push({ text: fullResponse, fromUser: false });
                await saveConversations();
              }
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
          activeGenerationTab = null;
          savedPartialResponse = "";
          updateStopButtonVisibility();
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
  let activeGenerationTab = null; // Track which tab is generating
  let savedPartialResponse = ""; // To save partial responses when switching tabs

  // ===== sendPrompt (STREAMING VERSION with MARKDOWN) =====
  function constructFinalPrompt(text) {
    const conv = getCurrentConversation();
    const history = (conv && conv.messages.length > 0)
      ? conv.messages.map(m => ({ from: m.fromUser ? 'user' : 'assistant', text: m.text }))
      : [];

    const promptObject = {
      prompt: text,
      internal_metadata: {
        ...getInternalMetadata(),
        chat_history: history,
      }
    };

    return JSON.stringify(promptObject, null, 2); // Pretty-print JSON
  }

  async function sendPrompt(text) {
    if (!currentConversationId) {
      const newConv = { id: Date.now(), title: 'New Chat', messages: [] };
      conversations.unshift(newConv);
      currentConversationId = newConv.id;
      await saveConversations();
      renderConversations();
    }

    const conv = getCurrentConversation();
    activeGenerationTab = currentConversationId; // Set active tab

    // Save + render user message
    conv.messages.push({ text, fromUser: true });
    await saveConversations();
    const userMessageIndex = conv.messages.length - 1;
    appendUserMessage(text, userMessageIndex);

    if (input) input.value = "";

    // Show stop button only in this tab
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
      const finalPrompt = constructFinalPrompt(text);
      const response = await puter.ai.chat(finalPrompt, {
        model: (modelSelect ? modelSelect.value : "gpt-5-nano"),
        stream: true
      });

      for await (const part of response) {
        if (shouldStop) {
          console.log('🛑 Generation stopped by user');
          // Save partial response before breaking
          if (fullResponse) {
            savedPartialResponse = fullResponse;
            conv.messages.push({ text: fullResponse, fromUser: false });
            await saveConversations();
            const botMessageIndex = conv.messages.length - 1;

            // Add action buttons even when stopped
            const actions = createBotActions(fullResponse, botMessageIndex);
            msg.appendChild(actions);
          }
          break;
        }

        if (part?.text) {
          if (!hasStartedTyping) {
            if (typing.parentNode) typing.remove();
            hasStartedTyping = true;
          }
          fullResponse += part.text;
          contentDiv.innerHTML = processCodeBlocks(fullResponse);
          chatBox.scrollTop = chatBox.scrollHeight;
        }
      }

      // Only save complete response if not stopped
      if (!shouldStop && fullResponse) {
        conv.messages.push({ text: fullResponse, fromUser: false });
        await saveConversations();
        const botMessageIndex = conv.messages.length - 1;

        // Add action buttons
        const actions = createBotActions(fullResponse, botMessageIndex);
        msg.appendChild(actions);

        // Generate chat title in background
        setTimeout(() => generateChatTitle(conv), 1000);
      }

    } finally {
      // Always reset generation state
      isGenerating = false;
      shouldStop = false;
      savedPartialResponse = "";
      activeGenerationTab = null;

      // Update button state
      updateStopButtonVisibility();
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

  // Helper function to update stop button visibility based on current state
  function updateStopButtonVisibility() {
    if (!sendButton) return;

    if (isGenerating && activeGenerationTab === currentConversationId) {
      // Show stop button in the generating tab
      sendButton.style.display = "flex";
      sendButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="6" width="12" height="12" rx="2"/>
      </svg>`;
      sendButton.classList.add('stop-button');
    } else {
      // Show send button or hide based on input
      sendButton.classList.remove('stop-button');
      sendButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
      sendButton.style.display = (input && input.value.trim()) ? "flex" : "none";
    }
  }

  if (sendButton) sendButton.addEventListener("click", () => {
    // If generating, stop it
    if (isGenerating && activeGenerationTab === currentConversationId) {
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
    if (!sendButton || (isGenerating && activeGenerationTab === currentConversationId)) return;
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