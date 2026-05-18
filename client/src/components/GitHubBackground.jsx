import { useEffect, useRef } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

const GH_PATH = `M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z`;


const GitHubLogo3D = ({ size = 100 }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    mount.appendChild(renderer.domElement);

    
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 12);

   
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    const key = new THREE.DirectionalLight(0xffffff, 5.0);
    key.position.set(5, 7, 10);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x6699ff, 1.6);
    rim.position.set(-6, -3, -8);
    scene.add(rim);

    const warm = new THREE.DirectionalLight(0xffd090, 0.5);
    warm.position.set(0, -8, 4);
    scene.add(warm);

  
    const mat = new THREE.MeshStandardMaterial({
      color:     0x1a1f2e,
      metalness: 0.92,
      roughness: 0.08,
    });

   
    const loader  = new SVGLoader();
    const svgData = loader.parse(
      `<svg viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg"><path d="${GH_PATH}"/></svg>`,
    );

    const group = new THREE.Group();
    svgData.paths.forEach((path) => {
      SVGLoader.createShapes(path).forEach((shape) => {
        const geo = new THREE.ExtrudeGeometry(shape, {
          depth:          6,
          bevelEnabled:   true,
          bevelSize:      0.5,
          bevelThickness: 0.5,
          bevelSegments:  4,
        });
        group.add(new THREE.Mesh(geo, mat));
      });
    });

   
    const localBox = new THREE.Box3();
    group.children.forEach((mesh) => {
      mesh.geometry.computeBoundingBox();
      localBox.union(mesh.geometry.boundingBox);
    });
    const localCenter = localBox.getCenter(new THREE.Vector3());
    
    group.children.forEach((mesh) => {
      mesh.geometry.translate(
        -localCenter.x,
        -localCenter.y,
        -localCenter.z,
      );
    });

    
    const SCALE = 0.052;
    group.scale.set(SCALE, -SCALE, SCALE);
    scene.add(group);
   
    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      group.rotation.y += 0.012;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [size]);

  return (
    <div
      ref={mountRef}
      style={{ width: size, height: size, display: "block", lineHeight: 0 }}
    />
  );
};

export default GitHubLogo3D;
