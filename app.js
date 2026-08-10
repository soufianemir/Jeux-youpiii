const app = document.getElementById('app');

const state = {
  stars: Number(localStorage.getItem('constance-stars') || 0),
  maxMazeLevel: Number(localStorage.getItem('constance-maze-level') || 1),
  currentLevel: 1,
  sceneCleanup: null
};

const LEVELS = [
  {
    name: 'La Forêt des Fées',
    subtitle: 'Retrouve le dragon gardien',
    map: [
      '###########',
      '#S..#.....#',
      '#.#.#.###.#',
      '#.#...#...#',
      '#.#####.#.#',
      '#.....#.#.#',
      '###.#.#.#.#',
      '#...#...#.#',
      '#.#####.#.#',
      '#.......#D#',
      '###########'
    ],
    crystals: [[3,3],[5,5],[9,5]],
    sky: 0x24104d,
    fog: 0x3a1f66
  },
  {
    name: 'Le Jardin du Dragon',
    subtitle: 'Traverse le jardin secret',
    map: [
      '#############',
      '#S....#.....#',
      '###.#.#.###.#',
      '#...#.#...#.#',
      '#.###.###.#.#',
      '#.....#...#.#',
      '#.#####.###.#',
      '#.....#.....#',
      '###.#.#####.#',
      '#...#.......#',
      '#.#########.#',
      '#..........D#',
      '#############'
    ],
    crystals: [[1,5],[7,3],[9,9]],
    sky: 0x101b46,
    fog: 0x243b70
  }
];

function tone(freq = 440, duration = .1, gainValue = .045) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = gainValue;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration + .02);
  } catch (_) {}
}

function fanfare() {
  [[660,0],[830,120],[990,240],[1320,390]].forEach(([f,t]) => setTimeout(() => tone(f,.17,.05),t));
}

function addStars(n) {
  state.stars += n;
  localStorage.setItem('constance-stars', String(state.stars));
}

function cleanup3D() {
  if (state.sceneCleanup) {
    state.sceneCleanup();
    state.sceneCleanup = null;
  }
}

function shell(content, className = '') {
  cleanup3D();
  app.innerHTML = `<main class="screen ${className}">${content}</main>`;
}

function home() {
  shell(`
    <section class="home-scene">
      <div class="aurora aurora-a"></div>
      <div class="aurora aurora-b"></div>
      <div class="moon-orb"></div>
      <div class="spark-field"></div>
      <div class="home-copy">
        <div class="eyebrow">✨ LE ROYAUME ENCHANTÉ ✨</div>
        <h1>Constance et le<br><span>Dragon des Étoiles</span></h1>
        <p>Une vraie aventure magique, à explorer niveau après niveau.</p>
        <div class="home-stats"><span>⭐ ${state.stars} étoiles</span><span>🏰 Niveau ${state.maxMazeLevel}</span></div>
        <button class="primary-cta" onclick="startMaze(${Math.min(state.maxMazeLevel, LEVELS.length)})">
          <span class="cta-shine"></span>
          ▶ Continuer l’aventure
        </button>
        <button class="secondary-cta" onclick="startMaze(1)">Rejouer depuis le début</button>
      </div>
      <div class="fantasy-stage" aria-hidden="true">
        <div class="castle-silhouette"><i></i><i></i><i></i></div>
        <div class="magic-path"></div>
        <div class="dragon-card">
          <div class="dragon-wing left"></div><div class="dragon-wing right"></div>
          <div class="dragon-head">✦</div>
          <div class="dragon-eye eye-a"></div><div class="dragon-eye eye-b"></div>
          <div class="dragon-glow"></div>
        </div>
        <div class="fairy-light f1"></div><div class="fairy-light f2"></div><div class="fairy-light f3"></div>
      </div>
      <div class="level-ribbon">NOUVELLE VERSION 3D</div>
    </section>
  `, 'home-screen');
}

window.startMaze = function(level = 1) {
  const idx = Math.max(0, Math.min(LEVELS.length - 1, level - 1));
  state.currentLevel = idx + 1;
  const data = LEVELS[idx];
  shell(`
    <section class="maze-shell">
      <div id="world3d" class="world3d"></div>
      <div class="cinema-vignette"></div>
      <header class="maze-hud">
        <button class="hud-back" onclick="home()">‹</button>
        <div class="quest-title"><small>NIVEAU ${state.currentLevel}</small><strong>${data.name}</strong></div>
        <div class="star-badge">⭐ <span id="hudStars">${state.stars}</span></div>
      </header>
      <div class="quest-card" id="questCard">
        <span class="quest-icon">🐉</span>
        <div><small>MISSION</small><strong>${data.subtitle}</strong><em id="crystalCount">0 / 3 cristaux</em></div>
      </div>
      <div class="hint-pill" id="hintPill">Suis les lucioles ✨</div>
      <div class="touch-pad" aria-label="Contrôles">
        <button class="up" data-dir="up">▲</button>
        <button class="left" data-dir="left">◀</button>
        <button class="down" data-dir="down">▼</button>
        <button class="right" data-dir="right">▶</button>
      </div>
      <div class="victory-overlay" id="victoryOverlay" hidden>
        <div class="victory-stars" id="victoryStars"></div>
        <div class="victory-card">
          <div class="victory-crown">♕</div>
          <div class="victory-kicker">NIVEAU TERMINÉ</div>
          <h2>Bravo Constance !</h2>
          <p>Le dragon t’a reconnue comme gardienne du royaume.</p>
          <div class="reward-medal">+<span id="rewardAmount">5</span> ⭐</div>
          <div class="victory-actions" id="victoryActions"></div>
        </div>
      </div>
      <div class="webgl-fallback" id="webglFallback" hidden>
        <h2>La magie 3D n’a pas démarré</h2>
        <p>Recharge la page avec une connexion internet, puis relance l’aventure.</p>
        <button onclick="location.reload()">Recharger</button>
      </div>
    </section>
  `, 'maze-screen');
  requestAnimationFrame(() => initMaze3D(data, idx));
};

function initMaze3D(level, levelIndex) {
  if (!window.THREE) {
    document.getElementById('webglFallback').hidden = false;
    return;
  }

  const container = document.getElementById('world3d');
  const THREE = window.THREE;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(level.sky);
  scene.fog = new THREE.FogExp2(level.fog, .033);

  const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 120);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xc9b8ff, 0x142b24, 2.6);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(0xffe0f6, 3.5);
  moon.position.set(-8, 14, 8);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024,1024);
  scene.add(moon);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80,80),
    new THREE.MeshStandardMaterial({color:0x173b31, roughness:.9, metalness:0})
  );
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow = true;
  ground.position.y = -.05;
  scene.add(ground);

  const tile = 2.6;
  const rows = level.map.length;
  const cols = level.map[0].length;
  const ox = -((cols - 1) * tile) / 2;
  const oz = -((rows - 1) * tile) / 2;
  const worldPos = (r,c) => new THREE.Vector3(ox + c*tile, 0, oz + r*tile);

  let start = {r:1,c:1};
  let goal = {r:rows-2,c:cols-2};
  const wallMat = new THREE.MeshStandardMaterial({color:0x265743, roughness:.78});
  const wallTopMat = new THREE.MeshStandardMaterial({color:0x4e9b62, roughness:.7});
  const trunkMat = new THREE.MeshStandardMaterial({color:0x5c362a, roughness:1});
  const leafMats = [0x35734b,0x3e8555,0x2f6547].map(c => new THREE.MeshStandardMaterial({color:c, roughness:.9}));

  level.map.forEach((row,r) => [...row].forEach((cell,c) => {
    if (cell === 'S') start = {r,c};
    if (cell === 'D') goal = {r,c};
    const p = worldPos(r,c);
    if (cell === '#') {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(tile*.96,1.55,tile*.96), wallMat);
      wall.position.set(p.x,.72,p.z);
      wall.castShadow = wall.receiveShadow = true;
      scene.add(wall);
      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(.7,0), wallTopMat);
      crown.scale.set(1.6,.9,1.6);
      crown.position.set(p.x,1.58,p.z);
      crown.rotation.y = (r+c)*.7;
      crown.castShadow = true;
      scene.add(crown);
      if ((r*7+c*11)%5===0) {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.16,.22,1.7,7),trunkMat);
        trunk.position.set(p.x+.45,2.25,p.z-.3); trunk.castShadow=true; scene.add(trunk);
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(.85,1.8,7),leafMats[(r+c)%leafMats.length]);
        leaves.position.set(p.x+.45,3.55,p.z-.3); leaves.castShadow=true; scene.add(leaves);
      }
    } else {
      const path = new THREE.Mesh(
        new THREE.CylinderGeometry(.68,.76,.08,12),
        new THREE.MeshStandardMaterial({color: ((r+c)%2?0xc9b08a:0xbda27f), roughness:1})
      );
      path.position.set(p.x,.01,p.z); scene.add(path);
    }
  }));

  // Fairy fireflies / particles.
  const particleCount = 360;
  const positions = new Float32Array(particleCount*3);
  for (let i=0;i<particleCount;i++) {
    positions[i*3]=(Math.random()-.5)*cols*tile*1.25;
    positions[i*3+1]=.4+Math.random()*7;
    positions[i*3+2]=(Math.random()-.5)*rows*tile*1.25;
  }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const pm = new THREE.PointsMaterial({color:0xffe77a,size:.09,transparent:true,opacity:.78});
  const fireflies = new THREE.Points(pg,pm); scene.add(fireflies);

  // Distant moon.
  const moonOrb = new THREE.Mesh(new THREE.SphereGeometry(2.1,32,32), new THREE.MeshBasicMaterial({color:0xffdff4}));
  moonOrb.position.set(-11,15,-25); scene.add(moonOrb);
  const moonGlow = new THREE.PointLight(0xd7c5ff,18,35,2); moonGlow.position.copy(moonOrb.position); scene.add(moonGlow);

  // Character: a tiny magical princess built in 3D primitives.
  const princess = new THREE.Group();
  const dress = new THREE.Mesh(new THREE.ConeGeometry(.55,1.25,16), new THREE.MeshStandardMaterial({color:0xb64bc7,roughness:.45,metalness:.12}));
  dress.position.y=.66; dress.castShadow=true; princess.add(dress);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.32,20,20), new THREE.MeshStandardMaterial({color:0xffc9aa,roughness:.7}));
  head.position.y=1.45; head.castShadow=true; princess.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(.36,20,20,0,Math.PI*2,0,Math.PI*.58), new THREE.MeshStandardMaterial({color:0x3c211d,roughness:.9}));
  hair.position.set(0,1.57,.02); hair.rotation.x=Math.PI; princess.add(hair);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(.22,.4,5), new THREE.MeshStandardMaterial({color:0xffdd52,emissive:0x6b4b00,emissiveIntensity:.4,metalness:.6}));
  crown.position.y=1.96; princess.add(crown);
  const wand = new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.9,8), new THREE.MeshStandardMaterial({color:0xffd275,metalness:.5}));
  wand.position.set(.47,.95,0); wand.rotation.z=-.5; princess.add(wand);
  const wandStar = new THREE.Mesh(new THREE.OctahedronGeometry(.12), new THREE.MeshStandardMaterial({color:0xffffbc,emissive:0xffb400,emissiveIntensity:2}));
  wandStar.position.set(.69,1.33,0); princess.add(wandStar);
  scene.add(princess);

  // Dragon goal.
  const dragon = new THREE.Group();
  const green = new THREE.MeshStandardMaterial({color:0x3bc77b,roughness:.48,metalness:.05});
  const belly = new THREE.MeshStandardMaterial({color:0xf5d36e,roughness:.55});
  const wingMat = new THREE.MeshStandardMaterial({color:0x7f52c8,side:THREE.DoubleSide,roughness:.6});
  const body = new THREE.Mesh(new THREE.SphereGeometry(.9,24,24),green); body.scale.set(.85,1.15,.75); body.position.y=1; body.castShadow=true; dragon.add(body);
  const dragonHead = new THREE.Mesh(new THREE.SphereGeometry(.62,24,24),green); dragonHead.position.set(0,2.05,.08); dragon.add(dragonHead);
  const snout = new THREE.Mesh(new THREE.SphereGeometry(.34,20,20),belly); snout.scale.set(1.2,.6,.8); snout.position.set(0,1.92,.55); dragon.add(snout);
  const eyeMat = new THREE.MeshBasicMaterial({color:0xffffff});
  const pupilMat = new THREE.MeshBasicMaterial({color:0x15121b});
  [-.24,.24].forEach(x=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.11,12,12),eyeMat);e.position.set(x,2.18,.55);dragon.add(e);const pu=new THREE.Mesh(new THREE.SphereGeometry(.05,10,10),pupilMat);pu.position.set(x,2.18,.64);dragon.add(pu)});
  const wingGeo = new THREE.BufferGeometry();
  wingGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0, -1.65,.55,0, -.65,-1.1,0],3));
  wingGeo.setIndex([0,1,2]); wingGeo.computeVertexNormals();
  const wl=new THREE.Mesh(wingGeo,wingMat); wl.position.set(-.55,1.35,0); dragon.add(wl);
  const wr=new THREE.Mesh(wingGeo,wingMat); wr.scale.x=-1; wr.position.set(.55,1.35,0); dragon.add(wr);
  const hornMat = new THREE.MeshStandardMaterial({color:0xffe2a1,roughness:.7});
  [-.27,.27].forEach(x=>{const h=new THREE.Mesh(new THREE.ConeGeometry(.1,.42,9),hornMat);h.position.set(x,2.66,0);h.rotation.z=x>0?-.22:.22;dragon.add(h)});
  const gp = worldPos(goal.r,goal.c); dragon.position.set(gp.x,0,gp.z); dragon.rotation.y=Math.PI; scene.add(dragon);
  const dragonLight = new THREE.PointLight(0x8dffb8,11,10,2); dragonLight.position.set(gp.x,2.2,gp.z); scene.add(dragonLight);

  // Collectible crystals.
  const crystalMeshes = [];
  const collected = new Set();
  level.crystals.forEach(([r,c],i)=>{
    const cp=worldPos(r,c);
    const mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.34,0),new THREE.MeshStandardMaterial({color:[0x68e8ff,0xff7bea,0xffdf62][i%3],emissive:[0x176c8b,0x861468,0x806000][i%3],emissiveIntensity:1.5,metalness:.25,roughness:.22}));
    mesh.position.set(cp.x,.75,cp.z); mesh.userData={r,c,i}; mesh.castShadow=true; scene.add(mesh);
    const light=new THREE.PointLight([0x68e8ff,0xff7bea,0xffdf62][i%3],5,4,2); light.position.set(cp.x,.8,cp.z); scene.add(light); mesh.userData.light=light;
    crystalMeshes.push(mesh);
  });

  let pos={...start};
  let target=worldPos(pos.r,pos.c); princess.position.copy(target);
  let moving=false;
  let winning=false;
  let facing=0;
  const dirs={up:[-1,0,0],right:[0,1,Math.PI/2],down:[1,0,Math.PI],left:[0,-1,-Math.PI/2]};

  function tryMove(name){
    if(moving||winning) return;
    const d=dirs[name]; if(!d)return;
    const nr=pos.r+d[0],nc=pos.c+d[1];
    facing=d[2]; princess.rotation.y=facing;
    if(!level.map[nr]||level.map[nr][nc]==='#'){
      tone(220,.06,.025);
      const hint=document.getElementById('hintPill'); if(hint){hint.textContent='Un buisson magique bloque le passage 🌿';hint.classList.add('show');setTimeout(()=>hint?.classList.remove('show'),1100)}
      return;
    }
    pos={r:nr,c:nc}; target=worldPos(nr,nc); moving=true; tone(440,.045,.018);
  }

  function checkCollectibles(){
    crystalMeshes.forEach(mesh=>{
      if(!mesh.visible||collected.has(mesh.userData.i))return;
      if(mesh.userData.r===pos.r&&mesh.userData.c===pos.c){
        collected.add(mesh.userData.i); mesh.visible=false; mesh.userData.light.visible=false;
        tone(880,.12,.05); setTimeout(()=>tone(1170,.12,.04),90);
        const counter=document.getElementById('crystalCount'); if(counter) counter.textContent=`${collected.size} / 3 cristaux`;
        const hint=document.getElementById('hintPill'); if(hint){hint.textContent='Cristal magique trouvé ! ✨';hint.classList.add('show');setTimeout(()=>hint?.classList.remove('show'),1200)}
      }
    });
  }

  function win(){
    if(winning)return; winning=true;
    const reward=5+collected.size;
    addStars(reward);
    const nextUnlocked=Math.min(LEVELS.length,levelIndex+2);
    if(nextUnlocked>state.maxMazeLevel){state.maxMazeLevel=nextUnlocked;localStorage.setItem('constance-maze-level',String(state.maxMazeLevel));}
    fanfare();
    document.getElementById('hudStars').textContent=state.stars;
    document.getElementById('rewardAmount').textContent=reward;
    const overlay=document.getElementById('victoryOverlay'); overlay.hidden=false;
    const stars=document.getElementById('victoryStars');
    stars.innerHTML=Array.from({length:28},(_,i)=>`<i style="--x:${Math.random()*100}%;--d:${Math.random()*1.5}s;--s:${.6+Math.random()*1.5}">✦</i>`).join('');
    const actions=document.getElementById('victoryActions');
    if(levelIndex<LEVELS.length-1){actions.innerHTML=`<button class="victory-primary" onclick="startMaze(${levelIndex+2})">Niveau suivant →</button><button class="victory-secondary" onclick="home()">Retour au royaume</button>`}
    else{actions.innerHTML=`<button class="victory-primary" onclick="startMaze(1)">Rejouer l’aventure</button><button class="victory-secondary" onclick="home()">Retour au royaume</button>`}
  }

  const keyMap={ArrowUp:'up',w:'up',z:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',q:'left',ArrowRight:'right',d:'right'};
  const keyHandler=e=>{const dir=keyMap[e.key];if(dir){e.preventDefault();tryMove(dir)}};
  window.addEventListener('keydown',keyHandler,{passive:false});
  const buttons=[...document.querySelectorAll('[data-dir]')];
  buttons.forEach(btn=>{
    const go=e=>{e.preventDefault();tryMove(btn.dataset.dir)};
    btn.addEventListener('pointerdown',go,{passive:false});
  });

  let startX=0,startY=0;
  const canvas=renderer.domElement;
  const swipeStart=e=>{startX=e.clientX;startY=e.clientY};
  const swipeEnd=e=>{const dx=e.clientX-startX,dy=e.clientY-startY;if(Math.max(Math.abs(dx),Math.abs(dy))<35)return;if(Math.abs(dx)>Math.abs(dy))tryMove(dx>0?'right':'left');else tryMove(dy>0?'down':'up')};
  canvas.addEventListener('pointerdown',swipeStart); canvas.addEventListener('pointerup',swipeEnd);

  const clock=new THREE.Clock();
  let raf=0;
  function animate(){
    raf=requestAnimationFrame(animate);
    const t=clock.getElapsedTime();
    fireflies.rotation.y=t*.018;
    pm.opacity=.62+Math.sin(t*2)*.15;
    dragon.position.y=Math.sin(t*2.1)*.08;
    wl.rotation.z=Math.sin(t*3)*.28; wr.rotation.z=-Math.sin(t*3)*.28;
    dragonLight.intensity=9+Math.sin(t*3)*3;
    crystalMeshes.forEach((m,i)=>{if(m.visible){m.rotation.y=t*(1.4+i*.18);m.position.y=.76+Math.sin(t*2.5+i)*.16}});
    wandStar.rotation.y=t*2.7; wandStar.rotation.x=t*1.8;

    if(moving){
      princess.position.lerp(target,.22);
      princess.position.y=Math.abs(Math.sin(t*11))*.12;
      if(princess.position.distanceTo(target)<.06){princess.position.copy(target);moving=false;checkCollectibles();if(pos.r===goal.r&&pos.c===goal.c)setTimeout(win,260)}
    } else princess.position.y=Math.sin(t*3)*.035;

    const behind=new THREE.Vector3(0,5.4,6.7).applyAxisAngle(new THREE.Vector3(0,1,0),facing);
    const desired=princess.position.clone().add(behind);
    camera.position.lerp(desired,.075);
    const look=princess.position.clone().add(new THREE.Vector3(0,1.05,0));
    camera.lookAt(look);
    renderer.render(scene,camera);
  }
  animate();

  const onResize=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)};
  window.addEventListener('resize',onResize);

  state.sceneCleanup=()=>{
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown',keyHandler);
    window.removeEventListener('resize',onResize);
    canvas.removeEventListener('pointerdown',swipeStart); canvas.removeEventListener('pointerup',swipeEnd);
    renderer.dispose();
    scene.traverse(o=>{if(o.geometry)o.geometry.dispose?.();if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose?.())}});
    container.innerHTML='';
  };
}

window.home = home;
home();
