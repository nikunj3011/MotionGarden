export function create({ container, library: T, parameters, quality, transparent = false }) {
  let audio = { bass: 0, mid: 0, treble: 0 },
    baseScale = 1,
    palette = [],
    values = parameters,
    paused = false,
    frame = 0,
    disposed = false,
    time = 0;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.z = 7;
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: transparent,
    preserveDrawingBuffer: true,
  });
  renderer.setClearColor('#13151a', transparent ? 0 : 1);
  renderer.setPixelRatio(Math.min(devicePixelRatio, quality === 'low' ? 1.3 : 2));
  container.appendChild(renderer.domElement);
  const group = new T.Group();
  scene.add(group);
  const geometry = new T.TorusGeometry(1.55, 0.012, 8, 180);
  const materials = [];
  for (let i = 0; i < 36; i++) {
    const material = new T.MeshBasicMaterial({
      color: new T.Color().setHSL((values.hue + i * 1.1) / 360, 0.55, 0.68),
    });
    materials.push(material);
    const ring = new T.Mesh(geometry, material);
    ring.rotation.x = (i * Math.PI) / 36;
    ring.rotation.y = i * 0.09;
    group.add(ring);
  }
  const resize = (w, h) => {
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize(container.clientWidth, container.clientHeight);
  const draw = () => {
    if (disposed) return;
    frame = requestAnimationFrame(draw);
    if (paused) return;
    time += 0.006 * values.speed * (1 + audio.mid * 0.65);
    group.scale.setScalar(baseScale * (1 + audio.bass * 0.18));
    group.rotation.y = time + values.seed * 0.01;
    group.rotation.z = Math.sin(time * 0.5) * 0.3 + Math.sin(time * 2) * audio.treble * 0.06;
    group.rotation.x = 0.4;
    renderer.render(scene, camera);
  };
  draw();
  return {
    canvas: renderer.domElement,
    setAudio(next) {
      audio = next;
    },
    setTheme(theme) {
      renderer.setClearColor(theme === 'white' ? '#f3f0e6' : '#101112', transparent ? 0 : 1);
      renderer.render(scene, camera);
    },
    setPalette(colors) {
      palette = colors;
      materials.forEach((m, i) =>
        m.color.set(palette[Math.round((i / (materials.length - 1)) * (palette.length - 1))]),
      );
      renderer.render(scene, camera);
    },
    setParameters(next) {
      values = next;
      materials.forEach((m, i) =>
        palette.length
          ? m.color.set(palette[Math.round((i / (materials.length - 1)) * (palette.length - 1))])
          : m.color.setHSL(((values.hue + i * 1.1) % 360) / 360, 0.55, 0.68),
      );
      baseScale = 0.7 + values.density / 70;
      group.scale.setScalar(baseScale * (1 + audio.bass * 0.18));
      group.rotation.y = time + values.seed * 0.01;
      renderer.render(scene, camera);
    },
    resize,
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      geometry.dispose();
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
