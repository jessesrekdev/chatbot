// Markdown Integration - Patches the bot message rendering to use markdown
(() => {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // Override the text processing in bot messages
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.classList && node.classList.contains('bot-message')) {
            processBotMessage(node);
          }
        });
      });
    });

    const chatBox = document.getElementById('chatBox');
    if (chatBox) {
      observer.observe(chatBox, { childList: true, subtree: true });
    }
  }

  function processBotMessage(messageElement) {
    const contentDiv = messageElement.querySelector('.bot-content');
    if (!contentDiv || contentDiv.dataset.processed) return;

    // Get the raw text
    const textSpans = contentDiv.querySelectorAll('span');
    let rawText = '';
    
    textSpans.forEach(span => {
      rawText += span.textContent || span.innerText;
    });

    // If we have parseMarkdown function, use it
    if (typeof window.parseMarkdown === 'function' && rawText) {
      contentDiv.innerHTML = window.parseMarkdown(rawText);
      contentDiv.dataset.processed = 'true';
    }
  }

  console.log('📝 Markdown integration active!');
})();
