// Enhanced Projects Management with 8+ Features
(() => {
  // ===== DOM Elements =====
  const menuProjects = document.getElementById('menuProjects');
  const projectsSection = document.getElementById('projectsSection');
  const projectsList = document.getElementById('projectsList');
  const newProjectBtn = document.getElementById('newProjectBtn');
  const conversationList = document.getElementById('conversationList');
  const menuSearchSection = document.getElementById('menuSearchSection');

  // ===== State =====
  let projects = [];
  let currentProjectId = null;
  let currentView = 'list'; // 'list' or 'detail'
  let selectedColor = 'blue';
  let selectedEmoji = '📁';

  // ===== Project Colors & Emojis =====
  const projectColors = [
    { name: 'blue', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'green', gradient: 'linear-gradient(135deg, #10a37f 0%, #0d8a6a 100%)' },
    { name: 'orange', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'pink', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { name: 'purple', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { name: 'red', gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' }
  ];
  
  const projectEmojis = ['📁', '💼', '🎨', '🚀', '💡', '📊', '🔬', '🎯', '🏆', '⚡', '🌟', '🔥', '💎', '🎪', '🎭', '🎬'];

  // ===== Load Projects =====
  function loadProjects() {
    try {
      const saved = localStorage.getItem('projects');
      return saved ? JSON.parse(saved) : getDefaultProjects();
    } catch (e) {
      console.error('Failed to load projects:', e);
      return getDefaultProjects();
    }
  }

  // ===== Default Projects =====
  function getDefaultProjects() {
    return [
      {
        id: Date.now(),
        name: 'Personal',
        description: 'Personal conversations and notes',
        emoji: '📁',
        color: 'blue',
        chatIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: ['personal'],
        isFavorite: false,
        isArchived: false
      }
    ];
  }

  // ===== Save Projects =====
  function saveProjects() {
    try {
      localStorage.setItem('projects', JSON.stringify(projects));
      return true;
    } catch (e) {
      console.error('Failed to save projects:', e);
      return false;
    }
  }

  // ===== Create Custom Dialog =====
  function createDialog(title, subtitle, onSubmit) {
    const overlay = document.createElement('div');
    overlay.className = 'project-dialog-overlay';
    overlay.innerHTML = `
      <div class="project-dialog">
        <div class="dialog-header">
          <div class="dialog-title">${title}</div>
          <div class="dialog-subtitle">${subtitle}</div>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">Project Name</label>
            <input type="text" class="form-input" id="projectNameInput" placeholder="Enter project name..." maxlength="50">
          </div>
          <div class="form-group">
            <label class="form-label">Description (Optional)</label>
            <textarea class="form-input form-textarea" id="projectDescInput" placeholder="Add a description..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Choose Icon</label>
            <div class="emoji-picker" id="emojiPicker">
              ${projectEmojis.map(emoji => `
                <div class="emoji-option ${emoji === selectedEmoji ? 'selected' : ''}" data-emoji="${emoji}">${emoji}</div>
              `).join('')}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Choose Color</label>
            <div class="color-picker" id="colorPicker">
              ${projectColors.map(color => `
                <div class="color-option ${color.name === selectedColor ? 'selected' : ''}" 
                     data-color="${color.name}" 
                     style="background: ${color.gradient}"></div>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="dialog-btn dialog-btn-cancel" id="dialogCancel">Cancel</button>
          <button class="dialog-btn dialog-btn-primary" id="dialogSubmit">Create Project</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 10);

    const nameInput = overlay.querySelector('#projectNameInput');
    const descInput = overlay.querySelector('#projectDescInput');
    const submitBtn = overlay.querySelector('#dialogSubmit');
    const cancelBtn = overlay.querySelector('#dialogCancel');

    // Focus name input
    nameInput.focus();

    // Emoji selection
    overlay.querySelectorAll('.emoji-option').forEach(opt => {
      opt.addEventListener('click', () => {
        overlay.querySelectorAll('.emoji-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedEmoji = opt.dataset.emoji;
      });
    });

    // Color selection
    overlay.querySelectorAll('.color-option').forEach(opt => {
      opt.addEventListener('click', () => {
        overlay.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedColor = opt.dataset.color;
      });
    });

    // Submit
    submitBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (!name) {
        nameInput.focus();
        return;
      }
      onSubmit({
        name,
        description: descInput.value.trim(),
        emoji: selectedEmoji,
        color: selectedColor
      });
      closeDialog(overlay);
    });

    // Cancel
    cancelBtn.addEventListener('click', () => closeDialog(overlay));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDialog(overlay);
    });

    // Enter to submit
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') submitBtn.click();
    });
  }

  function closeDialog(overlay) {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  }

  // ===== Render Projects List =====
  function renderProjects() {
    if (!projectsList) return;

    const activeProjects = projects.filter(p => !p.isArchived);

    if (activeProjects.length === 0) {
      projectsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📁</div>
          <div class="empty-state-title">No Projects Yet</div>
          <div class="empty-state-text">Create your first project to organize your chats</div>
        </div>
      `;
      return;
    }

    projectsList.innerHTML = activeProjects.map(project => {
      const chatCount = project.chatIds?.length || 0;
      const colorGradient = projectColors.find(c => c.name === project.color)?.gradient || projectColors[0].gradient;
      
      return `
        <div class="project-item ${project.id === currentProjectId ? 'active' : ''}" data-project-id="${project.id}">
          <div class="project-icon" style="background: ${colorGradient}">
            ${project.emoji}
          </div>
          <div class="project-info">
            <div class="project-name">${project.name}</div>
            <div class="project-meta">
              <span class="project-chat-count">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894"/>
                </svg>
                ${chatCount} ${chatCount === 1 ? 'chat' : 'chats'}
              </span>
              ${project.isFavorite ? '<span>⭐</span>' : ''}
            </div>
          </div>
          <div class="project-actions">
            <button class="add-to-project-btn" data-action="open">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
              </svg>
              Open Project
            </button>
            <button class="project-action-btn edit-project-btn" aria-label="Edit">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
              </svg>
            </button>
            <button class="project-action-btn delete-project-btn" aria-label="Delete">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    attachProjectEventListeners();
  }

  // ===== Attach Event Listeners =====
  function attachProjectEventListeners() {
    const projectItems = projectsList.querySelectorAll('.project-item');
    
    projectItems.forEach(item => {
      const projectId = parseInt(item.dataset.projectId);
      
      // Open button
      const openBtn = item.querySelector('[data-action="open"]');
      if (openBtn) {
        openBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          // Hide the projects list first
          if (projectsSection) {
            projectsSection.classList.add('hidden');
          }
          // Then open the detail view
          openProjectDetail(projectId);
        });
      }

      // Edit button
      const editBtn = item.querySelector('.edit-project-btn');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          editProject(projectId);
        });
      }

      // Delete button
      const deleteBtn = item.querySelector('.delete-project-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteProject(projectId);
        });
      }
    });
  }

  // ===== Open Project Detail View =====
  function openProjectDetail(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    currentProjectId = projectId;
    const colorGradient = projectColors.find(c => c.name === project.color)?.gradient || projectColors[0].gradient;
    
    const detailView = document.createElement('div');
    detailView.className = 'project-detail-view';
    detailView.id = 'projectDetailView';
    detailView.innerHTML = `
      <div class="project-detail-header">
        <div class="project-detail-title-row">
          <button class="project-detail-back" id="backToProjects">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="project-detail-icon" style="background: ${colorGradient}">
            ${project.emoji}
          </div>
          <div class="project-detail-info">
            <div class="project-detail-name">${project.name}</div>
            <div class="project-detail-description">${project.description || 'No description'}</div>
          </div>
          <div class="project-detail-actions">
            <button class="project-action-btn-large primary" id="addChatToProject">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14m7-7H5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Add Chat
            </button>
            <button class="project-action-btn-large secondary" id="projectSettings">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/>
                <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"/>
              </svg>
              Settings
            </button>
          </div>
        </div>
        <div class="project-detail-stats">
          <div class="project-stat">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894"/>
            </svg>
            <span class="project-stat-value">${project.chatIds?.length || 0}</span> Chats
          </div>
          <div class="project-stat">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
            </svg>
            Created ${new Date(project.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
      <div class="project-detail-content">
        <div class="project-tabs">
          <div class="project-tab active" data-tab="chats">Chats</div>
          <div class="project-tab" data-tab="activity">Activity</div>
          <div class="project-tab" data-tab="settings">Settings</div>
        </div>
        <div class="project-tab-content" id="projectTabContent">
          ${renderProjectChats(project)}
        </div>
      </div>
    `;

    document.body.appendChild(detailView);

    // Event listeners
    document.getElementById('backToProjects').addEventListener('click', backToProjectsList);
    document.getElementById('addChatToProject').addEventListener('click', () => addChatToProject(projectId));
    
    // Tab switching
    detailView.querySelectorAll('.project-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        detailView.querySelectorAll('.project-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        // Switch content based on tab
      });
    });
  }

  function renderProjectChats(project) {
    if (!project.chatIds || project.chatIds.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <div class="empty-state-title">No Chats Yet</div>
          <div class="empty-state-text">Add chats to this project to get started</div>
          <button class="dialog-btn dialog-btn-primary" onclick="window.addChatToProject(${project.id})">
            Add Your First Chat
          </button>
        </div>
      `;
    }

    // Get conversations from localStorage
    const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
    const projectChats = conversations.filter(c => project.chatIds.includes(c.id));

    return `
      <div class="project-chats-grid">
        ${projectChats.map(chat => `
          <div class="project-chat-card" data-chat-id="${chat.id}" onclick="window.openChatFromProject(${chat.id})">
            <div class="project-chat-title">${chat.title || 'Untitled Chat'}</div>
            <div class="project-chat-preview">${chat.messages?.[0]?.text?.substring(0, 100) || 'No messages yet'}...</div>
            <div class="project-chat-meta">
              <span>${chat.messages?.length || 0} messages</span>
              <span>${new Date(chat.id).toLocaleDateString()}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function closeProjectDetail() {
    const detailView = document.getElementById('projectDetailView');
    if (detailView) {
      detailView.remove();
    }
    // Show projects list again when closing detail view
    if (projectsSection && !projectsSection.classList.contains('hidden')) {
      // Projects section should be visible, but we need to ensure it's shown
      projectsSection.classList.remove('hidden');
      if (conversationList) {
        conversationList.style.display = 'none';
      }
    }
  }
  
  function backToProjectsList() {
    const detailView = document.getElementById('projectDetailView');
    if (detailView) {
      detailView.remove();
    }
    // Show projects list
    if (projectsSection) {
      projectsSection.classList.remove('hidden');
      if (conversationList) {
        conversationList.style.display = 'none';
      }
      renderProjects();
    }
  }

  // ===== Add Chat to Project =====
  function addChatToProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Get all conversations
    const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
    
    if (conversations.length === 0) {
      showNotification('No chats available. Create a chat first!');
      return;
    }

    // Filter out chats already in this project
    const availableChats = conversations.filter(c => !project.chatIds.includes(c.id));

    if (availableChats.length === 0) {
      showNotification('All chats are already in this project!');
      return;
    }

    // Create selection dialog
    const overlay = document.createElement('div');
    overlay.className = 'project-dialog-overlay';
    overlay.innerHTML = `
      <div class="project-dialog">
        <div class="dialog-header">
          <div class="dialog-title">Add Chat to ${project.name}</div>
          <div class="dialog-subtitle">Select chats to add to this project</div>
        </div>
        <div class="dialog-body" style="max-height: 400px; overflow-y: auto;">
          ${availableChats.map(chat => `
            <div class="chat-select-item" data-chat-id="${chat.id}">
              <input type="checkbox" id="chat-${chat.id}" class="chat-checkbox">
              <label for="chat-${chat.id}" style="flex: 1; cursor: pointer; padding: 12px; display: flex; flex-direction: column; gap: 4px;">
                <div style="font-weight: 500; color: var(--text-primary);">${chat.title || 'Untitled Chat'}</div>
                <div style="font-size: 12px; color: var(--text-secondary);">${chat.messages?.length || 0} messages • ${new Date(chat.id).toLocaleDateString()}</div>
              </label>
            </div>
          `).join('')}
        </div>
        <div class="dialog-footer">
          <button class="dialog-btn dialog-btn-cancel" id="dialogCancel">Cancel</button>
          <button class="dialog-btn dialog-btn-primary" id="dialogSubmit">Add Selected</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 10);

    const submitBtn = overlay.querySelector('#dialogSubmit');
    const cancelBtn = overlay.querySelector('#dialogCancel');

    // Submit
    submitBtn.addEventListener('click', () => {
      const selectedChats = Array.from(overlay.querySelectorAll('.chat-checkbox:checked'))
        .map(cb => parseInt(cb.id.replace('chat-', '')));

      if (selectedChats.length === 0) {
        showNotification('Please select at least one chat');
        return;
      }

      // Add chats to project
      project.chatIds = [...new Set([...project.chatIds, ...selectedChats])];
      project.updatedAt = Date.now();
      saveProjects();

      closeDialog(overlay);
      showNotification(`✅ Added ${selectedChats.length} chat(s) to ${project.name}`);

      // Refresh project detail view if open
      const detailView = document.getElementById('projectDetailView');
      if (detailView) {
        closeProjectDetail();
        openProjectDetail(projectId);
      }
    });

    // Cancel
    cancelBtn.addEventListener('click', () => closeDialog(overlay));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDialog(overlay);
    });
  }

  // ===== Create New Project =====
  function createNewProject() {
    createDialog(
      'Create New Project',
      'Organize your chats into projects',
      (data) => {
        const newProject = {
          id: Date.now(),
          name: data.name,
          description: data.description,
          emoji: data.emoji,
          color: data.color,
          chatIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: [],
          isFavorite: false,
          isArchived: false
        };

        projects.push(newProject);
        saveProjects();
        renderProjects();
        showNotification(`✨ Project "${data.name}" created!`);
      }
    );
  }

  // ===== Edit Project =====
  function editProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    selectedColor = project.color;
    selectedEmoji = project.emoji;

    createDialog(
      'Edit Project',
      'Update project details',
      (data) => {
        project.name = data.name;
        project.description = data.description;
        project.emoji = data.emoji;
        project.color = data.color;
        project.updatedAt = Date.now();
        
        saveProjects();
        renderProjects();
        showNotification(`✏️ Project "${data.name}" updated!`);
      }
    );

    // Pre-fill form
    setTimeout(() => {
      const nameInput = document.getElementById('projectNameInput');
      const descInput = document.getElementById('projectDescInput');
      if (nameInput) nameInput.value = project.name;
      if (descInput) descInput.value = project.description || '';
    }, 100);
  }

  // ===== Delete Project =====
  function deleteProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const confirmed = confirm(`Delete project "${project.name}"?\n\nChats will not be deleted, only removed from this project.`);
    if (!confirmed) return;

    projects = projects.filter(p => p.id !== projectId);
    if (currentProjectId === projectId) {
      currentProjectId = null;
    }
    saveProjects();
    renderProjects();
    showNotification(`🗑️ Project "${project.name}" deleted`);
  }

  // ===== Toggle Projects View =====
  function toggleProjectsView() {
    if (!projectsSection) return;

    // Check if we're in projects mode (either list or detail view)
    const projectsListHidden = projectsSection.classList.contains('hidden');
    const detailViewOpen = document.getElementById('projectDetailView');
    const inProjectsMode = !projectsListHidden || detailViewOpen;
    
    // Hide search if open
    if (menuSearchSection) {
      menuSearchSection.classList.add('hidden');
    }

    if (inProjectsMode) {
      // Switch to normal chat view
      projectsSection.classList.add('hidden');
      closeProjectDetail();
      if (conversationList) {
        conversationList.style.display = 'block';
      }
    } else {
      // Switch to projects view
      projectsSection.classList.remove('hidden');
      if (conversationList) {
        conversationList.style.display = 'none';
      }
      renderProjects();
    }
  }

  // ===== Hide Projects and Show Normal Chat =====
  function hideProjectsShowChats() {
    if (projectsSection) {
      projectsSection.classList.add('hidden');
    }
    if (conversationList) {
      conversationList.style.display = 'block';
    }
    closeProjectDetail();
  }

  // ===== Show Notification =====
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

  // ===== Global Functions =====
  window.addChatToProject = addChatToProject;
  window.openChatFromProject = function(chatId) {
    // Close project view
    closeProjectDetail();
    hideProjectsShowChats();
    
    // Set active conversation
    const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
    const chat = conversations.find(c => c.id === chatId);
    
    if (chat) {
      // Use the global function from script.js if available
      if (window.__crazyChat && window.__crazyChat.setActiveConversation) {
        window.__crazyChat.setActiveConversation(chatId);
      }
      
      // Close menu
      if (window.__crazyChat && window.__crazyChat.closeMenu) {
        window.__crazyChat.closeMenu();
      }
      
      showNotification(`Opened: ${chat.title || 'Chat'}`);
    }
  };

  // Export function to hide projects when clicking normal chats
  window.__projects = {
    hideProjectsShowChats: hideProjectsShowChats
  };

  // ===== Event Listeners =====
  if (menuProjects) {
    menuProjects.addEventListener('click', toggleProjectsView);
  }

  if (newProjectBtn) {
    newProjectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      createNewProject();
    });
  }

  // ===== Initialize =====
  projects = loadProjects();
  
  console.log('📁 Enhanced Projects system initialized with 8+ features!');
})();
