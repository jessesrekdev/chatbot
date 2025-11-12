// Keyboard Shortcuts Management
(() => {
  // ===== Shortcut mappings =====
  const shortcuts = {
    'ctrl+n': () => createNewChat(),
    'ctrl+k': () => openSearch(),
    'ctrl+/': () => showShortcutsHelp(),
    'ctrl+,': () => openSettings(),
    'ctrl+shift+d': () => toggleTheme(),
    'escape': () => closeModals(),
    'ctrl+shift+c': () => clearChat(),
  };

  // ===== Key tracking =====
  const keysPressed = new Set();

  // ===== DOM Elements =====
  const input = document.querySelector('.composer-input');
  const sendButton = document.getElementById('sendButton');
  const sideMenu = document.getElementById('sideMenu');

  // ===== Initialize keyboard event listeners =====
  document.addEventListener('keydown', (e) => {
    // Track pressed keys
    const key = e.key.toLowerCase();
    keysPressed.add(key);
    
    // Build shortcut string
    let shortcut = '';
    if (e.ctrlKey || keysPressed.has('control')) shortcut += 'ctrl+';
    if (e.shiftKey) shortcut += 'shift+';
    if (e.altKey) shortcut += 'alt+';
    shortcut += key;

    // Handle Enter to send (only when input is focused and not empty)
    if (key === 'enter' && !e.shiftKey && document.activeElement === input) {
      const text = input ? input.value.trim() : '';
      if (text && sendButton) {
        e.preventDefault();
        sendButton.click();
      }
    }

    // Handle Escape
    if (key === 'escape') {
      e.preventDefault();
      shortcuts['escape']();
    }

    // Handle other shortcuts (only when not typing in input)
    if (shortcuts[shortcut] && document.activeElement !== input) {
      e.preventDefault();
      shortcuts[shortcut]();
    }

    // Ctrl+K can be triggered even when in input
    if (shortcut === 'ctrl+k') {
      e.preventDefault();
      shortcuts[shortcut]();
    }
  });

  document.addEventListener('keyup', (e) => {
    keysPressed.delete(e.key.toLowerCase());
  });

  // ===== Shortcut Actions =====

  function createNewChat() {
    const newChatBtn = document.getElementById('newChat') || document.getElementById('menuNewChat');
    if (newChatBtn) {
      newChatBtn.click();
      showNotification('✨ New chat created (Ctrl+N)');
    }
  }

  function openSearch() {
    const searchBtn = document.getElementById('menuSearchBtn');
    if (searchBtn) {
      // Open sidebar if on mobile
      if (window.innerWidth < 1024 && sideMenu) {
        sideMenu.classList.add('open');
      }
      searchBtn.click();
      
      // Focus search input
      setTimeout(() => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.focus();
      }, 100);
      
      showNotification('🔍 Search opened (Ctrl+K)');
    }
  }

  function openSettings() {
    const settingsBtn = document.getElementById('menuSettings');
    if (settingsBtn) {
      settingsBtn.click();
      showNotification('⚙️ Settings opened (Ctrl+,)');
    }
  }

  function toggleTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.click();
      const isDark = document.body.classList.contains('dark-theme');
      showNotification(`${isDark ? '🌙' : '☀️'} Theme switched (Ctrl+Shift+D)`);
    }
  }

  function closeModals() {
    // Close settings modal
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal && settingsModal.classList.contains('open')) {
      const closeBtn = document.getElementById('closeSettings');
      if (closeBtn) closeBtn.click();
      return;
    }

    // Close delete dialog
    const deleteDialog = document.getElementById('deleteDialog');
    if (deleteDialog && deleteDialog.classList.contains('open')) {
      const cancelBtn = document.getElementById('cancelDelete');
      if (cancelBtn) cancelBtn.click();
      return;
    }

    // Close side menu on mobile
    if (sideMenu && sideMenu.classList.contains('open') && window.innerWidth < 1024) {
      const closeMenu = document.getElementById('closeMenu');
      if (closeMenu) closeMenu.click();
      return;
    }

    // Close search
    const searchSection = document.getElementById('menuSearchSection');
    if (searchSection && !searchSection.classList.contains('hidden')) {
      const closeSearchBtn = document.getElementById('closeSearchBtn');
      if (closeSearchBtn) closeSearchBtn.click();
    }
  }

  function clearChat() {
    const chatBox = document.getElementById('chatBox');
    if (chatBox) {
      const confirmed = confirm('Clear current conversation messages? (This will not delete the conversation)');
      if (confirmed) {
        chatBox.innerHTML = `
          <h1 class="title">CrazyGPT</h1>
          <p class="subtitle">This chat won't appear in history or be used to train our models. For safety purposes, we may keep a copy of this chat for up to 30 days.</p>
        `;
        showNotification('🧹 Chat cleared (Ctrl+Shift+C)');
      }
    }
  }

  function showShortcutsHelp() {
    const helpText = `
╔══════════════════════════════════════╗
║     KEYBOARD SHORTCUTS              ║
╠══════════════════════════════════════╣
║ Ctrl + N       → New Chat           ║
║ Ctrl + K       → Search             ║
║ Ctrl + ,       → Settings           ║
║ Ctrl + Shift+D → Toggle Theme       ║
║ Ctrl + Shift+C → Clear Chat         ║
║ Enter          → Send Message       ║
║ Shift + Enter  → New Line           ║
║ Escape         → Close Modals       ║
║ Ctrl + /       → Show This Help     ║
╚══════════════════════════════════════╝
    `.trim();
    
    alert(helpText);
  }

  // ===== Helper: Show Notification =====
  function showNotification(text) {
    const bubble = document.getElementById('bubble');
    if (bubble) {
      bubble.textContent = text;
      bubble.style.display = 'block';
      setTimeout(() => {
        bubble.style.display = 'none';
      }, 2500);
    }
  }

  // ===== Add keyboard hint to composer =====
  function addComposerHint() {
    const composerContainer = document.querySelector('.composer-container');
    if (composerContainer && !document.querySelector('.composer-hint')) {
      const hint = document.createElement('span');
      hint.className = 'composer-hint';
      hint.textContent = '↵ Enter to send • ⇧↵ Shift+Enter for new line';
      composerContainer.appendChild(hint);
    }
  }

  // Initialize hint when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addComposerHint);
  } else {
    addComposerHint();
  }

  // ===== Show shortcuts indicator in footer =====
  function addShortcutsIndicator() {
    const footer = document.querySelector('.footer');
    if (footer && !footer.querySelector('.shortcuts-link')) {
      const shortcutsLink = document.createElement('span');
      shortcutsLink.className = 'shortcuts-link';
      shortcutsLink.innerHTML = ' • <a href="#" id="showShortcuts" style="cursor:pointer;">⌨️ Keyboard Shortcuts</a>';
      footer.appendChild(shortcutsLink);
      
      const showShortcutsBtn = document.getElementById('showShortcuts');
      if (showShortcutsBtn) {
        showShortcutsBtn.addEventListener('click', (e) => {
          e.preventDefault();
          showShortcutsHelp();
        });
      }
    }
  }

  // Initialize shortcuts indicator
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addShortcutsIndicator);
  } else {
    addShortcutsIndicator();
  }

  console.log('🎹 Keyboard shortcuts enabled! Press Ctrl+/ to see all shortcuts.');
})();
