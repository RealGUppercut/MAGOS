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

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    container.innerHTML = ""; // Clear previous renders
    container.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(7, 7, 7);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // OrbitControls for camera movement
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.2;
    controls.screenSpacePanning = true; // Enable panning
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.LEFT, // Rotate the object
      MIDDLE: THREE.MOUSE.MIDDLE, // Pan the camera
      RIGHT: THREE.MOUSE.RIGHT, // Pan the camera
    };

    // Allow rotation only on specific input
    let isRotatingObject = false;
    let lastMousePosition = new THREE.Vector2();

    const onMouseDown = (event: MouseEvent) => {
      if (event.button === 0 && event.shiftKey === false) {
        // Left-click without shift for object rotation
        isRotatingObject = true;
        lastMousePosition.set(event.clientX, event.clientY);
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (isRotatingObject && mesh) {
        const deltaX = event.clientX - lastMousePosition.x;
        const deltaY = event.clientY - lastMousePosition.y;

        // Rotate the object
        mesh.rotation.y += deltaX * 0.01;
        mesh.rotation.x += deltaY * 0.01;

        lastMousePosition.set(event.clientX, event.clientY);
      }
    };

    const onMouseUp = () => {
      isRotatingObject = false;
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);

    let mesh: THREE.Mesh | null = null; // Placeholder for the object

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);

    // STL Loader
    const loader = new STLLoader();
    const reader = new FileReader();

    reader.onload = (event) => {
      if (!event.target?.result) return;

      // Load geometry from STL file
      const geometry = loader.parse(event.target.result as ArrayBuffer);

      // Material for the model
      const material = new THREE.MeshPhysicalMaterial({
        color: 0x0077ff, // Default color
        metalness: 0.5,
        roughness: 0.4,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      });

      // Increase brightness by 30%
      const color = new THREE.Color(0x0077ff); // Original color
      color.multiplyScalar(2.5); // Scale RGB values by 1.3 (30% brighter)
      material.color = color;

      mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Center the model
      const boundingBox = new THREE.Box3().setFromObject(mesh);
      const center = boundingBox.getCenter(new THREE.Vector3());
      const size = boundingBox.getSize(new THREE.Vector3());
      mesh.position.x -= center.x;
      mesh.position.y -= center.y;
      mesh.position.z -= center.z;

      // Adjust camera
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      const cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
      camera.position.set(center.x, center.y, cameraZ);
      controls.target.copy(center);
      controls.update();

      scene.add(mesh);
    };

    reader.readAsArrayBuffer(file);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
      container.removeChild(renderer.domElement);
      renderer.dispose();
      scene.clear();
    };
  }, [file]);

  return (
    <div
      ref={containerRef}
      style={{ width: "50%%", height: "200px", border: "1px solid #ccc" }}
    />
  );
};

export default STLPreview;
