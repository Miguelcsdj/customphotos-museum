const STORAGE_KEY = 'customphotos-museum-v1';

const MATERIALS = {
  wood: 'Madeira',
  gold: 'Ouro',
  silver: 'Prata',
  bronze: 'Bronze',
  diamond: 'Diamante'
};

const defaultState = {
  galleryName: 'CustomPhotos Museum',
  galleryPrivate: false,
  notificationsEnabled: true,
  theme: 'classic',
  profileName: 'Visitante',
  activeRoomId: 'room-1',
  rooms: [
    {
      id: 'room-1',
      name: 'Nature Scenes',
      frames: [
        createFrame('Paisagem', 'wood'),
        createFrame('Lago', 'gold'),
        createFrame('Montanha', 'silver')
      ]
    },
    {
      id: 'room-2',
      name: 'Travel Adventures',
      frames: [
        createFrame('Viagem', 'bronze'),
        createFrame('Praia', 'diamond'),
        createFrame('Cidade', 'wood')
      ]
    }
  ]
};

let state = loadState();
let activeFrameId = null;

const roomTabsEl = document.getElementById('roomTabs');
const galleryArea = document.getElementById('galleryArea');
const fileInput = document.getElementById('fileInput');
const saveBtn = document.getElementById('saveBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const settingsBtn = document.getElementById('settingsBtn');
const toastContainer = document.getElementById('toastContainer');
const editorModal = document.getElementById('editorModal');
const settingsModal = document.getElementById('settingsModal');

const frameLabelInput = document.getElementById('frameLabelInput');
const frameMaterialInput = document.getElementById('frameMaterialInput');
const framePrivateInput = document.getElementById('framePrivateInput');
const frameFavoriteInput = document.getElementById('frameFavoriteInput');
const saveFrameBtn = document.getElementById('saveFrameBtn');
const deleteFrameBtn = document.getElementById('deleteFrameBtn');

const profileNameInput = document.getElementById('profileNameInput');
const galleryPrivateToggle = document.getElementById('galleryPrivateToggle');
const notificationsToggle = document.getElementById('notificationsToggle');
const clearDataBtn = document.getElementById('clearDataBtn');

function createFrame(label, material = 'wood') {
  return {
    id: crypto.randomUUID(),
    label,
    image: '',
    material,
    private: false,
    favorite: false
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(defaultState), ...parsed, rooms: parsed.rooms || structuredClone(defaultState.rooms) };
  } catch {
    return structuredClone(defaultState);
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function showToast(msg) {
  if (!state.notificationsEnabled) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2200);
}

function getActiveRoom() {
  return state.rooms.find(room => room.id === state.activeRoomId) || state.rooms[0];
}

function updateTheme() {
  document.body.classList.remove('theme-classic', 'theme-wood', 'theme-blue', 'theme-purple', 'theme-red');
  document.body.classList.add(`theme-${state.theme}`);

  document.querySelectorAll('.theme-option').forEach(option => {
    option.classList.toggle('active', option.dataset.theme === state.theme);
  });
}

function renderTabs() {
  roomTabsEl.innerHTML = '';

  state.rooms.forEach(room => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'room-tab' + (room.id === state.activeRoomId ? ' active' : '');
    button.textContent = room.name;
    button.onclick = () => {
      state.activeRoomId = room.id;
      render();
    };
    roomTabsEl.appendChild(button);
  });

  const addRoomBtn = document.createElement('button');
  addRoomBtn.type = 'button';
  addRoomBtn.className = 'room-tab';
  addRoomBtn.textContent = '+ Sala';
  addRoomBtn.onclick = () => {
    const input = prompt('Nome da nova sala:', `Sala ${state.rooms.length + 1}`);
    if (!input) return;

    const newRoom = {
      id: crypto.randomUUID(),
      name: input,
      frames: []
    };

    state.rooms.push(newRoom);
    state.activeRoomId = newRoom.id;
    persistState();
    render();
    showToast('Sala criada!');
  };

  roomTabsEl.appendChild(addRoomBtn);
}

function renderGallery() {
  const room = getActiveRoom();
  galleryArea.innerHTML = '';

  room.frames.forEach(frame => {
    const card = document.createElement('article');
    card.className = `frame ${frame.material || 'wood'}`;

    if (frame.private) {
      const badge = document.createElement('div');
      badge.className = 'frame-private-badge';
      badge.textContent = 'Privado';
      card.appendChild(badge);
    }

    const controls = document.createElement('div');
    controls.className = 'frame-controls';

    const starButton = document.createElement('button');
    starButton.type = 'button';
    starButton.className = 'frame-control';
    starButton.title = 'Favoritar';
    starButton.textContent = frame.favorite ? '★' : '☆';
    starButton.onclick = event => {
      event.stopPropagation();
      frame.favorite = !frame.favorite;
      persistState();
      render();
    };

    const privateButton = document.createElement('button');
    privateButton.type = 'button';
    privateButton.className = 'frame-control';
    privateButton.title = 'Privacidade';
    privateButton.textContent = frame.private ? '🔒' : '🔓';
    privateButton.onclick = event => {
      event.stopPropagation();
      frame.private = !frame.private;
      persistState();
      render();
    };

    controls.append(starButton, privateButton);
    card.appendChild(controls);

    const imageWrap = document.createElement('div');
    imageWrap.className = 'frame-image';

    if (frame.image) {
      const img = document.createElement('img');
      img.src = frame.image;
      img.alt = frame.label;
      imageWrap.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'frame-placeholder';
      placeholder.textContent = '🖼️';
      imageWrap.appendChild(placeholder);
    }

    const label = document.createElement('div');
    label.className = 'frame-label';
    label.textContent = frame.label || 'Novo quadro';

    card.append(imageWrap, label);
    card.addEventListener('click', () => openEditor(frame.id));
    galleryArea.appendChild(card);
  });

  const addCard = document.createElement('article');
  addCard.className = 'frame frame--add';
  addCard.innerHTML = `
    <div class="frame-image"><div class="frame-placeholder">＋</div></div>
    <div class="frame-label">Adicionar quadro</div>
  `;
  addCard.addEventListener('click', () => {
    const fileInputForFrame = document.getElementById('fileInput');
    fileInputForFrame.click();
  });
  galleryArea.appendChild(addCard);
}

function openEditor(frameId) {
  activeFrameId = frameId;
  const room = getActiveRoom();
  const frame = room.frames.find(item => item.id === frameId);
  if (!frame) return;

  frameLabelInput.value = frame.label || '';
  frameMaterialInput.value = frame.material || 'wood';
  framePrivateInput.checked = !!frame.private;
  frameFavoriteInput.checked = !!frame.favorite;

  editorModal.classList.remove('hidden');
}

function closeEditor() {
  editorModal.classList.add('hidden');
  activeFrameId = null;
}

function saveFrameEditor() {
  const room = getActiveRoom();
  const frame = room.frames.find(item => item.id === activeFrameId);
  if (!frame) return;

  frame.label = frameLabelInput.value.trim() || 'Novo quadro';
  frame.material = frameMaterialInput.value;
  frame.private = framePrivateInput.checked;
  frame.favorite = frameFavoriteInput.checked;

  persistState();
  render();
  closeEditor();
  showToast('Quadro salvo!');
}

function deleteCurrentFrame() {
  const room = getActiveRoom();
  room.frames = room.frames.filter(item => item.id !== activeFrameId);
  persistState();
  render();
  closeEditor();
  showToast('Quadro removido!');
}

function handleUpload(files) {
  const room = getActiveRoom();
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      room.frames.push({
        id: crypto.randomUUID(),
        label: file.name.replace(/\.[^/.]+$/, '') || 'Nova imagem',
        image: reader.result,
        material: 'wood',
        private: false,
        favorite: false
      });

      persistState();
      render();
      showToast(`${file.name} carregada!`);
    };
    reader.readAsDataURL(file);
  });
}

function exportGallery() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'customphotos-museum.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('Galeria exportada!');
}

function importGallery() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      state = { ...structuredClone(defaultState), ...imported };
      if (!state.rooms || !Array.isArray(state.rooms)) {
        state.rooms = structuredClone(defaultState.rooms);
      }
      persistState();
      render();
      showToast('Galeria importada!');
    } catch {
      showToast('Arquivo inválido');
    }
  };
  input.click();
}

function clearLocalData() {
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(defaultState);
  render();
  showToast('Dados locais limpos.');
}

function openSettings() {
  profileNameInput.value = state.profileName || '';
  galleryPrivateToggle.checked = !!state.galleryPrivate;
  notificationsToggle.checked = !!state.notificationsEnabled;
  settingsModal.classList.remove('hidden');
}

function closeSettings() {
  settingsModal.classList.add('hidden');
}

function applySettings() {
  state.profileName = profileNameInput.value.trim() || 'Visitante';
  state.galleryPrivate = galleryPrivateToggle.checked;
  state.notificationsEnabled = notificationsToggle.checked;
  persistState();
  render();
  closeSettings();
  showToast('Configurações salvas!');
}

function bindEvents() {
  saveBtn.onclick = () => {
    persistState();
    showToast('Galeria salva!');
  };

  exportBtn.onclick = exportGallery;
  importBtn.onclick = importGallery;
  settingsBtn.onclick = openSettings;

  fileInput.addEventListener('change', event => {
    const files = event.target.files;
    if (files && files.length) {
      handleUpload(files);
      fileInput.value = '';
    }
  });

  document.querySelectorAll('[data-close]').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.close;
      if (target === 'editorModal') closeEditor();
      if (target === 'settingsModal') closeSettings();
    });
  });

  saveFrameBtn.onclick = saveFrameEditor;
  deleteFrameBtn.onclick = deleteCurrentFrame;

  profileNameInput.addEventListener('change', applySettings);
  galleryPrivateToggle.addEventListener('change', applySettings);
  notificationsToggle.addEventListener('change', applySettings);

  document.querySelectorAll('.theme-option').forEach(button => {
    button.addEventListener('click', () => {
      state.theme = button.dataset.theme;
      updateTheme();
      persistState();
      showToast(`Tema ${button.dataset.theme} aplicado!`);
    });
  });

  clearDataBtn.onclick = () => {
    clearLocalData();
    closeSettings();
  };

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeEditor();
      closeSettings();
    }
  });
}

function render() {
  updateTheme();
  renderTabs();
  renderGallery();
}

bindEvents();
render();
