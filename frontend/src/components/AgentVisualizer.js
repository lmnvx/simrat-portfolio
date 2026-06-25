import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function AgentVisualizer({ position = 0, pnl = 0, regime = "trending" }) {
  const mountRef = useRef(null);
  const stateRef = useRef({ position, pnl, regime });

  useEffect(() => {
    stateRef.current = { position, pnl, regime };
  }, [position, pnl, regime]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, 4.5);

    // Core icosahedron
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x001830,
      emissive: 0x00E5FF,
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.1,
      wireframe: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // Wireframe shell
    const wMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF, wireframe: true, transparent: true, opacity: 0.18
    });
    const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), wMat);
    scene.add(wire);

    // Outer glow ring
    const ringGeo = new THREE.TorusGeometry(1.4, 0.015, 3, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // Second ring
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.008, 3, 80),
      new THREE.MeshBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending })
    );
    ring2.rotation.x = Math.PI / 3;
    scene.add(ring2);

    // Orbiting satellites
    const satellites = [];
    for (let i = 0; i < 6; i++) {
      const sg = new THREE.SphereGeometry(0.06, 8, 8);
      const sm = new THREE.MeshStandardMaterial({ color: 0x00E5FF, emissive: 0x00E5FF, emissiveIntensity: 1 });
      const s = new THREE.Mesh(sg, sm);
      s.userData = { angle: (i / 6) * Math.PI * 2, r: 1.55, speed: 0.008 + i * 0.002 };
      satellites.push(s);
      scene.add(s);
    }

    // Lights
    scene.add(new THREE.AmbientLight(0x001030, 3));
    const pt1 = new THREE.PointLight(0x00E5FF, 4, 10);
    pt1.position.set(3, 2, 3);
    scene.add(pt1);
    const pt2 = new THREE.PointLight(0xE8C99A, 2, 10);
    pt2.position.set(-3, -2, -2);
    scene.add(pt2);

    // Color targets by position
    const COLORS = {
      long:  { core: 0x00ffcc, emissive: 0x00ffcc, wire: 0x00ffcc, ring: 0x00ffcc },
      short: { core: 0x200010, emissive: 0xff4466, wire: 0xff4466, ring: 0xff4466 },
      flat:  { core: 0x001830, emissive: 0x00E5FF, wire: 0x00E5FF, ring: 0x00E5FF },
    };

    const clock = new THREE.Clock();
    let animId;

    function animate() {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const { position: pos, regime: reg } = stateRef.current;

      // Target colors
      const key = pos === 1 ? "long" : pos === -1 ? "short" : "flat";
      const target = COLORS[key];
      mat.color.lerp(new THREE.Color(target.core), 0.04);
      mat.emissive.lerp(new THREE.Color(target.emissive), 0.04);
      wMat.color.lerp(new THREE.Color(target.wire), 0.04);
      ringMat.color.lerp(new THREE.Color(target.ring), 0.04);

      // Rotation speed by regime
      const rotSpeed = reg === "volatile" ? 0.025 : reg === "trending" ? 0.012 : 0.007;
      mesh.rotation.x += rotSpeed;
      mesh.rotation.y += rotSpeed * 1.3;
      wire.rotation.x -= rotSpeed * 0.7;
      wire.rotation.y += rotSpeed * 0.9;

      // Ring orbit
      ring.rotation.z = t * (pos === 1 ? 0.8 : pos === -1 ? -0.8 : 0.3);
      ring2.rotation.y = t * 0.5;

      // Satellites orbit
      satellites.forEach((s, i) => {
        s.userData.angle += s.userData.speed * (reg === "volatile" ? 2.5 : 1);
        s.position.x = Math.cos(s.userData.angle) * s.userData.r;
        s.position.z = Math.sin(s.userData.angle) * s.userData.r;
        s.position.y = Math.sin(s.userData.angle * 2 + i) * 0.4;
        s.material.emissiveIntensity = 0.6 + Math.sin(t * 3 + i) * 0.4;
        s.material.color.lerp(new THREE.Color(target.ring), 0.04);
        s.material.emissive.lerp(new THREE.Color(target.ring), 0.04);
      });

      // Pulse emissive
      mat.emissiveIntensity = 0.3 + Math.sin(t * 1.5) * 0.15;
      ringMat.opacity = 0.25 + Math.sin(t * 2) * 0.1;

      pt1.position.x = Math.cos(t * 0.5) * 3;
      pt1.position.z = Math.sin(t * 0.5) * 3;

      renderer.render(scene, camera);
    }
    animate();

    const ro = new ResizeObserver(() => {
      const w = el.clientWidth, h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
