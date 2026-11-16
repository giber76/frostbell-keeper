// Keyboard and mouse, read fresh every frame. The game polls this, it never
// listens for game events itself, so a headless self-test can drive the same
// code by writing into the same fields.

import { VIEW_W, VIEW_H } from './config.js';

export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_BELL = 'bell';
export const ACTION_MUTE = 'mute';
export const ACTION_UPGRADE = 'upgrade';
export const ACTION_RESTART = 'restart';

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const mouse = { x: 0, y: 0, down: false, clicked: false, rightClicked: false, rightDown: false };

  function toLocal(e) {
    // Map to logical 1280x720 coordinates, not the canvas's 2x backing
    // store: the renderer supersamples, the game never sees the extra pixels.
    const rect = canvas.getBoundingClientRect();
    const sx = VIEW_W / rect.width;
    const sy = VIEW_H / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }

  function keyName(e) {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    return k;
  }

  window.addEventListener('keydown', (e) => {
    const k = keyName(e);
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
    if (!keys.has(k)) pressed.add(k);
    keys.add(k);
  });
  window.addEventListener('keyup', (e) => { keys.delete(keyName(e)); });
  window.addEventListener('blur', () => { keys.clear(); pressed.clear(); mouse.down = false; mouse.rightDown = false; });
  canvas.addEventListener('mousemove', (e) => {
    const p = toLocal(e);
    mouse.x = p.x; mouse.y = p.y;
  });
  canvas.addEventListener('mousedown', (e) => {
    const p = toLocal(e);
    mouse.x = p.x; mouse.y = p.y;
    if (e.button === 0) { mouse.down = true; mouse.clicked = true; }
    // Right button held is the Lantern Sweep (v6): rightDown stays true
    // until the button comes up, so the Keeper can sweep the march.
    if (e.button === 2) { mouse.rightClicked = true; mouse.rightDown = true; }
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.rightDown = false;
  });
  canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); });

  return {
    keys, pressed, mouse,
    down(...names) { return names.some((n) => keys.has(n)); },
    wasPressed(...names) { return names.some((n) => pressed.has(n)); },
    // One-shot presses are consumed at the end of each frame.
    endFrame() { pressed.clear(); mouse.clicked = false; mouse.rightClicked = false; },
    action(name) {
      if (name === ACTION_CONFIRM) return this.wasPressed('enter');
      if (name === ACTION_PAUSE) return this.wasPressed('escape', 'p');
      if (name === ACTION_BELL) return this.wasPressed(' ');
      if (name === ACTION_MUTE) return this.wasPressed('m');
      if (name === ACTION_UPGRADE) return this.wasPressed('u');
      if (name === ACTION_RESTART) return this.wasPressed('r', 'enter');
      return false;
    },
  };
}
