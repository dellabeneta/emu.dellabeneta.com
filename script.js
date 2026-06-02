
const translations = {
  pt: {
    headerStats: "%G JOGOS DISPONÍVEIS EM %P PLATAFORMAS DIFERENTES",
    controlsTitle: "// ESCOLHA UMA PLATAFORMA",
    filterEra: "FILTRAR POR DÉCADA",
    filterAll: "TODAS",
    searchLabel: "PESQUISA (P)",
    searchPlaceholder: "POR PLATAFORMA...",
    placeholder: "// SELECIONE UMA PLATAFORMA",
    allPlatforms: "TODAS AS PLATAFORMAS",
    footerMid: "COM TECNOLOGIA EMULATORJS + NÚCLEOS RETROARCH",
    release: "LANÇAMENTO",
    maker: "FABRICANTE",
    abbr: "SIGLA",
    cores: "NÚCLEO",
    era80s: "Anos 80",
    era90s: "Anos 90",
    era00s: "Anos 2000",
    games: "JOGOS (J)",
    searchGamesPlaceholder: "FILTRAR JOGOS...",
    footerKeyPlatforms: "plataformas",
    footerKeyGames: "jogos",
    footerKeyPlay: "jogar",
    footerKeySearch: "buscar",
    footerJoystick: "Compatibilidade com Joysticks",
    joystickModalTitle: "JOYSTICK NO BROWSER",
    joystickModalP1: "O site usa a Gamepad API do próprio navegador pra detectar controles — o que significa que ele não faz mágica por conta própria. A regra é simples: se o controle funciona no seu sistema operacional, ele vai funcionar aqui também.",
    joystickModalP2: "Então antes de achar que o site tá bugado, plugue o controle, abra o painel de controle do seu sistema e confirma que ele aparece lá. No Windows você procura por \"Controladores de jogo\", no Mac vai em Preferências do Sistema. Depois é só jogar.",
    joystickModalClose: "FECHAR",
    footerFeedback: "Feedback",
    feedbackModalTitle: "FEEDBACK",
    feedbackNameLabel: "NOME COMPLETO",
    feedbackCommentLabel: "COMENTÁRIO",
    feedbackNamePlaceholder: "Seu nome completo",
    feedbackCommentPlaceholder: "Opinião, sugestão ou bug...",
    feedbackSubmit: "ENVIAR",
    feedbackSuccess: "Obrigado! Seu comentário foi recebido.",
    feedbackError: "Erro ao enviar. Tente novamente.",
    booting: "CARREGANDO SISTEMA...",
    items: "ITENS"
  },
  en: {
    headerStats: "%G GAMES AVAILABLE ACROSS %P DIFFERENT PLATFORMS",
    controlsTitle: "// CHOOSE A PLATFORM",
    filterEra: "FILTER BY ERA",
    filterAll: "ALL",
    searchLabel: "SEARCH (P)",
    searchPlaceholder: "BY PLATFORM...",
    placeholder: "// SELECT A PLATFORM",
    allPlatforms: "ALL PLATFORMS",
    footerMid: "POWERED BY EMULATORJS + RETROARCH CORES",
    release: "RELEASE",
    maker: "MAKER",
    abbr: "ABBR",
    cores: "CORE",
    era80s: "80s",
    era90s: "90s",
    era00s: "00s",
    games: "GAMES (J)",
    searchGamesPlaceholder: "FILTER GAMES...",
    footerKeyPlatforms: "platforms",
    footerKeyGames: "games",
    footerKeyPlay: "play",
    footerKeySearch: "search",
    footerJoystick: "Joystick Compatible",
    joystickModalTitle: "JOYSTICK IN THE BROWSER",
    joystickModalP1: "The site uses the browser's native Gamepad API to detect controllers — which means it doesn't do any magic on its own. The rule is simple: if the controller works on your operating system, it'll work here too.",
    joystickModalP2: "So before assuming the site is broken, plug in your controller, open your system's game controller settings, and confirm it shows up there. On Windows search for \"Game Controllers\", on Mac go to System Preferences. After that, just play.",
    joystickModalClose: "CLOSE",
    footerFeedback: "Feedback",
    feedbackModalTitle: "FEEDBACK",
    feedbackNameLabel: "FULL NAME",
    feedbackCommentLabel: "COMMENT",
    feedbackNamePlaceholder: "Your full name",
    feedbackCommentPlaceholder: "Opinion, suggestion or bug...",
    feedbackSubmit: "SEND",
    feedbackSuccess: "Thanks! Your feedback was received.",
    feedbackError: "Failed to send. Please try again.",
    booting: "BOOTING SYSTEM...",
    items: "ITEMS"
  }
};


function updateUI() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[state.lang][key]) {
      el.textContent = translations[state.lang][key];
    }
  });

  const headerStatsEl = document.getElementById('header-stats');
  if (headerStatsEl) {
    headerStatsEl.innerHTML = translations[state.lang].headerStats
      .replace('%G', `<span class="stats-highlight">${TOTAL_GAMES}</span>`)
      .replace('%P', `<span class="stats-highlight">${TOTAL_PLATFORMS}</span>`);
  }

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[state.lang][key]) el.placeholder = translations[state.lang][key];
  });
}

const TOTAL_GAMES     = PLATFORMS.reduce((sum, p) => sum + (p.games?.length ?? 0), 0);
const TOTAL_PLATFORMS = PLATFORMS.length;

// ===== MODALS =====
function createModal({ btnId, backdropId, modalId, closeBtnId, onOpen, onClose }) {
  const btn      = document.getElementById(btnId);
  const backdrop = document.getElementById(backdropId);
  const modal    = document.getElementById(modalId);
  const closeBtn = document.getElementById(closeBtnId);

  function open() {
    backdrop.classList.add('open');
    modal.classList.add('open');
    if (onOpen) onOpen(closeBtn);
  }
  function close() {
    backdrop.classList.remove('open');
    modal.classList.remove('open');
    if (onClose) onClose();
  }

  btn.addEventListener('click', open);
  backdrop.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) close();
  });
}

createModal({
  btnId:      'joystick-info-btn',
  backdropId: 'joystick-backdrop',
  modalId:    'joystick-modal',
  closeBtnId: 'joystick-modal-close',
  onOpen: closeBtn => closeBtn.focus(),
});

(function () {
  const form        = document.getElementById('feedback-form');
  const formWrap    = document.getElementById('feedback-form-wrap');
  const commentArea = document.getElementById('feedback-comment');
  const counter     = document.getElementById('feedback-count');
  const errorEl     = document.getElementById('feedback-error');
  const successEl   = document.getElementById('feedback-success');
  const submitBtn   = document.getElementById('feedback-submit');

  createModal({
    btnId:      'feedback-btn',
    backdropId: 'feedback-backdrop',
    modalId:    'feedback-modal',
    closeBtnId: 'feedback-modal-close',
    onOpen: () => document.getElementById('feedback-name').focus(),
    onClose: () => {
      form.reset();
      counter.textContent = '0';
      errorEl.hidden = true;
      successEl.hidden = true;
      formWrap.hidden = false;
      submitBtn.disabled = false;
    },
  });

  commentArea.addEventListener('input', () => {
    counter.textContent = commentArea.value.length;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    errorEl.hidden = true;

    try {
      const res = await fetch('https://formspree.io/f/mvzdvokd', {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        formWrap.hidden = true;
        successEl.hidden = false;
      } else {
        errorEl.hidden = false;
        submitBtn.disabled = false;
      }
    } catch {
      errorEl.hidden = false;
      submitBtn.disabled = false;
    }
  });
})();

document.getElementById('lang-toggle').addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    state.lang = e.target.getAttribute('data-lang');
    updateUI();
    buildCarousel();
    selectPlatform(state.activeIdx);
  }
});

// ===== EMULATOR CONFIG =====
const CORE_MAP = {
  'NES':    'nes',
  'SNES':   'snes',
  'GB':     'gambatte',
  'GBC':    'gambatte',
  'GBA':    'gba',
  'PSX':    'pcsx_rearmed',
  'MEGA':   'genesis_plus_gx',
  'MASTER': 'genesis_plus_gx',
  'cps1':   'fbneo',
  'cps2':   'fbneo',
  'cps3':   'fbneo',
  'neogeo': 'fbneo',
  'fbneo':  'fbneo',
  'N64':    'n64'
};

const EXT_MAP = {
  'NES':    'nes',
  'SNES':   'sfc',
  'GB':     'gb',
  'GBC':    'gbc',
  'GBA':    'gba',
  'PSX':    'chd',
  'MEGA':   'md',
  'MASTER': 'sms',
  'cps1':   'zip',
  'cps2':   'zip',
  'cps3':   'zip',
  'neogeo': 'zip',
  'fbneo':  'zip',
  'N64':    'z64'
};

// ===== STATE =====
const state = {
  filtered:          [...PLATFORMS],
  activeIdx:         0,
  visible:           5,
  carOffset:         0,
  selectedGameIdx:   0,
  isEmulatorRunning: false,
  lastKeyTime:       0,
  keyboardActive:    false,
  lang:              'pt',
};

const KEY_THROTTLE = 80;

// ===== ELEMENTS =====
const track       = document.getElementById('carousel-track');
const navLeft     = document.getElementById('nav-left');
const navRight    = document.getElementById('nav-right');
const detailInner = document.getElementById('detail-inner');
const detailPanel = document.getElementById('detail-panel');

// ===== CAROUSEL =====
function getCardStep() {
  const firstCard = track.querySelector('.c-card');
  return firstCard ? firstCard.offsetWidth + 16 : 236;
}

function calcVisible() {
  const vp = document.querySelector('.carousel-container');
  if (!vp) return;
  state.visible = Math.max(1, Math.floor((vp.clientWidth - 64 + 16) / getCardStep()));
}

function buildCarousel() {
  track.innerHTML = '';

  state.filtered.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'c-card' + (state.activeIdx === i ? ' active' : '');
    card.style.animationDelay = (i * 0.04) + 's';

    const wrap = document.createElement('div');
    wrap.className = 'c-img-wrap';
    const img = document.createElement('img');
    img.src = p.img;
    img.alt = p.name;
    img.loading = 'lazy';
    img.onerror = () => { wrap.innerHTML = `<span class="c-abbr">${p.abbr.toUpperCase()}</span>`; };
    wrap.appendChild(img);

    const name = document.createElement('div');
    name.className = 'c-name';
    name.innerText = p.name;

    const era = document.createElement('div');
    era.className = 'c-era';
    era.innerText = p.era;

    card.appendChild(wrap);
    card.appendChild(name);
    card.appendChild(era);
    card.addEventListener('click', () => selectPlatform(i));
    track.appendChild(card);
  });

  calcVisible();
  applyCarouselOffset();
  updateNav();
}

function applyCarouselOffset() {
  const step = getCardStep();
  track.style.transform = `translateX(${-(state.carOffset * step - 16)}px)`;
}

function updateNav() {
  const max = Math.max(0, state.filtered.length - state.visible);
  navLeft.disabled  = state.carOffset <= 0;
  navRight.disabled = state.carOffset >= max;
}

function syncNav() {
  applyCarouselOffset();
  updateNav();
}

function goTo(dir) {
  const max = Math.max(0, state.filtered.length - state.visible);
  state.carOffset = Math.max(0, Math.min(state.carOffset + dir, max));
  syncNav();
}

navLeft.addEventListener('click', () => goTo(-1));
navRight.addEventListener('click', () => goTo(1));

document.getElementById('carousel-container').addEventListener('wheel', e => {
  e.preventDefault();
  goTo(e.deltaY > 0 ? 1 : -1);
}, { passive: false });

// ===== DETAIL =====
function renderInfo(p) {
  const lang  = translations[state.lang];
  const desc  = state.lang === 'en' && desc_en[p.name] ? desc_en[p.name] : p.desc;
  const cores = p.cores.map(c => `<span class="core-badge">${c}</span>`).join('');

  return `
  <div class="detail-info">
    <div class="detail-name">${p.fullName || p.name}</div>
    <div class="detail-meta">
      <span>${lang.release}: <strong>${p.era}</strong></span>
      <span>${lang.maker}: <strong>${p.maker}</strong></span>
      <span>${lang.abbr}: <strong>${p.abbr.toUpperCase()}</strong></span>
    </div>
    <div class="detail-desc">${desc}</div>
    <div class="detail-cores">
      <span class="detail-cores-label">${lang.cores}: </span>
      ${cores}
    </div>
  </div>`;
}

function renderGames(p) {
  const lang = translations[state.lang];

  const html = `
  <div class="detail-games">
    <div class="games-header">
      <span data-i18n="games">${lang.games}</span>
      <span class="games-count">${p.games.length} ${lang.items}</span>
    </div>
    <div class="game-search-box">
      <span class="search-icon">></span>
      <input type="text" id="game-search" placeholder="${lang.searchGamesPlaceholder}" />
    </div>
    <div class="game-list" id="game-list-view"></div>
  </div>`;

  return html;
}

function renderDetail(p) {
  detailInner.innerHTML = renderInfo(p) + renderGames(p);

  renderGameList(p.games);

  document.getElementById('game-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderGameList(p.games.filter(g => g.title.toLowerCase().includes(q)));
  });
}

function selectFirstGame() {
  const firstItem = document.querySelector('.game-item');
  if (firstItem) firstItem.click();
}

function centerOnPlatform(idx) {
  const maxScroll = Math.max(0, state.filtered.length - state.visible);
  state.carOffset = Math.max(0, Math.min(idx - Math.floor(state.visible / 2), maxScroll));
  syncNav();
}

function selectPlatform(idx) {
  state.activeIdx = idx;
  document.querySelectorAll('.c-card').forEach((c, i) => c.classList.toggle('active', i === idx));
  renderDetail(state.filtered[idx]);
  selectFirstGame();
  centerOnPlatform(idx);
}

function renderGameList(gamesList) {
  const container = document.getElementById('game-list-view');
  if (!container) return;

  const sorted = [...gamesList].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));

  if (sorted.length === 0) {
    container.innerHTML = `<div class="game-empty">${state.lang === 'en' ? 'NO GAMES FOUND' : 'NENHUM JOGO ENCONTRADO'}</div>`;
    return;
  }

  container.innerHTML = sorted.map(g => `
    <div class="game-item" data-title="${g.title}">
      <span class="game-title">${g.displayTitle || g.title}</span>
      <span class="game-year">${g.year}</span>
      <span class="game-launch">${state.lang === 'pt' ? 'JOGAR' : 'PLAY'}</span>
    </div>
  `).join('');

  container.querySelectorAll('.game-item').forEach(item => {
    item.addEventListener('click', e => {
      if (e.target.classList.contains('game-launch')) return;
      container.querySelectorAll('.game-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');

      const p = state.filtered[state.activeIdx];
      const title = item.getAttribute('data-title');
      state.selectedGameIdx = p.games.findIndex(g => g.title === title);
    });

    item.querySelector('.game-launch').addEventListener('click', e => {
      e.stopPropagation();
      if (item.classList.contains('selected')) launchGame();
    });
  });
}

// ===== FILTERS =====
function applyFilters() {
  const era = document.querySelector('.filter-btn.active')?.dataset.era || 'all';
  state.filtered  = PLATFORMS.filter(p => era === 'all' || p.decade === era);
  state.carOffset = 0;
  buildCarousel();
  if (state.filtered.length > 0) selectPlatform(0);
}

document.getElementById('era-filter').addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyFilters();
});

// ===== KEYBOARD NAV =====

document.addEventListener('keydown', e => {
  if (e.key === 'Tab' && !document.querySelector('.open[role="dialog"]')) {
    e.preventDefault();
    return;
  }

  if (state.isEmulatorRunning) {
    if (e.key === 'Escape') closeEmulator();
    return;
  }

  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (document.querySelector('.open[role="dialog"]')) return;

  const now = Date.now();
  if (now - state.lastKeyTime < KEY_THROTTLE) return;

  const max = state.filtered.length;
  if (max === 0) return;

  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    state.lastKeyTime = now;
    state.keyboardActive = true;
    track.style.pointerEvents = 'none';
    selectPlatform(Math.max(0, state.activeIdx - 1));
  }

  if (e.key === 'ArrowRight') {
    e.preventDefault();
    state.lastKeyTime = now;
    state.keyboardActive = true;
    track.style.pointerEvents = 'none';
    selectPlatform(Math.min(max - 1, state.activeIdx + 1));
  }

  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
    state.lastKeyTime = now;
    const items = [...document.querySelectorAll('.game-item')];
    if (!items.length) return;
    const currentDomIdx = items.findIndex(item => item.classList.contains('selected'));
    let nextDomIdx;
    if (e.key === 'ArrowUp') {
      nextDomIdx = currentDomIdx <= 0 ? items.length - 1 : currentDomIdx - 1;
    } else {
      nextDomIdx = currentDomIdx < 0 || currentDomIdx >= items.length - 1 ? 0 : currentDomIdx + 1;
    }
    state.keyboardActive = true;
    const gameList = document.getElementById('game-list-view');
    if (gameList) gameList.style.pointerEvents = 'none';
    items[nextDomIdx].click();
    items[nextDomIdx].scrollIntoView({ block: 'nearest' });
  }

  if (e.key === 'Enter') {
    launchGame();
  }

  if (e.key.toLowerCase() === 'j') {
    e.preventDefault();
    document.getElementById('game-search')?.focus();
  }
});

document.addEventListener('mousemove', () => {
  if (!state.keyboardActive) return;
  state.keyboardActive = false;
  track.style.pointerEvents = '';
  const gameList = document.getElementById('game-list-view');
  if (gameList) gameList.style.pointerEvents = '';
});

// ===== START =====
function init() {
  if (window.innerWidth < 933) return;
  setTimeout(() => {
    const savedActive = localStorage.getItem('retroVault_activeIdx');
    const savedGame   = localStorage.getItem('retroVault_selectedGameIdx');

    if (savedActive !== null) {
      state.activeIdx       = parseInt(savedActive);
      state.selectedGameIdx = parseInt(savedGame) || 0;
      localStorage.removeItem('retroVault_activeIdx');
      localStorage.removeItem('retroVault_selectedGameIdx');
    }

    updateUI();
    buildCarousel();
    selectPlatform(state.activeIdx);
  }, 100);
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { calcVisible(); syncNav(); }, 150);
});
window.addEventListener('load', init);
window.addEventListener('load', fetchVisitorCount);

async function fetchVisitorCount() {
  try {
    const res = await fetch('/api/visits');
    const { count: n } = await res.json();
    const el = document.getElementById('visitor-count');
    if (el) el.textContent = n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : n;
  } catch {
    // silently fail — counter stays as —
  }
}

// ===== EMULATOR INTEGRATION =====

function launchGame() {
  if (state.isEmulatorRunning) return;
  state.isEmulatorRunning = true;
  const platform     = state.filtered[state.activeIdx];
  const selectedGame = platform.games[state.selectedGameIdx];
  if (!selectedGame) return;

  const overlay    = document.getElementById('emulator-overlay');
  const bootScreen = document.getElementById('boot-screen');

  overlay.style.display    = 'flex';
  bootScreen.style.opacity = '1';
  bootScreen.style.display = 'flex';

  const bootCanvas = document.getElementById('boot-canvas');
  let noiseRaf;
  if (bootCanvas) {
    const ctx = bootCanvas.getContext('2d');
    bootCanvas.width  = bootCanvas.offsetWidth;
    bootCanvas.height = bootCanvas.offsetHeight;
    function drawNoise() {
      const w = bootCanvas.width, h = bootCanvas.height;
      const imageData = ctx.createImageData(w, h);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255 | 0;
        data[i] = v; data[i+1] = v; data[i+2] = v; data[i+3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
      noiseRaf = requestAnimationFrame(drawNoise);
    }
    drawNoise();
  }
  const bootLogo = document.querySelector('.boot-logo');
  if (bootLogo) {
    bootLogo.className = 'boot-logo hidden';
    setTimeout(() => { bootLogo.className = 'boot-logo tuning'; }, 800);
    setTimeout(() => { bootLogo.className = 'boot-logo stable'; }, 2100);
  }

  const currentCore  = CORE_MAP[platform.abbr] || 'snes';
  const ext          = EXT_MAP[platform.abbr]  || 'zip';
  const filename     = selectedGame.file || selectedGame.title.replace(/\s+/g, '_').toLowerCase();
  const emuContainer = document.getElementById('emulator-container');
  emuContainer.innerHTML     = '';
  emuContainer.style.opacity = '0';

  window.EJS_biosUrl = undefined;
  if (platform.abbr === 'PSX')    window.EJS_biosUrl = 'roms/psx/scph5501.bin';
  if (platform.abbr === 'neogeo') window.EJS_biosUrl = 'roms/neogeo/neogeo.zip';

  window.EJS_player             = '#emulator-container';
  window.EJS_gameUrl            = `roms/${platform.abbr.toLowerCase()}/${filename.includes('.') ? filename : `${filename}.${ext}`}`;
  window.EJS_core               = currentCore;
  window.EJS_pathtodata         = 'https://cdn.emulatorjs.org/stable/data/';
  window.EJS_startOnLoaded      = true;
  window.EJS_allow_Focus_Inputs = true;
  window.EJS_showMenu           = false;
  window.EJS_core_config        = false;
  window.EJS_mouse              = false;
  window.EJS_threads            = false;
  window.EJS_Buttons            = {};
  window.EJS_Settings           = {};

  const injectLoader = () => {
    const s = document.createElement('script');
    s.src         = 'https://cdn.emulatorjs.org/stable/data/loader.js';
    s.integrity   = 'sha256-aeCQO/Hi9izteIleflEfom4RMW9+tzSSXDXpGboSh7I=';
    s.crossOrigin = 'anonymous';
    document.body.appendChild(s);
  };

  setTimeout(injectLoader, 2000);
  setTimeout(() => {
    if (noiseRaf) cancelAnimationFrame(noiseRaf);
    bootScreen.style.opacity = '0';
    emuContainer.classList.add('visible');
    setTimeout(() => { bootScreen.style.display = 'none'; }, 800);
  }, 3000);
}

function closeEmulator() {
  state.isEmulatorRunning = false;
  localStorage.setItem('retroVault_activeIdx',       state.activeIdx);
  localStorage.setItem('retroVault_selectedGameIdx', state.selectedGameIdx);
  window.location.reload();
}

// ===== PC-ONLY: bloqueia acesso via mobile =====
(function() {
  function checkMobile() {
    const wall = document.getElementById('mobile-wall');
    if (window.innerWidth < 933) {
      wall.removeAttribute('hidden');
    } else {
      wall.setAttribute('hidden', '');
    }
  }
  checkMobile();
  window.addEventListener('resize', checkMobile);
})();

document.getElementById('exit-emulator').addEventListener('click', closeEmulator);
