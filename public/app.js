const modelSelect = document.getElementById('model');
const imageSizeSelect = document.getElementById('imageSize');
const aspectRatioSelect = document.getElementById('aspectRatio');
const claritySelect = document.getElementById('clarity');
const clarityLabel = document.getElementById('clarityLabel');
const modelOverride = document.getElementById('modelOverride');
const apiKeyInput = document.getElementById('apiKey');
const openAiKeyInput = document.getElementById('openAiKey');
const promptInput = document.getElementById('prompt');
const promptField = promptInput?.closest('.field.wide');
const imageInput = document.getElementById('imagePrompt');
const imagePreview = document.getElementById('imagePreview');
const selectedList = document.getElementById('selectedList');
const promptImagesField = imagePreview?.closest('.field.wide');
const removeSelectedBtn = document.getElementById('removeSelectedBtn');
const generateBtn = document.getElementById('generateBtn');
const controlPanel = document.getElementById('controlPanel');
const statusEl = document.getElementById('status');
const pendingBar = document.getElementById('pendingBar');
const projectBar = document.getElementById('projectBar');
const resultsEl = document.getElementById('results');
const logoStar = document.querySelector('.logo');
const brandEl = document.querySelector('.brand');
const meteorOverlay = document.getElementById('meteorOverlay');
const memoBoard = document.getElementById('memoBoard');
const memoDisplay = document.getElementById('memoDisplay');
const memoInput = document.getElementById('memoInput');
const likedOnlyToggle = document.getElementById('likedOnly');
const usageToggle = document.getElementById('usageToggle');
const usagePie = document.getElementById('usagePie');
const usageText = document.getElementById('usageText');
const tokenSummary = document.getElementById('tokenSummary');
const trashToggle = document.getElementById('trashToggle');
const usageModal = document.getElementById('usageModal');
const usageModalBackdrop = document.getElementById('usageModalBackdrop');
const usageModalClose = document.getElementById('usageModalClose');
const usageModalBody = document.getElementById('usageModalBody');
const usageModalSubtitle = document.getElementById('usageModalSubtitle');
const trashModal = document.getElementById('trashModal');
const trashModalBackdrop = document.getElementById('trashModalBackdrop');
const trashModalClose = document.getElementById('trashModalClose');
const trashModalBody = document.getElementById('trashModalBody');
const trashBatchBtn = document.getElementById('trashBatchBtn');
const trashRestoreBtn = document.getElementById('trashRestoreBtn');
const trashClearBtn = document.getElementById('trashClearBtn');
const clearBtn = document.getElementById('clearBtn');
const cardTemplate = document.getElementById('cardTemplate');
const detailModal = document.getElementById('detailModal');
const detailBackdrop = document.getElementById('detailBackdrop');
const detailLayout = document.querySelector('.detail-layout');
const detailClose = document.getElementById('detailClose');
const detailPrev = document.getElementById('detailPrev');
const detailNext = document.getElementById('detailNext');
const detailDelete = document.getElementById('detailDelete');
const detailIndex = document.getElementById('detailIndex');
const detailModel = document.getElementById('detailModel');
const detailImage = document.getElementById('detailImage');
const detailPrompt = document.getElementById('detailPrompt');
const detailInfo = document.getElementById('detailInfo');
const copyPromptBtn = document.getElementById('copyPromptBtn');

const LIKED_KEY = 'image-aggregator-liked-v1';
const API_KEY_STORAGE = 'image-aggregator-google-api-key-v1';
const OPENAI_API_KEY_STORAGE = 'image-aggregator-openai-api-key-v1';
const MEMO_STORAGE_KEY = 'image-aggregator-memo-v1';
const DRAFT_STORAGE_KEY = 'image-aggregator-draft-v1';
const LEGACY_RESULTS_KEY = 'image-aggregator-results-v1';
const PROJECTS_STORAGE_KEY = 'image-aggregator-projects-v1';
const USAGE_LEDGER_KEY = 'image-aggregator-usage-ledger-v2';
const USAGE_LEDGER_LEGACY_KEY = 'image-aggregator-usage-ledger-v1';
const MODEL_BILLING = {
  'gemini-2.5-flash-image': {
    key: 'nb',
    shortLabel: 'NB',
    label: 'Nano Banana',
    provider: 'gemini',
    color: '#78b9ff',
  },
  'gemini-3-pro-image-preview': {
    key: 'pro',
    shortLabel: 'NBP',
    label: 'Nano Banana Pro',
    provider: 'gemini',
    color: '#ff9d6c',
  },
  'gemini-3.1-flash-image-preview': {
    key: 'nb2',
    shortLabel: 'NB2',
    label: 'Nano Banana 2',
    provider: 'gemini',
    color: '#8ce99a',
  },
  'gpt-image-2': {
    key: 'gpt2',
    shortLabel: 'GPT2',
    label: 'GPT Image 2',
    provider: 'openai',
    color: '#b997ff',
  },
};
const IMAGE_OUTPUT_PRICING = {
  'gemini-2.5-flash-image': {
    default: 0.039,
  },
  'gemini-3-pro-image-preview': {
    '1K': 0.134,
    '2K': 0.134,
    '4K': 0.24,
    default: 0.134,
  },
  'gemini-3.1-flash-image-preview': {
    '0.5K': 0.045,
    '1K': 0.067,
    '2K': 0.101,
    '4K': 0.151,
    default: 0.067,
  },
  'gpt-image-2': {
    low: 0.017687,
    medium: 0.054107,
    high: 0.177587,
    default: 0.054107,
  },
};
const IMAGE_SIZE_OPTIONS_BY_MODEL = {
  'gemini-2.5-flash-image': [
    { label: '1K', value: '1K' },
    { label: '2K', value: '2K' },
    { label: '4K', value: '4K' },
  ],
  'gemini-3-pro-image-preview': [
    { label: '1K', value: '1K' },
    { label: '2K', value: '2K' },
    { label: '4K', value: '4K' },
  ],
  'gemini-3.1-flash-image-preview': [
    { label: '0.5K', value: '512' },
    { label: '1K', value: '1K' },
    { label: '2K', value: '2K' },
    { label: '4K', value: '4K' },
  ],
  'gpt-image-2': [
    { label: '1024×1024', value: '1024x1024' },
    { label: '1536×1024', value: '1536x1024' },
    { label: '1024×1536', value: '1024x1536' },
  ],
};
const DEFAULT_MODEL_ID = 'gemini-3.1-flash-image-preview';
const DEFAULT_IMAGE_SIZE_BY_MODEL = {
  'gemini-2.5-flash-image': '1K',
  'gemini-3-pro-image-preview': '1K',
  'gemini-3.1-flash-image-preview': '1K',
  'gpt-image-2': '1024x1024',
};

let results = [];
let likedIds = new Set(loadLiked());
let promptImages = [];
const draft = loadDraft();
const usageLedger = loadUsageLedger();
let usageSaveTimer = null;
const projectState = loadProjectState();
let projectSaveTimer = null;
let taskSeq = 0;
const activeTasks = new Map();
let detailCursor = -1;
let detailScope = 'results';
let batchProjectMode = false;
let batchSelectedResultIds = new Set();
let trashItems = [];
let meteorStormTimer = null;
let trashBatchMode = false;
let selectedTrashIds = new Set();
let draggedPromptIndex = null;
let memoEditing = false;
let memoDraftValue = '';

function isOpenAiModel(modelId) {
  return modelId === 'gpt-image-2';
}

function getProviderLabel(modelId) {
  return MODEL_BILLING[modelId]?.provider === 'openai' ? 'OpenAI' : 'Gemini';
}

function loadMemoText() {
  try {
    return localStorage.getItem(MEMO_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function saveMemoText(value) {
  try {
    localStorage.setItem(MEMO_STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

function renderMemoDisplay(value) {
  if (!memoDisplay) return;
  const clean = String(value || '').trim();
  if (!clean) {
    memoDisplay.textContent = 'Write something here...';
    memoDisplay.classList.add('empty');
    return;
  }
  memoDisplay.textContent = clean;
  memoDisplay.classList.remove('empty');
}

function saveMemoNow() {
  if (!memoInput) return;
  const value = memoInput.value || '';
  memoDraftValue = value;
  saveMemoText(value);
  renderMemoDisplay(value);
}

function setMemoEditing(next) {
  memoEditing = Boolean(next);
  if (!memoDisplay || !memoInput) return;
  memoInput.hidden = !memoEditing;
  memoDisplay.hidden = memoEditing;
  memoBoard?.classList.toggle('editing', memoEditing);
  if (memoEditing) {
    memoDraftValue = loadMemoText();
    memoInput.value = memoDraftValue;
    memoInput.focus();
    memoInput.setSelectionRange(memoInput.value.length, memoInput.value.length);
  } else {
    saveMemoNow();
  }
}

function normalizeModelId(raw) {
  if (!raw || raw === 'recovered' || raw === 'unknown') {
    return '';
  }
  if (raw === 'gemini-2.5-flash-image-preview') {
    return 'gemini-3-pro-image-preview';
  }
  if (raw === 'gemini-3.1-flash-image') {
    return 'gemini-3.1-flash-image-preview';
  }
  return raw;
}

function hasModelOption(modelId) {
  return [...modelSelect.options].some((option) => option.value === modelId);
}

function getSafeModelId(raw, fallback = DEFAULT_MODEL_ID) {
  const normalized = normalizeModelId(raw);
  return normalized && hasModelOption(normalized) ? normalized : fallback;
}

function getActiveModelId() {
  const override = normalizeModelId(modelOverride.value.trim());
  if (override) return override;
  return getSafeModelId(modelSelect.value);
}

function getImageSizeLabel(value) {
  if (value === '512') return '0.5K';
  if (value === '1024x1024') return '1024×1024';
  if (value === '1536x1024') return '1536×1024';
  if (value === '1024x1536') return '1024×1536';
  return value || '';
}

function updateImageSizeOptions(preferredValue = imageSizeSelect.value) {
  const modelId = getActiveModelId();
  const options =
    IMAGE_SIZE_OPTIONS_BY_MODEL[modelId] || IMAGE_SIZE_OPTIONS_BY_MODEL['gemini-3-pro-image-preview'];
  const fallbackValue = DEFAULT_IMAGE_SIZE_BY_MODEL[modelId] || '';
  const nextValue = options.some((option) => option.value === preferredValue)
    ? preferredValue
    : fallbackValue;
  imageSizeSelect.innerHTML = '<option value="">Auto</option>';
  for (const option of options) {
    const el = document.createElement('option');
    el.value = option.value;
    el.textContent = option.label;
    imageSizeSelect.appendChild(el);
  }
  imageSizeSelect.value = nextValue;
}

function updateModelSpecificControls() {
  const modelId = getActiveModelId();
  const isOpenAi = isOpenAiModel(modelId);
  if (clarityLabel) {
    clarityLabel.textContent = isOpenAi ? 'Quality' : 'Clarity';
  }
  if (aspectRatioSelect) {
    aspectRatioSelect.disabled = isOpenAi;
    if (isOpenAi) {
      const size = imageSizeSelect.value || DEFAULT_IMAGE_SIZE_BY_MODEL[modelId] || '1024x1024';
      aspectRatioSelect.value = size === '1536x1024' ? '3:2' : size === '1024x1536' ? '2:3' : '1:1';
    }
  }
}

function renderDetailInfoRows(rows) {
  return `<div class="detail-info-grid">${rows
    .map(
      (row) =>
        `<div class="detail-info-row"><span class="detail-info-key">${row.key}</span><span class="detail-info-val">${row.value}</span></div>`
    )
    .join('')}</div>`;
}

apiKeyInput.value = localStorage.getItem(API_KEY_STORAGE) || '';
openAiKeyInput.value = localStorage.getItem(OPENAI_API_KEY_STORAGE) || '';
if (memoInput) memoInput.value = loadMemoText();
renderMemoDisplay(memoInput?.value || '');
promptInput.value = draft.prompt || '';
const initialModel = getSafeModelId(draft.model || DEFAULT_MODEL_ID);
modelSelect.value = initialModel;
aspectRatioSelect.value = draft.aspectRatio || '1:1';
claritySelect.value = draft.clarity || '';
modelOverride.value = normalizeModelId(draft.modelOverride || '');
updateImageSizeOptions(draft.imageSize || DEFAULT_IMAGE_SIZE_BY_MODEL[initialModel] || '1K');
updateModelSpecificControls();
promptImages = Array.isArray(draft.promptImages)
  ? draft.promptImages
      .filter((item) => item && typeof item.dataUrl === 'string' && item.dataUrl.startsWith('data:'))
      .map((item) => ({
        id: item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        dataUrl: item.dataUrl,
        mimeType: item.mimeType || 'image/png',
        source: item.source || 'upload',
        resultId: item.resultId || null,
        checked: Boolean(item.checked),
      }))
  : [];

function loadLiked() {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadProjectState() {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') throw new Error('invalid');
    return {
      activeProjectId: typeof parsed.activeProjectId === 'string' ? parsed.activeProjectId : 'all',
      projects: Array.isArray(parsed.projects)
        ? parsed.projects
            .filter((project) => project && typeof project === 'object' && project.id)
            .map((project) => ({
              id: String(project.id),
              name: String(project.name || 'Project'),
              createdAt: project.createdAt || new Date().toISOString(),
            }))
        : [],
      assignments:
        parsed.assignments && typeof parsed.assignments === 'object' ? { ...parsed.assignments } : {},
    };
  } catch {
    return {
      activeProjectId: 'all',
      projects: [],
      assignments: {},
    };
  }
}

function saveProjectState() {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projectState));
  } catch {
    // The server copy remains the durable source if browser storage is unavailable.
  }
  clearTimeout(projectSaveTimer);
  projectSaveTimer = setTimeout(() => {
    fetch('/api/projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: projectState }),
      keepalive: true,
    }).catch(() => {
      // Keep the local copy and retry on the next project change or page load.
    });
  }, 120);
}

function hasProjectContent(state) {
  return Boolean(
    state &&
      (Array.isArray(state.projects) && state.projects.length > 0 ||
        state.assignments && Object.keys(state.assignments).length > 0)
  );
}

function requestProjectName(currentName) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'project-name-backdrop';
    backdrop.innerHTML = `
      <form class="project-name-dialog" aria-label="Rename project">
        <div class="project-name-title">Rename project</div>
        <input class="project-name-input" type="text" maxlength="80" autocomplete="off" />
        <div class="project-name-actions">
          <button class="project-name-cancel" type="button">Cancel</button>
          <button class="project-name-save" type="submit">Save</button>
        </div>
      </form>
    `;
    const form = backdrop.querySelector('.project-name-dialog');
    const input = backdrop.querySelector('.project-name-input');
    const cancelButton = backdrop.querySelector('.project-name-cancel');
    let settled = false;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      backdrop.remove();
      resolve(value);
    };

    input.value = currentName || '';
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const nextName = input.value.trim();
      if (!nextName) {
        input.focus();
        return;
      }
      finish(nextName);
    });
    cancelButton.addEventListener('click', () => finish(null));
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) finish(null);
    });
    backdrop.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        finish(null);
      }
    });
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => {
      input.focus();
      input.select();
    });
  });
}

async function syncProjectStateFromServer() {
  const res = await fetch('/api/projects');
  if (!res.ok) return;
  const data = await res.json();
  const remote = data?.state;
  if (hasProjectContent(remote)) {
    const normalized = (() => {
      try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(remote));
        return loadProjectState();
      } catch {
        return remote;
      }
    })();
    projectState.activeProjectId = normalized.activeProjectId || 'all';
    projectState.projects = Array.isArray(normalized.projects) ? normalized.projects : [];
    projectState.assignments = normalized.assignments && typeof normalized.assignments === 'object'
      ? { ...normalized.assignments }
      : {};
    return;
  }
  if (hasProjectContent(projectState)) {
    const upload = await fetch('/api/projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: projectState }),
    });
    if (!upload.ok) throw new Error('Failed to migrate projects.');
  }
}

function getProjectForResult(resultId) {
  return projectState.assignments[resultId] || null;
}

function assignResultToProject(resultId, projectId) {
  if (!resultId) return;
  if (projectId === 'all' || !projectId) {
    delete projectState.assignments[resultId];
  } else {
    projectState.assignments[resultId] = projectId;
  }
  saveProjectState();
}

function assignManyResultsToProject(resultIds, projectId) {
  for (const resultId of resultIds) {
    assignResultToProject(resultId, projectId);
  }
}

function restoreResultToOriginalProject(resultId, originalProjectId) {
  assignResultToProject(resultId, originalProjectId || 'all');
}

async function moveResultsToTrash(resultIds) {
  const uniqueIds = [...new Set(resultIds)].filter(Boolean);
  let moved = 0;
  for (const id of uniqueIds) {
    const originalProjectId = getProjectForResult(id) || 'all';
    const res = await fetch(`/api/results/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'x-project-id': originalProjectId },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Trash failed.');
    }
    delete projectState.assignments[id];
    results = results.filter((item) => item.id !== id);
    moved += 1;
  }
  saveProjectState();
  await refreshResultsFromServer();
  await refreshTrashFromServer();
  return moved;
}

function cleanupProjectAssignments() {
  const validIds = new Set(results.map((item) => item.id));
  let changed = false;
  for (const resultId of Object.keys(projectState.assignments)) {
    if (!validIds.has(resultId)) {
      delete projectState.assignments[resultId];
      changed = true;
    }
  }
  const validProjectIds = new Set(projectState.projects.map((project) => project.id));
  for (const [resultId, projectId] of Object.entries(projectState.assignments)) {
    if (!validProjectIds.has(projectId)) {
      delete projectState.assignments[resultId];
      changed = true;
    }
  }
  if (
    projectState.activeProjectId !== 'all' &&
    !validProjectIds.has(projectState.activeProjectId)
  ) {
    projectState.activeProjectId = 'all';
    changed = true;
  }
  if (changed) {
    saveProjectState();
  }
}

function loadUsageLedger() {
  const empty = {
    startedAt: null,
    entries: [],
    migratedLegacy: null,
  };
  try {
    const raw = localStorage.getItem(USAGE_LEDGER_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') throw new Error('invalid');
    return {
      startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : null,
      entries: Array.isArray(parsed.entries)
        ? parsed.entries
            .filter((entry) => entry && typeof entry === 'object')
            .map((entry) => ({
              id: entry.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              createdAt:
                typeof entry.createdAt === 'string' ? entry.createdAt : new Date().toISOString(),
              modelId: normalizeBillingModelId(entry.modelId),
              count: Math.max(1, Number(entry.count || 1)),
              cost: Number(entry.cost || 0),
              imageTier: typeof entry.imageTier === 'string' ? entry.imageTier : null,
              source: entry.source || 'live',
              tokens: {
                prompt: Number(entry.tokens?.prompt || 0),
                output: Number(entry.tokens?.output || 0),
                total: Number(entry.tokens?.total || 0),
              },
            }))
        : [],
      migratedLegacy:
        parsed.migratedLegacy && typeof parsed.migratedLegacy === 'object'
          ? {
              nb: Number(parsed.migratedLegacy.nb || 0),
              pro: Number(parsed.migratedLegacy.pro || 0),
              nb2: Number(parsed.migratedLegacy.nb2 || 0),
              promptTokens: Number(parsed.migratedLegacy.promptTokens || 0),
              outputTokens: Number(parsed.migratedLegacy.outputTokens || 0),
              totalTokens: Number(parsed.migratedLegacy.totalTokens || 0),
              totalPrompts: Number(parsed.migratedLegacy.totalPrompts || 0),
            }
          : null,
    };
  } catch {
    try {
      const rawLegacy = localStorage.getItem(USAGE_LEDGER_LEGACY_KEY);
      const parsedLegacy = rawLegacy ? JSON.parse(rawLegacy) : null;
      if (!parsedLegacy || typeof parsedLegacy !== 'object') return empty;
      return {
        ...empty,
        migratedLegacy: {
          nb: Number(parsedLegacy.nb || 0),
          pro: Number(parsedLegacy.pro || 0),
          nb2: Number(parsedLegacy.nb2 || 0),
          promptTokens: Number(parsedLegacy.promptTokens || 0),
          outputTokens: Number(parsedLegacy.outputTokens || 0),
          totalTokens: Number(parsedLegacy.totalTokens || 0),
          totalPrompts: Number(parsedLegacy.totalPrompts || 0),
        },
      };
    } catch {
      return empty;
    }
  }
}

function saveUsageLedger() {
  try {
    localStorage.setItem(USAGE_LEDGER_KEY, JSON.stringify(usageLedger));
  } catch {
    // The shared server ledger remains durable if browser storage is unavailable.
  }
  clearTimeout(usageSaveTimer);
  usageSaveTimer = setTimeout(() => {
    fetch('/api/usage', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: usageLedger }),
      keepalive: true,
    }).catch(() => {
      // Retry on the next successful generation or app launch.
    });
  }, 120);
}

function hasUsageContent(state) {
  return Boolean(
    state &&
      (Array.isArray(state.entries) && state.entries.length > 0 ||
        state.migratedLegacy && Number(state.migratedLegacy.totalPrompts || 0) > 0)
  );
}

async function syncUsageLedgerFromServer() {
  const res = await fetch('/api/usage');
  if (!res.ok) return;
  const data = await res.json();
  const remote = data?.state;
  if (hasUsageContent(remote)) {
    let normalized = remote;
    try {
      localStorage.setItem(USAGE_LEDGER_KEY, JSON.stringify(remote));
      normalized = loadUsageLedger();
    } catch {
      // Use the server payload directly.
    }
    usageLedger.startedAt = normalized.startedAt || null;
    usageLedger.entries = Array.isArray(normalized.entries) ? normalized.entries : [];
    usageLedger.migratedLegacy = normalized.migratedLegacy || null;
    return;
  }
  if (hasUsageContent(usageLedger)) {
    const upload = await fetch('/api/usage', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: usageLedger }),
    });
    if (!upload.ok) throw new Error('Failed to migrate usage ledger.');
  }
}

function resultImageSrc(item) {
  return item.imageDataUrl || item.imageUrl || '';
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function ensureResultDataUrl(item) {
  if (item.imageDataUrl) return item.imageDataUrl;
  if (!item.imageUrl) return null;
  const res = await fetch(item.imageUrl);
  if (!res.ok) return null;
  const blob = await res.blob();
  const dataUrl = await blobToDataUrl(blob);
  item.imageDataUrl = dataUrl;
  return dataUrl;
}

async function refreshResultsFromServer() {
  const res = await fetch('/api/results');
  if (!res.ok) {
    throw new Error('Failed to load history from server.');
  }
  const data = await res.json();
  results = Array.isArray(data.results) ? data.results : [];
  cleanupProjectAssignments();
  updateTokenSummary();
  updateUsageSummary();
}

async function refreshTrashFromServer() {
  const res = await fetch('/api/trash');
  if (!res.ok) {
    throw new Error('Failed to load trash.');
  }
  const data = await res.json();
  trashItems = Array.isArray(data.items) ? data.items : [];
  if (trashToggle) {
    trashToggle.dataset.count = String(trashItems.length);
  }
}

function loadLegacyResults() {
  try {
    const raw = localStorage.getItem(LEGACY_RESULTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function importLegacyResultsIfNeeded() {
  if (results.length > 0) return 0;
  const legacy = loadLegacyResults();
  if (legacy.length === 0) return 0;
  const res = await fetch('/api/results/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: legacy }),
  });
  if (!res.ok) {
    throw new Error('Failed to import legacy history.');
  }
  const data = await res.json();
  return Number(data.imported || 0);
}

function saveLiked() {
  localStorage.setItem(LIKED_KEY, JSON.stringify([...likedIds]));
}

function updateTokenSummary() {
  if (!tokenSummary) return;
  const stats = collectUsageStats();
  const sinceText = stats.startedAt ? `Since ${formatShortDate(stats.startedAt)}` : 'Since now';
  tokenSummary.textContent = `${sinceText} · NB:${stats.nb.count} NBP:${stats.pro.count} NB2:${stats.nb2.count}`;
}

function normalizeBillingModelId(raw) {
  if (!raw) return '';
  return raw;
}

function getDefaultImageTierForModel(modelId) {
  if (modelId === 'gemini-3.1-flash-image-preview') return '1K';
  if (modelId === 'gemini-3-pro-image-preview') return '1K';
  if (modelId === 'gemini-2.5-flash-image') return '1K';
  if (modelId === 'gpt-image-2') return 'medium';
  return null;
}

function inferImageTier({ modelId, imageSize, width, height, clarity }) {
  if (modelId === 'gpt-image-2') {
    return clarity || 'medium';
  }
  if (modelId === 'gemini-2.5-flash-image') {
    return '1K';
  }
  if (imageSize === '512') return '0.5K';
  if (imageSize === '1K' || imageSize === '2K' || imageSize === '4K') return imageSize;
  const longestSide = Math.max(Number(width || 0), Number(height || 0));
  if (!longestSide) return getDefaultImageTierForModel(modelId);
  if (longestSide <= 512) return '0.5K';
  if (longestSide <= 1024) return '1K';
  if (longestSide <= 2048) return '2K';
  return '4K';
}

function estimateImageOutputCost({ modelId, imageTier, count = 1 }) {
  const pricing = IMAGE_OUTPUT_PRICING[modelId];
  if (!pricing) return 0;
  const unit = pricing[imageTier] ?? pricing.default ?? 0;
  return unit * Math.max(1, Number(count || 1));
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(4)}`;
}

function formatShortDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatMonthLabel(monthKey) {
  const [year, month] = String(monthKey).split('-').map(Number);
  if (!year || !month) return monthKey;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
  }).format(new Date(year, month - 1, 1));
}

function makeUsageEntry({
  createdAt,
  modelId,
  count = 1,
  imageSize = '',
  width = 0,
  height = 0,
  clarity = '',
  usage = null,
  cost = null,
  source = 'live',
}) {
  const normalizedModel = normalizeBillingModelId(modelId);
  const imageTier = inferImageTier({
    modelId: normalizedModel,
    imageSize,
    width,
    height,
    clarity,
  });
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: createdAt || new Date().toISOString(),
    modelId: normalizedModel,
    count: Math.max(1, Number(count || 1)),
    imageTier,
    cost:
      cost == null
        ? estimateImageOutputCost({ modelId: normalizedModel, imageTier, count })
        : Number(cost || 0),
    source,
    tokens: {
      prompt: Number(usage?.promptTokenCount || 0),
      output: Number(usage?.candidatesTokenCount || 0),
      total: Number(usage?.totalTokenCount || 0),
    },
  };
}

function trackSuccessfulGeneration({ requestedModel, usage, result }) {
  const modelId = normalizeBillingModelId(requestedModel);
  const entry = makeUsageEntry({
    createdAt: result?.createdAt || new Date().toISOString(),
    modelId,
    imageSize: result?.settings?.imageSize || '',
    width: result?.width || 0,
    height: result?.height || 0,
    clarity: result?.settings?.clarity || '',
    usage,
    source: 'live',
  });
  usageLedger.entries.push(entry);
  usageLedger.entries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  usageLedger.startedAt = usageLedger.startedAt || entry.createdAt;
  saveUsageLedger();
}

function buildUsageEntriesFromResults(items) {
  return [...items]
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((item) =>
      makeUsageEntry({
        createdAt: item.createdAt,
        modelId: item.requestedModel || item.model,
        imageSize: item?.settings?.imageSize || '',
        width: item.width || 0,
        height: item.height || 0,
        clarity: item?.settings?.clarity || '',
        usage: item.usage || null,
        source: 'import',
      })
    );
}

function countByModel(entries) {
  const counts = { nb: 0, pro: 0, nb2: 0, gpt2: 0 };
  for (const entry of entries) {
    const modelConfig = MODEL_BILLING[entry.modelId];
    if (!modelConfig) continue;
    counts[modelConfig.key] += Number(entry.count || 1);
  }
  return counts;
}

function getEarliestResultDate() {
  if (!Array.isArray(results) || results.length === 0) return new Date().toISOString();
  const sorted = [...results].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return sorted[0]?.createdAt || new Date().toISOString();
}

function initializeUsageLedgerFromResultsIfEmpty() {
  if (Array.isArray(usageLedger.entries) && usageLedger.entries.length > 0) {
    if (!usageLedger.startedAt) {
      usageLedger.startedAt = usageLedger.entries
        .map((entry) => entry.createdAt)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
      saveUsageLedger();
    }
    return;
  }

  const importedEntries = buildUsageEntriesFromResults(Array.isArray(results) ? results : []);
  usageLedger.entries = importedEntries;
  usageLedger.startedAt = importedEntries[0]?.createdAt || usageLedger.startedAt || null;

  const legacy = usageLedger.migratedLegacy;
  if (legacy) {
    const importedCounts = countByModel(importedEntries);
    const baselineDate = usageLedger.startedAt || getEarliestResultDate();
    const adjustments = [
      ['gemini-2.5-flash-image', Math.max(0, legacy.nb - importedCounts.nb)],
      ['gemini-3-pro-image-preview', Math.max(0, legacy.pro - importedCounts.pro)],
      ['gemini-3.1-flash-image-preview', Math.max(0, legacy.nb2 - importedCounts.nb2)],
    ];

    for (const [modelId, delta] of adjustments) {
      if (!delta) continue;
      usageLedger.entries.unshift(
        makeUsageEntry({
          createdAt: baselineDate,
          modelId,
          count: delta,
          cost: estimateImageOutputCost({
            modelId,
            imageTier: getDefaultImageTierForModel(modelId),
            count: delta,
          }),
          source: 'migration',
        })
      );
    }

    if (!usageLedger.startedAt && usageLedger.entries.length > 0) {
      usageLedger.startedAt = usageLedger.entries[0].createdAt;
    }
    usageLedger.migratedLegacy = null;
  }

  saveUsageLedger();
}

function collectUsageStats() {
  const stats = {
    nb: { count: 0, cost: 0, label: MODEL_BILLING['gemini-2.5-flash-image'].label },
    pro: { count: 0, cost: 0, label: MODEL_BILLING['gemini-3-pro-image-preview'].label },
    nb2: { count: 0, cost: 0, label: MODEL_BILLING['gemini-3.1-flash-image-preview'].label },
    gpt2: { count: 0, cost: 0, label: MODEL_BILLING['gpt-image-2'].label },
    providers: {
      gemini: { count: 0, cost: 0, label: 'Gemini' },
      openai: { count: 0, cost: 0, label: 'OpenAI' },
    },
    tokens: { prompt: 0, output: 0, total: 0 },
    totalPrompts: 0,
    startedAt: usageLedger.startedAt || null,
    entries: Array.isArray(usageLedger.entries) ? usageLedger.entries : [],
    monthly: [],
  };

  const monthlyMap = new Map();

  for (const entry of stats.entries) {
    const modelConfig = MODEL_BILLING[entry.modelId];
    if (!modelConfig) continue;
    const count = Number(entry.count || 1);
    const cost = Number(entry.cost || 0);
    stats[modelConfig.key].count += count;
    stats[modelConfig.key].cost += cost;
    stats.providers[modelConfig.provider].count += count;
    stats.providers[modelConfig.provider].cost += cost;
    stats.totalPrompts += count;
    stats.tokens.prompt += Number(entry.tokens?.prompt || 0);
    stats.tokens.output += Number(entry.tokens?.output || 0);
    stats.tokens.total += Number(entry.tokens?.total || 0);

    const monthKey = String(entry.createdAt || new Date().toISOString()).slice(0, 7);
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        key: monthKey,
        count: 0,
        cost: 0,
        gemini: 0,
        openai: 0,
        nb: 0,
        pro: 0,
        nb2: 0,
        gpt2: 0,
      });
    }
    const month = monthlyMap.get(monthKey);
    month.count += count;
    month.cost += cost;
    month[modelConfig.provider] += cost;
    month[modelConfig.key] += cost;
  }

  stats.monthly = [...monthlyMap.values()].sort((a, b) => b.key.localeCompare(a.key));
  return {
    ...stats,
  };
}

function updateUsageSummary() {
  if (!usageText || !usagePie) return;
  const stats = collectUsageStats();

  const totalCount = stats.totalPrompts;
  const totalCost = stats.providers.gemini.cost + stats.providers.openai.cost;
  usageText.textContent = `Total ${formatMoney(totalCost)}`;
  if (tokenSummary) {
    tokenSummary.textContent = '';
  }

  if (totalCount === 0) {
    usagePie.style.background =
      'conic-gradient(#78b9ff 0deg 90deg, #ff9d6c 90deg 180deg, #8ce99a 180deg 270deg, #b997ff 270deg 360deg)';
    return;
  }
  const slices = [stats.nb.cost, stats.pro.cost, stats.nb2.cost, stats.gpt2.cost];
  const counts = [stats.nb.count, stats.pro.count, stats.nb2.count, stats.gpt2.count];
  const colors = ['#78b9ff', '#ff9d6c', '#8ce99a', '#b997ff'];
  const base = totalCost > 0 ? totalCost : totalCount;
  let cursor = 0;
  const segments = slices.map((value, index) => {
    const share = totalCost > 0 ? value / base : counts[index] / base;
    const start = cursor;
    cursor += share * 360;
    return `${colors[index]} ${start.toFixed(2)}deg ${cursor.toFixed(2)}deg`;
  });
  usagePie.style.background = `conic-gradient(${segments.join(', ')})`;
}

function renderUsageModal() {
  if (!usageModalBody) return;
  const stats = collectUsageStats();
  const totalPrompts = stats.totalPrompts;
  const totalCost = stats.providers.gemini.cost + stats.providers.openai.cost;
  if (usageModalSubtitle) {
    usageModalSubtitle.textContent = `Started ${formatShortDate(stats.startedAt)} · image-output estimate only`;
  }

  const monthlyRows = stats.monthly.length
    ? stats.monthly
        .map(
          (month) => `
            <div class="usage-month-card">
              <div class="usage-month-head">
                <strong>${formatMonthLabel(month.key)}</strong>
                <span>${month.count} prompts · ${formatMoney(month.cost)}</span>
              </div>
              <div class="usage-month-breakdown">
                <span>Gemini ${formatMoney(month.gemini)}</span>
                <span>OpenAI ${formatMoney(month.openai)}</span>
                <span>NB ${formatMoney(month.nb)}</span>
                <span>NBP ${formatMoney(month.pro)}</span>
                <span>NB2 ${formatMoney(month.nb2)}</span>
                <span>GPT2 ${formatMoney(month.gpt2)}</span>
              </div>
            </div>`
        )
        .join('')
    : '<div class="usage-empty">No successful generations yet.</div>';

  usageModalBody.innerHTML = `
    <div class="usage-stat-grid">
      <div class="usage-stat-card">
        <span class="usage-stat-label">Started</span>
        <strong>${formatShortDate(stats.startedAt)}</strong>
      </div>
      <div class="usage-stat-card">
        <span class="usage-stat-label">Successful prompts</span>
        <strong>${totalPrompts}</strong>
      </div>
      <div class="usage-stat-card">
        <span class="usage-stat-label">Estimated total</span>
        <strong>${formatMoney(totalCost)}</strong>
      </div>
    </div>
    <div class="usage-model-list">
      <div class="usage-model-row"><span>Gemini total</span><strong>${stats.providers.gemini.count} · ${formatMoney(stats.providers.gemini.cost)}</strong></div>
      <div class="usage-model-row"><span>OpenAI total</span><strong>${stats.providers.openai.count} · ${formatMoney(stats.providers.openai.cost)}</strong></div>
      <div class="usage-model-row"><span>Nano Banana</span><strong>${stats.nb.count} · ${formatMoney(stats.nb.cost)}</strong></div>
      <div class="usage-model-row"><span>Nano Banana Pro</span><strong>${stats.pro.count} · ${formatMoney(stats.pro.cost)}</strong></div>
      <div class="usage-model-row"><span>Nano Banana 2</span><strong>${stats.nb2.count} · ${formatMoney(stats.nb2.cost)}</strong></div>
      <div class="usage-model-row"><span>GPT Image 2</span><strong>${stats.gpt2.count} · ${formatMoney(stats.gpt2.cost)}</strong></div>
    </div>
    <div class="usage-section">
      <div class="usage-section-title">Monthly breakdown</div>
      <div class="usage-month-list">${monthlyRows}</div>
    </div>
    <div class="usage-footnote">
      Gemini pricing follows the Gemini Developer API image-output rates already in the app. GPT Image 2 uses your provided estimate table: low $0.017687, medium $0.054107, high $0.177587 per successful image.
    </div>
  `;
}

function openUsageModal() {
  if (!usageModal) return;
  renderUsageModal();
  usageModal.hidden = false;
}

function closeUsageModal() {
  if (!usageModal) return;
  usageModal.hidden = true;
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDraft() {
  const payload = {
    prompt: promptInput.value,
    model: getSafeModelId(modelSelect.value),
    imageSize: imageSizeSelect.value,
    aspectRatio: aspectRatioSelect.value,
    clarity: claritySelect.value,
    modelOverride: normalizeModelId(modelOverride.value),
    promptImages: promptImages.map((image) => ({
      id: image.id,
      dataUrl: image.dataUrl,
      mimeType: image.mimeType,
      source: image.source,
      resultId: image.resultId || null,
      checked: Boolean(image.checked),
    })),
  };
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function setStatus(message) {
  statusEl.textContent = message;
}

function triggerMeteorShower() {
  if (!meteorOverlay) return;
  meteorOverlay.innerHTML = '';
  meteorOverlay.classList.remove('active');
  void meteorOverlay.offsetWidth;
  meteorOverlay.classList.add('active');
  const viewportWidth = meteorOverlay.clientWidth || window.innerWidth || 1280;
  const viewportHeight = meteorOverlay.clientHeight || window.innerHeight || 800;
  const viewportArea = viewportWidth * viewportHeight;
  const meteorCount = Math.max(12, Math.min(24, Math.round(viewportArea / 72000)));
  const sparkleCount = Math.max(10, Math.min(20, Math.round(viewportArea / 90000)));

  for (let index = 0; index < sparkleCount; index += 1) {
    const sparkle = document.createElement('span');
    sparkle.className = 'meteor-spark';
    sparkle.style.left = `${6 + Math.random() * 88}%`;
    sparkle.style.top = `${8 + Math.random() * 72}%`;
    sparkle.style.animationDelay = `${(Math.random() * 0.45).toFixed(2)}s`;
    sparkle.style.animationDuration = `${0.9 + Math.random() * 0.9}s`;
    meteorOverlay.appendChild(sparkle);
  }

  for (let index = 0; index < meteorCount; index += 1) {
    const meteor = document.createElement('span');
    meteor.className = 'meteor';
    const meteorLength = Math.max(
      110,
      Math.min(280, viewportWidth * (0.12 + Math.random() * 0.07))
    );
    const startLeft = -meteorLength * 0.72 + Math.random() * viewportWidth * 0.47;
    const startTop = -meteorLength * 0.12 + Math.random() * viewportHeight * 0.2;
    const startHeadX = startLeft + meteorLength;
    const endHeadX = Math.max(
      startHeadX + viewportWidth * 0.28,
      viewportWidth * (0.68 + Math.random() * 0.27)
    );
    const endHeadY = viewportHeight * (0.5 + Math.random() * 0.38);
    meteor.style.left = `${startLeft.toFixed(1)}px`;
    meteor.style.top = `${startTop.toFixed(1)}px`;
    meteor.style.animationDelay = `${(Math.random() * 0.6).toFixed(2)}s`;
    meteor.style.animationDuration = `${1.15 + Math.random() * 0.9}s`;
    meteor.style.setProperty('--meteor-length', `${meteorLength.toFixed(1)}px`);
    meteor.style.setProperty('--meteor-scale', `${(0.72 + Math.random() * 0.38).toFixed(2)}`);
    meteor.style.setProperty('--meteor-angle', `${(-24 - Math.random() * 8).toFixed(1)}deg`);
    meteor.style.setProperty('--meteor-start-x', `${(-meteorLength * 0.16).toFixed(1)}px`);
    meteor.style.setProperty('--meteor-start-y', `${(-viewportHeight * 0.035).toFixed(1)}px`);
    meteor.style.setProperty('--meteor-end-x', `${(endHeadX - startHeadX).toFixed(1)}px`);
    meteor.style.setProperty('--meteor-end-y', `${(endHeadY - startTop).toFixed(1)}px`);
    meteorOverlay.appendChild(meteor);
  }

  window.clearTimeout(meteorStormTimer);
  meteorStormTimer = window.setTimeout(() => {
    meteorOverlay.classList.remove('active');
    meteorOverlay.innerHTML = '';
  }, 3200);
}

function formatFriendlyError(message) {
  const msg = String(message || '');
  if (
    /RESOURCE_EXHAUSTED|quota|429|rate limit|exceeded your current quota/i.test(msg)
  ) {
    const retry = msg.match(/retryDelay[":\s]*"?([0-9.]+s)/i)?.[1] || null;
    return retry
      ? `额度用完(429)。请更换有余额/有配额的 API key，或等待 ${retry} 后重试。`
      : '额度用完(429)。请更换有余额/有配额的 API key，或稍后重试。';
  }
  return msg;
}

function renderPendingTasks() {
  if (!pendingBar) return;
  pendingBar.innerHTML = '';
  for (const task of activeTasks.values()) {
    const chip = document.createElement('div');
    chip.className = 'pending-chip';
    chip.innerHTML = `<span class="pending-dot"></span><span>${task.label}</span>`;
    pendingBar.appendChild(chip);
  }
}

function isPanelCollapsed() {
  return controlPanel?.classList.contains('collapsed');
}

function setPanelCollapsed(collapsed) {
  if (!controlPanel) return;
  const isCollapsedNow = controlPanel.classList.contains('collapsed');
  if (isCollapsedNow === collapsed) return;

  controlPanel.classList.remove('expanding', 'collapsing');
  if (collapsed) {
    controlPanel.classList.add('collapsing');
    controlPanel.classList.add('collapsed');
  } else {
    controlPanel.classList.remove('collapsed');
    controlPanel.classList.add('expanding');
  }

  window.setTimeout(() => {
    controlPanel.classList.remove('expanding', 'collapsing');
  }, 300);
}

function formatWhen(isoDate) {
  if (!isoDate) return 'N/A';
  const date = new Date(isoDate);
  return date.toLocaleString();
}

function parseRatio(text) {
  const [a, b] = String(text || '').split(':').map(Number);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) {
    return null;
  }
  return a / b;
}

function checkResultMatchesSettings(width, height, expectedRatioText, selectedSizeText) {
  const issues = [];
  const expectedRatio = parseRatio(expectedRatioText);
  if (expectedRatio) {
    const actualRatio = width / height;
    const diff = Math.abs(actualRatio - expectedRatio);
    if (diff > 0.03) {
      issues.push(
        `ratio mismatch: expected ${expectedRatioText}, got ${width}:${height} (${actualRatio.toFixed(3)})`
      );
    }
  }

  const sizeMinByPreset = {
    '512': 512,
    '1K': 1024,
    '2K': 2048,
    '4K': 4096,
  };
  const minExpected = sizeMinByPreset[selectedSizeText];
  if (minExpected) {
    const longEdge = Math.max(width, height);
    if (longEdge < minExpected) {
      issues.push(`size too small for ${getImageSizeLabel(selectedSizeText)}: got ${width}x${height}`);
    }
  }

  return issues;
}

async function getImageDimensions(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Failed to decode generated image.'));
    img.src = dataUrl;
  });
}

function openDetailByIndex(index, scope = 'results') {
  detailScope = scope;
  const visible = detailScope === 'trash' ? trashItems : getVisibleResults();
  if (visible.length === 0) return;
  if (index < 0 || index >= visible.length) return;
  detailCursor = index;
  const item = visible[index];
  const record = detailScope === 'trash' ? item.original || {} : item;
  const imageSrc =
    detailScope === 'trash'
      ? record.imageDataUrl || record.imageUrl || ''
      : resultImageSrc(record);

  if (detailModal) {
    detailModal.style.zIndex = detailScope === 'trash' ? '90' : '70';
  }
  if (detailLayout) {
    detailLayout.scrollTop = 0;
  }
  detailImage.src = imageSrc;
  if (detailModel) {
    detailModel.textContent =
      detailScope === 'trash' ? `Trash · ${record.model || 'Unknown model'}` : `Model: ${record.model}`;
  }
  detailPrompt.textContent = record.prompt || '(empty)';
  detailInfo.innerHTML = renderDetailInfoRows([
    { key: 'Model', value: record.model || 'N/A' },
    {
      key: 'Requested model',
      value:
        detailScope === 'trash'
          ? 'Trashed item'
          : record.requestedModel && record.requestedModel !== record.model
            ? record.requestedModel
            : 'Same as model',
    },
    { key: detailScope === 'trash' ? 'Trashed' : 'Created', value: formatWhen(detailScope === 'trash' ? item.trashedAt : record.createdAt) },
    { key: 'Output', value: record.width && record.height ? `${record.width}x${record.height}` : 'N/A' },
    { key: 'Size preset', value: getImageSizeLabel(record.settings?.imageSize) || 'Auto' },
    { key: 'Aspect ratio', value: record.settings?.aspectRatio || 'N/A' },
    { key: isOpenAiModel(record.requestedModel || record.model) ? 'Quality' : 'Clarity', value: record.settings?.clarity || 'Auto' },
    { key: 'Force refs', value: record.settings?.forceRefUse ? 'On' : 'Off' },
    {
      key: 'Refs received',
      value:
        record.referenceDiagnostics?.receivedCount !== undefined
          ? String(record.referenceDiagnostics.receivedCount)
          : 'N/A',
    },
    { key: 'Ref guide', value: record.referenceDiagnostics?.guideApplied ? 'On' : 'Off' },
  ]);
  if (detailIndex) {
    detailIndex.textContent = `${index + 1} / ${visible.length}`;
  }
  if (detailPrev) {
    detailPrev.disabled = index === 0;
  }
  if (detailNext) {
    detailNext.disabled = index === visible.length - 1;
  }
  if (detailDelete) {
    detailDelete.hidden = false;
    detailDelete.querySelector('span').textContent = detailScope === 'trash' ? 'Restore' : 'Trash';
    detailDelete.setAttribute('aria-label', detailScope === 'trash' ? 'Restore generation' : 'Trash generation');
  }
  copyPromptBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(record.prompt || '');
      setStatus('Prompt copied.');
    } catch {
      setStatus('Failed to copy prompt.');
    }
  };
  detailModal.hidden = false;
}

function closeDetail() {
  if (detailModal) {
    detailModal.hidden = true;
    detailModal.style.zIndex = '';
  }
  detailCursor = -1;
  detailScope = 'results';
}

function moveDetail(step) {
  if (detailModal.hidden) return;
  const nextIndex = detailCursor + step;
  openDetailByIndex(nextIndex);
}

function getCurrentDetailItem() {
  const visible = detailScope === 'trash' ? trashItems : getVisibleResults();
  if (detailCursor < 0 || detailCursor >= visible.length) return null;
  return visible[detailCursor];
}

function getBase64Payload(dataUrl) {
  const parts = dataUrl.split(',');
  if (parts.length < 2) return null;
  const match = parts[0].match(/data:(.*);base64/);
  return {
    mimeType: match ? match[1] : 'image/png',
    data: parts[1],
  };
}

function makePromptImage({ dataUrl, mimeType, source, resultId = null }) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    dataUrl,
    mimeType,
    source,
    resultId,
    checked: false,
  };
}

function makePromptImageSnapshot(image) {
  return {
    dataUrl: image.dataUrl,
    mimeType: image.mimeType || 'image/png',
  };
}

function restorePromptImagesFromResult(item) {
  const refs = Array.isArray(item?.promptReferenceImages) ? item.promptReferenceImages : [];
  promptImages = refs
    .filter((ref) => typeof ref?.dataUrl === 'string' && ref.dataUrl.startsWith('data:'))
    .map((ref) =>
      makePromptImage({
        dataUrl: ref.dataUrl,
        mimeType: ref.mimeType || 'image/png',
        source: 'history',
      })
    );
}

async function getResultWithPromptReferences(item) {
  if (Array.isArray(item?.promptReferenceImages) && item.promptReferenceImages.length > 0) {
    return item;
  }
  if (!item?.id || !item?.promptReferenceImageCount) {
    return item;
  }
  const res = await fetch(`/api/results/${encodeURIComponent(item.id)}`);
  if (!res.ok) {
    return item;
  }
  const data = await res.json();
  return data.result || item;
}

function openPromptWorkspace() {
  setPanelCollapsed(false);
  window.requestAnimationFrame(() => {
    setPanelCollapsed(false);
    promptInput.focus();
    promptInput.setSelectionRange(promptInput.value.length, promptInput.value.length);
  });
}

function hasResultSelected(resultId) {
  return promptImages.some((item) => item.source === 'result' && item.resultId === resultId);
}

function getVisibleResults() {
  const base = likedOnlyToggle.checked
    ? results.filter((item) => likedIds.has(item.id))
    : results;
  if (!projectState.activeProjectId || projectState.activeProjectId === 'all') {
    return base;
  }
  return base.filter((item) => getProjectForResult(item.id) === projectState.activeProjectId);
}

function recoverEmptyGalleryView() {
  if (!Array.isArray(results) || results.length === 0) return false;
  if (getVisibleResults().length > 0) return false;

  let changed = false;
  if (likedOnlyToggle.checked) {
    likedOnlyToggle.checked = false;
    changed = true;
  }
  if (projectState.activeProjectId && projectState.activeProjectId !== 'all') {
    projectState.activeProjectId = 'all';
    saveProjectState();
    changed = true;
  }
  if (changed) {
    setStatus('Showing all photos. Your current filter/project was empty.');
  }
  return changed;
}

let dimensionsHydrationPromise = null;

async function hydrateMissingResultDimensions() {
  if (dimensionsHydrationPromise) return dimensionsHydrationPromise;
  const pending = results.filter(
    (item) => item && (!Number(item.width) || !Number(item.height)) && resultImageSrc(item)
  );
  if (pending.length === 0) return Promise.resolve(false);

  dimensionsHydrationPromise = (async () => {
    let changed = false;
    for (const item of pending) {
      try {
        const dims = await getImageDimensions(resultImageSrc(item));
        if (dims.width && dims.height) {
          item.width = dims.width;
          item.height = dims.height;
          changed = true;
        }
      } catch {
        // Keep fallback ratio if the image cannot be measured.
      }
    }
    dimensionsHydrationPromise = null;
    return changed;
  })();

  return dimensionsHydrationPromise;
}

function createResultCard(item, idx) {
  const node = cardTemplate.content.cloneNode(true);
  const card = node.querySelector('.card');
  const modelEl = node.querySelector('.model');
  const imageEl = node.querySelector('.image');
  const editBtn = node.querySelector('.edit');
  const likeBtn = node.querySelector('.like');
  const selectBtn = node.querySelector('.select');
  const batchCheck = document.createElement('button');
  batchCheck.type = 'button';
  batchCheck.className = 'batch-check';
  batchCheck.setAttribute('aria-label', 'Select in batch mode');
  batchCheck.innerHTML = `<span aria-hidden="true">${batchSelectedResultIds.has(item.id) ? '✓' : ''}</span>`;
  if (batchProjectMode) {
    batchCheck.classList.add('visible');
    if (batchSelectedResultIds.has(item.id)) batchCheck.classList.add('checked');
  }
  card.appendChild(batchCheck);

  card.draggable = true;
  card.dataset.resultId = item.id;
  const projectId = getProjectForResult(item.id);
  if (projectId) {
    card.dataset.projectId = projectId;
  }
  if (batchSelectedResultIds.has(item.id)) {
    card.classList.add('batch-selected');
  }
  if (batchProjectMode) {
    card.classList.add('batch-mode');
  }

  modelEl.textContent = item.model;
  imageEl.src = resultImageSrc(item);

  if (likedIds.has(item.id)) {
    likeBtn.classList.add('liked');
  }

  if (hasResultSelected(item.id)) {
    selectBtn.classList.add('selected');
    selectBtn.textContent = 'Selected';
  }
  if (batchProjectMode) {
    selectBtn.hidden = true;
  }

  likeBtn.addEventListener('click', () => {
    if (likedIds.has(item.id)) {
      likedIds.delete(item.id);
      likeBtn.classList.remove('liked');
    } else {
      likedIds.add(item.id);
      likeBtn.classList.add('liked');
    }
    saveLiked();
    if (likedOnlyToggle.checked) {
      render();
    }
  });

  selectBtn.addEventListener('click', async () => {
    if (hasResultSelected(item.id)) {
      promptImages = promptImages.filter(
        (img) => !(img.source === 'result' && img.resultId === item.id)
      );
    } else {
      const dataUrl = await ensureResultDataUrl(item);
      if (!dataUrl) {
        setStatus('Failed to load selected image for prompt.');
        return;
      }
      promptImages.push(
        makePromptImage({
          dataUrl,
          mimeType: 'image/png',
          source: 'result',
          resultId: item.id,
        })
      );
    }
    saveDraft();
    renderSelected();
    render();
  });

  batchCheck.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!batchProjectMode) return;
    toggleBatchResultSelection(item.id);
  });

  editBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const editItem = await getResultWithPromptReferences(item);
    promptInput.value = editItem.prompt || '';
    restorePromptImagesFromResult(editItem);
    const editModel = normalizeModelId(editItem.requestedModel || editItem.model);
    const hasOption = [...modelSelect.options].some((option) => option.value === editModel);
    if (hasOption) {
      modelSelect.value = editModel;
      modelOverride.value = '';
    } else {
      modelOverride.value = '';
    }
    if (editItem.settings?.imageSize !== undefined) {
      updateImageSizeOptions(editItem.settings.imageSize || '');
      imageSizeSelect.value = editItem.settings.imageSize || '';
    }
    if (editItem.settings?.aspectRatio) {
      aspectRatioSelect.value = editItem.settings.aspectRatio;
    }
    if (editItem.settings?.clarity !== undefined) {
      claritySelect.value = editItem.settings.clarity || '';
    }
    saveDraft();
    renderSelected();
    openPromptWorkspace();
    setStatus('Loaded prompt and reference images from this result. Edit and click Generate.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  imageEl.addEventListener('click', (event) => {
    if (batchProjectMode) {
      event.preventDefault();
      event.stopPropagation();
      toggleBatchResultSelection(item.id);
      return;
    }
    openDetailByIndex(idx);
  });

  card.addEventListener('click', (event) => {
    if (!batchProjectMode) return;
    if (event.target.closest('button')) return;
    event.preventDefault();
    event.stopPropagation();
    toggleBatchResultSelection(item.id);
  });

  card.addEventListener('dragstart', (event) => {
    card.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', item.id);
    if (batchProjectMode) {
      const ids = batchSelectedResultIds.has(item.id)
        ? [...batchSelectedResultIds]
        : [item.id];
      event.dataTransfer.setData('application/x-foundry-selected', JSON.stringify(ids));
    }
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
  });

  return card;
}

function getActiveProject() {
  return projectState.projects.find((project) => project.id === projectState.activeProjectId) || null;
}

function getActiveProjectCount() {
  if (projectState.activeProjectId === 'all') return results.length;
  return results.filter((item) => getProjectForResult(item.id) === projectState.activeProjectId).length;
}

function clearBatchSelection() {
  batchSelectedResultIds.clear();
}

function clearTrashSelection() {
  selectedTrashIds.clear();
}

function renderPreservingScroll() {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  render();
  window.requestAnimationFrame(() => {
    window.scrollTo(scrollX, scrollY);
  });
}

function toggleBatchResultSelection(resultId) {
  if (batchSelectedResultIds.has(resultId)) {
    batchSelectedResultIds.delete(resultId);
  } else {
    batchSelectedResultIds.add(resultId);
  }
  renderProjects();
  renderPreservingScroll();
}

function setBatchProjectMode(next) {
  batchProjectMode = Boolean(next);
  if (!batchProjectMode) {
    clearBatchSelection();
  }
  renderProjects();
  render();
}

function toggleTrashSelection(trashId) {
  if (selectedTrashIds.has(trashId)) {
    selectedTrashIds.delete(trashId);
  } else {
    selectedTrashIds.add(trashId);
  }
  renderTrashModal();
}

function setTrashBatchMode(next) {
  trashBatchMode = Boolean(next);
  if (!trashBatchMode) {
    clearTrashSelection();
  }
  renderTrashModal();
}

function createProjectChip({ id, name, count, active, kind = 'project' }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'project-chip';
  button.classList.add(`project-chip-${kind}`);
  if (active) button.classList.add('active');
  button.dataset.projectId = id;
  const iconLabel = kind === 'all' ? '◉' : '◆';
  button.innerHTML = `<span class="project-chip-icon" aria-hidden="true">${iconLabel}</span><span class="project-chip-name">${name}</span><span class="project-chip-count">${count}</span>`;
  button.addEventListener('click', () => {
    if (batchProjectMode && batchSelectedResultIds.size > 0) {
      assignManyResultsToProject(batchSelectedResultIds, id);
      saveProjectState();
      const movedCount = batchSelectedResultIds.size;
      clearBatchSelection();
      batchProjectMode = false;
      if (id !== 'all') {
        projectState.activeProjectId = id;
      }
      renderProjects();
      render();
      setStatus(
        id === 'all'
          ? `Removed ${movedCount} photo(s) from projects.`
          : `Moved ${movedCount} photo(s) to ${name}.`
      );
      return;
    }
    projectState.activeProjectId = id;
    saveProjectState();
    renderProjects();
    render();
  });
  button.addEventListener('dragover', (event) => {
    event.preventDefault();
    button.classList.add('drop-target');
  });
  button.addEventListener('dragleave', () => {
    button.classList.remove('drop-target');
  });
  button.addEventListener('drop', (event) => {
    event.preventDefault();
    button.classList.remove('drop-target');
    const resultId = event.dataTransfer.getData('text/plain');
    const selectedPayload = event.dataTransfer.getData('application/x-foundry-selected');
    let resultIds = [];
    if (selectedPayload) {
      try {
        const parsed = JSON.parse(selectedPayload);
        if (Array.isArray(parsed) && parsed.length > 0) {
          resultIds = parsed;
        }
      } catch {
        // ignore
      }
    }
    if (resultIds.length === 0 && resultId) {
      resultIds = [resultId];
    }
    if (resultIds.length === 0) return;
    assignManyResultsToProject(resultIds, id);
    saveProjectState();
    if (batchProjectMode) {
      clearBatchSelection();
      batchProjectMode = false;
    }
    renderProjects();
    render();
    setStatus(
      id === 'all'
        ? `Removed ${resultIds.length} photo(s) from projects.`
        : `Moved ${resultIds.length} photo(s) to ${name}.`
    );
  });
  return button;
}

function renderProjects() {
  if (!projectBar) return;
  const counts = new Map(projectState.projects.map((project) => [project.id, 0]));
  for (const projectId of Object.values(projectState.assignments)) {
    if (counts.has(projectId)) {
      counts.set(projectId, counts.get(projectId) + 1);
    }
  }

  projectBar.innerHTML = '';
  const inner = document.createElement('div');
  inner.className = 'project-bar-inner';

  inner.appendChild(
    createProjectChip({
      id: 'all',
      name: 'All photos',
      count: results.length,
      active: projectState.activeProjectId === 'all',
      kind: 'all',
    })
  );

  projectState.projects.forEach((project) => {
    inner.appendChild(
      createProjectChip({
        id: project.id,
        name: project.name,
        count: counts.get(project.id) || 0,
        active: projectState.activeProjectId === project.id,
        kind: 'project',
      })
    );
  });

  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.className = 'project-create';
  addButton.innerHTML = `<span class="project-tool-icon" aria-hidden="true">＋</span><span>New project</span>`;
  addButton.addEventListener('click', () => {
    const project = {
      id: `project-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      name: `Project ${projectState.projects.length + 1}`,
      createdAt: new Date().toISOString(),
    };
    projectState.projects.push(project);
    projectState.activeProjectId = project.id;
    saveProjectState();
    renderProjects();
    render();
    setStatus(`Created ${project.name}. Drag photos into it to group them.`);
  });
  inner.appendChild(addButton);

  const tools = document.createElement('div');
  tools.className = 'project-tools';

  const batchButton = document.createElement('button');
  batchButton.type = 'button';
  batchButton.className = 'project-tool';
  if (batchProjectMode) batchButton.classList.add('active');
  batchButton.innerHTML = batchProjectMode
    ? `<span class="project-tool-icon" aria-hidden="true">◌</span><span>Selecting ${batchSelectedResultIds.size}</span>`
    : `<span class="project-tool-icon" aria-hidden="true">◌</span><span>Batch select</span>`;
  batchButton.addEventListener('click', () => {
    const nextMode = !batchProjectMode;
    setBatchProjectMode(nextMode);
    if (nextMode) {
      setStatus('Batch select on. Click photos, then click a project chip to move them there.');
    }
  });
  tools.appendChild(batchButton);

  if (batchProjectMode) {
    const clearSelectionButton = document.createElement('button');
    clearSelectionButton.type = 'button';
    clearSelectionButton.className = 'project-tool';
    clearSelectionButton.innerHTML = `<span class="project-tool-icon" aria-hidden="true">↺</span><span>Clear picks</span>`;
    clearSelectionButton.addEventListener('click', () => {
      clearBatchSelection();
      renderProjects();
      render();
    });
    tools.appendChild(clearSelectionButton);

    const trashSelectionButton = document.createElement('button');
    trashSelectionButton.type = 'button';
    trashSelectionButton.className = 'project-tool danger';
    trashSelectionButton.innerHTML = `<span class="project-tool-icon" aria-hidden="true">🗑</span><span>Move to trash</span>`;
    trashSelectionButton.addEventListener('click', async () => {
      if (batchSelectedResultIds.size === 0) {
        setStatus('Pick photos first, then move them to trash.');
        return;
      }
      if (!window.confirm(`Move ${batchSelectedResultIds.size} photo(s) to trash?`)) return;
      try {
        const moved = await moveResultsToTrash([...batchSelectedResultIds]);
        clearBatchSelection();
        batchProjectMode = false;
        renderProjects();
        render();
        setStatus(`Moved ${moved} photo(s) to trash.`);
      } catch (err) {
        setStatus(err.message || 'Trash failed.');
      }
    });
    tools.appendChild(trashSelectionButton);
  }

  const activeProject = getActiveProject();
  if (activeProject) {
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'project-tool';
    removeButton.innerHTML = `<span class="project-tool-icon" aria-hidden="true">−</span><span>Remove selected</span>`;
    removeButton.addEventListener('click', () => {
      const inProject = results
        .filter((item) => getProjectForResult(item.id) === activeProject.id)
        .map((item) => item.id);
      if (inProject.length === 0) {
        setStatus('No photos in this project yet.');
        return;
      }
      if (!batchProjectMode || batchSelectedResultIds.size === 0) {
        setStatus('Turn on batch select, pick photos, then use Remove selected.');
        return;
      }
      const removable = [...batchSelectedResultIds].filter(
        (resultId) => getProjectForResult(resultId) === activeProject.id
      );
      if (removable.length === 0) {
        setStatus('Pick photos from this project first.');
        return;
      }
      assignManyResultsToProject(removable, 'all');
      saveProjectState();
      clearBatchSelection();
      batchProjectMode = false;
      renderProjects();
      render();
      setStatus(`Removed ${removable.length} photo(s) from ${activeProject.name}.`);
    });
    tools.appendChild(removeButton);

    const renameButton = document.createElement('button');
    renameButton.type = 'button';
    renameButton.className = 'project-tool';
    renameButton.innerHTML = `<span class="project-tool-icon" aria-hidden="true">✎</span><span>Rename</span>`;
    renameButton.addEventListener('click', async () => {
      const nextName = await requestProjectName(activeProject.name);
      if (!nextName) return;
      activeProject.name = nextName;
      saveProjectState();
      renderProjects();
      render();
      setStatus(`Renamed project to ${activeProject.name}.`);
    });
    tools.appendChild(renameButton);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'project-tool danger';
    deleteButton.innerHTML = `<span class="project-tool-icon" aria-hidden="true">🗑</span><span>Trash</span>`;
    deleteButton.addEventListener('click', () => {
      if (!window.confirm(`Trash ${activeProject.name}? Photos will stay in All photos.`)) return;
      projectState.projects = projectState.projects.filter((project) => project.id !== activeProject.id);
      for (const [resultId, projectId] of Object.entries(projectState.assignments)) {
        if (projectId === activeProject.id) {
          delete projectState.assignments[resultId];
        }
      }
      projectState.activeProjectId = 'all';
      saveProjectState();
      renderProjects();
      render();
      setStatus(`Trashed ${activeProject.name}.`);
    });
    tools.appendChild(deleteButton);
  }

  inner.appendChild(tools);

  projectBar.appendChild(inner);
}

function getGalleryBaseRowHeight() {
  return window.innerWidth <= 900 ? 150 : window.innerWidth <= 1280 ? 190 : 220;
}

function getJustifiedRows(items, containerWidth, gap) {
  const rows = [];
  const targetHeight = getGalleryBaseRowHeight();
  let currentRow = [];
  let aspectSum = 0;

  items.forEach((item, idx) => {
    const width = Number(item.width || 0);
    const height = Number(item.height || 0);
    const aspect = width > 0 && height > 0 ? width / height : 1;
    currentRow.push({ item, aspect, idx });
    aspectSum += aspect;

    const projectedWidth = aspectSum * targetHeight + gap * Math.max(0, currentRow.length - 1);
    if (projectedWidth >= containerWidth && currentRow.length > 0) {
      const exactHeight = (containerWidth - gap * (currentRow.length - 1)) / aspectSum;
      rows.push({
        entries: currentRow,
        height: Math.max(110, exactHeight),
        justified: true,
      });
      currentRow = [];
      aspectSum = 0;
    }
  });

  if (currentRow.length > 0) {
    rows.push({
      entries: currentRow,
      height: targetHeight,
      justified: false,
    });
  }

  return rows;
}

function render() {
  resultsEl.innerHTML = '';
  recoverEmptyGalleryView();
  renderProjects();
  const visible = getVisibleResults();

  if (visible.length === 0) {
    resultsEl.innerHTML = '<div class="status">No results yet.</div>';
  } else {
    const gap = 1;
    const containerWidth = Math.max(320, Math.floor(resultsEl.clientWidth || window.innerWidth));
    const rows = getJustifiedRows(visible, containerWidth, gap);

    rows.forEach((row) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'gallery-row';
      rowEl.style.height = `${row.height}px`;
      rowEl.style.gap = `${gap}px`;

      row.entries.forEach(({ item, aspect, idx }, entryIndex) => {
        const card = createResultCard(item, idx);
        const cardWidth = Math.max(60, row.height * aspect);
        card.style.width = `${cardWidth.toFixed(2)}px`;
        card.style.height = `${row.height}px`;
        rowEl.appendChild(card);
      });

      resultsEl.appendChild(rowEl);
    });
  }

  renderSelected();
  updateTokenSummary();
  updateUsageSummary();
  renderUsageModal();
}

function renderTrashModal() {
  if (!trashModalBody) return;
  if (trashBatchBtn) {
    trashBatchBtn.classList.toggle('active', trashBatchMode);
    trashBatchBtn.innerHTML = trashBatchMode
      ? `<span aria-hidden="true">◌</span><span>Selecting ${selectedTrashIds.size}</span>`
      : `<span aria-hidden="true">◌</span><span>Batch select</span>`;
  }
  if (trashRestoreBtn) {
    trashRestoreBtn.disabled = selectedTrashIds.size === 0;
  }
  if (!trashItems.length) {
    trashModalBody.innerHTML = '<div class="usage-empty">Trash is empty.</div>';
    return;
  }
  trashModalBody.innerHTML = '<div class="grid trash-grid"></div>';
  const trashGrid = trashModalBody.querySelector('.trash-grid');
  const gap = 1;
  const containerWidth = Math.max(320, Math.floor((trashModalBody.clientWidth || 900) - 4));
  const rows = getJustifiedRows(
    trashItems.map((item) => ({
      ...item.original,
      width: item.original?.width || 0,
      height: item.original?.height || 0,
      trashId: item.id,
      imageDataUrl: item.original?.imageDataUrl || '',
      imageUrl: item.original?.imageUrl || '',
      trashedAt: item.trashedAt,
    })),
    containerWidth,
    gap
  );

  rows.forEach((row) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'gallery-row';
    rowEl.style.height = `${row.height}px`;
    rowEl.style.gap = `${gap}px`;
    trashGrid.appendChild(rowEl);

    row.entries.forEach(({ item, aspect }) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.style.width = `${Math.max(60, row.height * aspect).toFixed(2)}px`;
      card.style.height = `${row.height}px`;
      if (trashBatchMode) card.classList.add('batch-mode');
      if (selectedTrashIds.has(item.trashId)) card.classList.add('batch-selected');

      const img = document.createElement('img');
      img.className = 'image';
      img.src = item.imageDataUrl || item.imageUrl || '';
      img.alt = 'Trashed image';
      card.appendChild(img);

      const meta = document.createElement('div');
      meta.className = 'card-head';
      meta.innerHTML = `<div class="model">${item.model || 'Unknown model'}</div>`;
      card.appendChild(meta);

      const batchCheck = document.createElement('button');
      batchCheck.type = 'button';
      batchCheck.className = 'batch-check';
      if (trashBatchMode) batchCheck.classList.add('visible');
      if (selectedTrashIds.has(item.trashId)) batchCheck.classList.add('checked');
      batchCheck.innerHTML = `<span aria-hidden="true">${selectedTrashIds.has(item.trashId) ? '✓' : ''}</span>`;
      batchCheck.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!trashBatchMode) return;
        toggleTrashSelection(item.trashId);
      });
      card.appendChild(batchCheck);

      card.addEventListener('click', (event) => {
        if (!trashBatchMode) {
          const index = trashItems.findIndex((entry) => entry.id === item.trashId);
          if (index >= 0) {
            openDetailByIndex(index, 'trash');
          }
          return;
        }
        if (event.target.closest('button')) return;
        event.preventDefault();
        event.stopPropagation();
        toggleTrashSelection(item.trashId);
      });

      rowEl.appendChild(card);
    });
  });
}

function openTrashModal() {
  if (!trashModal) return;
  renderTrashModal();
  trashModal.hidden = false;
}

function closeTrashModal() {
  if (!trashModal) return;
  trashModal.hidden = true;
}

function renderSelected() {
  selectedList.innerHTML = '';

  if (promptImages.length === 0) {
    selectedList.innerHTML = '<div class="status">No selected images.</div>';
    imagePreview.textContent = 'No image selected';
    saveDraft();
    return;
  }

  imagePreview.textContent = `${promptImages.length} image(s) ready as prompt references`;

  promptImages.forEach((image, index) => {
    const item = document.createElement('div');
    item.className = 'selected-item';
    item.draggable = true;
    item.dataset.index = String(index);

    if (image.checked) {
      item.classList.add('checked');
    }

    const img = document.createElement('img');
    img.src = image.dataUrl;
    img.alt = 'Prompt reference';
    img.draggable = false;

    const badge = document.createElement('div');
    badge.className = 'selected-index';
    badge.textContent = `#${index + 1}`;

    const check = document.createElement('button');
    check.className = 'selected-check';
    check.textContent = image.checked ? 'Selected' : 'Pick';

    const moveLeft = document.createElement('button');
    moveLeft.className = 'selected-move selected-move-left';
    moveLeft.textContent = '←';
    moveLeft.title = 'Move left';

    const moveRight = document.createElement('button');
    moveRight.className = 'selected-move selected-move-right';
    moveRight.textContent = '→';
    moveRight.title = 'Move right';

    const remove = document.createElement('button');
    remove.className = 'selected-remove';
    remove.textContent = 'Remove';

    check.addEventListener('click', (event) => {
      event.stopPropagation();
      image.checked = !image.checked;
      renderSelected();
    });

    moveLeft.addEventListener('click', (event) => {
      event.stopPropagation();
      if (index <= 0) return;
      const temp = promptImages[index - 1];
      promptImages[index - 1] = promptImages[index];
      promptImages[index] = temp;
      saveDraft();
      renderSelected();
      render();
    });

    moveRight.addEventListener('click', (event) => {
      event.stopPropagation();
      if (index >= promptImages.length - 1) return;
      const temp = promptImages[index + 1];
      promptImages[index + 1] = promptImages[index];
      promptImages[index] = temp;
      saveDraft();
      renderSelected();
      render();
    });

    remove.addEventListener('click', (event) => {
      event.stopPropagation();
      promptImages = promptImages.filter((entry) => entry.id !== image.id);
      saveDraft();
      renderSelected();
      render();
    });

    item.addEventListener('dragstart', (event) => {
      draggedPromptIndex = index;
      item.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    });

    item.addEventListener('dragend', () => {
      draggedPromptIndex = null;
      item.classList.remove('dragging');
      selectedList?.querySelectorAll('.selected-item').forEach((node) => node.classList.remove('drop-before', 'drop-after'));
    });

    item.addEventListener('dragover', (event) => {
      if (draggedPromptIndex == null) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      const rect = item.getBoundingClientRect();
      const before = event.clientX < rect.left + rect.width / 2;
      item.classList.toggle('drop-before', before);
      item.classList.toggle('drop-after', !before);
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drop-before', 'drop-after');
    });

    item.addEventListener('drop', (event) => {
      if (draggedPromptIndex == null) return;
      event.preventDefault();
      const fromIndex = Number(event.dataTransfer.getData('text/plain'));
      const baseIndex = Number(item.dataset.index);
      if (Number.isNaN(fromIndex) || Number.isNaN(baseIndex)) return;
      const rect = item.getBoundingClientRect();
      const before = event.clientX < rect.left + rect.width / 2;
      let toIndex = before ? baseIndex : baseIndex + 1;
      item.classList.remove('drop-before', 'drop-after');
      if (fromIndex < toIndex) {
        toIndex -= 1;
      }
      if (fromIndex === toIndex || fromIndex + 1 === toIndex) {
        return;
      }
      const [moved] = promptImages.splice(fromIndex, 1);
      promptImages.splice(toIndex, 0, moved);
      saveDraft();
      renderSelected();
      render();
    });

    if (index === 0) moveLeft.disabled = true;
    if (index === promptImages.length - 1) moveRight.disabled = true;

    item.append(img, badge, check, moveLeft, moveRight, remove);
    selectedList.appendChild(item);
  });

  selectedList.ondragover = (event) => {
    if (draggedPromptIndex == null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  selectedList.ondrop = (event) => {
    if (draggedPromptIndex == null) return;
    const targetItem = event.target.closest('.selected-item');
    if (targetItem) return;
    event.preventDefault();
    const fromIndex = draggedPromptIndex;
    if (fromIndex == null || fromIndex >= promptImages.length - 1) return;
    const [moved] = promptImages.splice(fromIndex, 1);
    promptImages.push(moved);
    saveDraft();
    renderSelected();
    render();
  };
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image.'));
    img.src = src;
  });
}

async function convertHeicFileToJpegDataUrl(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(objectUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to create canvas context.');
    }
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.94);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function readSinglePromptFile(file) {
  const mime = (file.type || '').toLowerCase();
  const isHeic = mime === 'image/heic' || mime === 'image/heif' || /\.(heic|heif)$/i.test(file.name || '');

  if (isHeic) {
    try {
      const dataUrl = await convertHeicFileToJpegDataUrl(file);
      return makePromptImage({
        dataUrl,
        mimeType: 'image/jpeg',
        source: 'upload',
      });
    } catch {
      throw new Error(`Failed to convert ${file.name} from HEIC. Please re-save it as JPG or PNG and try again.`);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(
        makePromptImage({
          dataUrl: reader.result,
          mimeType: file.type || 'image/png',
          source: 'upload',
        })
      );
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function readFilesAsPromptImages(files) {
  return Promise.all([...files].map((file) => readSinglePromptFile(file)));
}

function extractImageFilesFromDataTransfer(dataTransfer) {
  if (!dataTransfer) return [];
  const files = [...(dataTransfer.files || [])];
  return files.filter((file) => file.type && file.type.startsWith('image/'));
}

imageInput.addEventListener('change', async () => {
  const files = imageInput.files;
  if (!files || files.length === 0) {
    return;
  }

  try {
    const newImages = await readFilesAsPromptImages(files);
    promptImages = [...promptImages, ...newImages];
    saveDraft();
    setStatus(`Added ${newImages.length} image(s).`);
    renderSelected();
    render();
  } catch (err) {
    setStatus(err.message || 'Failed to add images.');
  } finally {
    imageInput.value = '';
  }
});

function activatePromptDropUi(active) {
  if (!promptInput) return;
  promptInput.classList.toggle('drop-active', active);
  promptField?.classList.toggle('drop-active-zone', active);
  promptImagesField?.classList.toggle('drop-active-zone', active);
}

function isPointInsideElement(element, clientX, clientY) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
}

function isPromptDropTarget(event) {
  const target = event.target;
  if (target instanceof Node) {
    if (promptField?.contains(target) || promptImagesField?.contains(target) || selectedList?.contains(target)) {
      return true;
    }
  }
  return isPointInsideElement(promptField, event.clientX, event.clientY) || isPointInsideElement(promptImagesField, event.clientX, event.clientY);
}

async function addPromptImagesFromFiles(files, sourceLabel = 'drag & drop') {
  if (!files || files.length === 0) return;
  const newImages = await readFilesAsPromptImages(files);
  promptImages = [...promptImages, ...newImages];
  saveDraft();
  setStatus(`Added ${newImages.length} image(s) from ${sourceLabel}.`);
  renderSelected();
  render();
}

async function handlePromptDrop(event) {
  const imageFiles = extractImageFilesFromDataTransfer(event.dataTransfer);
  if (imageFiles.length === 0) return false;
  event.preventDefault();
  event.stopPropagation();
  activatePromptDropUi(false);
  try {
    await addPromptImagesFromFiles(imageFiles, 'drag & drop');
    return true;
  } catch (err) {
    setStatus(err.message || 'Failed to add dropped images.');
    return false;
  }
}

function handlePromptDragEnter(event) {
  const imageFiles = extractImageFilesFromDataTransfer(event.dataTransfer);
  if (imageFiles.length === 0) return;
  event.preventDefault();
  event.stopPropagation();
  activatePromptDropUi(isPromptDropTarget(event));
}

function handlePromptDragOver(event) {
  const imageFiles = extractImageFilesFromDataTransfer(event.dataTransfer);
  if (imageFiles.length === 0) return;
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer.dropEffect = 'copy';
  activatePromptDropUi(isPromptDropTarget(event));
}

function handlePromptDragLeave(event) {
  if (promptField && promptField.contains(event.relatedTarget)) return;
  if (promptImagesField && promptImagesField.contains(event.relatedTarget)) return;
  activatePromptDropUi(false);
}

promptInput.addEventListener('dragenter', handlePromptDragEnter);
promptInput.addEventListener('dragover', handlePromptDragOver);
promptInput.addEventListener('dragleave', handlePromptDragLeave);
promptInput.addEventListener('drop', handlePromptDrop);

if (promptField) {
  promptField.addEventListener('dragenter', handlePromptDragEnter);
  promptField.addEventListener('dragover', handlePromptDragOver);
  promptField.addEventListener('dragleave', handlePromptDragLeave);
  promptField.addEventListener('drop', handlePromptDrop);
}

if (promptImagesField && promptImagesField !== promptField) {
  promptImagesField.addEventListener('dragenter', handlePromptDragEnter);
  promptImagesField.addEventListener('dragover', handlePromptDragOver);
  promptImagesField.addEventListener('dragleave', handlePromptDragLeave);
  promptImagesField.addEventListener('drop', handlePromptDrop);
}

if (imagePreview) {
  imagePreview.addEventListener('dragenter', handlePromptDragEnter);
  imagePreview.addEventListener('dragover', handlePromptDragOver);
  imagePreview.addEventListener('dragleave', handlePromptDragLeave);
  imagePreview.addEventListener('drop', handlePromptDrop);
}

if (selectedList) {
  selectedList.addEventListener('dragenter', handlePromptDragEnter);
  selectedList.addEventListener('dragover', handlePromptDragOver);
  selectedList.addEventListener('dragleave', handlePromptDragLeave);
  selectedList.addEventListener('drop', handlePromptDrop);
}

window.addEventListener('dragover', (event) => {
  const imageFiles = extractImageFilesFromDataTransfer(event.dataTransfer);
  if (imageFiles.length === 0) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  activatePromptDropUi(isPromptDropTarget(event));
});

window.addEventListener('drop', async (event) => {
  const imageFiles = extractImageFilesFromDataTransfer(event.dataTransfer);
  if (imageFiles.length === 0) return;
  event.preventDefault();
  event.stopPropagation();
  if (isPromptDropTarget(event)) {
    await handlePromptDrop(event);
  }
  activatePromptDropUi(false);
});

document.addEventListener('dragover', (event) => {
  const imageFiles = extractImageFilesFromDataTransfer(event.dataTransfer);
  if (imageFiles.length === 0) return;
  event.preventDefault();
}, true);

document.addEventListener('drop', async (event) => {
  const imageFiles = extractImageFilesFromDataTransfer(event.dataTransfer);
  if (imageFiles.length === 0) return;
  event.preventDefault();
  if (isPromptDropTarget(event)) {
    await handlePromptDrop(event);
  }
  activatePromptDropUi(false);
}, true);

apiKeyInput.addEventListener('input', () => {
  localStorage.setItem(API_KEY_STORAGE, apiKeyInput.value.trim());
});
openAiKeyInput.addEventListener('input', () => {
  localStorage.setItem(OPENAI_API_KEY_STORAGE, openAiKeyInput.value.trim());
});
promptInput.addEventListener('input', saveDraft);
modelSelect.addEventListener('change', () => {
  modelOverride.value = '';
  modelSelect.value = getSafeModelId(modelSelect.value);
  updateImageSizeOptions(imageSizeSelect.value);
  updateModelSpecificControls();
  saveDraft();
});
imageSizeSelect.addEventListener('change', () => {
  updateModelSpecificControls();
  saveDraft();
});
aspectRatioSelect.addEventListener('change', saveDraft);
claritySelect.addEventListener('change', saveDraft);
modelOverride.addEventListener('input', () => {
  updateImageSizeOptions(imageSizeSelect.value);
  updateModelSpecificControls();
  saveDraft();
});

likedOnlyToggle.addEventListener('change', render);

clearBtn.addEventListener('click', () => {
  refreshResultsFromServer()
    .then(() => {
      setStatus('History synced from server.');
      render();
    })
    .catch((err) => {
      setStatus(err.message || 'Failed to sync history.');
    });
});

removeSelectedBtn.addEventListener('click', () => {
  const checkedIds = new Set(promptImages.filter((img) => img.checked).map((img) => img.id));
  if (checkedIds.size === 0) {
    setStatus('Pick thumbnails first, then Remove selected.');
    return;
  }
  promptImages = promptImages.filter((img) => !checkedIds.has(img.id));
  saveDraft();
  renderSelected();
  render();
});

async function generate() {
  if (isPanelCollapsed()) {
    setPanelCollapsed(false);
    promptInput.focus();
    return;
  }

  const prompt = promptInput.value.trim();
  const override = normalizeModelId(modelOverride.value.trim());
  const selectedModel = getSafeModelId(modelSelect.value);
  const model = override || selectedModel;
  if (!modelSelect.value || !hasModelOption(modelSelect.value)) {
    modelSelect.value = DEFAULT_MODEL_ID;
    modelOverride.value = '';
    updateImageSizeOptions(DEFAULT_IMAGE_SIZE_BY_MODEL[DEFAULT_MODEL_ID] || '1K');
    updateModelSpecificControls();
    saveDraft();
  }
  const runtimeApiKey = apiKeyInput.value.trim();
  const runtimeOpenAiKey = openAiKeyInput.value.trim();
  const aspectRatio = aspectRatioSelect.value;
  const imageSize = imageSizeSelect.value;
  const clarity = claritySelect.value;

  if (!prompt) {
    setStatus('Please enter a prompt.');
    return;
  }

  const taskId = ++taskSeq;
  const taskLabel = `正在生成 #${taskId}`;
  activeTasks.set(taskId, { label: taskLabel });
  renderPendingTasks();
  setStatus(`${taskLabel}（队列中 ${activeTasks.size} 个）`);

  const payload = {
    prompt,
    model,
  };

  const images = [];
  const promptImagesSnapshot = [...promptImages];
  for (const image of promptImagesSnapshot) {
    const payloadImage = getBase64Payload(image.dataUrl);
    if (payloadImage) {
      images.push(payloadImage);
    }
  }
  if (images.length > 0) {
    payload.images = images;
  }
  const forceRefUse = images.length > 0;
  payload.options = {
    aspectRatio,
    imageSize,
    clarity,
    forceRefUse,
  };

  const sendingImageCount = images.length;
  setStatus(`Generating with ${sendingImageCount} reference image(s)...`);

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (runtimeApiKey) {
      headers['x-google-api-key'] = runtimeApiKey;
    }
    if (runtimeOpenAiKey) {
      headers['x-openai-api-key'] = runtimeOpenAiKey;
    }

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      const recv =
        data?.referenceDiagnostics && typeof data.referenceDiagnostics.receivedCount === 'number'
          ? ` refs received ${data.referenceDiagnostics.receivedCount}/${sendingImageCount}.`
          : '';
      const modelText = data?.text ? ` Model text: ${String(data.text).slice(0, 220)}` : '';
      const reasonText = Array.isArray(data?.finishReasons) && data.finishReasons.length > 0
        ? ` finish=${data.finishReasons.join(',')}.`
        : '';
      const blockText = data?.blockReason ? ` block=${data.blockReason}.` : '';
      const modelUsed = data?.effectiveModel ? ` model=${data.effectiveModel}.` : '';
      const refsText =
        typeof data?.receivedReferences === 'number' && typeof data?.sentReferences === 'number'
          ? ` refs_used=${data.receivedReferences}/${data.sentReferences}.`
          : '';
      const modelVersionText = data?.modelVersion ? ` modelVersion=${data.modelVersion}.` : '';
      throw new Error(`${data.error || 'Generation failed.'}${recv}${refsText}${modelUsed}${modelVersionText}${reasonText}${blockText}${modelText}`);
    }

    if (!data.images || data.images.length === 0) {
      const recv =
        data?.referenceDiagnostics && typeof data.referenceDiagnostics.receivedCount === 'number'
          ? ` refs received ${data.referenceDiagnostics.receivedCount}/${sendingImageCount}.`
          : '';
      const modelText = data?.text ? ` Model text: ${String(data.text).slice(0, 220)}` : '';
      throw new Error(`No image returned.${recv}${modelText}`);
    }

    const first = data.images[0];
    const imageDataUrl = `data:${first.mimeType};base64,${first.data}`;
    const dimensions = await getImageDimensions(imageDataUrl);

    const persistedResult = data.result
      ? {
          ...data.result,
          imageDataUrl,
          width: dimensions.width,
          height: dimensions.height,
          requestedModel: data.requestedModel || model,
        }
      : {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          model: data.model,
          requestedModel: data.requestedModel || model,
          prompt,
          imageDataUrl,
          createdAt: new Date().toISOString(),
          usage: data.usage || null,
        };
    persistedResult.settings = {
      aspectRatio: data.appliedOptions?.aspectRatio ?? aspectRatio,
      imageSize: data.appliedOptions?.imageSize ?? imageSize,
      clarity: data.appliedOptions?.clarity ?? clarity,
      forceRefUse,
    };
    persistedResult.promptReferenceImages = Array.isArray(data.result?.promptReferenceImages)
      ? data.result.promptReferenceImages
      : promptImagesSnapshot.map(makePromptImageSnapshot);
    persistedResult.referenceDiagnostics = data.referenceDiagnostics || null;
    persistedResult.referenceImageCount =
      typeof data.referenceImageCount === 'number' ? data.referenceImageCount : sendingImageCount;

    results.unshift(persistedResult);
    if (projectState.activeProjectId && projectState.activeProjectId !== 'all') {
      assignResultToProject(persistedResult.id, projectState.activeProjectId);
    }
    trackSuccessfulGeneration({
      requestedModel: persistedResult.requestedModel || model,
      usage: persistedResult.usage || data.usage || null,
      result: persistedResult,
    });
    await refreshResultsFromServer();
    const likedOnlyWasOn = likedOnlyToggle.checked;
    if (likedOnlyToggle.checked) {
      likedOnlyToggle.checked = false;
    }
    if (trashModal && !trashModal.hidden) {
      closeTrashModal();
    }
    saveDraft();
    const accepted = persistedResult.referenceImageCount;
    const mismatches = checkResultMatchesSettings(
      dimensions.width,
      dimensions.height,
      aspectRatio,
      imageSize
    );
    if (mismatches.length === 0) {
      const refDiag = data.referenceDiagnostics;
      const refLine =
        refDiag && typeof refDiag.receivedCount === 'number'
          ? ` Refs received ${refDiag.receivedCount}/${sendingImageCount}.`
          : '';
      const promptLine =
        refDiag && typeof refDiag.promptChars === 'number'
          ? ` Prompt chars ${refDiag.promptChars}.`
          : '';
      const partsLine =
        refDiag && typeof refDiag.sentPartsCount === 'number'
          ? ` Sent parts ${refDiag.sentPartsCount}.`
          : '';
      const refHashLine =
        refDiag && Array.isArray(refDiag.hashes) && refDiag.hashes.length > 0
          ? ` Hashes: ${refDiag.hashes.join(', ')}.`
          : '';
      const refGuideLine = refDiag?.guideApplied ? ' Ref guide ON.' : '';
      const refStrategyLine = data.referenceStrategy ? ` Ref strategy ${data.referenceStrategy}.` : '';
      const locationLine =
        projectState.activeProjectId && projectState.activeProjectId !== 'all'
          ? ` Saved into ${getActiveProject()?.name || 'current project'}.`
          : ' Saved into All photos.';
      const likedLine = likedOnlyWasOn ? ' Liked-only view was turned off.' : '';
      setStatus(
        `#${taskId} 完成。Sent ${sendingImageCount}, received ${accepted}. Output ${dimensions.width}x${dimensions.height}.${refLine}${promptLine}${partsLine}${refHashLine}${refGuideLine}${refStrategyLine}${locationLine}${likedLine}`
      );
    } else {
      setStatus(
        `#${taskId} 完成但有警告：${mismatches.join('; ')}`
      );
    }
    render();
  } catch (err) {
    const msg = formatFriendlyError(err?.message || 'Generation failed.');
    if (msg.includes('Failed to fetch')) {
      setStatus(
        `#${taskId} 失败：连接服务器失败。请确认 server.js 正在运行，并减少/压缩参考图后重试。`
      );
    } else {
      setStatus(`#${taskId} 失败：${msg}`);
    }
  } finally {
    activeTasks.delete(taskId);
    renderPendingTasks();
  }
}

generateBtn.addEventListener('click', () => {
  generateBtn.classList.remove('spark');
  // Restart animation cleanly on repeated clicks.
  void generateBtn.offsetWidth;
  generateBtn.classList.add('spark');
  generate();
});
if (logoStar) {
  logoStar.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    triggerMeteorShower();
  });
}
if (brandEl) {
  brandEl.addEventListener('dblclick', (event) => {
    event.preventDefault();
    event.stopPropagation();
    triggerMeteorShower();
  });
}
generateBtn.addEventListener('animationend', (event) => {
  if (event.animationName === 'buttonSpark') {
    generateBtn.classList.remove('spark');
  }
});

if (memoDisplay) {
  memoDisplay.addEventListener('click', () => {
    if (!memoInput || memoEditing) return;
    setMemoEditing(true);
  });
}
if (memoInput) {
  memoInput.addEventListener('blur', () => {
    if (!memoEditing) return;
    setMemoEditing(false);
  });
  memoInput.addEventListener('input', () => {
    memoDraftValue = memoInput.value;
  });
  memoInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      memoInput.value = loadMemoText();
      memoDraftValue = memoInput.value;
      setMemoEditing(false);
    }
  });
}
document.addEventListener('pointerdown', (event) => {
  if (!memoEditing || !memoBoard) return;
  if (memoBoard.contains(event.target)) return;
  setMemoEditing(false);
});
if (controlPanel) {
  controlPanel.addEventListener('click', (event) => {
    if (isPanelCollapsed()) {
      setPanelCollapsed(false);
    }
  });

  controlPanel.addEventListener('focusin', () => {
    if (isPanelCollapsed()) {
      setPanelCollapsed(false);
    }
  });
}

window.addEventListener('click', (event) => {
  if (!controlPanel) return;
  if (controlPanel.contains(event.target)) return;
  setPanelCollapsed(true);
});

window.addEventListener('click', (event) => {
  if (!batchProjectMode) return;
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  if (projectBar && path.includes(projectBar)) return;
  if (resultsEl && path.includes(resultsEl)) return;
  setBatchProjectMode(false);
  setStatus('Batch select off.');
});

let resizeRenderTimer = null;
window.addEventListener('resize', () => {
  window.clearTimeout(resizeRenderTimer);
  resizeRenderTimer = window.setTimeout(() => {
    render();
  }, 80);
});

if (usageToggle && usageModal) {
  usageToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    if (usageModal.hidden) {
      openUsageModal();
      return;
    }
    closeUsageModal();
  });
}

if (trashToggle) {
  trashToggle.addEventListener('click', async (event) => {
    event.stopPropagation();
    if (!trashModal.hidden) {
      closeTrashModal();
      return;
    }
    try {
      await refreshTrashFromServer();
      openTrashModal();
    } catch (err) {
      setStatus(err.message || 'Failed to open trash.');
    }
  });
}

if (usageModalClose) {
  usageModalClose.addEventListener('click', closeUsageModal);
}
if (usageModalBackdrop) {
  usageModalBackdrop.addEventListener('click', closeUsageModal);
}
if (trashModalClose) {
  trashModalClose.addEventListener('click', closeTrashModal);
}
if (trashModalBackdrop) {
  trashModalBackdrop.addEventListener('click', closeTrashModal);
}
if (trashClearBtn) {
  trashClearBtn.addEventListener('click', async () => {
    if (!trashItems.length) {
      setStatus('Trash is already empty.');
      return;
    }
    if (!window.confirm('Clear the trash permanently?')) return;
    const res = await fetch('/api/trash/clear', { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Failed to clear trash.');
      return;
    }
    await refreshTrashFromServer();
    renderTrashModal();
    setStatus('Trash cleared.');
  });
}
if (trashBatchBtn) {
  trashBatchBtn.addEventListener('click', () => {
    setTrashBatchMode(!trashBatchMode);
    if (!trashBatchMode) {
      setStatus('Trash batch select on. Click photos, then Restore.');
    }
  });
}
if (trashRestoreBtn) {
  trashRestoreBtn.addEventListener('click', async () => {
    if (selectedTrashIds.size === 0) {
      setStatus('Pick trashed photos first.');
      return;
    }
    let restored = 0;
    const restoreTargets = [...selectedTrashIds]
      .map((id) => trashItems.find((item) => item.id === id))
      .filter(Boolean);
    for (const item of restoreTargets) {
      const res = await fetch(`/api/trash/${encodeURIComponent(item.id)}/restore`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || 'Restore failed.');
        return;
      }
      if (data?.result?.id) {
        restoreResultToOriginalProject(data.result.id, data.originalProjectId || item.originalProjectId || 'all');
      }
      restored += 1;
    }
    saveProjectState();
    clearTrashSelection();
    trashBatchMode = false;
    await refreshResultsFromServer();
    await refreshTrashFromServer();
    closeTrashModal();
    render();
    setStatus(`Restored ${restored} photo(s) to their original project(s).`);
  });
}

detailClose.addEventListener('click', closeDetail);
detailBackdrop.addEventListener('click', closeDetail);
if (detailModal && detailLayout) {
  detailModal.addEventListener('click', (event) => {
    if (detailModal.hidden) return;
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    if (path.includes(detailLayout)) return;
    closeDetail();
  });
}
if (detailPrev) {
  detailPrev.addEventListener('click', () => moveDetail(-1));
}
if (detailNext) {
  detailNext.addEventListener('click', () => moveDetail(1));
}
if (detailDelete) {
  detailDelete.addEventListener('click', async () => {
    const current = getCurrentDetailItem();
    if (!current?.id) return;

    if (detailScope === 'trash') {
      const trashItem = trashItems[detailCursor];
      if (!trashItem) return;
      try {
        const res = await fetch(`/api/trash/${encodeURIComponent(trashItem.id)}/restore`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Restore failed.');
        if (data?.result?.id) {
          restoreResultToOriginalProject(data.result.id, data.originalProjectId || trashItem.originalProjectId || 'all');
        }
        saveProjectState();
        await refreshResultsFromServer();
        await refreshTrashFromServer();
        closeDetail();
        closeTrashModal();
        render();
        setStatus('Restored image to its original project.');
      } catch (err) {
        setStatus(err.message || 'Restore failed.');
      }
      return;
    }

    if (!window.confirm('Move this generation to trash?')) return;
    try {
      const originalProjectId = getProjectForResult(current.id) || 'all';
      const res = await fetch(`/api/results/${encodeURIComponent(current.id)}`, {
        method: 'DELETE',
        headers: { 'x-project-id': originalProjectId },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Trash failed.');
      }
      promptImages = promptImages.filter(
        (img) => !(img.source === 'result' && img.resultId === current.id)
      );
      delete projectState.assignments[current.id];
      results = results.filter((item) => item.id !== current.id);
      saveProjectState();
      saveDraft();
      await refreshResultsFromServer();
      await refreshTrashFromServer();
      closeDetail();
      render();
      setStatus(data.trashed ? 'Moved to trash.' : 'Removed from history.');
    } catch (err) {
      setStatus(err.message || 'Trash failed.');
    }
  });
}
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && trashModal && !trashModal.hidden) {
    closeTrashModal();
    return;
  }
  if (event.key === 'Escape' && usageModal && !usageModal.hidden) {
    closeUsageModal();
    return;
  }
  if (event.key === 'Escape' && !detailModal.hidden) {
    closeDetail();
    return;
  }
  if (!detailModal.hidden && event.key === 'ArrowLeft') {
    moveDetail(-1);
    return;
  }
  if (!detailModal.hidden && event.key === 'ArrowRight') {
    moveDetail(1);
  }
});

async function init() {
  try {
    await syncProjectStateFromServer();
    await syncUsageLedgerFromServer();
    await refreshResultsFromServer();
    await refreshTrashFromServer();
    const hydrated = await hydrateMissingResultDimensions();
    const imported = await importLegacyResultsIfNeeded();
    if (imported > 0) {
      await refreshResultsFromServer();
      await refreshTrashFromServer();
      await hydrateMissingResultDimensions();
      setStatus(`Imported ${imported} legacy generations.`);
    } else if (hydrated) {
      setStatus('History loaded and image ratios restored.');
    } else {
      setStatus('History loaded from server.');
    }
    initializeUsageLedgerFromResultsIfEmpty();
  } catch (err) {
    setStatus(`${err.message || 'Failed to load history.'} Showing current session only.`);
  }
  render();
}

init();
