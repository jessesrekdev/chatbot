// Custom Animated Model Dropdown
(() => {
  // ===== DOM Elements =====
  const customSelect = document.getElementById('customModelSelect');
  const selectTrigger = customSelect?.querySelector('.select-trigger');
  const selectedValueSpan = customSelect?.querySelector('.selected-value');
  const dropdown = customSelect?.querySelector('.select-dropdown');
  const searchInput = customSelect?.querySelector('.dropdown-search-input');
  const optionItems = customSelect?.querySelectorAll('.option-item');
  const hiddenSelect = document.getElementById('modelSelect');

  if (!customSelect || !selectTrigger || !dropdown) return;

  // ===== State =====
  let currentValue = 'gpt-4o-mini';

  // ===== Toggle Dropdown =====
  function toggleDropdown(e) {
    e?.stopPropagation();
    customSelect.classList.toggle('open');
    
    if (customSelect.classList.contains('open')) {
      // Focus search input when opening
      setTimeout(() => searchInput?.focus(), 100);
      
      // Add smooth stagger animation to options
      optionItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.03}s`;
      });
    } else {
      // Clear search when closing
      if (searchInput) searchInput.value = '';
      filterOptions('');
    }
  }

  // ===== Close Dropdown =====
  function closeDropdown() {
    customSelect.classList.remove('open');
    if (searchInput) searchInput.value = '';
    filterOptions('');
  }

  // ===== Select Option =====
  function selectOption(value, label) {
    currentValue = value;
    
    // Update displayed value
    if (selectedValueSpan) {
      selectedValueSpan.textContent = label;
    }
    
    // Update hidden select (for compatibility)
    if (hiddenSelect) {
      hiddenSelect.value = value;
      // Trigger change event for any existing listeners
      hiddenSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Update selected state on all options
    optionItems.forEach(item => {
      if (item.dataset.value === value) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
    
    // Save to localStorage
    try {
      localStorage.setItem('selectedModel', value);
    } catch (e) {
      console.error('Failed to save model preference:', e);
    }
    
    // Close dropdown
    closeDropdown();
    
    // Show notification
    showNotification(`✨ Model switched to ${label}`);
  }

  // ===== Filter Options (Search) =====
  function filterOptions(query) {
    const searchTerm = query.toLowerCase().trim();
    
    optionItems.forEach(item => {
      const label = item.querySelector('.option-label')?.textContent.toLowerCase() || '';
      const value = item.dataset.value?.toLowerCase() || '';
      const badge = item.querySelector('.option-badge')?.textContent.toLowerCase() || '';
      
      const matches = label.includes(searchTerm) || 
                     value.includes(searchTerm) || 
                     badge.includes(searchTerm);
      
      if (matches) {
        item.classList.remove('hidden');
      } else {
        item.classList.add('hidden');
      }
    });
  }

  // ===== Event Listeners =====
  
  // Toggle on trigger click
  if (selectTrigger) {
    selectTrigger.addEventListener('click', toggleDropdown);
  }

  // Handle option clicks
  optionItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const value = item.dataset.value;
      const label = item.querySelector('.option-label')?.textContent || value;
      selectOption(value, label);
    });
  });

  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterOptions(e.target.value);
    });
    
    // Prevent dropdown from closing when clicking search
    searchInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!customSelect.contains(e.target)) {
      closeDropdown();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!customSelect.classList.contains('open')) return;
    
    if (e.key === 'Escape') {
      closeDropdown();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      navigateOptions(e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const focused = document.querySelector('.option-item:focus');
      if (focused) {
        const value = focused.dataset.value;
        const label = focused.querySelector('.option-label')?.textContent || value;
        selectOption(value, label);
      }
    }
  });

  // ===== Keyboard Navigation Helper =====
  function navigateOptions(direction) {
    const visibleOptions = Array.from(optionItems).filter(item => !item.classList.contains('hidden'));
    if (visibleOptions.length === 0) return;
    
    const currentFocused = document.querySelector('.option-item:focus');
    let currentIndex = visibleOptions.indexOf(currentFocused);
    
    if (currentIndex === -1) {
      currentIndex = direction > 0 ? -1 : visibleOptions.length;
    }
    
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < visibleOptions.length) {
      visibleOptions[nextIndex].focus();
      visibleOptions[nextIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  // Make options focusable
  optionItems.forEach(item => {
    item.setAttribute('tabindex', '0');
  });

  // ===== Load Saved Preference =====
  function loadSavedModel() {
    try {
      const savedModel = localStorage.getItem('selectedModel');
      if (savedModel) {
        const option = Array.from(optionItems).find(item => item.dataset.value === savedModel);
        if (option) {
          const label = option.querySelector('.option-label')?.textContent || savedModel;
          selectOption(savedModel, label);
        }
      } else {
        // Set gpt-4o-mini as default
        const defaultOption = Array.from(optionItems).find(item => item.dataset.value === 'gpt-4o-mini');
        if (defaultOption) {
          const label = defaultOption.querySelector('.option-label')?.textContent || 'gpt-4o-mini';
          selectOption('gpt-4o-mini', label);
        }
      }
    } catch (e) {
      console.error('Failed to load model preference:', e);
    }
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

  // ===== Initialize =====
  loadSavedModel();

  console.log('🎨 Custom model dropdown initialized with animations!');
})();
