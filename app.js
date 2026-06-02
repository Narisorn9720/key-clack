// Keyboard Layout Definition (60% ANSI Layout)
const KEYBOARD_LAYOUT = [
  // Row 1 (15u total width)
  [
    { code: 'Escape', label: 'esc', w: 1, mod: true },
    { code: 'Digit1', label: '1', sub: '!' },
    { code: 'Digit2', label: '2', sub: '@' },
    { code: 'Digit3', label: '3', sub: '#' },
    { code: 'Digit4', label: '4', sub: '$' },
    { code: 'Digit5', label: '5', sub: '%' },
    { code: 'Digit6', label: '6', sub: '^' },
    { code: 'Digit7', label: '7', sub: '&' },
    { code: 'Digit8', label: '8', sub: '*' },
    { code: 'Digit9', label: '9', sub: '(' },
    { code: 'Digit0', label: '0', sub: ')' },
    { code: 'Minus', label: '-', sub: '_' },
    { code: 'Equal', label: '=', sub: '+' },
    { code: 'Backspace', label: 'backspace', w: 2, mod: true }
  ],
  // Row 2 (15u total width)
  [
    { code: 'Tab', label: 'tab', w: 1.5, mod: true },
    { code: 'KeyQ', label: 'Q' },
    { code: 'KeyW', label: 'W' },
    { code: 'KeyE', label: 'E' },
    { code: 'KeyR', label: 'R' },
    { code: 'KeyT', label: 'T' },
    { code: 'KeyY', label: 'Y' },
    { code: 'KeyU', label: 'U' },
    { code: 'KeyI', label: 'I' },
    { code: 'KeyO', label: 'O' },
    { code: 'KeyP', label: 'P' },
    { code: 'BracketLeft', label: '[', sub: '{' },
    { code: 'BracketRight', label: ']', sub: '}' },
    { code: 'Backslash', label: '\\', sub: '|', w: 1.5, mod: true }
  ],
  // Row 3 (15u total width)
  [
    { code: 'CapsLock', label: 'caps lock', w: 1.75, mod: true },
    { code: 'KeyA', label: 'A' },
    { code: 'KeyS', label: 'S' },
    { code: 'KeyD', label: 'D' },
    { code: 'KeyF', label: 'F' },
    { code: 'KeyG', label: 'G' },
    { code: 'KeyH', label: 'H' },
    { code: 'KeyJ', label: 'J' },
    { code: 'KeyK', label: 'K' },
    { code: 'KeyL', label: 'L' },
    { code: 'Semicolon', label: ';', sub: ':' },
    { code: 'Quote', label: '\'', sub: '"' },
    { code: 'Enter', label: 'enter', w: 2.25, mod: true }
  ],
  // Row 4 (15u total width)
  [
    { code: 'ShiftLeft', label: 'shift', w: 2.25, mod: true },
    { code: 'KeyZ', label: 'Z' },
    { code: 'KeyX', label: 'X' },
    { code: 'KeyC', label: 'C' },
    { code: 'KeyV', label: 'V' },
    { code: 'KeyB', label: 'B' },
    { code: 'KeyN', label: 'N' },
    { code: 'KeyM', label: 'M' },
    { code: 'Comma', label: ',', sub: '<' },
    { code: 'Period', label: '.', sub: '>' },
    { code: 'Slash', label: '/', sub: '?' },
    { code: 'ShiftRight', label: 'shift', w: 2.75, mod: true }
  ],
  // Row 5 (15u total width)
  [
    { code: 'ControlLeft', label: 'ctrl', w: 1.25, mod: true },
    { code: 'MetaLeft', label: 'win', w: 1.25, mod: true },
    { code: 'AltLeft', label: 'alt', w: 1.25, mod: true },
    { code: 'Space', label: '', w: 6.25 },
    { code: 'AltRight', label: 'alt', w: 1.25, mod: true },
    { code: 'MetaRight', label: 'win', w: 1.25, mod: true },
    { code: 'ContextMenu', label: 'menu', w: 1.25, mod: true },
    { code: 'ControlRight', label: 'ctrl', w: 1.25, mod: true }
  ]
];

// App State
let audioCtx = null;
let currentSwitch = 'blue'; // 'blue', 'red', 'brown'
let currentCase = 'plastic'; // 'plastic', 'aluminum', 'wood'

// Audio Settings
const settings = {
  pitch: 1.0,
  decay: 1.0,
  volume: 0.8
};

// Keyboard tracking for preventing keyup double triggers
const activeKeys = new Set();

// Noise Buffer Cache (to avoid recreating on every click)
let cachedNoiseBuffer = null;

// Initialize Audio Context on user interaction
function initAudio() {
  if (audioCtx) return;
  
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContextClass();
  
  // Create noise buffer
  const bufferSize = audioCtx.sampleRate * 0.15; // ~150ms buffer
  cachedNoiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = cachedNoiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
}

// Generate the noise buffer source node
function createNoiseNode() {
  if (!audioCtx) initAudio();
  const source = audioCtx.createBufferSource();
  source.buffer = cachedNoiseBuffer;
  return source;
}

// Map key codes to structural settings for sound sizing
function getKeyType(code) {
  if (code === 'Space') return 'space';
  if (['Enter', 'Backspace', 'ShiftLeft', 'ShiftRight', 'Tab', 'CapsLock'].includes(code)) return 'modifier';
  return 'standard';
}

// Synthesis engine function for switch sound triggers
function synthesizeSound(switchType, keyType, isRelease = false) {
  if (!audioCtx) initAudio();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;
  
  // Create local master volume node for this sound event
  const eventGain = audioCtx.createGain();
  
  // Sound customizations variables
  let masterVol = settings.volume;
  let pitchMult = settings.pitch;
  let decayMult = settings.decay;

  // Type specific tuning
  if (keyType === 'space') {
    pitchMult *= 0.62;   // Deepest sound
    decayMult *= 1.7;    // Spacebar echoes longer
    masterVol *= 1.25;   // Spacebar is slightly louder
  } else if (keyType === 'modifier') {
    pitchMult *= 0.85;   // Moderately deep
    decayMult *= 1.2;
    masterVol *= 1.1;
  } else {
    // Standard keys have a tiny bit of random pitch variation (mechanical realism)
    pitchMult *= (0.96 + Math.random() * 0.08);
  }

  // Adjust volume if it is a key release (release is generally quieter)
  if (isRelease) {
    masterVol *= 0.45;
    decayMult *= 0.7;
  }

  eventGain.gain.setValueAtTime(masterVol * 0.4, now); // scale down peak slightly to prevent digital clipping

  // Apply Case Acoustics Sub-filters and Feedback Delay
  let chainInput = eventGain;
  let chainOutput = audioCtx.destination;

  // 1. COMB FILTER (Resonant keyboard housing cabinet simulator)
  let delayTime = 0.005; // default plastic
  let delayFeedback = 0.15;
  
  if (currentCase === 'aluminum') {
    delayTime = 0.003;
    delayFeedback = 0.45; // High feedback = metallic ringing ping
  } else if (currentCase === 'wood') {
    delayTime = 0.008;
    delayFeedback = 0.08; // Damped, deep hollow cabinet
  }

  const combDelay = audioCtx.createDelay();
  const combFeedback = audioCtx.createGain();
  combDelay.delayTime.setValueAtTime(delayTime, now);
  combFeedback.gain.setValueAtTime(delayFeedback, now);

  // Wire comb filter loop
  chainInput.connect(combDelay);
  combDelay.connect(combFeedback);
  combFeedback.connect(combDelay); // feedback loop
  
  // Dry / Wet Mix
  const dryGain = audioCtx.createGain();
  const wetGain = audioCtx.createGain();
  dryGain.gain.setValueAtTime(0.85, now);
  wetGain.gain.setValueAtTime(0.4, now);

  chainInput.connect(dryGain);
  combDelay.connect(wetGain);

  const mixedNode = audioCtx.createGain();
  dryGain.connect(mixedNode);
  wetGain.connect(mixedNode);

  // 2. CABINET ACOUSTICS BIQUAD FILTER
  const caseFilter = audioCtx.createBiquadFilter();
  if (currentCase === 'aluminum') {
    // Bright metallic ping + clean bass cut
    caseFilter.type = 'peaking';
    caseFilter.frequency.setValueAtTime(2300, now);
    caseFilter.Q.setValueAtTime(8, now);
    caseFilter.gain.setValueAtTime(7, now);
  } else if (currentCase === 'wood') {
    // Warm low mid-boost + high dampening
    caseFilter.type = 'lowpass';
    caseFilter.frequency.setValueAtTime(1000 * pitchMult, now);
    caseFilter.Q.setValueAtTime(1.5, now);
  } else {
    // Standard plastic
    caseFilter.type = 'lowpass';
    caseFilter.frequency.setValueAtTime(1800 * pitchMult, now);
    caseFilter.Q.setValueAtTime(0.7, now);
  }
  
  mixedNode.connect(caseFilter);
  caseFilter.connect(chainOutput);

  // ---- PROCEDURAL SYNTH GENERATION LAYERS ----

  if (switchType === 'blue') {
    // Blue Switch: Double-tactile click + clack
    if (!isRelease) {
      // 1. TACTILE TICK (Noise burst)
      const tickNoise = createNoiseNode();
      const tickFilter = audioCtx.createBiquadFilter();
      tickFilter.type = 'bandpass';
      tickFilter.frequency.setValueAtTime(5500 * pitchMult, now);
      tickFilter.Q.setValueAtTime(12, now);

      const tickGain = audioCtx.createGain();
      tickGain.gain.setValueAtTime(0.9, now);
      tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.008); // Ultra sharp click

      tickNoise.connect(tickFilter);
      tickFilter.connect(tickGain);
      tickGain.connect(chainInput);
      tickNoise.start(now);
      tickNoise.stop(now + 0.015);

      // 2. BOTTOM-OUT CLACK (Thump)
      const clackOsc = audioCtx.createOscillator();
      clackOsc.type = 'triangle';
      clackOsc.frequency.setValueAtTime(450 * pitchMult, now);
      clackOsc.frequency.exponentialRampToValueAtTime(130 * pitchMult, now + 0.012);

      const clackFilter = audioCtx.createBiquadFilter();
      clackFilter.type = 'lowpass';
      clackFilter.frequency.setValueAtTime(900 * pitchMult, now);
      clackFilter.Q.setValueAtTime(1.2, now);

      const clackGain = audioCtx.createGain();
      clackGain.gain.setValueAtTime(0.7, now);
      clackGain.gain.exponentialRampToValueAtTime(0.001, now + (0.035 * decayMult));

      clackOsc.connect(clackFilter);
      clackFilter.connect(clackGain);
      clackGain.connect(chainInput);
      clackOsc.start(now);
      clackOsc.stop(now + (0.05 * decayMult));
    } else {
      // Release click: softer, slightly higher tick
      const clickNoise = createNoiseNode();
      const clickFilter = audioCtx.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(6000 * pitchMult, now);
      clickFilter.Q.setValueAtTime(8, now);

      const clickGain = audioCtx.createGain();
      clickGain.gain.setValueAtTime(0.4, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.006);

      clickNoise.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(chainInput);
      clickNoise.start(now);
      clickNoise.stop(now + 0.012);
    }

  } else if (switchType === 'red') {
    // Red Switch: Linear smooth deep clack/thock
    const clackOsc = audioCtx.createOscillator();
    clackOsc.type = 'triangle';
    
    let baseFreq = isRelease ? 200 : 250;
    clackOsc.frequency.setValueAtTime(baseFreq * pitchMult, now);
    clackOsc.frequency.exponentialRampToValueAtTime(80 * pitchMult, now + 0.015);

    const clackFilter = audioCtx.createBiquadFilter();
    clackFilter.type = 'lowpass';
    clackFilter.frequency.setValueAtTime((isRelease ? 320 : 420) * pitchMult, now);
    clackFilter.Q.setValueAtTime(1.5, now);

    // Friction sound component
    const frictionNoise = createNoiseNode();
    const frictionFilter = audioCtx.createBiquadFilter();
    frictionFilter.type = 'bandpass';
    frictionFilter.frequency.setValueAtTime(450 * pitchMult, now);
    frictionFilter.Q.setValueAtTime(1.0, now);

    const frictionGain = audioCtx.createGain();
    frictionGain.gain.setValueAtTime(isRelease ? 0.15 : 0.25, now);
    frictionGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    frictionNoise.connect(frictionFilter);
    frictionFilter.connect(frictionGain);
    frictionGain.connect(chainInput);
    frictionNoise.start(now);
    frictionNoise.stop(now + 0.03);

    const clackGain = audioCtx.createGain();
    const peakVol = isRelease ? 0.5 : 0.95;
    const decayDuration = (isRelease ? 0.038 : 0.052) * decayMult;

    clackGain.gain.setValueAtTime(peakVol, now);
    clackGain.gain.exponentialRampToValueAtTime(0.001, now + decayDuration);

    clackOsc.connect(clackFilter);
    clackFilter.connect(clackGain);
    clackGain.connect(chainInput);
    
    clackOsc.start(now);
    clackOsc.stop(now + decayDuration + 0.01);

  } else if (switchType === 'brown') {
    // Brown Switch: Mild tactile bump (mid-range sweep) followed by a soft clack
    const clackOsc = audioCtx.createOscillator();
    clackOsc.type = 'triangle';
    
    let baseFreq = isRelease ? 220 : 310;
    clackOsc.frequency.setValueAtTime(baseFreq * pitchMult, now);
    clackOsc.frequency.exponentialRampToValueAtTime(90 * pitchMult, now + 0.018);

    const clackFilter = audioCtx.createBiquadFilter();
    clackFilter.type = 'lowpass';
    clackFilter.frequency.setValueAtTime((isRelease ? 400 : 580) * pitchMult, now);
    clackFilter.Q.setValueAtTime(2.2, now);

    // Mild tactile friction tick
    if (!isRelease) {
      const bumpOsc = audioCtx.createOscillator();
      bumpOsc.type = 'sine';
      bumpOsc.frequency.setValueAtTime(1200 * pitchMult, now);
      
      const bumpGain = audioCtx.createGain();
      bumpGain.gain.setValueAtTime(0.35, now);
      bumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

      bumpOsc.connect(bumpGain);
      bumpGain.connect(chainInput);
      bumpOsc.start(now);
      bumpOsc.stop(now + 0.02);
    }

    const clackGain = audioCtx.createGain();
    const peakVol = isRelease ? 0.45 : 0.85;
    const decayDuration = (isRelease ? 0.034 : 0.046) * decayMult;

    clackGain.gain.setValueAtTime(peakVol, now);
    clackGain.gain.exponentialRampToValueAtTime(0.001, now + decayDuration);

    clackOsc.connect(clackFilter);
    clackFilter.connect(clackGain);
    clackGain.connect(chainInput);
    
    clackOsc.start(now);
    clackOsc.stop(now + decayDuration + 0.01);
  }
}

// Generate the 60% mechanical layout in HTML
function renderKeyboard() {
  const keyboardContainer = document.getElementById('keyboard-container');
  keyboardContainer.innerHTML = ''; // reset container

  const plate = document.createElement('div');
  plate.className = 'keyboard-plate';
  plate.id = 'keyboard-plate';

  KEYBOARD_LAYOUT.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'keyboard-row';

    row.forEach(key => {
      const keyDiv = document.createElement('div');
      keyDiv.className = 'key';
      if (key.mod) keyDiv.classList.add('modifier');
      
      keyDiv.setAttribute('data-code', key.code);
      keyDiv.setAttribute('data-w', key.w || 1);

      // Width calculation
      keyDiv.style.setProperty('--u', key.w || 1);

      // Legend
      const legend = document.createElement('span');
      legend.className = 'key-legend';
      legend.textContent = key.label;
      keyDiv.appendChild(legend);

      // Sub-legend for Shift symbols
      if (key.sub) {
        const sub = document.createElement('span');
        sub.className = 'key-sub';
        sub.textContent = key.sub;
        keyDiv.appendChild(sub);
      }

      // Add click & touch triggers for virtual keypresses
      keyDiv.addEventListener('mousedown', (e) => {
        e.preventDefault();
        triggerKey(key.code);
      });
      keyDiv.addEventListener('mouseup', () => {
        releaseKey(key.code);
      });
      keyDiv.addEventListener('mouseleave', () => {
        if (activeKeys.has(key.code)) {
          releaseKey(key.code);
        }
      });

      rowDiv.appendChild(keyDiv);
    });

    plate.appendChild(rowDiv);
  });

  keyboardContainer.appendChild(plate);
}

// Event handler for triggering key presses
function triggerKey(code) {
  // Prevent system keyboard auto-repeat triggers
  if (activeKeys.has(code)) return;
  activeKeys.add(code);

  const keyElement = document.querySelector(`.key[data-code="${code}"]`);
  if (keyElement) {
    keyElement.classList.add('active');
  }

  // Synthesize Press Clack Sound
  const type = getKeyType(code);
  synthesizeSound(currentSwitch, type, false);
}

// Event handler for releasing keys
function releaseKey(code) {
  if (!activeKeys.has(code)) return;
  activeKeys.delete(code);

  const keyElement = document.querySelector(`.key[data-code="${code}"]`);
  if (keyElement) {
    keyElement.classList.remove('active');
  }

  // Synthesize Release Clack Sound (mechanical returns)
  const type = getKeyType(code);
  synthesizeSound(currentSwitch, type, true);
}

// Sync switch buttons states and body classes
function selectSwitch(switchType) {
  currentSwitch = switchType;

  // Update Body Theme CSS classes
  document.body.className = ''; // wipe previous classes
  document.body.classList.add(`switch-${switchType}`);

  // Update button active state in UI
  document.querySelectorAll('.switch-btn').forEach(btn => {
    if (btn.getAttribute('data-switch') === switchType) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Apply default customizer settings depending on Switch choice
  // (Blue is higher pitch, Red is deeper pitch, Brown is medium pitch)
  const pitchSlider = document.getElementById('pitch');
  const decaySlider = document.getElementById('decay');

  if (switchType === 'blue') {
    settings.pitch = 1.05;
    settings.decay = 0.9;
  } else if (switchType === 'red') {
    settings.pitch = 0.85;
    settings.decay = 1.15;
  } else if (switchType === 'brown') {
    settings.pitch = 0.95;
    settings.decay = 1.0;
  }

  // Update slider UI
  pitchSlider.value = settings.pitch;
  decaySlider.value = settings.decay;
  document.getElementById('pitch-val').textContent = settings.pitch.toFixed(2) + 'x';
  document.getElementById('decay-val').textContent = settings.decay.toFixed(2) + 'x';
  
  // Make a sample click sound on change to demonstrate switch profile
  synthesizeSound(currentSwitch, 'standard', false);
}

// Sync keyboard case material buttons states
function selectCase(caseType) {
  currentCase = caseType;
  
  // Update UI active button
  document.querySelectorAll('.case-btn').forEach(btn => {
    if (btn.getAttribute('data-case') === caseType) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Make a sample click sound on change to demonstrate switch acoustics inside the new case
  synthesizeSound(currentSwitch, 'standard', false);
}

// Bind sliders, buttons, and physical typing event listeners
function bindEvents() {
  // Physical Keyboard Hooks
  window.addEventListener('keydown', (e) => {
    // If user is focused inside standard inputs (e.g. typing test box if any), don't block defaults
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    // Prevent default scroll behaviors for Space/Arrow keys to keep viewport static
    if (['Space', 'Tab', 'AltLeft', 'AltRight'].includes(e.code)) {
      e.preventDefault();
    }
    
    triggerKey(e.code);
  });

  window.addEventListener('keyup', (e) => {
    releaseKey(e.code);
  });

  // Switch Selection Buttons
  document.querySelectorAll('.switch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectSwitch(btn.getAttribute('data-switch'));
    });
  });

  // Case Selection Buttons
  document.querySelectorAll('.case-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectCase(btn.getAttribute('data-case'));
    });
  });

  // Range Slider Customizations Hooks
  const pitchSlider = document.getElementById('pitch');
  pitchSlider.addEventListener('input', (e) => {
    settings.pitch = parseFloat(e.target.value);
    document.getElementById('pitch-val').textContent = settings.pitch.toFixed(2) + 'x';
  });

  const decaySlider = document.getElementById('decay');
  decaySlider.addEventListener('input', (e) => {
    settings.decay = parseFloat(e.target.value);
    document.getElementById('decay-val').textContent = settings.decay.toFixed(2) + 'x';
  });

  const volumeSlider = document.getElementById('volume');
  volumeSlider.addEventListener('input', (e) => {
    settings.volume = parseFloat(e.target.value);
    document.getElementById('volume-val').textContent = Math.round(settings.volume * 100) + '%';
  });

  // Tap keyboard space or panel to initialize audio in restricted browser settings
  document.addEventListener('click', () => {
    if (!audioCtx) initAudio();
  }, { once: true });
}

// Bootstrapper
document.addEventListener('DOMContentLoaded', () => {
  renderKeyboard();
  bindEvents();
  
  // Set default initial theme setup (Blue switch)
  selectSwitch('blue');
  selectCase('plastic');
});
