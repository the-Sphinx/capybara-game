import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const NPC_DEFS = [
  {
    id: 'gardener',
    furColor: 0x9B6B3A,   // warm brown
    waypoints: [new THREE.Vector3(-6.5, 0, 2.5), new THREE.Vector3(-9.5, 0, 2.5)],
    speed: 1.2,
    pauseTime: 1.8,
  },
  {
    id: 'student',
    furColor: 0x8BA87A,   // sage green
    waypoints: [new THREE.Vector3(0.0, 0, -4.5), new THREE.Vector3(-4.0, 0, -4.5)],
    speed: 1.0,
    pauseTime: 2.5,
  },
  {
    id: 'traveler',
    furColor: 0xC08878,   // salmon-pink
    waypoints: [new THREE.Vector3(5.5, 0, 3.0), new THREE.Vector3(8.5, 0, 5.5)],
    speed: 1.5,
    pauseTime: 1.0,
  },
];

const npcs = [];

export function initNPCs(scene) {
  const loader = new GLTFLoader();
  for (const def of NPC_DEFS) {
    loader.load(
      `${import.meta.env.BASE_URL}models/characters/capy_idle.glb`,
      (gltf) => {
        const mesh = gltf.scene;
        const furMat = new THREE.MeshStandardMaterial({ color: def.furColor, roughness: 0.85, metalness: 0.0 });
        mesh.traverse((node) => {
          if (!node.isMesh) return;
          node.castShadow = true;
          node.receiveShadow = true;
          const matName = node.material?.name ?? '';
          if (matName === 'mat_eye_white') {
            node.material = new THREE.MeshStandardMaterial({ color: 0xF0EDE8, roughness: 0.25, metalness: 0.0 });
          } else if (matName === 'mat_eye' || matName === 'mat_eye_dark') {
            node.material = new THREE.MeshStandardMaterial({ color: 0x1A1A1F, roughness: 0.05, metalness: 0.0 });
          } else {
            node.material = furMat;
          }
        });

        // Ground offset: -bbox.min.y (matches capy_store GLB pattern)
        const bbox = new THREE.Box3().setFromObject(mesh);
        const groundY = -bbox.min.y;

        const start = def.waypoints[0];
        mesh.position.set(start.x, groundY, start.z);
        scene.add(mesh);

        let mixer = null;
        if (gltf.animations?.length > 0) {
          mixer = new THREE.AnimationMixer(mesh);
          mixer.clipAction(gltf.animations[0]).setLoop(THREE.LoopRepeat).play();
        }

        npcs.push({
          mesh,
          mixer,
          groundY,
          waypoints: def.waypoints,
          wpIndex: 0,
          speed: def.speed,
          pauseTime: def.pauseTime,
          pauseTimer: 0,
          state: 'moving',
          direction: 1,
        });
      },
      undefined,
      (err) => console.warn(`NPC ${def.id} failed to load:`, err)
    );
  }
}

export function updateNPCs(delta) {
  for (const npc of npcs) {
    if (npc.mixer) npc.mixer.update(delta);

    if (npc.state === 'pausing') {
      npc.pauseTimer -= delta;
      if (npc.pauseTimer <= 0) {
        npc.direction *= -1;
        npc.wpIndex = npc.direction > 0
          ? Math.min(npc.waypoints.length - 1, npc.wpIndex + 1)
          : Math.max(0, npc.wpIndex - 1);
        npc.state = 'moving';
      }
      continue;
    }

    const target = npc.waypoints[npc.wpIndex];
    const dx = target.x - npc.mesh.position.x;
    const dz = target.z - npc.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.08) {
      npc.mesh.position.set(target.x, npc.groundY, target.z);
      npc.state = 'pausing';
      npc.pauseTimer = npc.pauseTime;
    } else {
      const step = npc.speed * delta;
      npc.mesh.position.x += (dx / dist) * step;
      npc.mesh.position.z += (dz / dist) * step;
      npc.mesh.rotation.y = Math.atan2(dx, dz);
    }
  }
}
