import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { THEMES, POWERUPS, WEAPONS, PORTS, RADAR_RANGE, PLAYER_Z } from './game-core.mjs';

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const octaGeometry = new THREE.OctahedronGeometry(1);
const sphereGeometry = new THREE.IcosahedronGeometry(1, 1);
const torusGeometry = new THREE.TorusGeometry(1, .065, 6, 32);
const coinGeometry = new THREE.CylinderGeometry(.26, .26, .085, 16);
coinGeometry.rotateX(Math.PI / 2);

function glowTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const c = canvas.getContext('2d'); const g = c.createRadialGradient(32, 32, 1, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.15, 'rgba(255,255,255,.65)'); g.addColorStop(.45, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(canvas);
}
function labelTexture(text, color) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
  const c = canvas.getContext('2d'); c.fillStyle = 'rgba(4,10,24,.85)'; c.fillRect(3, 3, 506, 122);
  c.strokeStyle = color; c.lineWidth = 3; c.strokeRect(3, 3, 506, 122);
  c.fillStyle = color; c.font = (text.length<=2?'600 82px':'600 27px')+' Consolas, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 256, 64);
  return new THREE.CanvasTexture(canvas);
}
function extrudedPolygon(points, depth) {
  const shape = new THREE.Shape(); points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y)); shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }); geometry.rotateX(Math.PI / 2); return geometry;
}

export function createFlightRenderer(onContextLost) {
  let reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let quality = 'normal';
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.info.autoReset = false;
  renderer.domElement.className = 'game-canvas'; renderer.domElement.setAttribute('aria-label', 'Vuela por un túnel tridimensional y esquiva los objetos.');
  renderer.domElement.addEventListener('webglcontextlost', (event) => { event.preventDefault(); onContextLost?.(); });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#060b1c'); scene.fog = new THREE.FogExp2('#070d23', .022);
  const camera = new THREE.PerspectiveCamera(57, 16 / 9, .1, 180); camera.position.set(0, 1.05, 12);
  const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(960, 540), .38, .4, 1.1); composer.addPass(bloom); composer.addPass(new OutputPass());

  const resources = new Set([boxGeometry, octaGeometry, sphereGeometry, torusGeometry, coinGeometry]);
  const materialCache = new Map(); const labels = new Map();
  function material(color, glow = false, options = {}) {
    const key = `${color}:${glow}:${JSON.stringify(options)}`;
    if (!materialCache.has(key)) {
      const m = new THREE.MeshStandardMaterial({ color, roughness: glow ? .35 : .48, metalness: glow ? .35 : .7, emissive: glow ? color : '#000000', emissiveIntensity: glow ? 2.2 : 0, ...options });
      materialCache.set(key, m); resources.add(m);
    }
    return materialCache.get(key);
  }
  function mesh(geometry, mat, parent, position = [0, 0, 0], scale = [1, 1, 1]) {
    const item = new THREE.Mesh(geometry, mat); item.position.set(...position); item.scale.set(...scale); parent.add(item); return item;
  }
  function box(parent, position, scale, color, glow = false) { return mesh(boxGeometry, material(color, glow), parent, position, scale); }
  function beam(parent, start, end, width, mat) {
    const a = new THREE.Vector3(...start); const b = new THREE.Vector3(...end); const length = a.distanceTo(b);
    const direction = b.clone().sub(a).normalize();
    const item = mesh(boxGeometry, mat, parent, a.add(b).multiplyScalar(.5).toArray(), [width, width, length]);
    item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction); return item;
  }
  function label(parent, text, color, y = 1.1) {
    const key = text + color;
    if (!labels.has(key)) { const texture = labelTexture(text, color); resources.add(texture); const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }); labels.set(key, mat); resources.add(mat); }
    const sprite = new THREE.Sprite(labels.get(key)); sprite.position.y = y; sprite.scale.set(2.7, .68, 1); parent.add(sprite); return sprite;
  }
  const glowMap = glowTexture(); resources.add(glowMap);
  function glowSprite(parent, color, size, position) {
    const mat = new THREE.SpriteMaterial({ map: glowMap, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }); resources.add(mat);
    const sprite = new THREE.Sprite(mat); sprite.scale.set(size, size, 1); sprite.position.set(...position); parent.add(sprite); return sprite;
  }

  scene.add(new THREE.HemisphereLight('#8fbeff', '#17152e', 1.25));
  const keyLight = new THREE.DirectionalLight('#cfe7ff', 1.9); keyLight.position.set(-4, 6, 7); scene.add(keyLight);
  const fill = new THREE.DirectionalLight('#7892ff', 1.2); fill.position.set(5, -2, -7); scene.add(fill);
  const shipLight = new THREE.PointLight('#67baff', 2.2, 15, 2); shipLight.position.set(0, -.5, 4); scene.add(shipLight);
  const corridorLight = new THREE.PointLight('#8398ff', 80, 70, 2); corridorLight.position.set(0, 2, -18); scene.add(corridorLight);

  const tunnel = new THREE.Group(); scene.add(tunnel);
  const shellGeo = new THREE.CylinderGeometry(6.6, 6.6, 116, 8, 1, true); shellGeo.rotateX(Math.PI / 2); resources.add(shellGeo);
  const shell = mesh(shellGeo, material('#111d35', false, { side: THREE.BackSide, roughness: .88, metalness: .25 }), tunnel, [0, 0, -44], [1, .77, 1]);
  const ringMaterial = material('#296a7c', true, { emissiveIntensity: .85 });
  const railMaterial = material('#50c9c7', true, { emissiveIntensity: 1.7 });
  const vertices = [];
  for (let i = 0; i < 8; i++) { const angle = i / 8 * Math.PI * 2; vertices.push([Math.cos(angle) * 6.3, Math.sin(angle) * 4.85]); }
  // Batch repeated tunnel parts rather than issuing hundreds of separate draw calls.
  function instancedParts(mat, count) {
    const parts = new THREE.InstancedMesh(boxGeometry, mat, count);
    parts.instanceMatrix.setUsage(THREE.DynamicDrawUsage); parts.frustumCulled=false;
    tunnel.add(parts); resources.add(parts); return parts;
  }
  function localBeam(start, end, thickness) {
    const a=new THREE.Vector3(...start); const b=new THREE.Vector3(...end); const direction=b.clone().sub(a); const item=new THREE.Object3D();
    item.position.copy(a.add(b).multiplyScalar(.5)); item.scale.set(thickness,thickness,direction.length()); item.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),direction.normalize()); item.updateMatrix(); return item.matrix.clone();
  }
  const frameBodies=instancedParts(material('#1e3652'),112);
  const frameLights=instancedParts(ringMaterial,112);
  const wallLamps=instancedParts(material('#79bed7',true),28);
  const bodyTransforms=[]; const lightTransforms=[]; const lampTransforms=[];
  for(let v=0;v<8;v++){
    const a=vertices[v]; const b=vertices[(v+1)%8];
    bodyTransforms.push(localBeam([a[0],a[1],0],[b[0],b[1],0],.12));
    lightTransforms.push(localBeam([a[0]*.985,a[1]*.985,.09],[b[0]*.985,b[1]*.985,.09],.024));
    if(v===4||v===7){const lamp=new THREE.Object3D();lamp.position.set(a[0]*.96,a[1]*.96,-.2);lamp.scale.set(.16,.6,.28);lamp.updateMatrix();lampTransforms.push(lamp.matrix.clone());}
  }
  vertices.forEach(([x, y], i) => { beam(tunnel, [x * .985, y * .985, 14], [x * .985, y * .985, -100], i % 2 ? .035 : .05, railMaterial); });
  // Short floor markings give velocity a readable scale without covering obstacles.
  const floorMarks=instancedParts(material('#3c9daf',true),44);
  const markTransforms=[-1,1].map(side=>{const mark=new THREE.Object3D();mark.position.set(side*2.2,-4.42,0);mark.scale.set(.1,.025,1.3);mark.rotation.z=side*-.08;mark.updateMatrix();return mark.matrix.clone();});
  const depthTransform=new THREE.Matrix4(); const instanceTransform=new THREE.Matrix4();
  const portal = new THREE.Group(); portal.position.z = -100;
  for (let i = 0; i < 4; i++) { const torus = mesh(torusGeometry, material('#548dff', true), portal, [0, 0, i * 1.2], [3.6 - i * .65, 3.6 - i * .65, 1]); torus.rotation.z = i * .25; }
  scene.add(portal);
  const starGeo = new THREE.BufferGeometry(); const starPositions = [];
  for (let i = 0; i < 240; i++) { const a = i * 2.39996; const r = Math.sqrt(i / 240) * 16; starPositions.push(Math.cos(a) * r, Math.sin(a) * r, -115 - (i % 4)); }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3)); resources.add(starGeo);
  const starMaterial = new THREE.PointsMaterial({ size: .12, color: '#d2e4ff', transparent: true, opacity: .7 }); resources.add(starMaterial); scene.add(new THREE.Points(starGeo, starMaterial));

  const ship = new THREE.Group(); scene.add(ship);
  const hullGeo = new THREE.ConeGeometry(.45, 2.3, 5); hullGeo.rotateX(-Math.PI / 2); resources.add(hullGeo);
  const hullMaterial = material('#5f819c', false, { metalness: .65, roughness: .4 });
  mesh(hullGeo, hullMaterial, ship, [0, 0, -.25], [.9, .6, 1]);
  const wingGeo = extrudedPolygon([[.18,.55],[1.43,1.1],[1.08,-.06],[.2,-.75]], .1); resources.add(wingGeo);
  for (const side of [-1, 1]) {
    const wing = mesh(wingGeo, material('#214860'), ship, [0, -.04, -.12], [side, 1, 1]);
    box(ship, [side * .79, -.06, .5], [.09, .08, .7], '#5ef4e6', true);
    box(ship, [side * .74, .05, .65], [.31, .24, .65], '#172a45');
    const engineGeo = new THREE.CylinderGeometry(.15, .2, .18, 12); engineGeo.rotateX(Math.PI / 2); resources.add(engineGeo);
    mesh(engineGeo, material('#319fe8', true, { emissiveIntensity: 1.4 }), ship, [side * .74, .05, 1.02]);
    glowSprite(ship, '#36c8ff', .34, [side * .74, .05, 1.14]);
    const trail = box(ship, [side * .74, .05, 1.52], [.065, .065, .9], '#75d8ff', true); trail.name = 'thruster';
    box(ship, [side * 1.28, -.04, .93], [.055, .07, .22], side === 1 ? '#ffc870' : '#75ffe9', true);
  }
  const canopyGeo = new THREE.SphereGeometry(.33, 12, 8); resources.add(canopyGeo);
  mesh(canopyGeo, material('#53a9cb', false, { metalness: .7, roughness: .14, emissive: '#153d50', emissiveIntensity: .6 }), ship, [0, .18, -.33], [.72, .55, 1.65]);
  box(ship, [0, .17, .6], [.07, .28, .8], '#345c71');
  const shieldMaterial = new THREE.MeshBasicMaterial({ color: '#7dd8ff', wireframe: true, transparent: true, opacity: .17, depthWrite: false }); resources.add(shieldMaterial);
  const shield = mesh(new THREE.IcosahedronGeometry(1.65, 1), shieldMaterial, ship, [0, 0, 0], [1, .65, .95]); resources.add(shield.geometry);
  const backupHalo = mesh(torusGeometry, material('#dca45e', true, { emissiveIntensity: .9 }), ship, [0, 0, .85], [1.5, .9, 1]);
  const decoy = new THREE.Group(); scene.add(decoy);
  const hologramMaterial = new THREE.MeshBasicMaterial({ color: '#cc9bff', wireframe: true, transparent: true, opacity: .65, depthWrite: false }); resources.add(hologramMaterial);
  mesh(hullGeo, hologramMaterial, decoy, [0, 0, -.25], [.9, .6, 1]);
  for (const side of [-1, 1]) mesh(wingGeo, hologramMaterial, decoy, [0, -.04, -.12], [side, 1, 1]);
  label(decoy, 'SEÑUELO · HONEYPOT', '#d497ff', 1.1);

  const objectViews = new Map(); const shotViews = new Map(); const enemyShotViews = new Map(); const effects = [];
  const reticle = new THREE.Group(); scene.add(reticle);
  for (const side of [-1, 1]) { box(reticle, [side * .4, 0, 0], [.25, .025, .025], '#72c4ce', true); box(reticle, [0, side * .4, 0], [.025, .25, .025], '#72c4ce', true); }
  const shotMat = material('#8eefff', true, { emissiveIntensity: 5 });
  const scanMaterial = new THREE.MeshBasicMaterial({color:'#62efd3',transparent:true,opacity:.55,depthWrite:false}); resources.add(scanMaterial);
  const scanRing = mesh(torusGeometry,scanMaterial,scene,[0,0,-10],[5.8,4.4,1]);
  const scannedMaterial = new THREE.MeshBasicMaterial({color:'#62efd3',wireframe:true,transparent:true,opacity:.55,depthWrite:false}); resources.add(scannedMaterial);
  function createObject(e) {
    const group = new THREE.Group();
    if (e.kind === 'drone') {
      mesh(octaGeometry, material('#77394f'), group, [0, 0, 0], [.6, .5, .65]);
      box(group, [0, 0, .45], [.5, .14, .12], '#ff6784', true);
      for (const side of [-1, 1]) { box(group, [side * .7, 0, .05], [.6, .13, .24], '#3b2342'); box(group, [side * .8, 0, .21], [.3, .055, .06], '#ff668e', true); }
    } else if (e.kind === 'mine') {
      mesh(sphereGeometry, material('#714734'), group, [0, 0, 0], [.49, .49, .49]);
      for (let i = 0; i < 3; i++) { const ring = mesh(torusGeometry, material('#ff9f60', true), group, [0, 0, 0], [.6, .6, .6]); ring.rotation.set(i * Math.PI / 3, i * Math.PI / 4, 0); }
    } else if (e.kind === 'gate') {
      const dark = '#26304a'; const bright = '#ff8c78';
      const left = e.gapX - e.gapWidth / 2; const right = e.gapX + e.gapWidth / 2;
      const bottom = e.gapY - e.gapHeight / 2; const top = e.gapY + e.gapHeight / 2;
      box(group, [(-6 + left) / 2, 0, 0], [6 + left, 8.8, .45], dark);
      box(group, [(6 + right) / 2, 0, 0], [6 - right, 8.8, .45], dark);
      box(group, [e.gapX, (4.4 + top) / 2, 0], [e.gapWidth, 4.4 - top, .45], dark);
      box(group, [e.gapX, (-4.4 + bottom) / 2, 0], [e.gapWidth, 4.4 + bottom, .45], dark);
      for (const x of [left, right]) box(group, [x, e.gapY, .28], [.055, e.gapHeight + .1, .05], bright, true);
      for (const y of [bottom, top]) box(group, [e.gapX, y, .28], [e.gapWidth + .1, .055, .05], '#61eed4', true);
      label(group, 'HUECO SEGURO', '#87f1db', top + .5);
    } else if (e.kind === 'shard') {
      mesh(coinGeometry, material('#d79831', true, {emissiveIntensity:.9,metalness:.7}), group);
      mesh(torusGeometry, material('#ffdc8b',true), group, [0,0,.05], [.255,.255,.255]);
    } else if (e.kind === 'repair') {
      mesh(octaGeometry,material('#133e35'),group,[0,0,0],[.5,.5,.5]);
      box(group,[0,0,.52],[.13,.65,.08],'#8df2c0',true); box(group,[0,0,.52],[.65,.13,.08],'#8df2c0',true);
      label(group,'+20 ENERGÍA','#8df2c0',.9);
    } else if (e.kind === 'weapon') {
      const w=WEAPONS[e.weaponType];
      mesh(octaGeometry,material('#33334e'),group,[0,0,0],[.6,.4,.6]);
      for(const x of e.weaponType==='triple'?[-.25,0,.25]:[0])box(group,[x,0,.25],[.08,.65,.1],w.color,true);
      label(group,w.name.toUpperCase()+' · 12 s',w.color,1);
    } else if (e.kind === 'beacon') {
      const frame=material('#91a8b8',true,{emissiveIntensity:.6});
      mesh(torusGeometry,frame,group,[0,0,0],[.7,.7,.7]);
      box(group,[0,0,0],[.6,.65,.35],'#20354a');
      const unknown=label(group,'? BALIZA DE RED','#c1cddd',1.1); unknown.name='unknown';
      for(const state of Object.keys(PORTS)) {
        const p=PORTS[state], text=label(group,p.symbol+' '+p.label,p.color,1.1);text.name='port-'+state;text.visible=false;
        const marker=label(group,p.symbol,p.color,.9);marker.name='marker-'+state;marker.scale.set(1.6,.8,1);marker.visible=false;
      }
      const cargo=box(group,[0,0,.25],[.35,.35,.25],'#62efd3',true);cargo.name='cargo';cargo.visible=false;
    } else if (e.kind === 'powerup') {
      const item = POWERUPS[e.powerType];
      const ring = mesh(torusGeometry, material(item.color, true), group, [0, 0, 0], [.8, .8, .8]); ring.name = 'ring';
      if (e.powerType === 'nmap') {
        mesh(torusGeometry, material(item.color, true), group, [0, 0, 0], [.4, .4, .4]);
        box(group, [.2, .2, .05], [.05, .65, .07], item.color, true).rotation.z = -.7;
      } else if (e.powerType === 'firewall') {
        for (let i = -1; i <= 1; i++) { box(group, [i * .25, 0, 0], [.05, .8, .1], item.color, true); box(group, [0, i * .25, 0], [.8, .05, .1], item.color, true); }
      } else if (e.powerType === 'honeypot') {
        mesh(hullGeo, hologramMaterial, group, [0, 0, 0], [.8, .8, .5]);
      } else {
        for (let i = -1; i <= 1; i++) box(group, [0, i * .2, 0], [.65, .12, .4], item.color, true);
      }
      label(group, `${item.key} · ${item.name.toUpperCase()}`, item.color, 1.15);
    }
    if(['mine','drone'].includes(e.kind)) { const outline=mesh(octaGeometry,scannedMaterial,group,[0,0,0],[1.05,.8,1]);outline.name='scanned';outline.visible=false; }
    if(e.kind==='drone'){const warning=label(group,'! RÁFAGA','#ffb293',1.2);warning.name='warning';warning.visible=false;}
    scene.add(group); return group;
  }

  function consume(events) {
    for (const event of events) {
      const color = event.kind === 'destroy' || event.kind === 'hit' ? '#ff8d78' : event.kind === 'filter' ? '#79bcff' : event.kind === 'divert' ? '#d497ff' : '#ffdc8a';
      if (!['destroy', 'hit', 'collect', 'filter', 'divert', 'restore'].includes(event.kind)) continue;
      const count = reduced ? 3 : 8;
      for (let i = 0; i < count; i++) {
        const item = mesh(octaGeometry, material(color, true), scene, [event.x, event.y, event.z], [.045, .045, .045]);
        const a = i * 2.39996; effects.push({ item, life: .65, velocity: new THREE.Vector3(Math.cos(a) * 3, Math.sin(a) * 3, 2 + i % 3) });
      }
    }
  }
  let lastSector = -1; let time = 0; let width = 0; let height = 0;
  function resize() {
    const parent = renderer.domElement.parentElement; if (!parent) return;
    const nextWidth = Math.max(1, parent.clientWidth); const nextHeight = Math.max(1, parent.clientHeight);
    if (nextWidth === width && nextHeight === height) return;
    width = nextWidth; height = nextHeight; renderer.setSize(width, height, false); composer.setSize(width, height); camera.aspect = width / height;
    // Preserve enough horizontal field of view to keep all pickup lanes and wings in view on phones.
    camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.max(Math.tan(THREE.MathUtils.degToRad(57)/2),Math.tan(THREE.MathUtils.degToRad(60)/2)/camera.aspect)));
    camera.updateProjectionMatrix();
  }
  function attach(parent) { parent.prepend(renderer.domElement); resize(); }
  function draw(game, dt = 0, preview = false) {
    resize(); time += dt;
    const theme = THEMES[game.theme];
    if (lastSector !== game.theme) {
      ringMaterial.color.set(theme.color); ringMaterial.emissive.set(theme.color); railMaterial.color.set(theme.color); railMaterial.emissive.set(theme.color); corridorLight.color.set(theme.secondary); lastSector = game.theme;
    }
    for(let i=0;i<14;i++){
      depthTransform.makeTranslation(0,0,14-((i*8+112-(game.travel%112))%112));
      for(let v=0;v<8;v++){frameBodies.setMatrixAt(i*8+v,instanceTransform.multiplyMatrices(depthTransform,bodyTransforms[v]));frameLights.setMatrixAt(i*8+v,instanceTransform.multiplyMatrices(depthTransform,lightTransforms[v]));}
      for(let v=0;v<2;v++)wallLamps.setMatrixAt(i*2+v,instanceTransform.multiplyMatrices(depthTransform,lampTransforms[v]));
    }
    for(let i=0;i<22;i++){depthTransform.makeTranslation(0,0,14-((i*5+110-(game.travel%110))%110));for(let v=0;v<2;v++)floorMarks.setMatrixAt(i*2+v,instanceTransform.multiplyMatrices(depthTransform,markTransforms[v]));}
    for(const batch of [frameBodies,frameLights,wallLamps,floorMarks])batch.instanceMatrix.needsUpdate=true;
    // Do not rotate solid walls away from the simulation's stable collision axes.
    tunnel.rotation.z = 0; portal.rotation.z = reduced ? 0 : time * .05;
    ship.position.set(game.player.x, game.player.y, 3);
    const tilt = reduced ? .02 : .04;
    ship.rotation.z = THREE.MathUtils.damp(ship.rotation.z, -game.player.vx * tilt, 8, dt || .016);
    ship.rotation.x = THREE.MathUtils.damp(ship.rotation.x, game.player.vy * -.025, 8, dt || .016);
    ship.visible = true;
    hullMaterial.color.set(game.skinColor || '#5f819c');
    hullMaterial.emissive.set(game.invulnerable>0?'#27556b':'#000000');hullMaterial.emissiveIntensity=game.invulnerable>0?.7:0;
    shield.visible = game.active.firewall > 0 || game.invulnerable>0;
    shieldMaterial.color.set(game.active.firewall>0?'#79bcff':'#d2efff'); shield.rotation.z = time * .35;
    backupHalo.visible = game.backupEnergy > 0; backupHalo.rotation.z = time * .25;
    decoy.visible = game.active.honeypot > 0; decoy.position.set(game.decoy.x, game.decoy.y, game.decoy.z);
    ship.children.forEach((c) => { if (c.name === 'thruster') c.scale.z = .75 + (reduced?0:Math.sin(time * 40) * .06) + (game.boost ? 1.2 : .25); });
    scanRing.visible=game.active.nmap>0&&game.pulse>0;
    scanRing.position.set(game.player.x*.1,0,PLAYER_Z-Math.min(RADAR_RANGE,(game.time-game.scanStarted)*120));
    scanMaterial.opacity=reduced?.3:Math.min(.65,game.pulse);
    shipLight.position.set(game.player.x, game.player.y, 5);
    const targetX = preview ? 2.3 : game.player.x * .21;
    const targetY = preview ? 1.3 : 1 + game.player.y * .15;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 3, dt || .016); camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 3, dt || .016);
    camera.lookAt(game.player.x * .1, -.15, -23);
    reticle.position.set(game.player.x, game.player.y, -26); reticle.visible = !preview;
    const alive = new Set();
    for (const e of game.entities) {
      alive.add(e.id); let group = objectViews.get(e.id);
      if (!group || group.userData.kind !== e.kind) { if (group) scene.remove(group); group = createObject(e); group.userData.kind = e.kind; objectViews.set(e.id, group); }
      group.position.set(e.x, e.y, e.z);
      const scanned=group.getObjectByName('scanned');if(scanned)scanned.visible=e.scannedUntil>=game.time;
      const warning=group.getObjectByName('warning');if(warning)warning.visible=e.warning>0;
      if(e.kind==='beacon'){
        const known=e.scannedUntil>=game.time;
        group.getObjectByName('unknown').visible=!known;
        for(const state of Object.keys(PORTS)){
          group.getObjectByName('port-'+state).visible=known&&e.portState===state&&e.z>-28;
          group.getObjectByName('marker-'+state).visible=known&&e.portState===state&&e.z<=-28;
        }
        group.getObjectByName('cargo').visible=known&&e.portState==='open';
      }
      if (e.kind==='mine') group.rotation.set(time*.3,time*.6,time*.35);
      if (e.kind==='shard') group.rotation.set(0,time*1.5,0);
      const ring = group.getObjectByName('ring'); if (ring) ring.rotation.y = Math.sin(time) * .45;
    }
    for (const [id, group] of objectViews) { if (!alive.has(id)) { scene.remove(group); objectViews.delete(id); } }
    const activeShots = new Set();
    for (const shot of game.shots) { activeShots.add(shot.id); let item = shotViews.get(shot.id); if (!item) { item = mesh(boxGeometry, shot.weapon&&shot.weapon!=='laser'?material(WEAPONS[shot.weapon].color,true):shotMat, scene, [0, 0, 0], shot.weapon==='pierce'?[.09,.09,2.4]:[.04,.04,.9]); shotViews.set(shot.id, item); } item.position.set(shot.x, shot.y, shot.z); }
    for (const [id, item] of shotViews) { if (!activeShots.has(id)) { scene.remove(item); shotViews.delete(id); } }
    const hostileShots = new Set();
    for (const packet of game.enemyShots) {
      hostileShots.add(packet.id); let item = enemyShotViews.get(packet.id);
      if (!item) { item = mesh(octaGeometry, material('#ff6a88', true), scene, [0, 0, 0], [.16, .16, .38]); enemyShotViews.set(packet.id, item); }
      item.position.set(packet.x, packet.y, packet.z); item.rotation.z = time * 2;
    }
    for (const [id, item] of enemyShotViews) { if (!hostileShots.has(id)) { scene.remove(item); enemyShotViews.delete(id); } }
    for (let i = effects.length - 1; i >= 0; i--) { const e = effects[i]; e.life -= dt; e.item.position.addScaledVector(e.velocity, dt); const scale = Math.max(0, e.life) * .08; e.item.scale.setScalar(scale); if (e.life <= 0) { scene.remove(e.item); effects.splice(i, 1); } }
    renderer.info.reset(); if(quality==='fluid')renderer.render(scene,camera);else composer.render();
  }
  function reset() { for (const group of objectViews.values()) scene.remove(group); objectViews.clear(); for (const item of shotViews.values()) scene.remove(item); shotViews.clear(); for (const item of enemyShotViews.values()) scene.remove(item); enemyShotViews.clear(); for (const effect of effects) scene.remove(effect.item); effects.length = 0; }
  function dispose() { reset(); for (const resource of resources) resource.dispose(); composer.dispose(); renderer.dispose(); }
  function configure(options={}) {
    reduced=!!options.reduced;quality=options.quality==='fluid'?'fluid':'normal';
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,quality==='fluid'?1:1.25));
    width=height=0;resize();
  }
  return { attach, draw, consume, reset, dispose, configure, metrics: () => ({ drawCalls:renderer.info.render.calls, triangles:renderer.info.render.triangles }), canvas: renderer.domElement };
}
