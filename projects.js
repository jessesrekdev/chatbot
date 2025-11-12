// Projects Management
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

  // ===== Project Colors =====
  const projectColors = ['blue', 'green', 'orange', 'pink'];
  const projectEmojis = ['📁', '💼', '🎨', '🚀', '💡', '📊', '🔬', '🎯'];

  // ===== Load Projects from localStorage =====
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
        emoji: '📁',
        color: 'blue',
        chatCount: 0,
        createdAt: Date.now()
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

  // ===== Render Projects =====
  function renderProjects() {
    if (!projectsList) return;

    if (projects.length === 0) {
      projectsList.innerHTML = '<p style="padding: 12px; color: var(--text-secondary); font-size: 13px; text-align: center;">No projects yet</p>';
      return;
    }

    projectsList.innerHTML = projects.map(project => `
      <div class="project-item ${project.id === currentProjectId ? 'active' : ''}" data-project-id="${project.id}">
        <div class="project-icon ${project.color}">
          ${project.emoji}
        </div>
        <div class="project-info">
          <div class="project-name">${project.name}</div>
          <div class="project-meta">
            <span class="project-chat-count">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894"/>
              </svg>
              ${project.chatCount || 0} chats
            </span>
          </div>
        </div>
        <div class="project-actions">
          <button class="add-to-project-btn add-chat-btn" data-action="chat">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12 5v14m7-7H5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Add Chat
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
    `).join('');

    // Add event listeners
    attachProjectEventListeners();
  }

  // ===== Attach Event Listeners to Projects =====
  function attachProjectEventListeners() {
    const projectItems = projectsList.querySelectorAll('.project-item');
    
    projectItems.forEach(item => {
      const projectId = parseInt(item.dataset.projectId);
      
      // Click on project
      item.addEventListener('click', (e) => {
        if (e.target.closest('.project-action-btn')) return;
        selectProject(projectId);
      });

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

  // ===== Select Project =====
  function selectProject(projectId) {
    currentProjectId = projectId;
    renderProjects();
    // Filter conversations by project (to be implemented)
    console.log('Selected project:', projectId);
  }

  // ===== Create New Project =====
  function createNewProject() {
    const name = prompt('Enter project name:');
    if (!name || !name.trim()) return;

    const newProject = {
      id: Date.now(),
      name: name.trim(),
      emoji: projectEmojis[Math.floor(Math.random() * projectEmojis.length)],
      color: projectColors[Math.floor(Math.random() * projectColors.length)],
      chatCount: 0,
      createdAt: Date.now()
    };

    projects.push(newProject);
    saveProjects();
    renderProjects();
    showNotification(`✨ Project "${name}" created!`);
  }

  // ===== Edit Project =====
  function editProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newName = prompt('Edit project name:', project.name);
    if (!newName || !newName.trim()) return;

    project.name = newName.trim();
    saveProjects();
    renderProjects();
    showNotification(`✏️ Project renamed to "${newName}"`);
  }

  // ===== Delete Project =====
  function deleteProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    if (!confirm(`Delete project "${project.name}"? This won't delete the chats.`)) return;

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

    const isHidden = projectsSection.classList.contains('hidden');
    
    // Hide search if open
    if (menuSearchSection) {
      menuSearchSection.classList.add('hidden');
    }

    if (isHidden) {
      projectsSection.classList.remove('hidden');
      renderProjects();
    } else {
      projectsSection.classList.add('hidden');
    }
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
  
  console.log('📁 Projects system initialized!');
})();
