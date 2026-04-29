import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { GridUnit } from "@/lib/types";

type SelectMode = "none" | "move" | "attack" | "skill";

// ── World-space grid layout ───────────────────────────────────────────────────
const CELL    = 1.0;
const GAP     = 0.5;
const COLS    = 4;
const ROWS    = 4;

const ALLY_X  = 0;
const WATER_X = COLS * CELL;          // 4.0
const ENEMY_X = WATER_X + GAP;       // 4.5
const TOTAL_W = ENEMY_X + COLS * CELL; // 8.5
const TOTAL_D = ROWS * CELL;          // 4.0
const CX      = TOTAL_W / 2;          // 4.25  board center X
const CZ      = TOTAL_D / 2;          // 2.0   board center Z

// Geometry sizes
const TILE_H   = 0.10;
const WALL_H   = 0.80;
const WALL_T   = 0.30;
const UNIT_SZ  = 0.62;
const TOWER_H  = 3.4;
const TOWER_W  = 1.0;

// Palette
const C = {
  STONE_L:  0x8a8072,
  STONE_D:  0x6a6055,
  MORTAR:   0x3a3028,
  WALL:     0x60584a,
  WALL_TOP: 0x8a7e6a,
  TOWER:    0x504840,
  TOWER_C:  0x706050,
  WATER:    0x1a3860,
  GROUND:   0x151310,
  ALLY:     0x2255cc,
  ENEMY:    0xcc2222,
  SELECTED: 0x44bbff,
  QUEUED:   0x4477dd,
  HL_MOVE:  0x44cc55,
  HL_ATCK:  0xff4422,
  HL_SKILL: 0xaa44ff,
  BANNER_A: 0x1a3388,  // ally banner blue
  BANNER_E: 0x882222,  // enemy banner red
  FLAME:    0xff7711,
};

// Tile world centre helpers
const TX = (col: number, onEnemy: boolean) =>
  (onEnemy ? ENEMY_X : ALLY_X) + col * CELL + CELL / 2;
const TZ = (row: number) => row * CELL + CELL / 2;

// ── Camera presets ────────────────────────────────────────────────────────────
const PRESETS = [
  { name: "Overview",  pos: new THREE.Vector3(CX,   9.0, TOTAL_D + 6.5), look: new THREE.Vector3(CX, 0, CZ - 0.5) },
  { name: "Ally View", pos: new THREE.Vector3(-4.0, 3.5, TOTAL_D + 5.0), look: new THREE.Vector3(CX, 0.3, CZ) },
  { name: "Side",      pos: new THREE.Vector3(13.0, 5.5, CZ),             look: new THREE.Vector3(CX, 0, CZ) },
  { name: "Cinematic", pos: new THREE.Vector3(CX,   2.2, TOTAL_D + 9.0), look: new THREE.Vector3(CX, 0.5, CZ) },
  { name: "Aerial",    pos: new THREE.Vector3(CX,  15.0, CZ + 1.0),      look: new THREE.Vector3(CX, 0, CZ) },
];

// ─────────────────────────────────────────────────────────────────────────────
export interface Props {
  myUnits:     GridUnit[];
  enemyUnits:  GridUnit[];
  mySide:      "A" | "B";
  selectedId:  string | null;
  highlights:  { x: number; y: number; onEnemy: boolean }[];
  selectMode:  SelectMode;
  queued:      Record<string, unknown>;
  flashUnits:  Record<string, string>;
  onUnitClick: (id: string) => void;
  onTileClick: (x: number, y: number, onEnemy: boolean) => void;
}

export default function BattleRenderer({
  myUnits, enemyUnits, selectedId, highlights, selectMode,
  queued, flashUnits, onUnitClick, onTileClick,
}: Props) {
  const mountRef     = useRef<HTMLDivElement>(null);
  const camIdxRef    = useRef(0);
  const [camName, setCamName] = useState(PRESETS[0].name);

  // Live props ref for animation loop
  const live = useRef({
    myUnits, enemyUnits, selectedId, highlights, selectMode,
    queued, flashUnits, onUnitClick, onTileClick,
  });
  useEffect(() => {
    live.current = {
      myUnits, enemyUnits, selectedId, highlights, selectMode,
      queued, flashUnits, onUnitClick, onTileClick,
    };
  });

  // Camera toggle handler (React side)
  function cycleCamera() {
    const next = (camIdxRef.current + 1) % PRESETS.length;
    camIdxRef.current = next;
    setCamName(PRESETS[next].name);
  }

  // ── Three.js setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current as HTMLDivElement;
    if (!el) return;

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      return; // No WebGL — headless env; real browsers will work
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    el.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050210);
    scene.fog = new THREE.FogExp2(0x050210, 0.022);

    // Camera (smoothly interpolated each frame toward active preset)
    const camera  = new THREE.PerspectiveCamera(44, el.clientWidth / el.clientHeight, 0.1, 200);
    const camPos  = PRESETS[0].pos.clone();
    const camLook = PRESETS[0].look.clone();
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    // ── Lights ─────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xfff0e0, 0.45));

    const sun = new THREE.DirectionalLight(0xfff8f0, 1.1);
    sun.position.set(CX, 14, TOTAL_D + 6);
    sun.target.position.set(CX, 0, CZ);
    sun.castShadow = true;
    sun.shadow.mapSize.setScalar(1024);
    const sc = sun.shadow.camera as THREE.OrthographicCamera;
    sc.left = -14; sc.right = 14; sc.top = 10; sc.bottom = -10;
    scene.add(sun); scene.add(sun.target);

    // Tower torch point lights — one per corner
    const TORCH_XZ: [number, number][] = [
      [ALLY_X  - TOWER_W,   -TOWER_W],
      [TOTAL_W + TOWER_W,   -TOWER_W],
      [ALLY_X  - TOWER_W,    TOTAL_D + TOWER_W],
      [TOTAL_W + TOWER_W,    TOTAL_D + TOWER_W],
    ];
    const torchLights = TORCH_XZ.map(([x, z]) => {
      const pl = new THREE.PointLight(0xff8820, 2.8, 10);
      pl.position.set(x, TOWER_H + 0.3, z);
      scene.add(pl);
      return pl;
    });

    // ── Extended ground ────────────────────────────────────────────────────
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshLambertMaterial({ color: C.GROUND });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(CX, -0.02, CZ);
    ground.receiveShadow = true;
    scene.add(ground);

    // ── Floor tiles ────────────────────────────────────────────────────────
    const tileGeo = new THREE.BoxGeometry(CELL * 0.93, TILE_H, CELL * 0.93);

    interface TileRecord { mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; baseColor: number }
    const tileMeshes = new Map<string, TileRecord>();

    function makeTiles(onEnemy: boolean) {
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const baseColor = (row + col) % 2 === 0 ? C.STONE_L : C.STONE_D;
          const mat  = new THREE.MeshLambertMaterial({ color: baseColor });
          const mesh = new THREE.Mesh(tileGeo, mat);
          mesh.position.set(TX(col, onEnemy), TILE_H / 2, TZ(row));
          mesh.receiveShadow = true;
          mesh.userData = { type: "tile", col, row, onEnemy };
          scene.add(mesh);
          tileMeshes.set(`${onEnemy ? "e" : "a"}-${col}-${row}`, { mesh, mat, baseColor });
        }
      }
    }
    makeTiles(false);
    makeTiles(true);

    // Mortar base planes
    const mortarMat = new THREE.MeshLambertMaterial({ color: C.MORTAR });
    function mortarPlane(cx: number) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(COLS * CELL, TOTAL_D), mortarMat.clone());
      m.rotation.x = -Math.PI / 2;
      m.position.set(cx, 0, TOTAL_D / 2);
      scene.add(m);
    }
    mortarPlane(ALLY_X  + COLS * CELL / 2);
    mortarPlane(ENEMY_X + COLS * CELL / 2);

    // ── Water channel ──────────────────────────────────────────────────────
    const waterMat = new THREE.MeshLambertMaterial({ color: C.WATER });
    const waterMesh = new THREE.Mesh(new THREE.BoxGeometry(GAP, TILE_H * 0.5, TOTAL_D), waterMat);
    waterMesh.position.set(WATER_X + GAP / 2, TILE_H * 0.25, TOTAL_D / 2);
    scene.add(waterMesh);

    // ── Perimeter walls ────────────────────────────────────────────────────
    const wallMat    = new THREE.MeshLambertMaterial({ color: C.WALL });
    const wallCapMat = new THREE.MeshLambertMaterial({ color: C.WALL_TOP });

    function addWall(x: number, z: number, w: number, d: number) {
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, WALL_H, d), wallMat);
      body.position.set(x, WALL_H / 2, z);
      body.castShadow = true; body.receiveShadow = true;
      scene.add(body);
      const capH = WALL_T * 0.4;
      const cap  = new THREE.Mesh(new THREE.BoxGeometry(w, capH, d), wallCapMat);
      cap.position.set(x, WALL_H + capH / 2, z);
      scene.add(cap);
    }

    const FW = TOTAL_W + WALL_T * 2;
    addWall(CX,                   -WALL_T / 2,          FW,    WALL_T);
    addWall(CX,                   TOTAL_D + WALL_T / 2, FW,    WALL_T);
    addWall(-WALL_T / 2,          CZ,                    WALL_T, TOTAL_D);
    addWall(TOTAL_W + WALL_T / 2, CZ,                    WALL_T, TOTAL_D);

    // ── Corner towers ──────────────────────────────────────────────────────
    const towerMat = new THREE.MeshLambertMaterial({ color: C.TOWER });
    const towerCapMat = new THREE.MeshLambertMaterial({ color: C.TOWER_C });

    const TOWER_CENTERS: [number, number][] = [
      [ALLY_X  - TOWER_W * 0.5 - WALL_T * 0.4, -TOWER_W * 0.5 - WALL_T * 0.4],
      [TOTAL_W + TOWER_W * 0.5 + WALL_T * 0.4, -TOWER_W * 0.5 - WALL_T * 0.4],
      [ALLY_X  - TOWER_W * 0.5 - WALL_T * 0.4,  TOTAL_D + TOWER_W * 0.5 + WALL_T * 0.4],
      [TOTAL_W + TOWER_W * 0.5 + WALL_T * 0.4,  TOTAL_D + TOWER_W * 0.5 + WALL_T * 0.4],
    ];

    const flameMeshes: THREE.Mesh[] = [];

    TOWER_CENTERS.forEach(([tx, tz]) => {
      // Main tower shaft
      const body = new THREE.Mesh(new THREE.BoxGeometry(TOWER_W, TOWER_H, TOWER_W), towerMat);
      body.position.set(tx, TOWER_H / 2, tz);
      body.castShadow = true; body.receiveShadow = true;
      scene.add(body);

      // Flat roof deck
      const roof = new THREE.Mesh(new THREE.BoxGeometry(TOWER_W + 0.14, 0.14, TOWER_W + 0.14), towerCapMat);
      roof.position.set(tx, TOWER_H + 0.07, tz);
      scene.add(roof);

      // Battlements (crenellations) — 4 merlons around the top
      const mW = 0.22, mH = 0.32, mD = 0.22;
      const merlon = new THREE.BoxGeometry(mW, mH, mD);
      const merlonMat = new THREE.MeshLambertMaterial({ color: C.TOWER });
      const offsets: [number, number][] = [
        [-TOWER_W / 2 + mW / 2, -TOWER_W / 2 + mD / 2],
        [ TOWER_W / 2 - mW / 2, -TOWER_W / 2 + mD / 2],
        [-TOWER_W / 2 + mW / 2,  TOWER_W / 2 - mD / 2],
        [ TOWER_W / 2 - mW / 2,  TOWER_W / 2 - mD / 2],
      ];
      offsets.forEach(([ox, oz]) => {
        const m = new THREE.Mesh(merlon, merlonMat);
        m.position.set(tx + ox, TOWER_H + 0.14 + mH / 2, tz + oz);
        scene.add(m);
      });

      // Torch sconce
      const sconceMat = new THREE.MeshLambertMaterial({ color: 0x333322 });
      const sconceGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.35, 8);
      const sconce = new THREE.Mesh(sconceGeo, sconceMat);
      sconce.position.set(tx, TOWER_H + 0.3, tz);
      scene.add(sconce);

      // Torch flame cone (animated)
      const flameMat = new THREE.MeshBasicMaterial({
        color: C.FLAME, transparent: true, opacity: 0.9,
      });
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 8), flameMat);
      flame.position.set(tx, TOWER_H + 0.52, tz);
      scene.add(flame);
      flameMeshes.push(flame);
    });

    // ── Hanging banners ────────────────────────────────────────────────────
    function addBanner(tx: number, tz: number, faceDir: "x" | "z", color: number) {
      const mat = new THREE.MeshLambertMaterial({
        color, emissive: color, emissiveIntensity: 0.12,
      });
      const bannerW = 0.20, bannerH = 1.40, bannerD = 0.05;
      const geo = new THREE.BoxGeometry(
        faceDir === "x" ? bannerD : bannerW,
        bannerH,
        faceDir === "z" ? bannerD : bannerW,
      );
      const banner = new THREE.Mesh(geo, mat);
      // Hang from upper tower face, pointing down
      const yCenter = TOWER_H - bannerH / 2 - 0.1;
      banner.position.set(tx, yCenter, tz);
      scene.add(banner);

      // Gold hem strip at top of banner
      const trimMat = new THREE.MeshBasicMaterial({ color: 0xd4aa44 });
      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(
          faceDir === "x" ? bannerD + 0.01 : bannerW + 0.04,
          0.07,
          faceDir === "z" ? bannerD + 0.01 : bannerW + 0.04,
        ),
        trimMat,
      );
      trim.position.set(tx, TOWER_H - 0.1 - 0.035, tz);
      scene.add(trim);
    }

    // Ally (left) towers — blue banners facing right (toward battlefield)
    const ALLY_BANNER_X = TOWER_CENTERS[0][0] + TOWER_W * 0.5 + 0.04;
    addBanner(ALLY_BANNER_X, TOWER_CENTERS[0][1], "x", C.BANNER_A);
    addBanner(ALLY_BANNER_X, TOWER_CENTERS[2][1], "x", C.BANNER_A);

    // Enemy (right) towers — red banners facing left (toward battlefield)
    const ENEMY_BANNER_X = TOWER_CENTERS[1][0] - TOWER_W * 0.5 - 0.04;
    addBanner(ENEMY_BANNER_X, TOWER_CENTERS[1][1], "x", C.BANNER_E);
    addBanner(ENEMY_BANNER_X, TOWER_CENTERS[3][1], "x", C.BANNER_E);

    // ── Rear archway (behind back wall) ────────────────────────────────────
    const archMat = new THREE.MeshLambertMaterial({ color: 0x3a3028 });
    const ARCH_Z = -1.8;
    const ARCH_H = 3.5;
    // Left pillar
    const lPillar = new THREE.Mesh(new THREE.BoxGeometry(0.55, ARCH_H, 0.55), archMat);
    lPillar.position.set(CX - 2.0, ARCH_H / 2, ARCH_Z);
    scene.add(lPillar);
    // Right pillar
    const rPillar = new THREE.Mesh(new THREE.BoxGeometry(0.55, ARCH_H, 0.55), archMat);
    rPillar.position.set(CX + 2.0, ARCH_H / 2, ARCH_Z);
    scene.add(rPillar);
    // Cross lintel
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.0 + 0.55, 0.55, 0.55), archMat);
    lintel.position.set(CX, ARCH_H, ARCH_Z);
    scene.add(lintel);
    // Pointed arch keystone
    const keystone = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.42), towerCapMat);
    keystone.position.set(CX, ARCH_H + 0.55 * 0.5, ARCH_Z);
    scene.add(keystone);

    // Background wall behind archway
    const bgWallMat = new THREE.MeshLambertMaterial({ color: 0x1e1a14 });
    const bgWall = new THREE.Mesh(new THREE.BoxGeometry(22, 8, 0.4), bgWallMat);
    bgWall.position.set(CX, 4, -4.5);
    bgWall.receiveShadow = true;
    scene.add(bgWall);

    // ── Unit boxes ─────────────────────────────────────────────────────────
    const unitGeo   = new THREE.BoxGeometry(UNIT_SZ, UNIT_SZ, UNIT_SZ);
    const shadowGeo = new THREE.CircleGeometry(UNIT_SZ * 0.38, 12);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 });

    interface UnitRecord { mesh: THREE.Mesh; shadow: THREE.Mesh; mat: THREE.MeshLambertMaterial }
    const unitMeshes = new Map<string, UnitRecord>();

    function getUnitColor(instanceId: string, isEnemy: boolean): number {
      const { selectedId, queued, flashUnits } = live.current;
      if (flashUnits[instanceId] === "damage") return 0xffffff;
      if (flashUnits[instanceId] === "ko")     return 0x333333;
      if (instanceId === selectedId)           return C.SELECTED;
      if (!isEnemy && queued[instanceId])      return C.QUEUED;
      return isEnemy ? C.ENEMY : C.ALLY;
    }

    function syncUnits() {
      const { myUnits, enemyUnits } = live.current;
      const all = [
        ...myUnits.map(u  => ({ ...u, isEnemy: false })),
        ...enemyUnits.map(u => ({ ...u, isEnemy: true })),
      ];
      for (const [id, rec] of unitMeshes) {
        if (!all.find(u => u.instanceId === id)) {
          scene.remove(rec.mesh); scene.remove(rec.shadow);
          unitMeshes.delete(id);
        }
      }
      for (const unit of all) {
        const wx = TX(unit.x, unit.isEnemy);
        const wz = TZ(unit.y);
        if (!unit.alive) {
          const rec = unitMeshes.get(unit.instanceId);
          if (rec) { scene.remove(rec.mesh); scene.remove(rec.shadow); unitMeshes.delete(unit.instanceId); }
          continue;
        }
        let rec = unitMeshes.get(unit.instanceId);
        if (!rec) {
          const mat  = new THREE.MeshLambertMaterial({ color: unit.isEnemy ? C.ENEMY : C.ALLY });
          const mesh = new THREE.Mesh(unitGeo, mat);
          mesh.castShadow = true;
          mesh.userData = { type: "unit", instanceId: unit.instanceId, isEnemy: unit.isEnemy };
          const shadow = new THREE.Mesh(shadowGeo, shadowMat.clone());
          shadow.rotation.x = -Math.PI / 2;
          scene.add(mesh); scene.add(shadow);
          rec = { mesh, shadow, mat };
          unitMeshes.set(unit.instanceId, rec);
        }
        rec.mesh.position.set(wx, TILE_H + UNIT_SZ / 2, wz);
        rec.shadow.position.set(wx, TILE_H + 0.005, wz);
        rec.mat.color.setHex(getUnitColor(unit.instanceId, unit.isEnemy));
      }
    }

    // ── Tile highlights ────────────────────────────────────────────────────
    function syncHighlights() {
      const { highlights, selectMode } = live.current;
      const hlColor = selectMode === "attack" ? C.HL_ATCK
                    : selectMode === "skill"  ? C.HL_SKILL
                    :                           C.HL_MOVE;
      for (const [key, rec] of tileMeshes) {
        const [side, c, r] = key.split("-");
        const col = parseInt(c), row = parseInt(r);
        const hl = highlights.find(h => h.x === col && h.y === row && h.onEnemy === (side === "e"));
        rec.mat.color.setHex(hl ? hlColor : rec.baseColor);
        rec.mat.emissive.setHex(hl ? hlColor : 0x000000);
        rec.mat.emissiveIntensity = hl ? 0.3 : 0;
      }
    }

    // ── Raycasting ─────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse2d   = new THREE.Vector2();

    function onPointerDown(e: PointerEvent) {
      const rect = el.getBoundingClientRect();
      mouse2d.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse2d.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse2d, camera);

      const unitArr = [...unitMeshes.values()].map(r => r.mesh);
      const unitHits = raycaster.intersectObjects(unitArr, false);
      if (unitHits.length) {
        live.current.onUnitClick(unitHits[0].object.userData.instanceId as string);
        return;
      }
      const tileArr = [...tileMeshes.values()].map(r => r.mesh);
      const tileHits = raycaster.intersectObjects(tileArr, false);
      if (tileHits.length) {
        const { col, row, onEnemy } = tileHits[0].object.userData as { col: number; row: number; onEnemy: boolean };
        live.current.onTileClick(col, row, onEnemy);
      }
    }
    el.addEventListener("pointerdown", onPointerDown);

    // ── Resize ─────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      if (!el.clientWidth || !el.clientHeight) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    });
    ro.observe(el);

    // ── Animation loop ─────────────────────────────────────────────────────
    let tick = 0;
    let rafId = 0;
    let isAlive = true;

    function animate() {
      if (!isAlive) return;
      rafId = requestAnimationFrame(animate);
      tick++;

      // Smooth camera transition toward active preset
      const preset = PRESETS[camIdxRef.current];
      camPos.lerp(preset.pos,  0.045);
      camLook.lerp(preset.look, 0.045);
      camera.position.copy(camPos);
      camera.lookAt(camLook);

      // Torch light flicker (two-frequency sum per corner for organic feel)
      torchLights.forEach((pl, i) => {
        pl.intensity = 2.5 + Math.sin(tick * 0.11 + i * 1.57) * 1.0
                           + Math.sin(tick * 0.27 + i * 0.8)  * 0.4;
      });

      // Torch flame scale flicker
      flameMeshes.forEach((f, i) => {
        const s = 0.9 + Math.sin(tick * 0.18 + i * 1.3) * 0.15
                      + Math.sin(tick * 0.41 + i * 0.7) * 0.07;
        f.scale.set(s, s, s);
        (f.material as THREE.MeshBasicMaterial).opacity = 0.75 + Math.sin(tick * 0.15 + i) * 0.2;
      });

      // Water hue pulse
      waterMat.color.setHSL(0.60, 0.65, 0.12 + Math.sin(tick * 0.035) * 0.04);

      syncUnits();
      syncHighlights();
      renderer.render(scene, camera);
    }
    animate();

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      isAlive = false;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      el.removeEventListener("pointerdown", onPointerDown);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []); // intentionally empty — reads from live ref and camIdxRef

  // ── JSX: canvas mount + camera toggle button ────────────────────────────
  return (
    <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />

      {/* Camera angle toggle */}
      <button
        onClick={cycleCamera}
        style={{
          position: "absolute",
          bottom: "12px",
          right: "12px",
          zIndex: 30,
          fontFamily: "'Cinzel', serif",
          fontSize: "11px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(240,210,130,0.88)",
          background: "rgba(6,4,16,0.78)",
          border: "1px solid rgba(240,192,64,0.28)",
          borderRadius: "6px",
          padding: "6px 13px",
          cursor: "pointer",
          backdropFilter: "blur(4px)",
          transition: "border-color 0.18s, color 0.18s",
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(240,192,64,0.65)";
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,230,160,1)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(240,192,64,0.28)";
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(240,210,130,0.88)";
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        {camName}
      </button>
    </div>
  );
}
