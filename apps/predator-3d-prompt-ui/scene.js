// ============================================================
// PREDATOR Analytics — Three.js Scene (scene.js)
// Порт 3040 | Standalone (без фреймворків)
// ============================================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// --- Renderer ---
const canvas = document.getElementById('three-canvas');
const W = window.innerWidth, H = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(W, H);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// --- Scene ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000008, 0.016);
scene.background = new THREE.Color(0x000005);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(60, W/H, 0.1, 1000);
camera.position.set(0, 3.5, 11);

// --- Controls ---
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.minDistance = 4;
controls.maxDistance = 24;
controls.maxPolarAngle = Math.PI * 0.76;
controls.target.set(0, 1.5, 0);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;

// --- Post-processing ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.85, 0.5, 0.62);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// === LIGHTING ===
scene.add(new THREE.AmbientLight(0x020408, 4));

const keyLight = new THREE.DirectionalLight(0xff3030, 3.5);
keyLight.position.set(6, 10, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x00e5ff, 2);
fillLight.position.set(-7, 5, -5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffab00, 1.2);
rimLight.position.set(0, -3, -10);
scene.add(rimLight);

const redPt  = new THREE.PointLight(0xff1111, 5, 22);
const cyanPt = new THREE.PointLight(0x00e5ff, 4, 20);
const purPt  = new THREE.PointLight(0xb44aff, 2.5, 16);
redPt.position.set(-4, 2, 1);
cyanPt.position.set(4, 2, -2);
purPt.position.set(0, 6, -6);
scene.add(redPt, cyanPt, purPt);

// === STAR FIELD ===
function makeStars() {
  const geo = new THREE.BufferGeometry();
  const N = 3500;
  const pos = new Float32Array(N*3), col = new Float32Array(N*3);
  for (let i=0;i<N;i++){
    const r=130+Math.random()*180, t=Math.random()*Math.PI*2, p=Math.acos(2*Math.random()-1);
    pos[i*3]=r*Math.sin(p)*Math.cos(t); pos[i*3+1]=r*Math.sin(p)*Math.sin(t); pos[i*3+2]=r*Math.cos(p);
    const c=Math.random();
    if(c<0.6){col[i*3]=0.9;col[i*3+1]=0.9;col[i*3+2]=1.0;}
    else if(c<0.8){col[i*3]=1.0;col[i*3+1]=0.3;col[i*3+2]=0.2;}
    else{col[i*3]=0.2;col[i*3+1]=0.8;col[i*3+2]=1.0;}
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  geo.setAttribute('color', new THREE.BufferAttribute(col,3));
  return new THREE.Points(geo, new THREE.PointsMaterial({size:0.7,vertexColors:true,transparent:true,opacity:0.88}));
}
scene.add(makeStars());

// === NEBULA PLANES ===
[0xff1111,0x4400bb,0x0055ff,0x00aaff,0x8800cc].forEach((c,i)=>{
  const m=new THREE.Mesh(
    new THREE.PlaneGeometry(90,65),
    new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.022+Math.random()*0.04,depthWrite:false,side:THREE.DoubleSide})
  );
  m.position.set((Math.random()-.5)*70,(Math.random()-.5)*45,-65-Math.random()*40);
  m.rotation.z=Math.random()*Math.PI;
  scene.add(m);
});

// === FLOOR — Holo Grid ===
const floorGeo = new THREE.CircleGeometry(20, 64);
const floorMat = new THREE.MeshStandardMaterial({color:0x010208,roughness:0.92,metalness:0.55});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x=-Math.PI/2; floor.position.y=-0.01; floor.receiveShadow=true;
scene.add(floor);

const grid = new THREE.GridHelper(40,40,0xff1111,0x0a0000);
grid.material.opacity=0.12; grid.material.transparent=true;
scene.add(grid);

for(let r=3;r<=18;r+=3){
  const ring=new THREE.Mesh(
    new THREE.RingGeometry(r-0.02,r+0.02,128),
    new THREE.MeshBasicMaterial({color:r%6===0?0xff2020:0x001133,transparent:true,opacity:r%6===0?0.28:0.08,side:THREE.DoubleSide})
  );
  ring.rotation.x=-Math.PI/2; ring.position.y=0.005;
  scene.add(ring);
}

// === THRONE ===
function makeThrone(){
  const g=new THREE.Group();
  const mat=new THREE.MeshStandardMaterial({color:0x1a0808,roughness:0.38,metalness:0.92,emissive:0x330000,emissiveIntensity:0.3});
  const parts=[
    [3.6,0.3,2.6,0,0.15,0],[3.1,0.2,2.1,0,0.4,0],[2.5,0.15,1.9,0,0.575,0],
    [2.5,2.6,0.2,0,1.9,-0.95]
  ];
  parts.forEach(([w,h,d,x,y,z])=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    m.position.set(x,y,z); m.castShadow=true; g.add(m);
  });
  // Arms
  [-1,1].forEach(s=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.72,1.7),mat);
    m.position.set(s*1.15,0.96,0); m.castShadow=true; g.add(m);
  });
  // Emissive stripes
  const acMat=new THREE.MeshStandardMaterial({color:0xff0000,emissive:0xff1111,emissiveIntensity:2.5,transparent:true,opacity:0.75});
  for(let i=0;i<6;i++){
    const m=new THREE.Mesh(new THREE.BoxGeometry(2.4,0.04,0.04),acMat);
    m.position.set(0,0.85+i*0.38,-0.83); g.add(m);
  }
  g.position.set(0,0,-3.5);
  return g;
}
scene.add(makeThrone());

// === HOLO TABLE ===
const tableGroup=new THREE.Group();
tableGroup.add(Object.assign(new THREE.Mesh(
  new THREE.CylinderGeometry(2.1,2.1,0.07,64),
  new THREE.MeshStandardMaterial({color:0x001122,roughness:0.08,metalness:0.96,emissive:0x001144,emissiveIntensity:0.45,transparent:true,opacity:0.88})
),{castShadow:true}));
const disc = new THREE.Mesh(
  new THREE.CylinderGeometry(2.0,2.0,0.02,64),
  new THREE.MeshBasicMaterial({color:0x00e5ff,transparent:true,opacity:0.14,side:THREE.DoubleSide})
);
disc.position.set(0, 0.05, 0);
tableGroup.add(disc);

const base = new THREE.Mesh(
  new THREE.CylinderGeometry(0.15,0.26,1.0,12),
  new THREE.MeshStandardMaterial({color:0x0a0a14,roughness:0.28,metalness:0.96})
);
base.position.set(0, -0.53, 0);
tableGroup.add(base);
tableGroup.position.set(0,0.54,1.8);
scene.add(tableGroup);

// === ORBITAL RING ===
const orbRing=new THREE.Group();
[2.3,2.0].forEach((r,i)=>{
  const m=new THREE.Mesh(
    new THREE.TorusGeometry(r,i===0?0.05:0.02,16,120),
    new THREE.MeshBasicMaterial({color:0x00e5ff,transparent:true,opacity:i===0?0.65:0.22})
  );
  orbRing.add(m);
});
orbRing.rotation.x=-Math.PI/2; orbRing.position.set(0,0.63,1.8);
scene.add(orbRing);

// === PILLARS ===
for(let i=0;i<6;i++){
  const a=(i/6)*Math.PI*2, R=13;
  const pillar=new THREE.Mesh(
    new THREE.CylinderGeometry(0.26,0.36,9,12),
    new THREE.MeshStandardMaterial({color:0x0a0810,roughness:0.5,metalness:0.82})
  );
  pillar.position.set(Math.cos(a)*R,4.5,Math.sin(a)*R);
  pillar.castShadow=true;
  scene.add(pillar);
  // Accent rings on pillar
  const acMat=new THREE.MeshBasicMaterial({color:i%2===0?0xff1111:0x00e5ff});
  for(let j=0;j<4;j++){
    const acc=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,0.1,12),acMat);
    acc.position.set(Math.cos(a)*R,0.8+j*2.2,Math.sin(a)*R);
    scene.add(acc);
  }
  const pl=new THREE.PointLight(i%2===0?0xff1111:0x00e5ff,2,10);
  pl.position.set(Math.cos(a)*R,2,Math.sin(a)*R);
  scene.add(pl);
}

// === LASERS (from Predator helmet) ===
const lasers=[];
[[0xff0000,[1.6,-2.2,4.5],0],[0xff4400,[-1.6,-2.2,4.5],1.2],[0xff8800,[0,-2.2,5.0],2.4]].forEach(([c,t,ph])=>{
  const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(...t)]);
  const mat=new THREE.LineBasicMaterial({color:c,transparent:true,opacity:0});
  const ln=new THREE.Line(geo,mat);
  ln.position.set(0,3.8,-3.5);
  scene.add(ln);
  lasers.push({ln,mat,ph});
});

// === SPACE DUST ===
function makeDust(){
  const N=900, pos=new Float32Array(N*3), vel=[];
  for(let i=0;i<N;i++){
    pos[i*3]=(Math.random()-.5)*32; pos[i*3+1]=Math.random()*10; pos[i*3+2]=(Math.random()-.5)*32;
    vel.push({x:(Math.random()-.5)*0.002,y:(Math.random()-.5)*0.0008,z:(Math.random()-.5)*0.002});
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const pts=new THREE.Points(geo,new THREE.PointsMaterial({size:0.04,color:0x88aaff,transparent:true,opacity:0.4}));
  pts.userData.vel=vel;
  return pts;
}
const dust=makeDust();
scene.add(dust);

// === LOAD MODELS ===
const manager=new THREE.LoadingManager();
const draco=new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
const gltf=new GLTFLoader(manager);
gltf.setDRACOLoader(draco);

let loadCount=0, TOTAL=2; // predator + globe є обов'язкові
function done(){
  loadCount++;
  if(loadCount>=TOTAL){
    document.getElementById('loading-bar').style.width='100%';
    document.getElementById('loading-status').textContent='СИСТЕМА ГОТОВА';
    setTimeout(()=>document.getElementById('loading-screen').classList.add('hidden'),600);
  }
}

manager.onProgress=(u,l,t)=>{
  document.getElementById('loading-bar').style.width=Math.round(l/t*100)+'%';
  document.getElementById('loading-status').textContent='ЗАВАНТАЖЕННЯ: '+u.split('/').pop();
};

const mixers=[], ships=[];

// Predator
gltf.load('./predator.glb',g=>{
  const m=g.scene;
  const box=new THREE.Box3().setFromObject(m);
  const sz=box.getSize(new THREE.Vector3());
  const sc=3.8/Math.max(sz.x,sz.y,sz.z);
  m.scale.setScalar(sc);
  const c=box.getCenter(new THREE.Vector3());
  m.position.set(-c.x*sc,-box.min.y*sc+0.62,-3.5-c.z*sc);
  m.traverse(ch=>{if(ch.isMesh){ch.castShadow=true;ch.receiveShadow=true;}});
  scene.add(m);
  if(g.animations?.length){
    const mx=new THREE.AnimationMixer(m);
    const clip=g.animations.find(a=>/idle|sit|walk/i.test(a.name))||g.animations[0];
    mx.clipAction(clip).play();
    mixers.push(mx);
  }
  done();
},undefined,()=>{
  // Fallback capsule
  const m=new THREE.Mesh(new THREE.CapsuleGeometry(0.65,2.2,8,16),
    new THREE.MeshStandardMaterial({color:0x2a4a2a,roughness:0.38,metalness:0.72,emissive:0x001100,emissiveIntensity:0.3}));
  m.position.set(0,1.6,-3.5); m.castShadow=true; scene.add(m); done();
});

// Spaceship
gltf.load('./spaceship.glb',g=>{
  const tmpl=g.scene;
  const box=new THREE.Box3().setFromObject(tmpl);
  const sc=1.4/Math.max(...box.getSize(new THREE.Vector3()).toArray());
  for(let i=0;i<3;i++){
    const s=tmpl.clone(true); s.scale.setScalar(sc);
    const a=(i/3)*Math.PI*2;
    s.position.copy(new THREE.Vector3(Math.cos(a)*10,3+i*0.6,Math.sin(a)*10));
    s.rotation.y=a+Math.PI;
    s.traverse(c=>{if(c.isMesh)c.castShadow=true;});
    scene.add(s);
    ships.push({m:s,a,r:10+i,h:3+i*0.6,sp:0.0022+i*0.001});
  }
  done();
},undefined,()=>{
  for(let i=0;i<3;i++){
    const g=new THREE.Group();
    const body=new THREE.Mesh(new THREE.ConeGeometry(0.17,0.9,8),
      new THREE.MeshStandardMaterial({color:0x223344,roughness:0.28,metalness:0.92,emissive:0x001122}));
    body.rotation.z=Math.PI/2; g.add(body);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.65,0.03,0.28),
      new THREE.MeshStandardMaterial({color:0x223344,roughness:0.28,metalness:0.92})));
    const el=new THREE.PointLight(0x00e5ff,2,3); el.position.set(-0.5,0,0); g.add(el);
    const a=(i/3)*Math.PI*2;
    g.position.set(Math.cos(a)*10,3+i,Math.sin(a)*10);
    g.rotation.y=a+Math.PI;
    scene.add(g);
    ships.push({m:g,a,r:10+i,h:3+i,sp:0.003+i*0.001});
  }
  done();
});

// Globe
gltf.load('./globe.glb',g=>{
  const m=g.scene;
  const box=new THREE.Box3().setFromObject(m);
  const sc=1.3/Math.max(...box.getSize(new THREE.Vector3()).toArray());
  m.scale.setScalar(sc); m.position.set(0,0.72,1.8);
  scene.add(m);
  if(g.animations?.length){
    const mx=new THREE.AnimationMixer(m);
    g.animations.forEach(c=>mx.clipAction(c).play());
    mixers.push(mx);
  }
  done();
},undefined,()=>{
  const m=new THREE.Mesh(new THREE.SphereGeometry(0.72,32,32),
    new THREE.MeshStandardMaterial({color:0x001133,roughness:0.18,metalness:0.82,emissive:0x002277,emissiveIntensity:0.55}));
  m.position.set(0,0.82,1.8); scene.add(m);
  const w=new THREE.Mesh(new THREE.SphereGeometry(0.74,16,16),
    new THREE.MeshBasicMaterial({color:0x00e5ff,wireframe:true,transparent:true,opacity:0.14}));
  w.position.set(0,0.82,1.8); scene.add(w); done();
});

// Bridge
gltf.load('./bridge.glb',g=>{
  const m=g.scene;
  const box=new THREE.Box3().setFromObject(m);
  const sc=9/Math.max(...box.getSize(new THREE.Vector3()).toArray());
  const c=box.getCenter(new THREE.Vector3());
  m.scale.setScalar(sc);
  m.position.set(-c.x*sc,-box.min.y*sc,-c.z*sc-2.5);
  m.traverse(ch=>{if(ch.isMesh){ch.castShadow=true;ch.receiveShadow=true;}});
  scene.add(m); done();
},undefined,()=>done());


// === FALLBACK: гарантоване закриття loading screen через 5 секунд ===
setTimeout(()=>{
  document.getElementById('loading-bar').style.width='100%';
  document.getElementById('loading-status').textContent='СИСТЕМА ГОТОВА';
  setTimeout(()=>document.getElementById('loading-screen').classList.add('hidden'),600);
}, 5000);

// === ANIMATE ===
const clock=new THREE.Clock();
let t=0;

function animate(){
  requestAnimationFrame(animate);
  t+=0.016;
  const dt=clock.getDelta();
  mixers.forEach(m=>m.update(dt));
  controls.update();

  // Orbital ring
  orbRing.rotation.z=t*0.28;

  // Ships
  ships.forEach(s=>{
    s.a+=s.sp;
    s.m.position.set(Math.cos(s.a)*s.r, s.h+Math.sin(t*0.5+s.a)*0.35, Math.sin(s.a)*s.r);
    s.m.rotation.y=s.a+Math.PI;
  });

  // Lasers flicker
  lasers.forEach(l=>{ l.mat.opacity=Math.max(0,Math.sin(t*1.6+l.ph)*0.55+0.28)*0.75; });

  // Lights pulse
  redPt.intensity=4+Math.sin(t*2.1)*1.2;
  cyanPt.intensity=3.5+Math.sin(t*1.8+1)*0.9;
  bloom.strength=0.72+Math.sin(t*1.3)*0.14;

  // Dust
  const dp=dust.geometry.attributes.position;
  const dv=dust.userData.vel;
  for(let i=0;i<dp.count;i++){
    dp.array[i*3]+=dv[i].x; dp.array[i*3+1]+=dv[i].y; dp.array[i*3+2]+=dv[i].z;
    if(dp.array[i*3+1]>10) dp.array[i*3+1]=0;
    if(dp.array[i*3+1]<0) dp.array[i*3+1]=10;
    if(Math.abs(dp.array[i*3])>16) dv[i].x*=-1;
    if(Math.abs(dp.array[i*3+2])>16) dv[i].z*=-1;
  }
  dp.needsUpdate=true;

  composer.render();
}
animate();

// === RESIZE ===
window.addEventListener('resize',()=>{
  const w=innerWidth,h=innerHeight;
  camera.aspect=w/h; camera.updateProjectionMatrix();
  renderer.setSize(w,h); composer.setSize(w,h);
});

// === EXPORT ===
window.predatorScene={
  camera, controls, scene, bloom,
  focusThrone:()=>{ animCam(0,3.5,11,0,1.5,0,1.5); controls.autoRotate=true; controls.autoRotateSpeed=0.35; },
  focusTable:()=>{ animCam(0,7,5,0,0.5,1.8,1.2); controls.autoRotate=false; },
};

function animCam(tx,ty,tz,lx,ly,lz,dur){
  const sp=camera.position.clone(), ep=new THREE.Vector3(tx,ty,tz);
  const st=controls.target.clone(), et=new THREE.Vector3(lx,ly,lz);
  let p=0;
  const step=()=>{
    p=Math.min(p+0.016/dur,1);
    const e=p<0.5?2*p*p:-1+(4-2*p)*p;
    camera.position.lerpVectors(sp,ep,e);
    controls.target.lerpVectors(st,et,e);
    controls.update();
    if(p<1) requestAnimationFrame(step);
  };
  step();
}
