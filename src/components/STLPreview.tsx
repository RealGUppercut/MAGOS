import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface STLPreviewProps {
  file: File | null;
}

const STLPreview: React.FC<STLPreviewProps> = ({ file }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file || !containerRef.current) return;

    const container = containerRef.current;

    // Renderer with tone mapping and shadow support
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // For realistic tone mapping
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = ""; // Clear previous renders
    container.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0); // Light gray background

    // Fog for better depth perception
    scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(7, 7, 10);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Softer ambient light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true; // Enable shadows
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    // Ground plane for context
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true; // Ground receives shadows
    scene.add(ground);

    // Orbit controls for interactivity
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // STL Loader
    const loader = new STLLoader();
    const reader = new FileReader();

    reader.onload = (event) => {
      if (!event.target?.result) return;

      // Parse the STL file
      const geometry = loader.parse(event.target.result as ArrayBuffer);

      // Material for the STL object
      const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true; // Enable shadow casting for the model
      mesh.receiveShadow = true; // Enable shadow receiving for the model
      scene.add(mesh);

      // Adjust camera and controls
      const boundingBox = new THREE.Box3().setFromObject(mesh);
      const center = boundingBox.getCenter(new THREE.Vector3());
      const size = boundingBox.getSize(new THREE.Vector3());

      camera.position.set(center.x, center.y, size.z * 3);
      controls.target.copy(center);
      controls.update();
    };

    reader.readAsArrayBuffer(file);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      container.removeChild(renderer.domElement);
      renderer.dispose();
      scene.clear();
    };
  }, [file]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "400px", border: "1px solid #ccc" }}
    />
  );
};

export default STLPreview;
