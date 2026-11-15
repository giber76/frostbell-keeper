// The village animals: a cat dozing by the hearth, a dog trotting the
// square, a cow standing by the granary, and three chickens pecking near
// the cottages. They are village life, not combat units — they never move
// a road, block a plot, fight, or change the balance. Every one of them
// moves on its own clock (a pure function of time, like the sleigh), so a
// seeded night replays exactly and no Math.random ever touches the game.

export function createAnimals() {
  return {
    // The cat sits east of the hearth, inside its glow, clear of the
    // buttons on the title screen and clear of every plot and road.
    cat: { x: 815, y: 425, phase: 0.5 },
    // The dog trots a small circle in the open south of the hearth —
    // clear of the south road (its edge is x 662) and of every plot.
    dog: { t: 0, cx: 700, cy: 600, r: 25, period: 10 },
    // The cow stands by the granary's door, west of it, clear of plots.
    cow: { x: 735, y: 135, phase: 2.0 },
    // Three chickens pecking by the south-west cottage, clear of plots.
    chickens: [
      { x: 205, y: 455, phase: 0.0 },
      { x: 235, y: 472, phase: 2.1 },
      { x: 270, y: 460, phase: 4.2 },
    ],
  };
}

// Where the dog is on its circle, and which way it faces (the tangent).
export function dogPosition(a) {
  const ang = -Math.PI / 2 + (a.dog.t / a.dog.period) * Math.PI * 2;
  return {
    x: a.dog.cx + Math.cos(ang) * a.dog.r,
    y: a.dog.cy + Math.sin(ang) * a.dog.r,
    angle: ang + Math.PI / 2,
  };
}

export function updateAnimals(g, dt) {
  g.animals.dog.t += dt;
}

function shadow(ctx, x, y, rx) {
  ctx.fillStyle = 'rgba(8,12,28,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, rx * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
}

// The cat: an orange tabby sitting curled by the hearth, tail wrapped
// around its paws, blinking slowly on the clock.
export function drawCat(ctx, cat, now) {
  const blink = Math.sin(now * 0.7 + cat.phase) > 0.96;
  shadow(ctx, cat.x, cat.y + 10, 13);
  // Curled body.
  ctx.fillStyle = '#d8a05a';
  ctx.beginPath();
  ctx.ellipse(cat.x, cat.y + 2, 13, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tabby stripes on the back.
  ctx.strokeStyle = '#a8763a';
  ctx.lineWidth = 1.5;
  for (const dx of [-7, -2, 3]) {
    ctx.beginPath();
    ctx.moveTo(cat.x + dx, cat.y - 6);
    ctx.lineTo(cat.x + dx, cat.y + 2);
    ctx.stroke();
  }
  // Tail curled around the paws.
  ctx.strokeStyle = '#d8a05a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cat.x + 2, cat.y + 8, 9, 0.3, Math.PI * 1.2);
  ctx.stroke();
  // Head with ears.
  ctx.fillStyle = '#d8a05a';
  ctx.beginPath();
  ctx.arc(cat.x, cat.y - 10, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cat.x - 7, cat.y - 14);
  ctx.lineTo(cat.x - 9, cat.y - 22);
  ctx.lineTo(cat.x - 2, cat.y - 16);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cat.x + 7, cat.y - 14);
  ctx.lineTo(cat.x + 9, cat.y - 22);
  ctx.lineTo(cat.x + 2, cat.y - 16);
  ctx.closePath();
  ctx.fill();
  // Eyes: two green sparks, or a blink.
  if (blink) {
    ctx.strokeStyle = '#0d1526';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cat.x - 5, cat.y - 11);
    ctx.lineTo(cat.x - 1, cat.y - 11);
    ctx.moveTo(cat.x + 1, cat.y - 11);
    ctx.lineTo(cat.x + 5, cat.y - 11);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#7dffb2';
    ctx.beginPath();
    ctx.arc(cat.x - 3, cat.y - 11, 1.6, 0, Math.PI * 2);
    ctx.arc(cat.x + 3, cat.y - 11, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // Pink nose.
  ctx.fillStyle = '#e8a0a0';
  ctx.beginPath();
  ctx.moveTo(cat.x - 2, cat.y - 7);
  ctx.lineTo(cat.x + 2, cat.y - 7);
  ctx.lineTo(cat.x, cat.y - 5);
  ctx.closePath();
  ctx.fill();
}

// The dog: a chestnut terrier trotting its circle, legs swinging on its
// own clock, tail wagging, ears flopping.
export function drawDog(ctx, a, now) {
  const p = dogPosition(a);
  const wag = Math.sin(now * 6) * 4;
  shadow(ctx, p.x, p.y + 9, 11);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  // Body.
  ctx.fillStyle = '#8a6242';
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head with a floppy ear.
  ctx.fillStyle = '#96683f';
  ctx.beginPath();
  ctx.arc(12, -2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5d4128';
  ctx.beginPath();
  ctx.ellipse(9, -6, 3.5, 5, 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Snout and nose.
  ctx.fillStyle = '#96683f';
  ctx.beginPath();
  ctx.ellipse(17, 0, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0d1526';
  ctx.beginPath();
  ctx.arc(20, 0, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Tail, wagging on the clock.
  ctx.strokeStyle = '#8a6242';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-11, -2);
  ctx.quadraticCurveTo(-17, -8 + wag, -15, -12 + wag);
  ctx.stroke();
  // Four legs, trotting on the clock.
  ctx.strokeStyle = '#5d4128';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    const lx = -7 + i * 5;
    const swing = Math.sin(a.dog.t * 10 + i * Math.PI) * 3;
    ctx.beginPath();
    ctx.moveTo(lx, 4);
    ctx.lineTo(lx + swing, 10);
    ctx.stroke();
  }
  ctx.restore();
}

// The cow: a big white cow with brown patches, standing by the granary,
// tail swishing slowly, ears flicking on the clock.
export function drawCow(ctx, cow, now) {
  const swish = Math.sin(now * 1.1 + cow.phase) * 5;
  shadow(ctx, cow.x, cow.y + 12, 20);
  // Body with a brown patch.
  ctx.fillStyle = '#f0ead8';
  ctx.beginPath();
  ctx.ellipse(cow.x, cow.y, 20, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a6242';
  ctx.beginPath();
  ctx.ellipse(cow.x - 6, cow.y - 3, 9, 6, 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Legs.
  ctx.strokeStyle = '#d8d0b8';
  ctx.lineWidth = 3;
  for (const dx of [-13, -5, 6, 13]) {
    ctx.beginPath();
    ctx.moveTo(cow.x + dx, cow.y + 8);
    ctx.lineTo(cow.x + dx, cow.y + 13);
    ctx.stroke();
  }
  // Head, lowered a little, with horns and a pink muzzle.
  ctx.fillStyle = '#f0ead8';
  ctx.beginPath();
  ctx.ellipse(cow.x + 20, cow.y + 2, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8b0b0';
  ctx.beginPath();
  ctx.ellipse(cow.x + 26, cow.y + 5, 4.5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Horns.
  ctx.strokeStyle = '#e8dcc0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cow.x + 16, cow.y - 4);
  ctx.lineTo(cow.x + 14, cow.y - 10);
  ctx.moveTo(cow.x + 24, cow.y - 4);
  ctx.lineTo(cow.x + 26, cow.y - 10);
  ctx.stroke();
  // Ears, flicking on the clock.
  const flick = Math.sin(now * 0.9 + cow.phase) > 0.9 ? -2 : 0;
  ctx.fillStyle = '#d8c49a';
  ctx.beginPath();
  ctx.ellipse(cow.x + 13, cow.y - 2 + flick, 4, 2.5, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Eye.
  ctx.fillStyle = '#0d1526';
  ctx.beginPath();
  ctx.arc(cow.x + 21, cow.y - 1, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // Tail, swishing on the clock.
  ctx.strokeStyle = '#f0ead8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cow.x - 19, cow.y - 2);
  ctx.quadraticCurveTo(cow.x - 26, cow.y + 4, cow.x - 24 + swish, cow.y + 12);
  ctx.stroke();
  ctx.fillStyle = '#8a6242';
  ctx.beginPath();
  ctx.arc(cow.x - 24 + swish, cow.y + 12, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

// One chicken: a white hen pecking the snow, head bobbing on the clock.
export function drawChicken(ctx, c, now) {
  const peck = Math.max(0, Math.sin(now * 3 + c.phase));
  const headDip = peck * 5;
  shadow(ctx, c.x, c.y + 6, 7);
  // Round body.
  ctx.fillStyle = '#f5f0e0';
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, 8, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wing.
  ctx.fillStyle = '#ddd5c0';
  ctx.beginPath();
  ctx.ellipse(c.x - 1, c.y, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head, dipping to peck.
  ctx.fillStyle = '#f5f0e0';
  ctx.beginPath();
  ctx.arc(c.x + 5, c.y - 6 + headDip, 4, 0, Math.PI * 2);
  ctx.fill();
  // Comb.
  ctx.fillStyle = '#d83840';
  ctx.beginPath();
  ctx.arc(c.x + 4, c.y - 10 + headDip, 2, 0, Math.PI * 2);
  ctx.arc(c.x + 7, c.y - 10 + headDip, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // Beak.
  ctx.fillStyle = '#e8a020';
  ctx.beginPath();
  ctx.moveTo(c.x + 8, c.y - 7 + headDip);
  ctx.lineTo(c.x + 12, c.y - 5 + headDip);
  ctx.lineTo(c.x + 8, c.y - 4 + headDip);
  ctx.closePath();
  ctx.fill();
  // Eye.
  ctx.fillStyle = '#0d1526';
  ctx.beginPath();
  ctx.arc(c.x + 6, c.y - 7 + headDip, 1.2, 0, Math.PI * 2);
  ctx.fill();
  // Thin legs.
  ctx.strokeStyle = '#e8a020';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(c.x - 3, c.y + 5);
  ctx.lineTo(c.x - 3, c.y + 8);
  ctx.moveTo(c.x + 3, c.y + 5);
  ctx.lineTo(c.x + 3, c.y + 8);
  ctx.stroke();
}

// The animals, drawn after the villagers and before the Keeper — they
// are part of the village, and the title shot shows them alive.
export function drawAnimals(ctx, g) {
  const a = g.animals;
  if (!a) return;
  drawCow(ctx, a.cow, g.now);
  for (const c of a.chickens) drawChicken(ctx, c, g.now);
  drawCat(ctx, a.cat, g.now);
  drawDog(ctx, a, g.now);
}
