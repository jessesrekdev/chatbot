// Advanced Markdown Renderer with Syntax Highlighting - FIXED VERSION
(() => {
  // ===== Syntax Highlighting Colors =====
  const syntaxColors = {
    keyword: '#ff79c6',
    string: '#50fa7b',
    number: '#bd93f9',
    comment: '#6272a4',
    function: '#8be9fd',
    operator: '#ff79c6',
    punctuation: '#f8f8f2',
    class: '#ffb86c',
    variable: '#f1fa8c',
    property: '#50fa7b',
    tag: '#ff79c6',
    attribute: '#8be9fd',
    value: '#f1fa8c',
  };

  // ===== Language Patterns for Syntax Highlighting =====
  const languagePatterns = {
    javascript: [
      { pattern: /\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|try|catch|finally|throw|new|class|extends|import|export|default|async|await|yield|this|super|static|get|set|typeof|instanceof|delete|void|in|of)\b/g, style: 'keyword' },
      { pattern: /(["'`])(?:(?=(\\?))\2.)*?\1/g, style: 'string' },
      { pattern: /\b\d+\.?\d*\b/g, style: 'number' },
      { pattern: /\/\/.*$/gm, style: 'comment' },
      { pattern: /\/\*[\s\S]*?\*\//g, style: 'comment' },
      { pattern: /\b([a-zA-Z_$][\w$]*)\s*\(/g, style: 'function', group: 1 },
      { pattern: /[+\-*\/%=<>!&|^~?:]/g, style: 'operator' },
    ],
    python: [
      { pattern: /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|raise|with|lambda|yield|pass|break|continue|and|or|not|in|is|True|False|None)\b/g, style: 'keyword' },
      { pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g, style: 'string' },
      { pattern: /\b\d+\.?\d*\b/g, style: 'number' },
      { pattern: /#.*$/gm, style: 'comment' },
      { pattern: /\b([a-zA-Z_][\w]*)\s*\(/g, style: 'function', group: 1 },
    ],
    html: [
      { pattern: /&lt;!--[\s\S]*?--&gt;/g, style: 'comment' },
      { pattern: /&lt;\/?\w+/g, style: 'tag' },
      { pattern: /\b[\w-]+(?==)/g, style: 'attribute' },
      { pattern: /=(["']).*?\1/g, style: 'value' },
      { pattern: /\/&gt;|&gt;/g, style: 'tag' },
    ],
    css: [
      { pattern: /\/\*[\s\S]*?\*\//g, style: 'comment' },
      { pattern: /[.#]?[\w-]+(?=\s*{)/g, style: 'class' },
      { pattern: /[\w-]+(?=:)/g, style: 'property' },
      { pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g, style: 'string' },
      { pattern: /\b\d+\.?\d*(px|em|rem|%|vh|vw|pt|cm|mm|in)?\b/g, style: 'number' },
      { pattern: /#[\da-fA-F]{3,8}\b/g, style: 'string' },
    ],
    json: [
      { pattern: /"[\w\s]*":/g, style: 'property' },
      { pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g, style: 'string' },
      { pattern: /\b(true|false|null)\b/g, style: 'keyword' },
      { pattern: /\b\d+\.?\d*\b/g, style: 'number' },
    ],
  };

  // ===== Escape HTML =====
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

  // ===== Apply Syntax Highlighting =====
  function applySyntaxHighlighting(code, language) {
    let highlighted = escapeHtml(code);
    const lang = language.toLowerCase();
    const patterns = languagePatterns[lang] || languagePatterns.javascript;

    patterns.forEach(({ pattern, style, group }) => {
      highlighted = highlighted.replace(pattern, (match, ...args) => {
        const text = group ? args[group - 1] : match;
        const color = syntaxColors[style] || syntaxColors.punctuation;
        return match.replace(text, `<span style="color:${color}">${text}</span>`);
      });
    });

    return highlighted;
  }

  // ===== Create Code Block HTML =====
  function createCodeBlockHTML(codeId, language, highlightedCode) {
    return `<div class="markdown-code-block" data-language="${language}" data-code-id="${codeId}">
      <div class="code-header">
        <span class="code-language">${language}</span>
        <div class="code-actions">
          <button class="code-action-btn copy-code-btn" data-code-id="${codeId}" title="Copy code">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
              <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
            </svg>
            <span>Copy</span>
          </button>
          <button class="code-action-btn download-code-btn" data-code-id="${codeId}" title="Download">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
            </svg>
            <span>Download</span>
          </button>
          ${(language === 'html' || language === 'xml' || language === 'svg') ? `
          <button class="code-action-btn preview-code-btn" data-code-id="${codeId}" title="Preview">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
              <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
            </svg>
            <span>Preview</span>
          </button>` : ''}
        </div>
      </div>
      <pre><code id="${codeId}" class="language-${language}">${highlightedCode}</code></pre>
      ${(language === 'html' || language === 'xml' || language === 'svg') ? `<div class="code-preview" id="preview-${codeId}" style="display:none;"></div>` : ''}
    </div>`;
  }

  // ===== Parse Full Markdown =====
  window.parseMarkdown = function(text) {
    if (typeof text !== 'string') return String(text);

    // Store code blocks temporarily to prevent them from being processed
    const codeBlocks = [];
    let html = text;

    // 1. Extract code blocks first (with closing backticks)
    html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || 'plaintext';
      const highlightedCode = applySyntaxHighlighting(code, language);
      const codeId = 'code-' + Math.random().toString(36).substr(2, 9);
      const placeholder = `__MDCODEBLOCK${codeBlocks.length}__`;
      codeBlocks.push(createCodeBlockHTML(codeId, language, highlightedCode));
      return placeholder;
    });

    // 1.5. Auto-detect disabled temporarily - will fix after basic blocks work

    // 2. Escape remaining HTML (protect from being interpreted)
    // Store inline code first
    const inlineCodes = [];
    html = html.replace(/`([^`\n]+)`/g, (match, code) => {
      const placeholder = `__MDINLINE${inlineCodes.length}__`;
      inlineCodes.push(`<code class="inline-code">${escapeHtml(code)}</code>`);
      return placeholder;
    });

    // 3. Escape HTML in remaining text
    html = escapeHtml(html);

    // 4. Bold + Italic (must be before individual bold/italic)
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');

    // 5. Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // 6. Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // 7. Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // 8. Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="markdown-link">$1</a>');

    // 9. Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="markdown-image" />');

    // 10. Headers (must handle line-by-line)
    html = html.split('\n').map(line => {
      if (line.match(/^######\s+(.+)/)) return `<h6 class="markdown-h6">${RegExp.$1}</h6>`;
      if (line.match(/^#####\s+(.+)/)) return `<h5 class="markdown-h5">${RegExp.$1}</h5>`;
      if (line.match(/^####\s+(.+)/)) return `<h4 class="markdown-h4">${RegExp.$1}</h4>`;
      if (line.match(/^###\s+(.+)/)) return `<h3 class="markdown-h3">${RegExp.$1}</h3>`;
      if (line.match(/^##\s+(.+)/)) return `<h2 class="markdown-h2">${RegExp.$1}</h2>`;
      if (line.match(/^#\s+(.+)/)) return `<h1 class="markdown-h1">${RegExp.$1}</h1>`;
      return line;
    }).join('\n');

    // 11. Blockquotes
    html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote class="markdown-quote">$1</blockquote>');
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote class="markdown-quote">$1</blockquote>');

    // 12. Horizontal rules
    html = html.replace(/^(-{3,}|_{3,}|\*{3,})$/gm, '<hr class="markdown-hr" />');

    // 13. Unordered lists
    html = html.replace(/^[\*\-\+]\s+(.+)$/gm, '<li class="markdown-li">$1</li>');
    html = html.replace(/(<li class="markdown-li">.*<\/li>\n?)+/g, '<ul class="markdown-ul">$&</ul>');

    // 14. Ordered lists
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="markdown-li-ordered">$1</li>');
    html = html.replace(/(<li class="markdown-li-ordered">.*<\/li>\n?)+/g, '<ol class="markdown-ol">$&</ol>');

    // 15. Restore code blocks BEFORE paragraph wrapping (important!)
    console.log('🔍 Restoring', codeBlocks.length, 'code blocks');
    codeBlocks.forEach((block, i) => {
      const placeholder = `__MDCODEBLOCK${i}__`;
      console.log('Looking for placeholder:', placeholder);
      console.log('In text:', html.includes(placeholder) ? 'FOUND ✓' : 'NOT FOUND ✗');
      html = html.replace(new RegExp(placeholder, 'g'), block);
    });

    // 16. Restore inline code
    inlineCodes.forEach((code, i) => {
      html = html.replace(new RegExp(`__MDINLINE${i}__`, 'g'), code);
    });

    // 17. Line breaks (double newline = paragraph)
    html = html.replace(/\n\n+/g, '</p><p class="markdown-p">');
    html = '<p class="markdown-p">' + html + '</p>';

    // 18. Single line breaks
    html = html.replace(/\n/g, '<br>');

    console.log('✅ Final HTML output (first 500 chars):', html.substring(0, 500));

    return html;
  };

  // ===== Code Block Actions =====
  document.addEventListener('click', (e) => {
    // Copy button
    if (e.target.closest('.copy-code-btn')) {
      const btn = e.target.closest('.copy-code-btn');
      const codeId = btn.dataset.codeId;
      const codeElement = document.getElementById(codeId);
      
      if (codeElement) {
        const text = codeElement.textContent;
        navigator.clipboard.writeText(text).then(() => {
          const originalHTML = btn.innerHTML;
          btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>
            <span>Copied!</span>
          `;
          btn.classList.add('success');
          
          setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.classList.remove('success');
          }, 2000);
        });
      }
    }

    // Download button
    if (e.target.closest('.download-code-btn')) {
      const btn = e.target.closest('.download-code-btn');
      const codeId = btn.dataset.codeId;
      const codeElement = document.getElementById(codeId);
      const codeBlock = btn.closest('.markdown-code-block');
      const language = codeBlock.dataset.language || 'txt';
      
      if (codeElement) {
        const text = codeElement.textContent;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `code.${language}`;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification(`📥 Code downloaded as code.${language}`);
      }
    }

    // Preview button
    if (e.target.closest('.preview-code-btn')) {
      const btn = e.target.closest('.preview-code-btn');
      const codeId = btn.dataset.codeId;
      const codeElement = document.getElementById(codeId);
      const previewElement = document.getElementById('preview-' + codeId);
      
      if (codeElement && previewElement) {
        const isVisible = previewElement.style.display !== 'none';
        
        if (isVisible) {
          previewElement.style.display = 'none';
          btn.querySelector('span').textContent = 'Preview';
        } else {
          const code = codeElement.textContent;
          previewElement.innerHTML = code;
          previewElement.style.display = 'block';
          btn.querySelector('span').textContent = 'Hide Preview';
        }
      }
    }
  });

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

  console.log('📝 Advanced Markdown Renderer (FIXED) loaded!');
})();
