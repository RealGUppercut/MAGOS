import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface STLPreviewProps {
  file: File | null; // STL file to preview
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
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = ""; // Clear previous renders
    container.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(7, 3, 7);

    // Resize handling
    const onWindowResize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onWindowResize);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 1); // Soft light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.top = 4;
    directionalLight.shadow.camera.bottom = -4;
    directionalLight.shadow.camera.left = -4;
    directionalLight.shadow.camera.right = 4;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 40;
    directionalLight.shadow.bias = -0.002;
    directionalLight.position.set(0, 20, 20);
    scene.add(directionalLight);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // STL Loader
    const loader = new STLLoader();
    const reader = new FileReader();

    reader.onload = (event) => {
      if (!event.target?.result) return;

      const geometry = loader.parse(event.target.result as ArrayBuffer);

      const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
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

    // Cleanup
    return () => {
      window.removeEventListener("resize", onWindowResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
      scene.clear();
    };
  }, [file]);

  return (
    <div
      ref={containerRef}
      style={{ width: "50%%", height: "275px", border: "1px solid #ccc" }}
    />
  );
};

export default STLPreview;
