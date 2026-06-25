import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const NODES = [
  // Core identity
  { id: "Simrat", group: "identity", size: 1.4 },
  // Languages
  { id: "Python", group: "lang", size: 1.0 },
  { id: "C++", group: "lang", size: 0.8 },
  { id: "SQL", group: "lang", size: 0.7 },
  { id: "R", group: "lang", size: 0.7 },
  { id: "JavaScript", group: "lang", size: 0.75 },
  // ML/RL
  { id: "PyTorch", group: "ml", size: 0.95 },
  { id: "TD3", group: "ml", size: 0.9 },
  { id: "PPO", group: "ml", size: 0.9 },
  { id: "XGBoost", group: "ml", size: 0.8 },
  { id: "Scikit-learn", group: "ml", size: 0.75 },
  // Quant
  { id: "Heston Model", group: "quant", size: 0.9 },
  { id: "Monte Carlo", group: "quant", size: 0.85 },
  { id: "Options Pricing", group: "quant", size: 0.85 },
  { id: "Fama-French", group: "quant", size: 0.75 },
  { id: "LOB / SHIFT", group: "quant", size: 0.9 },
  // Platforms
  { id: "FastAPI", group: "platform", size: 0.8 },
  { id: "React", group: "platform", size: 0.75 },
  { id: "D3.js", group: "platform", size: 0.75 },
  { id: "Streamlit", group: "platform", size: 0.7 },
  { id: "Three.js", group: "platform", size: 0.7 },
];

const EDGES = [
  ["Simrat","Python"],["Simrat","C++"],["Simrat","PyTorch"],["Simrat","LOB / SHIFT"],
  ["Simrat","Heston Model"],["Simrat","FastAPI"],["Simrat","React"],
  ["Python","PyTorch"],["Python","XGBoost"],["Python","Scikit-learn"],
  ["Python","Monte Carlo"],["Python","Heston Model"],["Python","Fama-French"],
  ["Python","FastAPI"],["Python","Streamlit"],["Python","D3.js"],
  ["C++","LOB / SHIFT"],["C++","TD3"],
  ["PyTorch","TD3"],["PyTorch","PPO"],
  ["TD3","LOB / SHIFT"],["PPO","LOB / SHIFT"],
  ["Heston Model","Options Pricing"],["Monte Carlo","Options Pricing"],
  ["Options Pricing","Fama-French"],
  ["React","D3.js"],["React","Three.js"],["React","Streamlit"],
  ["FastAPI","Streamlit"],
  ["JavaScript","React"],["JavaScript","D3.js"],["JavaScript","Three.js"],
  ["R","Fama-French"],
  ["SQL","FastAPI"],
];

const GROUP_COLORS = {
  identity: "#ffffff",
  lang:     "#00E5FF",
  ml:       "#00ffcc",
  quant:    "#E8C99A",
  platform: "#aa88ff",
};

export default function SkillsGraph() {
  const mountRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const hoveredRef = useRef(null);

  useEffect(() => { hoveredRef.current = hovered; }, [hovered]);

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
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
    camera.position.set(0, 0, 28);

    // ── FORCE LAYOUT (simple spring simulation) ──
    const nodeCount = NODES.length;
    const pos = NODES.map((n, i) => ({
      x: (Math.random() - 0.5) * 14,
      y: (Math.random() - 0.5) * 10,
      z: (Math.random() - 0.5) * 6,
      vx: 0, vy: 0, vz: 0,
    }));

    function runForce(steps = 120) {
      for (let s = 0; s < steps; s++) {
        // Repulsion
        for (let i = 0; i < nodeCount; i++) {
          for (let j = i + 1; j < nodeCount; j++) {
            const dx = pos[i].x - pos[j].x;
            const dy = pos[i].y - pos[j].y;
            const dz = pos[i].z - pos[j].z;
            const d2 = dx*dx + dy*dy + dz*dz + 0.01;
            const f = 12 / d2;
            pos[i].vx += dx * f; pos[j].vx -= dx * f;
            pos[i].vy += dy * f; pos[j].vy -= dy * f;
            pos[i].vz += dz * f; pos[j].vz -= dz * f;
          }
        }
        // Attraction (edges)
        const idxMap = Object.fromEntries(NODES.map((n, i) => [n.id, i]));
        EDGES.forEach(([a, b]) => {
          const i = idxMap[a], j = idxMap[b];
          if (i === undefined || j === undefined) return;
          const dx = pos[j].x - pos[i].x;
          const dy = pos[j].y - pos[i].y;
          const dz = pos[j].z - pos[i].z;
          const d = Math.sqrt(dx*dx + dy*dy + dz*dz) + 0.01;
          const f = (d - 3.5) * 0.04;
          pos[i].vx += dx/d*f; pos[j].vx -= dx/d*f;
          pos[i].vy += dy/d*f; pos[j].vy -= dy/d*f;
          pos[i].vz += dz/d*f; pos[j].vz -= dz/d*f;
        });
        // Center pull
        pos.forEach(p => {
          p.vx -= p.x * 0.012; p.vy -= p.y * 0.012; p.vz -= p.z * 0.008;
        });
        // Integrate + dampen
        pos.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.z += p.vz;
          p.vx *= 0.82; p.vy *= 0.82; p.vz *= 0.82;
        });
      }
    }
    runForce(200);

    // ── BUILD MESHES ──
    const idxMap = Object.fromEntries(NODES.map((n, i) => [n.id, i]));
    const meshes = [];

    NODES.forEach((node, i) => {
      const color = new THREE.Color(GROUP_COLORS[node.group]);
      const geo = new THREE.SphereGeometry(node.size * 0.38, 16, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: node.group === "identity" ? 0x111111 : color,
        emissive: color,
        emissiveIntensity: node.group === "identity" ? 0.6 : 0.35,
        metalness: 0.7,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos[i].x, pos[i].y, pos[i].z);
      mesh.userData = { nodeId: node.id, group: node.group, baseEmissive: node.group === "identity" ? 0.6 : 0.35 };
      scene.add(mesh);
      meshes.push(mesh);
    });

    // ── EDGES (lines) ──
    const edgeLines = [];
    EDGES.forEach(([a, b]) => {
      const i = idxMap[a], j = idxMap[b];
      if (i === undefined || j === undefined) return;
      const geo = new THREE.BufferGeometry().setFromPoints([
        meshes[i].position.clone(),
        meshes[j].position.clone(),
      ]);
      const mat = new THREE.LineBasicMaterial({
        color: 0x00E5FF, transparent: true, opacity: 0.08,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      edgeLines.push({ line, i, j, mat });
    });

    // ── LIGHTS ──
    scene.add(new THREE.AmbientLight(0x001020, 4));
    const pt = new THREE.PointLight(0x00E5FF, 3, 60);
    pt.position.set(10, 8, 10);
    scene.add(pt);

    // ── MOUSE / DRAG ──
    const mouse2D = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let rotX = 0, rotY = 0;
    const pivot = new THREE.Group();
    scene.add(pivot);
    meshes.forEach(m => pivot.add(m));
    edgeLines.forEach(({ line }) => pivot.add(line));

    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      mouse2D.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse2D.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const dx = e.clientX - prevMouse.x;
        const dy = e.clientY - prevMouse.y;
        rotY += dx * 0.005;
        rotX += dy * 0.005;
        prevMouse = { x: e.clientX, y: e.clientY };
      }
    };
    const onMouseDown = (e) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { isDragging = false; };

    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    // ── ANIMATE ──
    const clock = new THREE.Clock();
    let animId;

    function animate() {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!isDragging) {
        rotY += 0.003;
      }
      pivot.rotation.y = rotY;
      pivot.rotation.x = rotX;

      // Raycasting for hover
      raycaster.setFromCamera(mouse2D, camera);
      const hits = raycaster.intersectObjects(meshes);
      const hit = hits[0]?.object;

      meshes.forEach((m, i) => {
        const isHit = m === hit;
        const base = m.userData.baseEmissive;
        m.material.emissiveIntensity += (isHit ? 1.2 : base + Math.sin(t * 1.5 + i * 0.5) * 0.1 - m.material.emissiveIntensity) * 0.1;
        if (isHit && hoveredRef.current !== m.userData.nodeId) {
          setHovered(m.userData.nodeId);
        }
      });
      if (!hit && hoveredRef.current !== null) setHovered(null);

      // Highlight connected edges on hover
      edgeLines.forEach(({ line, i, j, mat }) => {
        const aId = NODES[i]?.id, bId = NODES[j]?.id;
        const active = hit && (hit.userData.nodeId === aId || hit.userData.nodeId === bId);
        mat.opacity += (active ? 0.5 : 0.08 - mat.opacity) * 0.12;
      });

      pt.position.x = Math.cos(t * 0.3) * 12;
      pt.position.z = Math.sin(t * 0.3) * 12;

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
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  const MONO = "'Space Mono', monospace";
  const hoveredNode = hovered ? NODES.find(n => n.id === hovered) : null;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%", cursor: "grab" }} />

      {/* Legend */}
      <div style={{ position: "absolute", top: 12, left: 12, display: "flex", flexDirection: "column", gap: 4 }}>
        {Object.entries(GROUP_COLORS).map(([g, c]) => (
          <div key={g} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: c, display: "block" }} />
            <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{g}</span>
          </div>
        ))}
      </div>

      {/* Hover label */}
      {hoveredNode && (
        <div style={{
          position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
          fontFamily: MONO, fontSize: 11, letterSpacing: ".12em",
          color: GROUP_COLORS[hoveredNode.group],
          background: "rgba(0,0,15,0.8)", padding: "6px 14px",
          border: `0.5px solid ${GROUP_COLORS[hoveredNode.group]}40`,
          textTransform: "uppercase", pointerEvents: "none",
        }}>
          {hoveredNode.id}
        </div>
      )}

      <div style={{
        position: "absolute", bottom: 12, right: 12,
        fontFamily: MONO, fontSize: 8, color: "rgba(255,255,255,0.2)",
        letterSpacing: ".1em"
      }}>
        DRAG TO ROTATE
      </div>
    </div>
  );
}
