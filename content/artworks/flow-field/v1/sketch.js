export function ease(current, target, dt, tau = 1.3) {
  return current + (target - current) * (1 - Math.exp(-Math.min(Math.max(dt, 0), 0.05) / tau));
}
export function create({ container, library: P5, parameters, seed, quality, transparent = false }) {
  let interaction = { enabled: true, pointer: { x: 0, y: 0, strength: 0 }, tilt: { x: 0, y: 0 } },
    motion = { x: 0, y: 0, strength: 0, tx: 0, ty: 0 },
    localPointer = null,
    listeners = [];
  const reduced = () =>
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let audio = { bass: 0, mid: 0, treble: 0 },
    theme = 'dark',
    ready = false,
    palette = [],
    values = parameters,
    particles = [],
    canvas,
    paused = false,
    sketchReset = () => {};
  const sketch = new P5((p) => {
    const reset = () => {
      p.randomSeed(values.seed ?? seed);
      p.noiseSeed(values.seed ?? seed);
      particles = Array.from({ length: quality === 'low' ? 350 : 700 }, () => ({
        x: p.random(p.width),
        y: p.random(p.height),
        age: p.random(200),
      }));
      if (transparent) p.clear();
      else p.background(theme === 'white' ? '#f3f0e6' : '#101112');
    };
    p.setup = () => {
      const c = p.createCanvas(container.clientWidth, container.clientHeight);
      canvas = c.elt;
      p.pixelDensity(Math.min(devicePixelRatio, 2));
      p.colorMode(p.HSB, 360, 100, 100, 100);
      ready = true;
      reset();
      if (canvas.addEventListener) {
        canvas.style.touchAction = 'none';
        let finger = null;
        const listen = (name, fn) => {
          canvas.addEventListener(name, fn);
          listeners.push(() => canvas.removeEventListener(name, fn));
        };
        const move = (e) => {
          if (finger !== e.pointerId) return;
          const b = canvas.getBoundingClientRect();
          localPointer = {
            x: Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width) * 2 - 1)),
            y: Math.max(-1, Math.min(1, ((e.clientY - b.top) / b.height) * 2 - 1)),
            strength: 1,
          };
        };
        listen('pointerdown', (e) => {
          if (!interaction.enabled || !e.isPrimary || e.button !== 0 || reduced()) return;
          finger = e.pointerId;
          canvas.setPointerCapture(e.pointerId);
          move(e);
        });
        listen('pointermove', move);
        for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'])
          listen(name, () => {
            finger = null;
            localPointer = null;
          });
      }
    };
    p.draw = () => {
      const dt = (p.deltaTime || 16.67) / 1000,
        active = interaction.enabled && !reduced();
      const pointer = localPointer || interaction.pointer;
      motion.x = ease(motion.x, pointer.x, dt, 0.8);
      motion.y = ease(motion.y, pointer.y, dt, 0.8);
      motion.strength = ease(motion.strength, active ? pointer.strength : 0, dt);
      motion.tx = ease(motion.tx, active ? interaction.tilt.x : 0, dt);
      motion.ty = ease(motion.ty, active ? interaction.tilt.y : 0, dt);
      if (transparent) {
        const ctx = p.drawingContext;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,0.035)';
        ctx.fillRect(0, 0, p.width, p.height);
        ctx.restore();
      } else {
        p.noStroke();
        p.fill(theme === 'white' ? 'rgba(243,240,230,0.035)' : 'rgba(16,17,18,0.035)');
        p.rect(0, 0, p.width, p.height);
      }
      for (let i = 0; i < particles.length; i++) {
        const dot = particles[i];
        const angle =
          audio.mid * Math.sin(i * 0.03) * 0.5 +
          p.noise(dot.x * 0.0018, dot.y * 0.0018, p.frameCount * 0.0005) * Math.PI * 4;
        const x = dot.x,
          y = dot.y;
        dot.x += Math.cos(angle) * values.speed * (1 + audio.bass * 1.2 + audio.mid * 0.4);
        dot.y += Math.sin(angle) * values.speed * (1 + audio.bass * 1.2 + audio.mid * 0.4);
        const dx = ((motion.x + 1) * p.width) / 2 - dot.x,
          dy = ((motion.y + 1) * p.height) / 2 - dot.y,
          distance = Math.hypot(dx, dy),
          pull = motion.strength * 0.8 * Math.exp(-distance / 180),
          step = Math.min(dt * 60, 3);
        dot.x += ((dx / Math.max(distance, 1)) * pull + motion.tx * 0.65) * step;
        dot.y += ((dy / Math.max(distance, 1)) * pull + motion.ty * 0.65) * step;
        dot.age++;
        if (dot.x < 0 || dot.x > p.width || dot.y < 0 || dot.y > p.height || dot.age > 300) {
          dot.x = p.random(p.width);
          dot.y = p.random(p.height);
          dot.age = 0;
          continue;
        }
        if (palette.length) {
          const hex = palette[Math.round((i / (particles.length - 1)) * (palette.length - 1))];
          p.stroke(
            `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${Math.min(1, values.density / 50)})`,
          );
        } else p.stroke((values.hue + i * 0.065) % 360, 48, 85, values.density);
        p.strokeWeight((palette.length ? 1.35 : 1) * (1 + audio.treble * 0.7));
        p.line(x, y, dot.x, dot.y);
      }
    };
    p.windowResized = () => {};
    sketchReset = reset;
  }, container);
  return {
    get canvas() {
      return canvas;
    },
    setAudio(next) {
      audio = next;
    },
    setInteraction(next) {
      interaction = next;
    },
    setTheme(next) {
      if (theme !== next) {
        theme = next;
        if (ready) {
          sketchReset();
          if (paused) sketch.redraw?.();
        }
      }
    },
    setPalette(colors) {
      palette = colors;
      if (paused) sketch.redraw?.();
    },
    setParameters(next) {
      const changed = values.seed !== next.seed;
      values = next;
      if (changed) {
        sketchReset();
        if (paused) sketch.redraw?.();
      }
    },
    resize(w, h) {
      sketch.resizeCanvas(w, h);
      sketchReset();
    },
    pause() {
      localPointer = null;
      interaction.pointer.strength = 0;
      interaction.tilt = { x: 0, y: 0 };
      motion.strength = 0;
      motion.tx = 0;
      motion.ty = 0;
      paused = true;
      sketch.noLoop();
    },
    resume() {
      if (paused) {
        paused = false;
        sketch.loop();
      }
    },
    dispose() {
      listeners.forEach((remove) => remove());
      sketch.remove();
    },
  };
}
