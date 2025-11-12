// Settings Management
(() => {
  // ===== DOM Elements =====
  const settingsModal = document.getElementById("settingsModal");
  const menuSettings = document.getElementById("menuSettings");
  const closeSettings = document.getElementById("closeSettings");
  const themeSelect = document.getElementById("themeSelect");
  const streamingToggle = document.getElementById("streamingToggle");
  const soundToggle = document.getElementById("soundToggle");
  const autoScrollToggle = document.getElementById("autoScrollToggle");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const exportBtn = document.getElementById("exportBtn");

  // ===== Default Settings =====
  const defaultSettings = {
    theme: "light-theme",
    streaming: true,
    sound: false,
    autoScroll: true
  };

  // ===== Load Settings =====
  function loadSettings() {
    try {
      const saved = localStorage.getItem("appSettings");
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
      
      // If no appSettings exist, check for legacy theme setting
      const legacyTheme = localStorage.getItem("theme");
      if (legacyTheme) {
        return { ...defaultSettings, theme: legacyTheme };
      }
      
      return defaultSettings;
    } catch (e) {
      console.error("Failed to load settings:", e);
      return defaultSettings;
    }
  }

  // ===== Save Settings =====
  function saveSettings(settings) {
    try {
      localStorage.setItem("appSettings", JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error("Failed to save settings:", e);
      return false;
    }
  }

  // ===== Apply Settings to UI =====
  function applySettings(settings) {
    // Apply theme
    document.body.classList.remove("light-theme", "dark-theme");
    document.body.classList.add(settings.theme);
    if (themeSelect) themeSelect.value = settings.theme;

    // Apply toggles
    if (streamingToggle) streamingToggle.checked = settings.streaming;
    if (soundToggle) soundToggle.checked = settings.sound;
    if (autoScrollToggle) autoScrollToggle.checked = settings.autoScroll;

    // Update theme icon
    if (window.updateThemeIcon) window.updateThemeIcon();
  }

  // ===== Open Settings Modal =====
  function openSettings() {
    if (settingsModal) {
      settingsModal.classList.add("open");
      const settings = loadSettings();
      applySettings(settings);
    }
  }

  // ===== Close Settings Modal =====
  function closeSettingsModal() {
    if (settingsModal) {
      settingsModal.classList.remove("open");
    }
  }

  // ===== Event Listeners =====
  
  // Open settings
  if (menuSettings) {
    menuSettings.addEventListener("click", () => {
      openSettings();
      // Close side menu on mobile with smooth animation
      if (window.__crazyChat && window.__crazyChat.closeMenu) {
        window.__crazyChat.closeMenu();
      }
    });
  }

  // Close settings
  if (closeSettings) {
    closeSettings.addEventListener("click", closeSettingsModal);
  }

  // Close on backdrop click
  if (settingsModal) {
    settingsModal.addEventListener("click", (e) => {
      if (e.target === settingsModal) {
        closeSettingsModal();
      }
    });
  }

  // Theme select
  if (themeSelect) {
    themeSelect.addEventListener("change", (e) => {
      const settings = loadSettings();
      settings.theme = e.target.value;
      
      // Apply immediately
      document.body.classList.remove("light-theme", "dark-theme");
      document.body.classList.add(settings.theme);
      
      // Save to localStorage
      saveSettings(settings);
      localStorage.setItem("theme", settings.theme); // For day_light.js compatibility
      
      // Update icon
      if (window.updateThemeIcon) window.updateThemeIcon();
    });
  }

  // Streaming toggle
  if (streamingToggle) {
    streamingToggle.addEventListener("change", (e) => {
      const settings = loadSettings();
      settings.streaming = e.target.checked;
      saveSettings(settings);
    });
  }

  // Sound toggle
  if (soundToggle) {
    soundToggle.addEventListener("change", (e) => {
      const settings = loadSettings();
      settings.sound = e.target.checked;
      saveSettings(settings);
      
      if (e.target.checked) {
        showNotification("Sound effects enabled");
      }
    });
  }

  // Auto-scroll toggle
  if (autoScrollToggle) {
    autoScrollToggle.addEventListener("change", (e) => {
      const settings = loadSettings();
      settings.autoScroll = e.target.checked;
      saveSettings(settings);
    });
  }

  // Clear all conversations
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      const confirmed = confirm(
        "⚠️ This will permanently delete all your conversations. This action cannot be undone.\n\nAre you sure you want to continue?"
      );
      
      if (confirmed) {
        try {
          localStorage.removeItem("conversations");
          
          // Reload the page to reset the UI
          showNotification("All conversations deleted");
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (e) {
          alert("Failed to clear conversations: " + e.message);
        }
      }
    });
  }

  // Export conversations
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      try {
        const conversations = localStorage.getItem("conversations");
        if (!conversations || conversations === "[]") {
          alert("No conversations to export");
          return;
        }

        const data = JSON.parse(conversations);
        const exportData = {
          exportDate: new Date().toISOString(),
          version: "1.0.0",
          conversationCount: data.length,
          conversations: data
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `crazy-chat-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification("Conversations exported successfully");
      } catch (e) {
        alert("Failed to export conversations: " + e.message);
      }
    });
  }

  // ===== Helper: Show Notification =====
  function showNotification(text) {
    const bubble = document.getElementById("bubble");
    if (bubble) {
      bubble.textContent = text;
      bubble.style.display = "block";
      setTimeout(() => {
        bubble.style.display = "none";
      }, 3000);
    }
  }

  // ===== Initialize Settings on Page Load =====
  function initSettings() {
    const settings = loadSettings();
    applySettings(settings);
  }

  // Initialize
  initSettings();

  // Export for access from other scripts
  window.appSettings = {
    get: loadSettings,
    save: saveSettings
  };
})();
