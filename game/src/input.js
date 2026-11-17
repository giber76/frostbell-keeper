// Input: mouse position and buttons plus the keyboard, normalised to the
// game's logical 1280x720 coordinates. The canvas is supersampled (painted
// at 2x), so the mouse is mapped back to logical pixels here and nowhere
// else.
//
// The game talks to input through a small action API:
//   down(name)     — is the key held? (' ' means Space, 'q' means Q)
//   wasPressed(name) — was it pressed this frame? (same names)
//   action(name)   — 'confirm' (Enter/Space), 'pause' (Escape),
//                    'restart' (R), 'mute' (M)
//   mouse          — {x, y, down, clicked, rightClicked}
//   wheel          — -1, 0 or 1, consumed on read

import { VIEW_W, VIEW_H } from './config.js';

export const ACTION_CONFIRM = 'confirm';

// Translate the game's short key names to event.code values.
function codeFor(name) {
  if (name === ' ') return 'Space';
  if (name.length === 1) {
    const ch = name.toLowerCase();
    if (ch >= 'a' && ch <= 'z') return 'Key' + ch.toUpperCase();
    if (ch >= '0' && ch <= '9') return 'Digit' + ch;
  }
  return name;
}

function actionPressed(pressed, name) {
  if (name === 'confirm') return pressed.has('Enter') || pressed.has('Space');
  if (name === 'pause') return pressed.has('Escape');
  if (name === 'restart') return pressed.has('KeyR');
  if (name === 'mute') return pressed.has('KeyM');
  return false;
}

export function createInput(canvas) {
  const mouse = { x: VIEW_W / 2, y: 300, down: false, clicked: false, rightClicked: false };
  const keys = new Set();
  const pressed = new Set();
  let wheelDelta = 0;

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW_W,
      y: ((event.clientY - rect.top) / rect.height) * VIEW_H,
    };
  }

  canvas.addEventListener('mousemove', (event) => {
    const p = toLogical(event);
    mouse.x = p.x;
    mouse.y = p.y;
  });
  canvas.addEventListener('mousedown', (event) => {
    const p = toLogical(event);
    mouse.x = p.x;
    mouse.y = p.y;
    if (event.button === 0) {
      mouse.down = true;
      mouse.clicked = true;
    }
    if (event.button === 2) mouse.rightClicked = true;
    event.preventDefault();
  });
  canvas.addEventListener('mouseup', (event) => {
    if (event.button === 0) mouse.down = false;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  canvas.addEventListener('wheel', (event) => {
    wheelDelta += event.deltaY;
    event.preventDefault();
  }, { passive: false });

  window.addEventListener('keydown', (event) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
    }
    if (!event.repeat) pressed.add(event.code);
    keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => keys.clear());

  return {
    mouse,
    keys,
    // The wheel reads -1/0/1 and consumes the delta, so one notch turns
    // a mirror one step and a held wheel does not keep spinning it.
    get wheel() {
      const d = wheelDelta;
      wheelDelta = 0;
      return d > 0 ? 1 : d < 0 ? -1 : 0;
    },
    down(name) { return keys.has(codeFor(name)); },
    wasPressed(name) { return pressed.has(codeFor(name)); },
    action(name) { return actionPressed(pressed, name); },
    confirm() { return pressed.has('Enter') || pressed.has('Space'); },
    endFrame() {
      mouse.clicked = false;
      mouse.rightClicked = false;
      pressed.clear();
    },
  };
}

// A scripted stand-in for the real input, used by the self-test and the
// screenshot staging: the same game code reads it, so a staged scene is a
// real play, not a painting.
export function createScriptedInput() {
  const mouse = { x: VIEW_W / 2, y: 300, down: false, clicked: false, rightClicked: false };
  const keys = new Set();
  const pressed = new Set();
  let wheel = 0;
  return {
    mouse,
    keys,
    get wheel() { const d = wheel; wheel = 0; return d; },
    setWheel(v) { wheel = v; },
    press(name) { const c = codeFor(name); pressed.add(c); keys.add(c); },
    release(name) { keys.delete(codeFor(name)); },
    down(name) { return keys.has(codeFor(name)); },
    wasPressed(name) { return pressed.has(codeFor(name)); },
    action(name) { return actionPressed(pressed, name); },
    confirm() { return pressed.has('Enter') || pressed.has('Space'); },
    endFrame() {
      mouse.clicked = false;
      mouse.rightClicked = false;
      pressed.clear();
    },
  };
}
