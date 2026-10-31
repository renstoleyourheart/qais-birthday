const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// A small, low-key sky: the stars are generated so every visit feels a little alive.
const starsLayer = document.querySelector('.stars-layer');
if (starsLayer && !prefersReducedMotion) {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 72; i += 1) {
    const star = document.createElement('span');
    star.className = `star${i % 13 === 0 ? ' star--bright' : ''}`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.setProperty('--twinkle', `${2.5 + Math.random() * 5}s`);
    star.style.animationDelay = `${Math.random() * -5}s`;
    fragment.appendChild(star);
  }
  starsLayer.appendChild(fragment);
}

// Reveal sections as the visitor wanders through the experience.
const revealItems = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
revealItems.forEach((item) => revealObserver.observe(item));

// The first invitation leads directly to the letter.
document.getElementById('openSurprise')?.addEventListener('click', () => {
  document.getElementById('letter')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
});

// Envelope reveal.
const envelope = document.getElementById('envelope');
const birthdayLetter = document.getElementById('birthdayLetter');
function openEnvelope() {
  if (!envelope || !birthdayLetter) return;
  envelope.classList.add('is-open');
  birthdayLetter.classList.add('is-visible');
  envelope.setAttribute('aria-expanded', 'true');
  birthdayLetter.setAttribute('aria-hidden', 'false');
  window.setTimeout(() => birthdayLetter.querySelector('[contenteditable="true"]')?.focus(), 850);
}
envelope?.addEventListener('click', openEnvelope);

// Upload a local photo into any memory placeholder without needing a server.
document.querySelectorAll('.photo-input').forEach((input) => {
  input.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    const placeholder = input.closest('[data-photo-preview]');
    const art = placeholder?.querySelector('.photo-art');
    if (!file || !placeholder || !art) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      art.style.backgroundImage = `url("${reader.result}")`;
      placeholder.classList.add('has-image');
    });
    reader.readAsDataURL(file);
  });
});

// Appreciation cards can be opened with a click or with Enter/Space.
document.querySelectorAll('.appreciation-card').forEach((card) => {
  const toggleCard = (event) => {
    if (event.target.closest('[contenteditable="true"]')) return;
    const flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-expanded', String(flipped));
  };
  card.addEventListener('click', toggleCard);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleCard(event);
    }
  });
});

// Final surprise reveal.
const surpriseButton = document.getElementById('surpriseButton');
const surpriseNote = document.getElementById('surpriseNote');
surpriseButton?.addEventListener('click', () => {
  const isRevealed = surpriseNote.classList.toggle('is-revealed');
  surpriseNote.setAttribute('aria-hidden', String(!isRevealed));
  surpriseButton.querySelector('span:first-child').textContent = isRevealed ? 'Keep this one close' : 'There’s one more thing';
  if (isRevealed && !prefersReducedMotion) makeSparkleBurst(surpriseButton);
});

function makeSparkleBurst(origin) {
  const rect = origin.getBoundingClientRect();
  const symbols = ['✦', '·', '✧', '⋆'];
  for (let i = 0; i < 13; i += 1) {
    const sparkle = document.createElement('span');
    sparkle.className = 'cursor-spark';
    sparkle.textContent = symbols[i % symbols.length];
    sparkle.style.left = `${rect.left + rect.width / 2}px`;
    sparkle.style.top = `${rect.top + rect.height / 2}px`;
    sparkle.style.fontSize = `${.55 + Math.random() * .65}rem`;
    sparkle.animate([
      { opacity: .9, transform: 'translate(0, 0) scale(1)' },
      { opacity: 0, transform: `translate(${(Math.random() - .5) * 150}px, ${(Math.random() - .5) * 110}px) scale(.2)`, offset: 1 }
    ], { duration: 850 + Math.random() * 350, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    document.body.appendChild(sparkle);
    window.setTimeout(() => sparkle.remove(), 1300);
  }
}

// Tiny cursor constellation on pointer devices.
if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
  let lastSpark = 0;
  document.addEventListener('pointermove', (event) => {
    const now = performance.now();
    if (now - lastSpark < 85) return;
    lastSpark = now;
    const spark = document.createElement('span');
    spark.className = 'cursor-spark';
    spark.textContent = Math.random() > .72 ? '✦' : '·';
    spark.style.left = `${event.clientX + (Math.random() * 10 - 5)}px`;
    spark.style.top = `${event.clientY + (Math.random() * 10 - 5)}px`;
    document.body.appendChild(spark);
    window.setTimeout(() => spark.remove(), 800);
  }, { passive: true });
}

// Gentle Web Audio ambience. It only starts after an explicit tap/click.
const musicToggle = document.getElementById('musicToggle');
let audioContext;
let masterGain;
let musicTimer;
let musicStep = 0;
const notes = [220, 261.63, 329.63, 392, 329.63, 261.63];

function playNote(frequency, delay = 0) {
  if (!audioContext || !masterGain) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, audioContext.currentTime + delay);
  gain.gain.linearRampToValueAtTime(0.025, audioContext.currentTime + delay + .7);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + delay + 3.4);
  oscillator.connect(gain).connect(masterGain);
  oscillator.start(audioContext.currentTime + delay);
  oscillator.stop(audioContext.currentTime + delay + 3.5);
}

function startMusic() {
  audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  masterGain = masterGain || audioContext.createGain();
  masterGain.gain.value = .42;
  masterGain.connect(audioContext.destination);
  audioContext.resume();
  playNote(notes[musicStep % notes.length]);
  playNote(notes[(musicStep + 2) % notes.length] / 2, .2);
  musicStep += 1;
  musicTimer = window.setInterval(() => {
    playNote(notes[musicStep % notes.length]);
    if (musicStep % 3 === 0) playNote(notes[(musicStep + 2) % notes.length] / 2, .2);
    musicStep += 1;
  }, 2600);
  musicToggle.classList.add('is-playing');
  musicToggle.setAttribute('aria-pressed', 'true');
  musicToggle.setAttribute('aria-label', 'Mute ambient music');
  musicToggle.querySelector('.music-label').textContent = 'mute the music';
}

function stopMusic() {
  window.clearInterval(musicTimer);
  musicTimer = undefined;
  if (masterGain) masterGain.gain.setTargetAtTime(0, audioContext.currentTime, .2);
  musicToggle.classList.remove('is-playing');
  musicToggle.setAttribute('aria-pressed', 'false');
  musicToggle.setAttribute('aria-label', 'Play ambient music');
  musicToggle.querySelector('.music-label').textContent = 'play a little music';
}

musicToggle?.addEventListener('click', () => {
  if (musicToggle.classList.contains('is-playing')) stopMusic();
  else startMusic();
});
