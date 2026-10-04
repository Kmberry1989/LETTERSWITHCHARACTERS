'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { ClawPrizeDefinition } from '@/lib/claw-crane';

function fitPreview(object: THREE.Object3D) {
  const bounds = new THREE.Box3().setFromObject(object);
  const size = bounds.getSize(new THREE.Vector3());
  const scale = 2.1 / (Math.max(size.x, size.y, size.z) || 1);
  object.scale.multiplyScalar(scale);
  const nextBounds = new THREE.Box3().setFromObject(object);
  const center = nextBounds.getCenter(new THREE.Vector3());
  object.position.sub(center);
  object.position.y -= nextBounds.min.y;
}

export default function ClawPrizePreview({
  prize,
  visible,
}: {
  prize: ClawPrizeDefinition;
  visible: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!visible || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(canvas.clientWidth || 280, canvas.clientHeight || 220, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, (canvas.clientWidth || 280) / (canvas.clientHeight || 220), 0.1, 20);
    camera.position.set(3.2, 2.5, 4.6);
    camera.lookAt(0, 1, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8b5cf6, 2.5));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(4, 6, 3);
    scene.add(light);
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.35, 0.18, 40),
      new THREE.MeshStandardMaterial({
        color: prize.previewColor,
        roughness: 0.45,
        metalness: 0.25,
      })
    );
    pedestal.position.y = -0.08;
    scene.add(pedestal);
    let model: THREE.Object3D | null = null;
    let raf = 0;
    let disposed = false;
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.load(
      prize.modelUrl,
      (gltf) => {
        if (disposed) return;
        model = gltf.scene;
        fitPreview(model);
        model.position.y = 0.06;
        scene.add(model);
      },
      undefined,
      (error) => console.error(`Could not preview ${prize.name}:`, error)
    );
    const animate = () => {
      if (disposed) return;
      if (model) model.rotation.y += 0.008;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) material.dispose();
      });
      renderer.dispose();
      dracoLoader.dispose();
    };
  }, [prize, visible]);

  return <canvas ref={canvasRef} className="h-56 w-full" aria-label={`${prize.name} prize preview`} />;
}
