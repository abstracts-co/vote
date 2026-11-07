import {
  BufferGeometry, Color, DirectionalLight, ExtrudeGeometry, Float32BufferAttribute, Group, HemisphereLight,
  LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, MeshStandardMaterial, NoToneMapping, PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry, Raycaster, Scene,
  ShadowMaterial, Shape, Path, SRGBColorSpace, Vector2, Vector3, WebGLRenderer,
} from 'three';

const W = 975, H = 610, TILT = 0.6, FOV = 22;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const tox = (x) => x - W / 2, toy = (y) => H / 2 - y;

export function create(canvas, shapes, onFrame) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 10, 8000);
  camera.up.set(0, 0, 1);
  const hemi = new HemisphereLight(0xffffff, 0xb8b4aa, 2.15);
  hemi.position.set(0, 0, 1);
  const sun = new DirectionalLight(0xfff6ea, 0.95);
  sun.position.set(-480, -360, 900);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -640, right: 640, top: 480, bottom: -480, near: 100, far: 2200 });
  sun.shadow.radius = 5;
  sun.shadow.bias = -0.0005;
  scene.add(hemi, sun);
  const ground = new Mesh(new PlaneGeometry(4000, 4000), new ShadowMaterial({ opacity: 0.32 }));
  ground.receiveShadow = true;
  scene.add(ground);

  const root = new Group();
  scene.add(root);
  const byAbbr = {};
  const meshes = [];
  for (const s of shapes) {
    const list = [], outline = [];
    for (const poly of s.polys) {
      const outer = poly[0].map(([x, y]) => new Vector2(tox(x), toy(y)));
      const shape = new Shape(outer);
      for (const hole of poly.slice(1)) shape.holes.push(new Path(hole.map(([x, y]) => new Vector2(tox(x), toy(y)))));
      list.push(shape);
      for (const ring of poly) for (let i = 0; i < ring.length; i++) {
        const a = ring[i], b = ring[(i + 1) % ring.length];
        outline.push(tox(a[0]), toy(a[1]), 1, tox(b[0]), toy(b[1]), 1);
      }
    }
    const geo = new ExtrudeGeometry(list, { depth: 1, bevelEnabled: false, curveSegments: 1 });
    const top = new MeshStandardMaterial({ roughness: 0.62, metalness: 0.04 });
    const side = new MeshBasicMaterial();
    const mesh = new Mesh(geo, [top, side]);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.userData.abbr = s.abbr;
    mesh.scale.z = 0.01;
    const lineGeo = new BufferGeometry();
    lineGeo.setAttribute('position', new Float32BufferAttribute(outline, 3));
    const line = new LineSegments(lineGeo, new LineBasicMaterial({ transparent: true, opacity: 0.7 }));
    mesh.add(line);
    root.add(mesh);
    meshes.push(mesh);
    byAbbr[s.abbr] = { mesh, top, side, line, s, height: 0.01, goal: 0.01, lift: 0, liftGoal: 0, color: new Color(), goalColor: new Color() };
  }

  const leads = new LineSegments(new BufferGeometry(), new LineBasicMaterial({ transparent: true, opacity: 0.55 }));
  scene.add(leads);

  const view = { fx: 0, fy: 0, gfx: 0, gfy: 0, bfx: 0, bfy: 0, w: 1, h: 1, dist: 2000, base: 2000, tx: 0, ty: 0, gtx: 0, gty: 0, gdist: 2000, shift: 0, gshift: 0, px: 0, py: 0, gpx: 0, gpy: 0, panx: 0, pany: 0, gpanx: 0, gpany: 0, zoom: 1, gzoom: 1 };
  let raised = {};
  const liftFor = (a) => (a === open ? 10 : (raised[a] ?? 0) + (a === hover ? 5 : 0));
  const ray = new Raycaster(), ndc = new Vector2(), tmp = new Vector3();
  const sample = shapes.flatMap((s) => s.polys.flatMap((p) => p[0].filter((_, i) => i % 6 === 0).map(([x, y]) => [tox(x), toy(y)])));
  let measureFn = null, roomNow = null, county = null, liftDirty = false, shadowOnce = true;
  let raf = 0, hover = '', open = '', edgeColor = new Color('#fff'), hl = new Color('#000'), inset = 0;

  const place = () => {
    const a = TILT + view.py * 0.03, az = view.px * 0.05;
    camera.position.set(view.tx + Math.sin(az) * Math.sin(a) * view.dist, view.ty - Math.cos(az) * Math.sin(a) * view.dist, Math.cos(a) * view.dist);
    camera.lookAt(view.tx, view.ty, 12);
    camera.zoom = view.zoom;
    camera.setViewOffset(view.w, view.h, view.shift + view.fx - view.panx, view.fy - view.pany, view.w, view.h);
    camera.updateMatrixWorld();
  };
  const fit = () => {
    const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    view.w = w; view.h = h;
    const top = w < 760 ? 46 : 100, foot = w < 760 ? 44 : 84, roomW = Math.max(0.2, (w - inset) / w), roomH = (h - top - foot) / h;
    const measure = (d, pts = sample, tx = 0, ty = 0, zTop = 44) => {
      camera.zoom = 1;
      camera.clearViewOffset();
      camera.position.set(tx, ty - Math.sin(TILT) * d, Math.cos(TILT) * d);
      camera.lookAt(tx, ty, 12);
      camera.updateMatrixWorld();
      let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
      for (const [x, y] of pts) for (const z of [0, zTop]) {
        tmp.set(x, y, z).project(camera);
        x0 = Math.min(x0, tmp.x); x1 = Math.max(x1, tmp.x); y0 = Math.min(y0, tmp.y); y1 = Math.max(y1, tmp.y);
      }
      return { x0, x1, y0, y1 };
    };
    let lo = 400, hi = 9000;
    for (let i = 0; i < 18; i++) {
      const d = (lo + hi) / 2, m = measure(d);
      if (m.x1 - m.x0 <= 1.93 * roomW && m.y1 - m.y0 <= 1.9 * roomH) hi = d; else lo = d;
    }
    const m = measure(hi);
    view.bfx = ((m.x0 + m.x1) / 2) * (w / 2);
    view.bfy = -((m.y0 + m.y1) / 2) * (h / 2) - (top - foot) / 2;
    measureFn = measure; roomNow = { roomW, roomH, top, w, h };
    view.base = hi;
    aim();
    shadowOnce = true;
    wake(true);
  };
  const aim = () => {
    const st = open && byAbbr[open];
    if (st && st.s.polys.length && measureFn) {
      const pts = st.s.polys.flatMap((p) => p[0].filter((_, i, l) => i % Math.max(1, Math.floor(l.length / 60)) === 0).map(([x, y]) => [tox(x), toy(y)]));
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const tx = (Math.min(...xs) + Math.max(...xs)) / 2, ty = (Math.min(...ys) + Math.max(...ys)) / 2;
      const { roomW, roomH, top, w, h } = roomNow, peak = Math.max(5, Math.max(st.s.w, st.s.hh) * 0.3);
      let lo = 120, hi = view.base;
      for (let i = 0; i < 16; i++) {
        const d = (lo + hi) / 2, m = measureFn(d, pts, tx, ty, peak);
        if (m.x1 - m.x0 <= 1.72 * roomW && m.y1 - m.y0 <= 1.66 * roomH) hi = d; else lo = d;
      }
      const m = measureFn(hi, pts, tx, ty, peak);
      view.gtx = tx; view.gty = ty; view.gdist = hi;
      view.gfx = ((m.x0 + m.x1) / 2) * (w / 2);
      view.gfy = -((m.y0 + m.y1) / 2) * (h / 2) - top / 2;
    } else { view.gtx = 0; view.gty = 0; view.gdist = view.base; view.gfx = view.bfx; view.gfy = view.bfy; }
    view.gshift = inset / 2;
  };
  const step = () => {
    raf = 0;
    const k = reduced() ? 1 : 0.14;
    let moving = false, shadow = false;
    const near = (a, b, e = 0.02) => { if (Math.abs(a - b) > e) moving = true; return a + (b - a) * k; };
    for (const key of ['tx', 'ty', 'dist', 'shift', 'fx', 'fy', 'panx', 'pany']) view[key] = near(view[key], view[`g${key}`], 0.05);
    if (Math.abs(view.zoom - view.gzoom) > 0.002) moving = true;
    view.zoom += (view.gzoom - view.zoom) * k;
    for (const key of ['px', 'py']) { const goal = view[`g${key}`]; if (Math.abs(view[key] - goal) > 0.002) moving = true; view[key] += (goal - view[key]) * (reduced() ? 1 : 0.07); }
    if (county) { if (Math.abs(county.group.scale.z - 1) > 0.002) shadow = true; county.group.scale.z = near(county.group.scale.z, 1, 0.002); }
    for (const a in byAbbr) {
      const st = byAbbr[a];
      if (Math.abs(st.height - st.goal) > 0.02) shadow = true;
      st.height = near(st.height, st.goal);
      if (Math.abs(st.lift - st.liftGoal) > 0.02) { moving = true; liftDirty = true; }
      st.lift += (st.liftGoal - st.lift) * (reduced() ? 1 : 0.26);
      st.mesh.scale.z = Math.max(0.01, st.height);
      st.mesh.position.z = st.lift;
      if (Math.abs(st.color.r - st.goalColor.r) + Math.abs(st.color.g - st.goalColor.g) + Math.abs(st.color.b - st.goalColor.b) > 0.004) moving = true;
      st.color.lerp(st.goalColor, k);
      st.top.color.copy(st.color);
      st.side.color.copy(st.color).multiplyScalar(0.48);
      const hot = a === hover || a === open || raised[a];
      st.line.material.color.copy(hot ? hl : edgeColor);
      st.line.material.opacity = hot ? 1 : 0.6;
    }
    if (!moving && liftDirty) { shadow = true; liftDirty = false; }
    if (shadow || shadowOnce) { renderer.shadowMap.needsUpdate = true; shadowOnce = false; }
    place();
    renderer.render(scene, camera);
    onFrame?.();
    if (moving || shadow) raf = requestAnimationFrame(step);
  };
  const wake = (now) => { if (now && !raf) raf = requestAnimationFrame(step); else if (!raf) raf = requestAnimationFrame(step); };

  const clearCounties = () => {
    if (!county) return;
    root.remove(county.group);
    county.group.traverse((o) => { o.geometry?.dispose(); });
    for (const st of Object.values(byAbbr)) st.mesh.visible = true;
    county = null;
    shadowOnce = true;
  };
  const showCounties = (abbr, list, edge) => {
    clearCounties();
    const group = new Group(), hits = [], line = [], tones = new Map();
    const matsFor = (hex) => {
      if (!tones.has(hex)) tones.set(hex, [new MeshStandardMaterial({ color: hex, roughness: 0.62, metalness: 0.04 }), new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(0.48) })]);
      return tones.get(hex);
    };
    for (const c of list) {
      const shapesList = [];
      for (const poly of c.polys) {
        const sh = new Shape(poly[0].map(([x, y]) => new Vector2(tox(x), toy(y))));
        for (const hole of poly.slice(1)) sh.holes.push(new Path(hole.map(([x, y]) => new Vector2(tox(x), toy(y)))));
        shapesList.push(sh);
        for (const ring of poly) for (let i = 0; i < ring.length; i++) {
          const p = ring[i], q = ring[(i + 1) % ring.length];
          line.push(tox(p[0]), toy(p[1]), c.height, tox(q[0]), toy(q[1]), c.height);
        }
      }
      const mesh = new Mesh(new ExtrudeGeometry(shapesList, { depth: c.height, bevelEnabled: false, curveSegments: 1 }), matsFor(c.color));
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.userData.county = c.id;
      group.add(mesh); hits.push(mesh);
    }
    const lineGeo = new BufferGeometry();
    lineGeo.setAttribute('position', new Float32BufferAttribute(line, 3));
    group.add(new LineSegments(lineGeo, new LineBasicMaterial({ color: edge, transparent: true, opacity: 0.75 })));
    group.scale.z = reduced() ? 1 : 0.05;
    root.add(group);
    shadowOnce = true;
    byAbbr[abbr].mesh.visible = false;
    county = { abbr, group, hits };
    wake();
  };
  const api = {
    fit,
    counties(abbr, list, edge) { if (abbr) showCounties(abbr, list, edge); else { clearCounties(); wake(); } },
    pickCounty(cx, cy) {
      if (!county) return '';
      const r = canvas.getBoundingClientRect();
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      return ray.intersectObjects(county.hits, false)[0]?.object.userData.county ?? '';
    },
    style(fills, heights) {
      for (const a in byAbbr) {
        const st = byAbbr[a];
        st.goalColor.set(fills[a]);
        st.goal = heights[a] ?? 2;
      }
      wake();
    },
    theme(edge, active) { edgeColor.set(edge); hl.set(active); wake(); },
    hover(a) { if (a === hover) return; const was = hover; hover = a; if (byAbbr[was]) byAbbr[was].liftGoal = liftFor(was); if (byAbbr[a]) byAbbr[a].liftGoal = liftFor(a); wake(); },
    raise(map) { raised = map; for (const a in byAbbr) byAbbr[a].liftGoal = liftFor(a); wake(); },
    zoomAt(f, x, y, ease) {
      const z1 = view.gzoom, z2 = Math.max(1, Math.min(8, z1 * f));
      if (z2 === z1) return;
      const move = (b, goal, mid, at) => b - ((mid - at) + (z2 * (at - mid + (b - goal))) / z1);
      view.gpanx = move(view.gshift + view.gfx, view.gpanx, view.w / 2, x);
      view.gpany = move(view.gfy, view.gpany, view.h / 2, y);
      if (z2 === 1 && f < 1) view.gpanx = view.gpany = 0;
      view.gzoom = z2;
      if (!ease) { view.zoom = z2; view.panx = view.gpanx; view.pany = view.gpany; }
      wake();
    },
    zoomLevel() { return view.gzoom; },
    pan(dx, dy) {
      const far = 0.6 * Math.max(1, view.base / view.dist) * view.gzoom, clamp = (v, max) => Math.max(-max, Math.min(max, v));
      view.panx = view.gpanx = clamp(view.gpanx + dx, view.w * far);
      view.pany = view.gpany = clamp(view.gpany + dy, view.h * far);
      wake();
    },
    resetPan() { view.gpanx = view.gpany = 0; view.gzoom = 1; wake(); },
    panned() { return !!(view.gpanx || view.gpany) || view.gzoom !== 1; },
    open(a) { if (a !== open) { view.gpanx = view.gpany = 0; view.gzoom = 1; } const was = open; open = a; if (byAbbr[was]) byAbbr[was].liftGoal = liftFor(was); if (byAbbr[a]) byAbbr[a].liftGoal = liftFor(a); aim(); wake(); },
    inset(px) { if (px === inset) return; inset = px; fit(); },
    tilt(nx, ny) { if (reduced()) return; view.gpx = nx; view.gpy = ny; wake(); },
    pick(cx, cy) {
      const r = canvas.getBoundingClientRect();
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      return ray.intersectObjects(meshes.filter((m) => m.visible), false)[0]?.object.userData.abbr ?? '';
    },
    project(x, y, z) {
      tmp.set(tox(x), toy(y), z).project(camera);
      return { x: (tmp.x * 0.5 + 0.5) * view.w, y: (-tmp.y * 0.5 + 0.5) * view.h, on: tmp.z < 1 };
    },
    topOf(a) { const st = byAbbr[a]; return st ? st.height + st.lift : 0; },
    setLeads(pairs) {
      const pos = [];
      for (const [x1, y1, z1, x2, y2] of pairs) pos.push(tox(x1), toy(y1), z1, tox(x2), toy(y2), 1);
      leads.geometry.dispose();
      leads.geometry = new BufferGeometry();
      leads.geometry.setAttribute('position', new Float32BufferAttribute(pos, 3));
      wake();
    },
    leadColor(c) { leads.material.color.set(c); },
  };
  new ResizeObserver(fit).observe(canvas);
  fit();
  return api;
}
