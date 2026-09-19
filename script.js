/* ============================================================
   For Someone Special — script.js
   Sections: config · helpers · particles · envelope · letter
             · afterword · modal · music player · cursor · init
   ============================================================ */

'use strict';

/* ---------- 1. CONFIG ---------- */

const PLAYLIST = [
  { title: 'Bawat Daan', artist: 'Ebe Dencel',  src: 'assets/song.mp3',   art: 'images/album-cover.jpg' },
];

/* The letter. Edit these lines — that's the whole point. */
const LETTER = [
  'Hi, Sophia,',
  'Gusto ko lang sabihin na sorry talaga sa ginawa ko kanina. Alam kong mali ako and I know na baka na-off or nainis ka sa akin. Hindi ko naman talaga intention na gawin yun. Siguro naging ganun lang ako kasi… miss lang talaga kita.',
  'Hindi ko alam kung paano ko ba sasabihin nang maayos, pero gusto talaga kita. Minsan nga hindi ko rin gets kung bakit ganito ako kapag ikaw na yung involved. Kahit simpleng message mo lang, napapangiti na ako. Tapos kapag hindi tayo nag-uusap, hinahanap-hanap kita.',
  'I like the little things about you too. Yung mga random na kwento mo, mga jokes mo, yung way mo makipag-usap, pati yung mga simpleng bagay na ginagawa mo. Baka normal lang yun para sa’yo, pero somehow, napapansin ko talaga.',
  'And honestly, hindi ko naman sinusulat ’to para may hingin sa’yo or para pilitin kang sabihin kung ano yung nararamdaman mo. Gusto ko lang maging honest sa’yo.',
  'Sorry ulit talaga, Sophia. Hindi ko dapat ginawa yung ginawa ko kanina. Miss lang talaga kita, pero alam kong hindi yun excuse para magkamali ako.',
  'I hope you know na I really care about you. Hindi man ako magaling mag-express ng feelings ko, pero sincere ako sa lahat ng sinasabi ko dito.',
  'Thank you for being you. 🖤',
  '— recto'
];

const TYPE_SPEED = 18;      // ms per character
const PARAGRAPH_PAUSE = 420; // ms between paragraphs

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 2. HELPERS ---------- */

const $  = (sel, root = document) => root.querySelector(sel);
const rand = (min, max) => Math.random() * (max - min) + min;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function paintRange(input) {
  const min = Number(input.min) || 0;
  const max = Number(input.max) || 100;
  const pct = ((Number(input.value) - min) / (max - min)) * 100;
  input.style.setProperty('--fill', `${pct}%`);
}

/* ---------- 3. PARTICLES ---------- */

const ambient = $('#ambient');
const HEART_GLYPHS = ['🖤', '🖤', '🖤', '🖤'];

function spawnHeart() {
  const el = document.createElement('span');
  el.className = 'particle particle--heart';
  el.textContent = pick(HEART_GLYPHS);
  el.style.left = `${rand(0, 100)}vw`;
  el.style.fontSize = `${rand(12, 26)}px`;
  el.style.opacity = rand(.4, .9);
  el.style.setProperty('--drift', `${rand(-90, 90)}px`);
  el.style.setProperty('--spin', `${rand(-160, 160)}deg`);
  el.style.animationDuration = `${rand(9, 16)}s`;
  ambient.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

function spawnPetal() {
  const el = document.createElement('span');
  el.className = 'particle particle--petal';
  el.style.left = `${rand(0, 100)}vw`;
  el.style.setProperty('--drift', `${rand(-140, 60)}px`);
  el.style.setProperty('--spin', `${rand(240, 620)}deg`);
  el.style.animationDuration = `${rand(10, 18)}s`;
  el.style.opacity = rand(.5, .95);
  ambient.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

function spawnSparkle(x, y) {
  const el = document.createElement('span');
  el.className = 'particle particle--sparkle';
  el.style.left = `${x + rand(-10, 10)}px`;
  el.style.top  = `${y + rand(-10, 10)}px`;
  ambient.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

/* a burst of hearts from a point — used on clicks */
function burstHearts(x, y, count = 10) {
  if (reduceMotion) return;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'particle particle--burst';
    el.textContent = pick(HEART_GLYPHS);
    el.style.left = `${x}px`;
    el.style.top  = `${y}px`;
    el.style.fontSize = `${rand(12, 28)}px`;
    el.style.setProperty('--dx', `${rand(-130, 130)}px`);
    el.style.setProperty('--dy', `${rand(-190, -70)}px`);
    el.style.animationDuration = `${rand(1.1, 1.9)}s`;
    ambient.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

let ambientTimer = null;
function startAmbient() {
  if (reduceMotion || ambientTimer) return;
  for (let i = 0; i < 6; i++) { spawnHeart(); spawnPetal(); }
  ambientTimer = setInterval(() => {
    if (document.hidden) return;                 // keep it light in background tabs
    if (ambient.childElementCount > 70) return;  // hard cap
    spawnHeart();
    if (Math.random() > .35) spawnPetal();
  }, 900);
}

/* hearts on click, anywhere marked .heart-click (plus the big heart) */
function bindHeartClicks() {
  document.addEventListener('click', e => {
    const target = e.target.closest('.heart-click, .particle--heart');
    if (target) burstHearts(e.clientX, e.clientY, 14);
  });
  const big = $('#bigHeart');
  big.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const r = big.getBoundingClientRect();
      burstHearts(r.left + r.width / 2, r.top + r.height / 2, 14);
    }
  });
}

/* ---------- 4. ENVELOPE ---------- */

const envelope     = $('#envelope');
const sceneEnvelope = $('#sceneEnvelope');
const sceneLetter  = $('#sceneLetter');
const openBtn      = $('#openBtn');
let opened = false;

/* one-time entrance fade, done as a class so it never replays when
   .is-shaking is toggled later (that used to cause a re-fade "flash") */
requestAnimationFrame(() => requestAnimationFrame(() => envelope.classList.add('is-visible')));

function openEnvelope() {
  if (opened) return;
  opened = true;
  openBtn.disabled = true;

  player.unlock(); // prime audio playback on this user gesture, since actual play() happens after a delay below

  const rect = envelope.getBoundingClientRect();
  burstHearts(rect.left + rect.width / 2, rect.top + rect.height / 2, 18);

  envelope.classList.add('is-shaking');

  setTimeout(() => {
    envelope.classList.remove('is-shaking');
    envelope.classList.add('is-open');
    if (!reduceMotion) for (let i = 0; i < 14; i++) setTimeout(spawnHeart, i * 90);
  }, reduceMotion ? 0 : 560);

  setTimeout(() => {
    sceneEnvelope.hidden = true;
    sceneLetter.hidden = false;
    window.scrollTo({ top: 0, behavior: 'auto' });
    typeLetter();
    player.startIfIdle();          // music begins with the letter, never before
  }, reduceMotion ? 120 : 1700);
}

/* ---------- 5. LETTER TYPING ---------- */

const letterBody = $('#letterBody');
const letterFoot = $('#letterFoot');
const skipBtn    = $('#skipBtn');
const afterword  = $('#afterword');

let typingTimers = [];
let typingDone = false;

function finishLetter() {
  typingDone = true;
  typingTimers.forEach(clearTimeout);
  typingTimers = [];
  letterBody.innerHTML = '';
  LETTER.forEach(text => {
    const p = document.createElement('p');
    p.textContent = text;
    letterBody.appendChild(p);
  });
  letterFoot.hidden = false;
  skipBtn.hidden = true;
  revealAfterword();
}

function typeLetter() {
  $('#letterDate').textContent = new Date().toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  if (reduceMotion) { finishLetter(); return; }

  let index = 0;

  const typeParagraph = () => {
    if (index >= LETTER.length) {
      letterFoot.hidden = false;
      skipBtn.hidden = true;
      typingDone = true;
      revealAfterword();
      return;
    }

    const text = LETTER[index++];
    const p = document.createElement('p');
    const span = document.createElement('span');
    const caret = document.createElement('i');
    caret.className = 'caret';
    p.append(span, caret);
    letterBody.appendChild(p);

    let i = 0;
    const tick = () => {
      span.textContent = text.slice(0, ++i);
      if (i < text.length) {
        typingTimers.push(setTimeout(tick, TYPE_SPEED));
      } else {
        caret.remove();
        typingTimers.push(setTimeout(typeParagraph, PARAGRAPH_PAUSE));
      }
    };
    tick();
  };

  typeParagraph();
}

skipBtn.addEventListener('click', () => { if (!typingDone) finishLetter(); });

/* ---------- 6. AFTERWORD ---------- */

function revealAfterword() {
  afterword.hidden = false;
  if (reduceMotion) return;
  requestAnimationFrame(() => {
    afterword.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

const oneMoreBtn = $('#oneMoreBtn');
const final = $('#final');

oneMoreBtn.addEventListener('click', e => {
  final.hidden = false;
  oneMoreBtn.hidden = true;
  burstHearts(e.clientX, e.clientY, 22);
  setTimeout(() => final.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
});

/* ---------- 7. SECRET MODAL ---------- */

const modal = $('#secretModal');

function openModal() {
  modal.hidden = false;
  $('#modalClose').focus();
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
  $('#secretBtn').focus();
}

$('#secretBtn').addEventListener('click', e => {
  openModal();
  burstHearts(e.clientX, e.clientY, 10);
});
$('#modalClose').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target.dataset.close !== undefined) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

/* ---------- 8. MUSIC PLAYER ---------- */

const player = (() => {
  const audio    = $('#audio');
  const shell    = $('#player');
  const titleEl  = $('#trackTitle');
  const artistEl = $('#trackArtist');
  const artEl    = $('#albumArt');
  const seek     = $('#seek');
  const volume   = $('#volume');
  const timeNow  = $('#timeNow');
  const timeTotal= $('#timeTotal');
  const playBtn  = $('#playBtn');
  const muteBtn  = $('#muteBtn');

  let current = 0;
  let seeking = false;
  let started = false;
  let hasRealTrack = false; // becomes true once a track actually loads/plays successfully

  function load(index, autoplay = false) {
    current = (index + PLAYLIST.length) % PLAYLIST.length;
    const track = PLAYLIST[current];
    audio.src = track.src;
    titleEl.textContent = track.title;
    artistEl.textContent = track.artist;
    artEl.classList.remove('is-missing');
    artEl.src = track.art;
    seek.value = 0; paintRange(seek);
    timeNow.textContent = '0:00';
    timeTotal.textContent = '0:00';
    if (autoplay) play();
  }

  function play() {
    const attempt = audio.play();
    if (attempt && attempt.catch) {
      attempt.catch(() => {
        // file missing, unsupported, or blocked by the browser — say so instead of failing silently
        if (!hasRealTrack) {
          titleEl.textContent = 'Tap + to add a song';
          artistEl.textContent = 'No audio file loaded yet';
        }
        shell.classList.remove('is-playing');
      });
    }
  }

  /* Primes the <audio> element inside a user-gesture call stack so that a
     later, delayed play() (e.g. after the envelope-opening animation) is
     not blocked by browser autoplay policies. Safe to call even with no
     track loaded — failures are swallowed silently. */
  function unlock() {
    const attempt = audio.play();
    if (attempt && attempt.then) {
      attempt.then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {});
    }
  }

  function toggle() { audio.paused ? play() : audio.pause(); }

  /* events */
  audio.addEventListener('play',  () => { shell.classList.add('is-playing'); playBtn.setAttribute('aria-label', 'Pause'); started = true; });
  audio.addEventListener('pause', () => { shell.classList.remove('is-playing'); playBtn.setAttribute('aria-label', 'Play'); });
  audio.addEventListener('ended', () => load(current + 1, true));
  audio.addEventListener('loadedmetadata', () => { timeTotal.textContent = formatTime(audio.duration); hasRealTrack = true; });
  audio.addEventListener('timeupdate', () => {
    if (seeking || !isFinite(audio.duration)) return;
    seek.value = (audio.currentTime / audio.duration) * 100;
    paintRange(seek);
    timeNow.textContent = formatTime(audio.currentTime);
  });
  audio.addEventListener('error', () => {
    if (!audio.src || hasRealTrack) return; // don't stomp a track that already loaded fine once
    titleEl.textContent = 'Tap + to add a song';
    artistEl.textContent = 'No audio file loaded yet';
    shell.classList.remove('is-playing');
  });

  playBtn.addEventListener('click', toggle);
  $('#nextBtn').addEventListener('click', () => load(current + 1, !audio.paused || started));
  $('#prevBtn').addEventListener('click', () => {
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    load(current - 1, !audio.paused || started);
  });

  seek.addEventListener('input', () => { seeking = true; paintRange(seek); timeNow.textContent = formatTime(audio.duration * seek.value / 100); });
  seek.addEventListener('change', () => {
    if (isFinite(audio.duration)) audio.currentTime = audio.duration * seek.value / 100;
    seeking = false;
  });

  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value);
    audio.muted = audio.volume === 0;
    shell.classList.toggle('is-muted', audio.muted);
    paintRange(volume);
  });
  muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    shell.classList.toggle('is-muted', audio.muted);
    muteBtn.setAttribute('aria-label', audio.muted ? 'Unmute' : 'Mute');
  });

  artEl.addEventListener('error', () => artEl.classList.add('is-missing'));

  $('#playerToggle').addEventListener('click', () => {
    const hidden = shell.classList.toggle('is-hidden');
    $('#playerToggle').setAttribute('aria-label', hidden ? 'Show player' : 'Hide player');
  });

  /* let the person add their own song(s) — the bundled playlist points at
     music/ files that usually don't exist yet, so this is what actually
     makes the player work out of the box */
  const fileInput = $('#fileInput');
  $('#uploadBtn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files || []).filter(f => f.type.startsWith('audio/'));
    if (!files.length) return;

    const insertAt = PLAYLIST.length;
    files.forEach(file => {
      PLAYLIST.push({
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Added by you ❤️',
        src: URL.createObjectURL(file),
        art: PLAYLIST[0] ? PLAYLIST[0].art : 'images/album-cover.jpg'
      });
    });
    hasRealTrack = false; // let the new track's own loadedmetadata confirm it's real
    load(insertAt, true);
    fileInput.value = '';
  });

  /* keyboard: space toggles play unless typing in a control */
  document.addEventListener('keydown', e => {
    if (e.code !== 'Space') return;
    if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement.tagName)) return;
    e.preventDefault();
    toggle();
  });

  /* init */
  audio.volume = Number(volume.value);
  paintRange(volume);
  paintRange(seek);
  load(0);

  return {
    startIfIdle() { if (!started && audio.paused) play(); },
    unlock
  };
})();

/* ---------- 9. CURSOR SPARKLES + GLOW ---------- */

const glow = $('#cursorGlow');
let lastSparkle = 0;

if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
  document.addEventListener('mousemove', e => {
    glow.classList.add('is-on');
    glow.style.translate = `${e.clientX}px ${e.clientY}px`;
    glow.style.transform = 'translate(-50%, -50%)';

    const now = performance.now();
    if (now - lastSparkle > 70) {
      lastSparkle = now;
      spawnSparkle(e.clientX, e.clientY);
    }
  }, { passive: true });

  document.addEventListener('mouseleave', () => glow.classList.remove('is-on'));
}

/* ---------- 10. SCROLL REVEALS ---------- */

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: .2 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* ---------- 11. INIT ---------- */

openBtn.addEventListener('click', openEnvelope);
$('#seal').addEventListener('click', openEnvelope);

bindHeartClicks();
startAmbient();