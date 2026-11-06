import { test } from 'node:test';
import assert from 'node:assert/strict';
import { create } from '../content/artworks/flow-field/v1/sketch.js';
class CanvasDouble {
  static last;
  constructor(sketch) {
    CanvasDouble.last = this;
    this.width = 600;
    this.height = 400;
    this.frameCount = 1;
    this.lines = 0;
    this.seeds = [];
    this.strokes = [];
    sketch(this);
    this.setup();
  }
  createCanvas(w, h) {
    this.width = w;
    this.height = h;
    return { elt: { testCanvas: true } };
  }
  pixelDensity() {}
  colorMode() {}
  background() {}
  noiseSeed() {}
  noStroke() {}
  fill() {}
  rect() {}
  stroke(...values) {
    this.strokes.push(values);
  }
  strokeWeight() {}
  randomSeed(seed) {
    this.seeds.push(seed);
  }
  random(max, min) {
    return min === undefined ? max / 2 : (max + min) / 2;
  }
  noise() {
    return 0.5;
  }
  line(...points) {
    this.lines++;
    this.lastLine = points;
  }
  resizeCanvas(w, h) {
    this.width = w;
    this.height = h;
  }
  noLoop() {
    this.stopped = true;
  }
  loop() {
    this.stopped = false;
  }
  remove() {
    this.removed = true;
  }
}
test('p5 adapter forwards pause, resume, resize, seed and cleanup', () => {
  globalThis.devicePixelRatio = 1;
  const values = { speed: 1, hue: 96, density: 25, seed: 42 };
  const engine = create({
    container: { clientWidth: 600, clientHeight: 400 },
    library: CanvasDouble,
    parameters: values,
    seed: 42,
    quality: 'low',
  });
  const p = CanvasDouble.last;
  p.draw();
  assert.equal(p.lines, 350);
  assert.equal(engine.canvas.testCanvas, true);
  engine.pause();
  assert.equal(p.stopped, true);
  engine.resume();
  assert.equal(p.stopped, false);
  engine.setParameters({ ...values, seed: 117 });
  assert.equal(p.seeds.at(-1), 117);
  engine.resize(300, 200);
  assert.equal(p.width, 300);
  assert.equal(p.height, 200);
  engine.setPalette(['#ff0000', '#00ff00', '#0000ff']);
  p.draw();
  for (const color of ['rgba(255,0,0,0.5)', 'rgba(0,255,0,0.5)', 'rgba(0,0,255,0.5)'])
    assert.ok(p.strokes.some((stroke) => stroke[0] === color));
  engine.dispose();
  assert.equal(p.removed, true);
});
test('audio influences flow speed without replacing base parameters and silence restores it', () => {
  globalThis.devicePixelRatio = 1;
  const parameters = { speed: 1, hue: 96, density: 25, seed: 42 };
  const engine = create({
    container: { clientWidth: 600, clientHeight: 400 },
    library: CanvasDouble,
    parameters,
    seed: 42,
    quality: 'low',
  });
  const p = CanvasDouble.last;
  engine.setAudio({ bass: 1, mid: 0, treble: 0 });
  p.draw();
  assert.ok(Math.abs(p.lastLine[2] - p.lastLine[0] - 2.2) < 0.00001);
  assert.equal(parameters.speed, 1);
  engine.setAudio({ bass: 0, mid: 0, treble: 0 });
  p.draw();
  assert.ok(Math.abs(p.lastLine[2] - p.lastLine[0] - 1) < 0.00001);
  engine.dispose();
});

test('tilt eases in and releases gradually without replacing base parameters', () => {
  globalThis.devicePixelRatio = 1;
  const parameters = { speed: 1, hue: 96, density: 25, seed: 42 };
  const engine = create({
    container: { clientWidth: 600, clientHeight: 400 },
    library: CanvasDouble,
    parameters,
    seed: 42,
    quality: 'low',
  });
  const p = CanvasDouble.last;
  engine.setInteraction({
    enabled: true,
    pointer: { x: 0, y: 0, strength: 0 },
    tilt: { x: 0, y: 1 },
  });
  p.draw();
  const first = p.lastLine[3] - p.lastLine[1];
  assert.ok(first > 0 && first < 0.02);
  for (let i = 0; i < 60; i++) p.draw();
  const later = p.lastLine[3] - p.lastLine[1];
  assert.ok(later > first && later < 0.65);
  engine.setInteraction({
    enabled: false,
    pointer: { x: 0, y: 0, strength: 0 },
    tilt: { x: 0, y: 0 },
  });
  p.draw();
  const release = p.lastLine[3] - p.lastLine[1];
  assert.ok(release > 0 && release < later);
  for (let i = 0; i < 600; i++) p.draw();
  assert.ok(Math.abs(p.lastLine[3] - p.lastLine[1]) < 0.001);
  assert.equal(parameters.seed, 42);
  engine.dispose();
});
