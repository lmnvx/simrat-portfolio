import { useEffect, useRef } from "react";
import * as THREE from "three";

// lat/lng to 3D sphere point
function latLngToVec3(lat, lng, r) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

// Great-circle arc points
function arcPoints(from, to, r, segments = 60, height = 0.35) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = from.clone().lerp(to.clone(), t).normalize();
    const lift = Math.sin(Math.PI * t) * height;
    pts.push(p.multiplyScalar(r + lift));
  }
  return pts;
}

const CAREER_ARCS = [
  {
    from: { lat: 23.0, lng: 72.6, label: "Ahmedabad" },   // Lendingkart
    to:   { lat: 40.7, lng: -74.0, label: "New York" },
    color: "#E8C99A",
    label: "Lendingkart → Stevens",
  },
  {
    from: { lat: 40.7, lng: -74.0, label: "New York" },
    to:   { lat: 40.74, lng: -74.03, label: "Hoboken" },
    color: "#00E5FF",
    label: "NYC → CRAFT Lab",
  },
  {
    from: { lat: 40.74, lng: -74.03, label: "Hoboken" },
    to:   { lat: 40.72, lng: -74.05, label: "Jersey City" },
    color: "#00ffcc",
    label: "Stevens → Jersey City",
  },
];

const CITIES = [
  { lat: 23.0,  lng: 72.6,   label: "Bangalore",  color: "#E8C99A", role: "Data Scientist @ Lendingkart" },
  { lat: 40.74, lng: -74.03, label: "Hoboken",     color: "#00E5FF", role: "Researcher @ CRAFT Lab" },
  { lat: 40.72, lng: -74.05, label: "Jersey City", color: "#00ffcc", role: "Founder · Job Hunting" },
];

export default function CareerGlobe() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;
    const R = 2.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 1.5, 7);
    camera.lookAt(0, 0, 0);

    // Globe
    const globeGeo = new THREE.SphereGeometry(R, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({
      color: 0x000d1a,
      metalness: 0.5,
      roughness: 0.6,
      transparent: true,
      opacity: 0.85,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Wireframe grid
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF, wireframe: true, transparent: true, opacity: 0.04,
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(R + 0.01, 24, 16), gridMat));

    // Atmosphere glow ring
    const atmGeo = new THREE.SphereGeometry(R + 0.12, 32, 32);
    const atmMat = new THREE.MeshBasicMaterial({
      color: 0x0044aa, transparent: true, opacity: 0.06,
      side: THREE.BackSide, blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Mesh(atmGeo, atmMat));

    // City markers
    CITIES.forEach(city => {
      const pos = latLngToVec3(city.lat, city.lng, R);
      const mg = new THREE.SphereGeometry(0.06, 12, 12);
      const mm = new THREE.MeshStandardMaterial({
        color: city.color, emissive: city.color, emissiveIntensity: 1.2,
      });
      const m = new THREE.Mesh(mg, mm);
      m.position.copy(pos);
      scene.add(m);

      // Pulse ring
      const pg = new THREE.RingGeometry(0.08, 0.12, 32);
      const pm = new THREE.MeshBasicMaterial({
        color: city.color, transparent: true, opacity: 0.5,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      });
      const pulse = new THREE.Mesh(pg, pm);
      pulse.position.copy(pos);
      pulse.lookAt(new THREE.Vector3(0, 0, 0));
      pulse.userData = { baseOpacity: 0.5, phase: Math.random() * Math.PI * 2 };
      scene.add(pulse);
    });

    // Career arcs — animated dashes
    const arcObjects = CAREER_ARCS.map(arc => {
      const from = latLngToVec3(arc.from.lat, arc.from.lng, R);
      const to   = latLngToVec3(arc.to.lat, arc.to.lng, R);
      const pts  = arcPoints(from, to, R, 80, 0.45);
      const geo  = new THREE.BufferGeometry().setFromPoints(pts);
      const mat  = new THREE.LineBasicMaterial({
        color: arc.color, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);

      // Animated dot traveling the arc
      const dotGeo = new THREE.SphereGeometry(0.045, 8, 8);
      const dotMat = new THREE.MeshStandardMaterial({
        color: arc.color, emissive: arc.color, emissiveIntensity: 1.5,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      scene.add(dot);

      return { line, mat, dot, dotMat, pts, color: arc.color, t: Math.random() };
    });

    // Lights
    scene.add(new THREE.AmbientLight(0x001830, 3));
    const sun = new THREE.DirectionalLight(0x4488ff, 1.5);
    sun.position.set(5, 3, 5);
    scene.add(sun);
    const pt = new THREE.PointLight(0x00E5FF, 2, 20);
    pt.position.set(-4, 4, -4);
    scene.add(pt);

    // Slow auto-rotate + drag
    let rotY = 0.3;
    let isDragging = false;
    let prevX = 0;
    const onMouseDown = e => { isDragging = true; prevX = e.clientX; };
    const onMouseUp   = () => { isDragging = false; };
    const onMouseMove = e => {
      if (isDragging) { rotY += (e.clientX - prevX) * 0.005; prevX = e.clientX; }
    };
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mousemove", onMouseMove);

    const clock = new THREE.Clock();
    let animId;

    function animate() {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!isDragging) rotY += 0.003;
      globe.rotation.y = rotY;

      // Fade in arcs + animate dots
      arcObjects.forEach((arc, i) => {
        arc.t = (arc.t + 0.003) % 1;
        arc.mat.opacity = 0.35 + Math.sin(t * 0.5 + i) * 0.15;

        const idx = Math.floor(arc.t * (arc.pts.length - 1));
        const frac = arc.t * (arc.pts.length - 1) - idx;
        const a = arc.pts[idx], b = arc.pts[Math.min(idx + 1, arc.pts.length - 1)];
        arc.dot.position.lerpVectors(a, b, frac);
        // rotate dot with globe
        arc.dot.position.applyEuler(new THREE.Euler(0, rotY - (t - 0) * 0, 0));
        arc.dotMat.emissiveIntensity = 1.2 + Math.sin(t * 4 + i) * 0.5;
      });

      // Pulse city rings
      scene.children.forEach(obj => {
        if (obj.userData.phase !== undefined) {
          obj.material.opacity = 0.3 + Math.sin(t * 2 + obj.userData.phase) * 0.25;
          const s = 1 + Math.sin(t * 2 + obj.userData.phase) * 0.3;
          obj.scale.setScalar(s);
        }
      });

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
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("mousemove", onMouseMove);
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  const MONO = "'Space Mono', monospace";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%", cursor: "grab" }} />
      <div style={{ position: "absolute", bottom: 12, left: 12 }}>
        {CITIES.map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.color, display: "block" }} />
            <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: ".1em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
              {c.label} — {c.role}
            </span>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", bottom: 12, right: 12, fontFamily: MONO, fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: ".1em" }}>
        DRAG TO ROTATE
      </div>
    </div>
  );
}
