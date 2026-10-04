'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type MutableRefObject,
} from 'react';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  CLAW_PRIZE_BY_ID,
  type ClawGameSnapshot,
  type ClawPhase,
  type ClawPlay,
} from '@/lib/claw-crane';

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}

type SceneResult = {
  kind: 'win' | 'miss';
  prizeId: string | null;
  score: number;
};

type ClawCraneSceneProps = {
  stockedPrizeIds: string[];
  practice: boolean;
  tokens: number | 'unlimited';
  berries: number | null;
  onReady: () => void;
  onPhaseChange: (phase: ClawPhase) => void;
  onDropRequested: () => void;
  onResolved: (result: SceneResult) => void;
};

export type ClawCraneSceneHandle = {
  setInput: (x: number, z: number) => void;
  getPosition: () => { x: number; z: number };
  startDrop: (play?: ClawPlay | null) => boolean;
  getSnapshot: () => ClawGameSnapshot;
};

type PrizeObject = {
  id: string;
  mesh: THREE.Group;
  body: CANNON.Body;
};

type EngineCallbacks = Pick<
  ClawCraneSceneProps,
  'onReady' | 'onPhaseChange' | 'onDropRequested' | 'onResolved'
>;

const FIXED_STEP = 1 / 60;
const GANTRY_Y = 6.15;
const CLAW_HOME_Y = 5.05;
const CLAW_BOTTOM_Y = 1.45;
const X_LIMIT = 3.05;
const Z_LIMIT = 2.7;
const CHUTE_X = -2.55;
const CHUTE_Z = 2.28;
const DEFAULT_CAMERA_YAW = 0.668;
const DEFAULT_CAMERA_PITCH = 0.324;
const CAMERA_TARGET_Y = 3.15;
const CAMERA_MIN_YAW = -0.38;
const CAMERA_MAX_YAW = 1.48;
const CAMERA_MIN_PITCH = 0.18;
const CAMERA_MAX_PITCH = 0.62;
const CAMERA_MIN_ZOOM = 0.68;
const CAMERA_MAX_ZOOM = 1.32;

function makeBox(
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  position: [number, number, number]
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeCylinder(
  radius: number,
  height: number,
  material: THREE.Material,
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
  segments = 18
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function fitModel(object: THREE.Object3D, targetSize: number) {
  const bounds = new THREE.Box3().setFromObject(object);
  const size = bounds.getSize(new THREE.Vector3());
  const largest = Math.max(size.x, size.y, size.z) || 1;
  object.scale.multiplyScalar(targetSize / largest);
  const fittedBounds = new THREE.Box3().setFromObject(object);
  const center = fittedBounds.getCenter(new THREE.Vector3());
  object.position.sub(center);
}

function seededValue(seed: number, index: number) {
  let state = (seed ^ (index * 2654435761)) >>> 0;
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  return (state >>> 0) / 4294967295;
}

class ClawCraneEngine {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  readonly renderer: THREE.WebGLRenderer;
  readonly world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
  readonly loader = new GLTFLoader();
  readonly dracoLoader = new DRACOLoader();
  readonly bridge = new THREE.Group();
  readonly carriage = new THREE.Group();
  readonly clawSwing = new THREE.Group();
  readonly clawVisual = new THREE.Group();
  readonly cable: THREE.Mesh;
  readonly wheelMeshes: THREE.Mesh[] = [];
  readonly fingerPivots: THREE.Group[] = [];
  readonly prizes: PrizeObject[] = [];
  readonly fillers: Array<{ mesh: THREE.Mesh; body: CANNON.Body; color: string }> = [];
  readonly callbacks: MutableRefObject<EngineCallbacks>;
  readonly runtime: MutableRefObject<{
    practice: boolean;
    tokens: number | 'unlimited';
    berries: number | null;
  }>;
  readonly container: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly clawBody = new CANNON.Body({ type: CANNON.Body.KINEMATIC, mass: 0 });

  phase: ClawPhase = 'loading';
  carriageX = 0;
  carriageZ = 0;
  velocityX = 0;
  velocityZ = 0;
  inputX = 0;
  inputZ = 0;
  clawY = CLAW_HOME_Y;
  fingerOpen = 1;
  phaseTime = 0;
  elapsed = 0;
  lastTimestamp = 0;
  raf = 0;
  disposed = false;
  ready = false;
  captured: PrizeObject | null = null;
  gripConstraint: CANNON.LockConstraint | null = null;
  gripStrength = 0;
  playId: string | null = null;
  lastResult: SceneResult | null = null;
  resizeObserver: ResizeObserver | null = null;
  keys = new Set<string>();
  activeViewPointers = new Map<number, { x: number; y: number }>();
  cameraYaw = DEFAULT_CAMERA_YAW;
  cameraPitch = DEFAULT_CAMERA_PITCH;
  cameraZoom = 1;
  baseCameraDistance = 16.54;
  lastGestureCenter: { x: number; y: number } | null = null;
  lastGestureDistance = 0;

  constructor(
    canvas: HTMLCanvasElement,
    container: HTMLElement,
    stockedPrizeIds: string[],
    callbacks: MutableRefObject<EngineCallbacks>,
    runtime: MutableRefObject<{ practice: boolean; tokens: number | 'unlimited'; berries: number | null }>
  ) {
    this.canvas = canvas;
    this.container = container;
    this.callbacks = callbacks;
    this.runtime = runtime;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.scene.background = new THREE.Color(0xffeee9);
    this.scene.fog = new THREE.Fog(0xffeee9, 18, 35);
    this.world.allowSleep = true;
    this.world.defaultContactMaterial.friction = 0.55;
    this.world.defaultContactMaterial.restitution = 0.08;
    this.clawBody.addShape(new CANNON.Sphere(0.32));
    this.world.addBody(this.clawBody);
    this.dracoLoader.setDecoderPath('/draco/');
    this.loader.setDRACOLoader(this.dracoLoader);

    const cableMaterial = new THREE.MeshStandardMaterial({
      color: 0x253046,
      metalness: 0.7,
      roughness: 0.35,
    });
    this.cable = makeCylinder(0.035, 1, cableMaterial, [0, -0.5, 0]);
    this.carriage.add(this.cable);
    this.carriage.add(this.clawSwing);
    this.clawSwing.add(this.clawVisual);

    this.buildEnvironment();
    this.buildPhysicsBounds();
    void this.loadAssets(stockedPrizeIds);
    this.installEvents();
    this.resize();
    this.raf = requestAnimationFrame(this.animate);
  }

  buildEnvironment() {
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xf9d8d6,
      roughness: 0.86,
      metalness: 0.02,
    });
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0xff5d8f,
      roughness: 0.38,
      metalness: 0.28,
    });
    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      roughness: 0.32,
      metalness: 0.45,
    });
    const steelMaterial = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.24,
      metalness: 0.9,
    });
    const darkSteelMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.3,
      metalness: 0.82,
    });
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdff7ff,
      transparent: true,
      opacity: 0.13,
      roughness: 0.05,
      metalness: 0,
      transmission: 0.3,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const ledMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x67e8f9,
      emissiveIntensity: 2.1,
      roughness: 0.25,
    });

    const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), floorMaterial);
    backdrop.rotation.x = -Math.PI / 2;
    backdrop.position.y = -0.05;
    backdrop.receiveShadow = true;
    this.scene.add(backdrop);

    const cabinet = new THREE.Group();
    cabinet.position.y = 0.2;
    this.scene.add(cabinet);

    cabinet.add(makeBox(8.2, 0.48, 7.6, frameMaterial, [0, 0.15, 0]));
    cabinet.add(makeBox(8.5, 0.44, 0.44, frameMaterial, [0, 6.42, -3.78]));
    cabinet.add(makeBox(8.5, 0.44, 0.44, frameMaterial, [0, 6.42, 3.78]));
    cabinet.add(makeBox(0.44, 0.44, 7.2, frameMaterial, [-4.03, 6.42, 0]));
    cabinet.add(makeBox(0.44, 0.44, 7.2, frameMaterial, [4.03, 6.42, 0]));
    cabinet.add(makeBox(8.35, 1.05, 0.6, frameMaterial, [0, 6.98, -3.65]));
    cabinet.add(makeBox(5.6, 0.18, 0.15, ledMaterial, [0, 6.98, -4]));
    cabinet.add(makeBox(8.45, 1.15, 1.05, frameMaterial, [0, 0.05, 4.08]));

    for (const x of [-4, 4]) {
      for (const z of [-3.7, 3.7]) {
        cabinet.add(makeBox(0.35, 6.3, 0.35, frameMaterial, [x, 3.2, z]));
        cabinet.add(makeCylinder(0.065, 5.8, ledMaterial, [x * 0.985, 3.2, z * 0.985]));
      }
    }

    cabinet.add(makeBox(7.7, 5.8, 0.08, glassMaterial, [0, 3.25, -3.67]));
    cabinet.add(makeBox(0.08, 5.8, 7.1, glassMaterial, [-3.97, 3.25, 0]));
    cabinet.add(makeBox(0.08, 5.8, 7.1, glassMaterial, [3.97, 3.25, 0]));

    const chute = makeBox(1.55, 0.2, 1.35, darkSteelMaterial, [CHUTE_X, 0.52, CHUTE_Z]);
    cabinet.add(chute);
    const chuteOpening = makeBox(
      1.22,
      0.08,
      1.02,
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }),
      [CHUTE_X, 0.64, CHUTE_Z]
    );
    cabinet.add(chuteOpening);
    cabinet.add(makeBox(1.75, 0.2, 0.18, trimMaterial, [CHUTE_X, 0.7, CHUTE_Z + 0.68]));

    for (const x of [-3.15, 3.15]) {
      cabinet.add(makeBox(0.18, 0.16, 6.35, steelMaterial, [x, 5.82, 0]));
      cabinet.add(makeBox(0.32, 0.1, 6.55, darkSteelMaterial, [x, 5.7, 0]));
    }

    this.bridge.position.set(0, GANTRY_Y, 0);
    cabinet.add(this.bridge);
    for (const zOffset of [-0.22, 0.22]) {
      this.bridge.add(makeBox(6.7, 0.18, 0.18, steelMaterial, [0, 0, zOffset]));
    }
    for (const x of [-3.15, 3.15]) {
      for (const z of [-0.26, 0.26]) {
        const wheel = makeCylinder(0.2, 0.13, darkSteelMaterial, [x, -0.16, z], [0, 0, Math.PI / 2]);
        this.bridge.add(wheel);
        this.wheelMeshes.push(wheel);
      }
    }

    this.carriage.position.set(0, 0, 0);
    this.bridge.add(this.carriage);
    this.carriage.add(makeBox(0.95, 0.48, 0.85, trimMaterial, [0, -0.15, 0]));
    this.carriage.add(makeBox(0.68, 0.48, 0.6, darkSteelMaterial, [0, 0.18, 0]));
    const winch = makeCylinder(0.22, 0.55, darkSteelMaterial, [0, 0.28, 0], [0, 0, Math.PI / 2]);
    this.carriage.add(winch);
    for (const x of [-0.38, 0.38]) {
      for (const z of [-0.24, 0.24]) {
        const wheel = makeCylinder(0.13, 0.1, darkSteelMaterial, [x, -0.3, z], [Math.PI / 2, 0, 0]);
        this.carriage.add(wheel);
        this.wheelMeshes.push(wheel);
      }
    }

    this.scene.add(new THREE.HemisphereLight(0xfffbeb, 0x7c3aed, 2.15));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(5, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1536, 1536);
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    this.scene.add(keyLight);
    const interior = new THREE.PointLight(0xffd8a8, 26, 18, 1.7);
    interior.position.set(0, 5.4, 0);
    this.scene.add(interior);
    const cyanFill = new THREE.PointLight(0x67e8f9, 12, 14, 2);
    cyanFill.position.set(-4, 4, 3);
    this.scene.add(cyanFill);
  }

  buildPhysicsBounds() {
    const addStaticBox = (
      halfExtents: [number, number, number],
      position: [number, number, number]
    ) => {
      const body = new CANNON.Body({ mass: 0, type: CANNON.Body.STATIC });
      body.addShape(new CANNON.Box(new CANNON.Vec3(...halfExtents)));
      body.position.set(...position);
      this.world.addBody(body);
    };
    addStaticBox([4, 0.25, 3.6], [0, 0.28, 0]);
    addStaticBox([0.18, 3.2, 3.6], [-3.82, 3.2, 0]);
    addStaticBox([0.18, 3.2, 3.6], [3.82, 3.2, 0]);
    addStaticBox([4, 3.2, 0.18], [0, 3.2, -3.42]);
    addStaticBox([4, 3.2, 0.18], [0, 3.2, 3.42]);
  }

  async loadClaw() {
    const hubPromise = this.loader.loadAsync('/claw/ClawHub.glb');
    const fingerPromise = this.loader.loadAsync('/claw/Finger.glb');
    try {
      const [hubGltf, fingerGltf] = await Promise.all([hubPromise, fingerPromise]);
      const hub = hubGltf.scene;
      fitModel(hub, 0.82);
      hub.position.y = 0.08;
      this.clawVisual.add(hub);
      for (let index = 0; index < 3; index += 1) {
        const radial = new THREE.Group();
        radial.rotation.y = index * ((Math.PI * 2) / 3);
        const pivot = new THREE.Group();
        pivot.position.set(0.25, -0.12, 0);
        const finger = fingerGltf.scene.clone(true);
        fitModel(finger, 1.15);
        finger.position.set(0.18, -0.55, 0);
        pivot.add(finger);
        radial.add(pivot);
        this.clawVisual.add(radial);
        this.fingerPivots.push(pivot);
      }
    } catch {
      const fallback = await this.loader.loadAsync('/claw/custom_claw.glb');
      fitModel(fallback.scene, 1.5);
      fallback.scene.position.y = -0.2;
      this.clawVisual.add(fallback.scene);
    }
  }

  async loadAssets(stockedPrizeIds: string[]) {
    try {
      this.addBallBed(28);
      await this.loadClaw();
      await Promise.all(
        stockedPrizeIds.map(async (id, index) => {
          const definition = CLAW_PRIZE_BY_ID[id];
          if (!definition) return;
          const gltf = await this.loader.loadAsync(definition.modelUrl);
          const model = gltf.scene;
          fitModel(model, 0.95 * definition.scale);
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              for (const material of materials) {
                if ('roughness' in material) {
                  (material as THREE.MeshStandardMaterial).roughness = 0.72;
                }
              }
            }
          });
          const mesh = new THREE.Group();
          mesh.add(model);
          const row = Math.floor(index / 4);
          const column = index % 4;
          const jitterX = (seededValue(1709, index) - 0.5) * 0.28;
          const jitterZ = (seededValue(3911, index) - 0.5) * 0.32;
          const x = -2.2 + column * 1.45 + jitterX;
          const z = -1.65 + row * 1.45 + jitterZ;
          const y = 1.46 + row * 0.08;
          const body = new CANNON.Body({
            mass: 0.72,
            shape: new CANNON.Box(
              new CANNON.Vec3(
                definition.collider[0],
                definition.collider[1],
                definition.collider[2]
              )
            ),
            position: new CANNON.Vec3(x, y, z),
            linearDamping: 0.44,
            angularDamping: 0.7,
            sleepSpeedLimit: 0.08,
            sleepTimeLimit: 0.8,
          });
          body.quaternion.setFromEuler(0, seededValue(5723, index) * Math.PI * 2, 0);
          mesh.position.set(x, y, z);
          this.scene.add(mesh);
          this.world.addBody(body);
          this.prizes.push({ id, mesh, body });
        })
      );
      this.ready = true;
      this.setPhase('ready');
      this.callbacks.current.onReady();
    } catch (error) {
      console.error('Prize crane asset loading failed:', error);
      this.ready = true;
      this.setPhase('ready');
      this.callbacks.current.onReady();
    }
  }

  addBallBed(count: number) {
    const colors = [
      0x38bdf8,
      0xfb7185,
      0xfacc15,
      0xa78bfa,
      0x4ade80,
      0xfb923c,
      0x2dd4bf,
      0xf472b6,
    ];
    let added = 0;
    let slot = 0;
    while (added < count && slot < 40) {
      const column = slot % 6;
      const row = Math.floor(slot / 6);
      const jitterX = (seededValue(811, slot) - 0.5) * 0.16;
      const jitterZ = (seededValue(1217, slot) - 0.5) * 0.16;
      const x = -3 + column * 1.2 + jitterX;
      const z = -2.38 + row * 1.03 + jitterZ;
      slot += 1;
      if (x < -1.55 && z > 1.25) continue;
      const color = colors[added % colors.length];
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.34,
        metalness: 0.04,
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.33, 18, 14), material);
      const y = 0.86 + (added % 3) * 0.025;
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      const body = new CANNON.Body({
        mass: 0.24,
        shape: new CANNON.Sphere(0.33),
        position: new CANNON.Vec3(x, y, z),
        linearDamping: 0.5,
        angularDamping: 0.58,
        sleepSpeedLimit: 0.06,
        sleepTimeLimit: 0.65,
      });
      this.world.addBody(body);
      this.fillers.push({ mesh, body, color: `#${color.toString(16).padStart(6, '0')}` });
      added += 1;
    }
  }

  installEvents() {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(key)) {
        event.preventDefault();
      }
      this.keys.add(key);
      if (key === ' ' && !event.repeat) {
        this.callbacks.current.onDropRequested();
      }
      if (key === 'f' && !event.repeat) {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void this.container.requestFullscreen();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      this.keys.delete(event.key.toLowerCase());
    };
    const resetGestureReference = () => {
      const points = [...this.activeViewPointers.values()];
      if (points.length === 0) {
        this.lastGestureCenter = null;
        this.lastGestureDistance = 0;
        return;
      }
      const first = points[0];
      const second = points[1];
      this.lastGestureCenter = second
        ? { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
        : { ...first };
      this.lastGestureDistance = second
        ? Math.hypot(second.x - first.x, second.y - first.y)
        : 0;
    };
    const onPointerDown = (event: PointerEvent) => {
      event.preventDefault();
      this.activeViewPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      try {
        this.canvas.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture can fail if the pointer ends during a browser gesture.
      }
      resetGestureReference();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!this.activeViewPointers.has(event.pointerId)) return;
      event.preventDefault();
      this.activeViewPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const points = [...this.activeViewPointers.values()];
      const first = points[0];
      const second = points[1];
      const center = second
        ? { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
        : first;
      if (this.lastGestureCenter) {
        const rotateScale = second ? 0.0042 : 0.0058;
        this.cameraYaw -= (center.x - this.lastGestureCenter.x) * rotateScale;
        this.cameraPitch += (center.y - this.lastGestureCenter.y) * rotateScale * 0.72;
      }
      if (second) {
        const distance = Math.hypot(second.x - first.x, second.y - first.y);
        if (this.lastGestureDistance > 0 && distance > 4) {
          this.cameraZoom *= this.lastGestureDistance / distance;
        }
        this.lastGestureDistance = distance;
      }
      this.lastGestureCenter = center;
      this.updateCamera();
    };
    const onPointerEnd = (event: PointerEvent) => {
      this.activeViewPointers.delete(event.pointerId);
      resetGestureReference();
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      this.cameraZoom *= Math.exp(event.deltaY * 0.001);
      this.updateCamera();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    this.canvas.addEventListener('pointerdown', onPointerDown);
    this.canvas.addEventListener('pointermove', onPointerMove);
    this.canvas.addEventListener('pointerup', onPointerEnd);
    this.canvas.addEventListener('pointercancel', onPointerEnd);
    this.canvas.addEventListener('wheel', onWheel, { passive: false });
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
    this.container.dataset.keydownCleanup = 'installed';
    (this.container as HTMLElement & { __clawCleanup?: () => void }).__clawCleanup = () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      this.canvas.removeEventListener('pointerdown', onPointerDown);
      this.canvas.removeEventListener('pointermove', onPointerMove);
      this.canvas.removeEventListener('pointerup', onPointerEnd);
      this.canvas.removeEventListener('pointercancel', onPointerEnd);
      this.canvas.removeEventListener('wheel', onWheel);
    };
  }

  updateCamera() {
    this.cameraYaw = clamp(this.cameraYaw, CAMERA_MIN_YAW, CAMERA_MAX_YAW);
    this.cameraPitch = clamp(this.cameraPitch, CAMERA_MIN_PITCH, CAMERA_MAX_PITCH);
    this.cameraZoom = clamp(this.cameraZoom, CAMERA_MIN_ZOOM, CAMERA_MAX_ZOOM);
    const distance = this.baseCameraDistance * this.cameraZoom;
    const horizontalDistance = Math.cos(this.cameraPitch) * distance;
    this.camera.position.set(
      Math.sin(this.cameraYaw) * horizontalDistance,
      CAMERA_TARGET_Y + Math.sin(this.cameraPitch) * distance,
      Math.cos(this.cameraYaw) * horizontalDistance
    );
    this.camera.lookAt(0, CAMERA_TARGET_Y, 0);
    this.camera.updateProjectionMatrix();
  }

  resize() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    if (width / height < 0.82) {
      this.baseCameraDistance = 19.16;
      this.camera.fov = 47;
    } else {
      this.baseCameraDistance = 16.54;
      this.camera.fov = 42;
    }
    this.updateCamera();
  }

  setPhase(phase: ClawPhase) {
    if (this.phase === phase) return;
    this.phase = phase;
    this.phaseTime = 0;
    this.callbacks.current.onPhaseChange(phase);
  }

  setInput(x: number, z: number) {
    this.inputX = THREE.MathUtils.clamp(x, -1, 1);
    this.inputZ = THREE.MathUtils.clamp(z, -1, 1);
  }

  getPosition() {
    return { x: this.carriageX, z: this.carriageZ };
  }

  startDrop(play?: ClawPlay | null) {
    if (!this.ready || (this.phase !== 'ready' && this.phase !== 'aiming')) return false;
    if (play) {
      this.carriageX = clamp(play.clawX, -X_LIMIT, X_LIMIT);
      this.carriageZ = clamp(play.clawZ, -Z_LIMIT, Z_LIMIT);
      this.playId = play.id;
    } else {
      this.playId = `practice-${crypto.randomUUID()}`;
    }
    this.inputX = 0;
    this.inputZ = 0;
    this.lastResult = null;
    this.setPhase('dropping');
    return true;
  }

  findCaptureCandidate() {
    let best: { prize: PrizeObject; distance: number } | null = null;
    for (const prize of this.prizes) {
      if (prize === this.captured || prize.body.position.y < 0.35) continue;
      const dx = prize.body.position.x - this.carriageX;
      const dz = prize.body.position.z - this.carriageZ;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance <= 1.08 && (!best || distance < best.distance)) {
        best = { prize, distance };
      }
    }
    if (!best) return;
    this.gripStrength = THREE.MathUtils.clamp(1 - best.distance / 1.08, 0, 1);
    if (this.gripStrength < 0.16) return;
    this.captured = best.prize;
    this.captured.body.wakeUp();
    this.gripConstraint = new CANNON.LockConstraint(this.clawBody, this.captured.body, {
      maxForce: 750 + this.gripStrength * 1750,
    });
    this.world.addConstraint(this.gripConstraint);
  }

  releaseCapture() {
    if (this.gripConstraint) {
      this.world.removeConstraint(this.gripConstraint);
      this.gripConstraint = null;
    }
    if (this.captured) {
      this.captured.body.velocity.set(0, -0.4, 0);
      this.captured.body.angularVelocity.set(0.2, 0.4, -0.15);
    }
  }

  resolve() {
    const prize = this.captured;
    const won = Boolean(prize);
    const score = won ? Math.round(100 + this.gripStrength * 50) : 0;
    if (prize) {
      this.scene.remove(prize.mesh);
      this.world.removeBody(prize.body);
      const index = this.prizes.indexOf(prize);
      if (index >= 0) this.prizes.splice(index, 1);
    }
    this.releaseCapture();
    this.captured = null;
    const result: SceneResult = {
      kind: won ? 'win' : 'miss',
      prizeId: prize?.id || null,
      score,
    };
    this.lastResult = result;
    this.setPhase('result');
    this.callbacks.current.onResolved(result);
  }

  updateInput(dt: number) {
    if (this.phase !== 'ready' && this.phase !== 'aiming') {
      this.velocityX = THREE.MathUtils.damp(this.velocityX, 0, 10, dt);
      this.velocityZ = THREE.MathUtils.damp(this.velocityZ, 0, 10, dt);
      return;
    }
    const keyboardX =
      Number(this.keys.has('arrowright') || this.keys.has('d')) -
      Number(this.keys.has('arrowleft') || this.keys.has('a'));
    const keyboardZ =
      Number(this.keys.has('arrowdown') || this.keys.has('s')) -
      Number(this.keys.has('arrowup') || this.keys.has('w'));
    const desiredX = Math.abs(keyboardX) > 0 ? keyboardX : this.inputX;
    const desiredZ = Math.abs(keyboardZ) > 0 ? keyboardZ : this.inputZ;
    const moving = Math.abs(desiredX) + Math.abs(desiredZ) > 0.04;
    if (moving && this.phase === 'ready') this.setPhase('aiming');
    if (!moving && this.phase === 'aiming' && Math.abs(this.velocityX) + Math.abs(this.velocityZ) < 0.08) {
      this.setPhase('ready');
    }
    this.velocityX = THREE.MathUtils.damp(this.velocityX, desiredX * 2.45, 9, dt);
    this.velocityZ = THREE.MathUtils.damp(this.velocityZ, desiredZ * 2.2, 9, dt);
    this.carriageX = THREE.MathUtils.clamp(this.carriageX + this.velocityX * dt, -X_LIMIT, X_LIMIT);
    this.carriageZ = THREE.MathUtils.clamp(this.carriageZ + this.velocityZ * dt, -Z_LIMIT, Z_LIMIT);
  }

  updatePhase(dt: number) {
    this.phaseTime += dt;
    if (this.phase === 'dropping') {
      this.fingerOpen = THREE.MathUtils.damp(this.fingerOpen, 1, 10, dt);
      this.clawY = Math.max(CLAW_BOTTOM_Y, this.clawY - 2.45 * dt);
      if (this.clawY <= CLAW_BOTTOM_Y + 0.01) this.setPhase('closing');
    } else if (this.phase === 'closing') {
      this.fingerOpen = Math.max(0, this.fingerOpen - 1.8 * dt);
      if (this.phaseTime >= 0.58) {
        this.findCaptureCandidate();
        this.setPhase('lifting');
      }
    } else if (this.phase === 'lifting') {
      this.clawY = Math.min(CLAW_HOME_Y, this.clawY + 2.25 * dt);
      if (this.clawY >= CLAW_HOME_Y - 0.01) this.setPhase('delivering');
    } else if (this.phase === 'delivering') {
      const dx = CHUTE_X - this.carriageX;
      const dz = CHUTE_Z - this.carriageZ;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance <= 0.06) {
        this.carriageX = CHUTE_X;
        this.carriageZ = CHUTE_Z;
        this.setPhase('releasing');
      } else {
        const speed = Math.min(2.9, distance * 3.2);
        this.carriageX += (dx / distance) * speed * dt;
        this.carriageZ += (dz / distance) * speed * dt;
      }
    } else if (this.phase === 'releasing') {
      this.fingerOpen = Math.min(1, this.fingerOpen + 2.1 * dt);
      if (this.phaseTime >= 0.34 && this.gripConstraint) this.releaseCapture();
      if (this.phaseTime >= 0.92) this.resolve();
    } else if (this.phase === 'result' && this.phaseTime >= 1.6) {
      this.playId = null;
      this.gripStrength = 0;
      this.carriageX = THREE.MathUtils.damp(this.carriageX, 0, 4, dt);
      this.carriageZ = THREE.MathUtils.damp(this.carriageZ, 0, 4, dt);
      if (Math.abs(this.carriageX) + Math.abs(this.carriageZ) < 0.08) {
        this.carriageX = 0;
        this.carriageZ = 0;
        this.setPhase('ready');
      }
    }
  }

  updateVisuals(dt: number) {
    this.bridge.position.z = this.carriageZ;
    this.carriage.position.x = this.carriageX;
    const cableLength = Math.max(0.3, GANTRY_Y - this.clawY);
    this.cable.scale.y = cableLength;
    this.cable.position.y = -cableLength / 2;
    this.clawSwing.position.set(0, -cableLength, 0);
    const motion = Math.sqrt(this.velocityX * this.velocityX + this.velocityZ * this.velocityZ);
    const swayTargetX = THREE.MathUtils.clamp(-this.velocityZ * 0.055, -0.11, 0.11);
    const swayTargetZ = THREE.MathUtils.clamp(this.velocityX * 0.055, -0.11, 0.11);
    this.clawSwing.rotation.x = THREE.MathUtils.damp(this.clawSwing.rotation.x, swayTargetX, 4, dt);
    this.clawSwing.rotation.z = THREE.MathUtils.damp(this.clawSwing.rotation.z, swayTargetZ, 4, dt);
    for (const pivot of this.fingerPivots) {
      pivot.rotation.z = THREE.MathUtils.lerp(0.15, -0.58, this.fingerOpen);
    }
    for (const [index, wheel] of this.wheelMeshes.entries()) {
      wheel.rotation.x += (index < 4 ? this.velocityZ : this.velocityX) * dt * 4;
    }
    const pulse = 1 + Math.sin(this.elapsed * 4) * 0.025;
    this.clawVisual.scale.setScalar(pulse);
    this.clawBody.position.set(this.carriageX, this.clawY - 0.45, this.carriageZ);
    this.clawBody.velocity.set(this.velocityX, 0, this.velocityZ);
    if (motion < 0.02) this.clawBody.velocity.set(0, 0, 0);
  }

  syncPhysics() {
    for (const prize of this.prizes) {
      prize.mesh.position.copy(prize.body.position as unknown as THREE.Vector3);
      prize.mesh.quaternion.copy(prize.body.quaternion as unknown as THREE.Quaternion);
    }
    for (const filler of this.fillers) {
      filler.mesh.position.copy(filler.body.position as unknown as THREE.Vector3);
      filler.mesh.quaternion.copy(filler.body.quaternion as unknown as THREE.Quaternion);
    }
  }

  step(dt = FIXED_STEP, shouldRender = true) {
    if (this.disposed) return;
    this.elapsed += dt;
    this.updateInput(dt);
    this.updatePhase(dt);
    this.updateVisuals(dt);
    this.world.step(FIXED_STEP, dt, 3);
    this.syncPhysics();
    if (shouldRender) this.renderer.render(this.scene, this.camera);
  }

  advance(ms: number) {
    const steps = Math.max(1, Math.min(1800, Math.round(ms / (FIXED_STEP * 1000))));
    for (let index = 0; index < steps; index += 1) {
      this.step(FIXED_STEP, index === steps - 1);
    }
  }

  animate = (timestamp: number) => {
    if (this.disposed) return;
    const delta = this.lastTimestamp
      ? Math.min(0.05, Math.max(FIXED_STEP, (timestamp - this.lastTimestamp) / 1000))
      : FIXED_STEP;
    this.lastTimestamp = timestamp;
    this.step(delta);
    this.raf = requestAnimationFrame(this.animate);
  };

  getSnapshot(): ClawGameSnapshot {
    return {
      mode: 'claw-crane',
      coordinateSystem: 'cabinet center origin; +x right, +y up, +z toward the player',
      phase: this.phase,
      practice: this.runtime.current.practice,
      tokens: this.runtime.current.tokens,
      credits: this.runtime.current.tokens,
      berries: this.runtime.current.berries,
      camera: {
        yaw: Number(this.cameraYaw.toFixed(3)),
        pitch: Number(this.cameraPitch.toFixed(3)),
        zoom: Number(this.cameraZoom.toFixed(3)),
        distance: Number((this.baseCameraDistance * this.cameraZoom).toFixed(2)),
      },
      carriage: {
        x: Number(this.carriageX.toFixed(2)),
        z: Number(this.carriageZ.toFixed(2)),
        velocityX: Number(this.velocityX.toFixed(2)),
        velocityZ: Number(this.velocityZ.toFixed(2)),
      },
      claw: {
        y: Number(this.clawY.toFixed(2)),
        fingerOpen: Number(this.fingerOpen.toFixed(2)),
        capturedPrizeId: this.captured?.id || null,
      },
      fillerBalls: {
        count: this.fillers.length,
        colors: [...new Set(this.fillers.map((filler) => filler.color))],
      },
      visiblePrizes: this.prizes.map((prize) => ({
        id: prize.id,
        x: Number(prize.body.position.x.toFixed(2)),
        y: Number(prize.body.position.y.toFixed(2)),
        z: Number(prize.body.position.z.toFixed(2)),
      })),
      lastResult: this.lastResult
        ? {
            kind: this.lastResult.kind,
            prizeId: this.lastResult.prizeId,
            score: this.lastResult.score,
          }
        : null,
    };
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
    (this.container as HTMLElement & { __clawCleanup?: () => void }).__clawCleanup?.();
    delete window.render_game_to_text;
    delete window.advanceTime;
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) material.dispose();
    });
    for (const constraint of [...this.world.constraints]) this.world.removeConstraint(constraint);
    for (const body of [...this.world.bodies]) this.world.removeBody(body);
    this.renderer.dispose();
    this.dracoLoader.dispose();
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const ClawCraneScene = forwardRef<ClawCraneSceneHandle, ClawCraneSceneProps>(
  function ClawCraneScene(
    {
      stockedPrizeIds,
      practice,
      tokens,
      berries,
      onReady,
      onPhaseChange,
      onDropRequested,
      onResolved,
    },
    forwardedRef
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<ClawCraneEngine | null>(null);
    const callbacksRef = useRef<EngineCallbacks>({
      onReady,
      onPhaseChange,
      onDropRequested,
      onResolved,
    });
    const runtimeRef = useRef({ practice, tokens, berries });
    callbacksRef.current = { onReady, onPhaseChange, onDropRequested, onResolved };
    runtimeRef.current = { practice, tokens, berries };
    const stockKey = stockedPrizeIds.join('|');

    useImperativeHandle(
      forwardedRef,
      () => ({
        setInput: (x, z) => engineRef.current?.setInput(x, z),
        getPosition: () => engineRef.current?.getPosition() || { x: 0, z: 0 },
        startDrop: (play) => engineRef.current?.startDrop(play) || false,
        getSnapshot: () =>
          engineRef.current?.getSnapshot() || {
            mode: 'claw-crane',
            coordinateSystem: 'cabinet center origin; +x right, +y up, +z toward the player',
            phase: 'loading',
            practice,
            tokens,
            credits: tokens,
            berries,
            camera: {
              yaw: DEFAULT_CAMERA_YAW,
              pitch: DEFAULT_CAMERA_PITCH,
              zoom: 1,
              distance: 16.54,
            },
            carriage: { x: 0, z: 0, velocityX: 0, velocityZ: 0 },
            claw: { y: CLAW_HOME_Y, fingerOpen: 1, capturedPrizeId: null },
            fillerBalls: { count: 0, colors: [] },
            visiblePrizes: [],
            lastResult: null,
          },
      }),
      [berries, practice, tokens]
    );

    useEffect(() => {
      if (!canvasRef.current || !containerRef.current) return;
      const engine = new ClawCraneEngine(
        canvasRef.current,
        containerRef.current,
        stockKey ? stockKey.split('|') : [],
        callbacksRef,
        runtimeRef
      );
      engineRef.current = engine;
      window.render_game_to_text = () => JSON.stringify(engine.getSnapshot());
      window.advanceTime = (ms) => engine.advance(ms);
      return () => {
        engineRef.current = null;
        engine.dispose();
      };
    }, [stockKey]);

    return (
      <div
        ref={containerRef}
        className="relative h-full min-h-0 w-full overflow-hidden rounded-[1.35rem] bg-rose-50"
        data-testid="claw-scene"
      >
        <canvas
          ref={canvasRef}
          className="block h-full w-full touch-none cursor-grab active:cursor-grabbing"
          aria-label="3D prize crane cabinet. Drag to rotate the view and pinch to zoom."
        />
      </div>
    );
  }
);

export default ClawCraneScene;
