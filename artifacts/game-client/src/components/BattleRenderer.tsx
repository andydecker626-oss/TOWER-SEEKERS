import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { GridUnit } from "@/lib/types";

type SelectMode = "none" | "move" | "attack" | "skill";

// ── World-space grid layout ───────────────────────────────────────────────────
const CELL   = 1.0;                            // world units per tile
const GAP    = 0.5;                            // water channel width
const COLS   = 4;                              // tiles per side
const ROWS   = 4;

const ALLY_X  = 0;
const WATER_X = COLS * CELL;                   // 4.0
const ENEMY_X = WATER_X + GAP;                // 4.5
const TOTAL_W = ENEMY_X + COLS * CELL;        // 8.5
const TOTAL_D = ROWS * CELL;                  // 4.0

// Geometry heights / thicknesses
const TILE_H  = 0.10;   // floor tile block height
const WALL_H  = 0.80;   // perimeter wall height
const WALL_T  = 0.30;   // wall thickness
const UNIT_SZ = 0.62;   // unit box side length

// Palette
const C = {
  STONE_L:   0x8a8072,   // light tile
  STONE_D:   0x6a6055,   // dark tile
  MORTAR:    0x3a3028,   // grout between tiles (thin gap)
  WALL:      0x60584a,   // wall face
  WALL_TOP:  0x8a7e6a,   // wall cap
  WATER:     0x1a3860,   // water channel base
  WATER_H:   0x3a70b0,   // water highlight
  ALLY:      0x2255cc,
  ENEMY:     0xcc2222,
  SELECTED:  0x44bbff,
  QUEUED:    0x4477dd,
  HL_MOVE:   0x44cc55,
  HL_ATCK:   0xff4422,
  HL_SKILL:  0xaa44ff,
  DEAD:      0x333333,
};

// Tile world centre
const TX = (col: number, onEnemy: boolean) =>
  (onEnemy ? ENEMY_X : ALLY_X) + col * CELL + CELL / 2;
const TZ = (row: number) => row * CELL + CELL / 2;

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
  const mountRef = useRef<HTMLDivElement>(null);

  // Live ref so the animation loop always reads current props
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

  useEffect(() => {
    const el = mountRef.current as HTMLDivElement;
    if (!el) return;

    // ── Renderer ──────────────────────────────────────────────────────────────
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      // WebGL not available in this environment (e.g. headless server).
      // The component renders nothing — real user browsers have WebGL.
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070311);
    scene.fog = new THREE.FogExp2(0x070311, 0.028);

    // ── Camera ────────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(44, el.clientWidth / el.clientHeight, 0.1, 120);
    const CAM_TARGET = new THREE.Vector3(TOTAL_W / 2, 0, TOTAL_D / 2 - 0.5);
    camera.position.set(TOTAL_W / 2, 9.0, TOTAL_D + 6.5);
    camera.lookAt(CAM_TARGET);

    // ── Lights ────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xfff2e0, 0.50));

    const sun = new THREE.DirectionalLight(0xfff8f0, 1.15);
    sun.position.set(TOTAL_W / 2, 14, TOTAL_D + 5);
    sun.target.position.copy(CAM_TARGET);
    sun.castShadow = true;
    sun.shadow.mapSize.setScalar(1024);
    const sc = sun.shadow.camera as THREE.OrthographicCamera;
    sc.left = -11; sc.right = 11; sc.top = 8; sc.bottom = -8;
    scene.add(sun); scene.add(sun.target);

    // Corner torch point lights
    const TORCH_CORNERS: [number, number, number][] = [
      [-WALL_T * 0.5, WALL_H + 0.7, -WALL_T * 0.5],
      [TOTAL_W + WALL_T * 0.5, WALL_H + 0.7, -WALL_T * 0.5],
      [-WALL_T * 0.5, WALL_H + 0.7, TOTAL_D + WALL_T * 0.5],
      [TOTAL_W + WALL_T * 0.5, WALL_H + 0.7, TOTAL_D + WALL_T * 0.5],
    ];
    const torchLights = TORCH_CORNERS.map(([x, y, z]) => {
      const pl = new THREE.PointLight(0xff8820, 2.8, 7.5);
      pl.position.set(x, y, z);
      scene.add(pl);
      return pl;
    });

    // ── Floor tiles ───────────────────────────────────────────────────────────
    // Each tile: slightly inset box (gap creates mortar look)
    const tileGeo = new THREE.BoxGeometry(CELL * 0.93, TILE_H, CELL * 0.93);

    interface TileRecord { mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; baseColor: number }
    const tileMeshes = new Map<string, TileRecord>();

    function makeTiles(onEnemy: boolean) {
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const baseColor = (row + col) % 2 === 0 ? C.STONE_L : C.STONE_D;
          const mat = new THREE.MeshLambertMaterial({ color: baseColor });
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

    // Dark mortar base plane (fills the gaps between tiles)
    const mortarGeo = new THREE.PlaneGeometry(COLS * CELL, TOTAL_D);
    const mortarMat = new THREE.MeshLambertMaterial({ color: C.MORTAR });
    const mAlly  = new THREE.Mesh(mortarGeo, mortarMat);
    const mEnemy = new THREE.Mesh(mortarGeo, mortarMat.clone());
    mAlly.rotation.x  = -Math.PI / 2; mAlly.position.set(ALLY_X + COLS * CELL / 2,  0, TOTAL_D / 2);
    mEnemy.rotation.x = -Math.PI / 2; mEnemy.position.set(ENEMY_X + COLS * CELL / 2, 0, TOTAL_D / 2);
    scene.add(mAlly); scene.add(mEnemy);

    // ── Water channel ─────────────────────────────────────────────────────────
    const waterGeo = new THREE.BoxGeometry(GAP, TILE_H * 0.5, TOTAL_D);
    const waterMat = new THREE.MeshLambertMaterial({ color: C.WATER });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(WATER_X + GAP / 2, TILE_H * 0.25, TOTAL_D / 2);
    scene.add(waterMesh);

    // ── Perimeter walls ───────────────────────────────────────────────────────
    const wallMat    = new THREE.MeshLambertMaterial({ color: C.WALL });
    const wallTopMat = new THREE.MeshLambertMaterial({ color: C.WALL_TOP });

    function wall(x: number, z: number, w: number, d: number) {
      // Body
      const geo = new THREE.BoxGeometry(w, WALL_H, d);
      const m   = new THREE.Mesh(geo, wallMat);
      m.position.set(x, WALL_H / 2, z);
      m.castShadow = true; m.receiveShadow = true;
      scene.add(m);
      // Cap
      const capH = WALL_T * 0.45;
      const cap  = new THREE.Mesh(new THREE.BoxGeometry(w, capH, d), wallTopMat);
      cap.position.set(x, WALL_H + capH / 2, z);
      scene.add(cap);
    }

    const FULL_W = TOTAL_W + WALL_T * 2;
    wall(TOTAL_W / 2,                -WALL_T / 2,          FULL_W, WALL_T); // back
    wall(TOTAL_W / 2,                TOTAL_D + WALL_T / 2, FULL_W, WALL_T); // front
    wall(-WALL_T / 2,                TOTAL_D / 2,           WALL_T, TOTAL_D); // left
    wall(TOTAL_W + WALL_T / 2,       TOTAL_D / 2,           WALL_T, TOTAL_D); // right

    // Subtle stone-block lines on back wall
    const lineMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 });
    for (let s = 1; s < COLS * 2; s++) {
      const lx = s * (TOTAL_W / (COLS * 2));
      const pts = [
        new THREE.Vector3(lx, 0,      -WALL_T / 2),
        new THREE.Vector3(lx, WALL_H, -WALL_T / 2),
      ];
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    }

    // ── Unit boxes ────────────────────────────────────────────────────────────
    const unitGeo  = new THREE.BoxGeometry(UNIT_SZ, UNIT_SZ, UNIT_SZ);
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

      // Remove stale meshes
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
          // Keep a flattened "dead" marker briefly then remove
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

    // ── Tile highlight colours ────────────────────────────────────────────────
    function syncHighlights() {
      const { highlights, selectMode } = live.current;
      const hlColor = selectMode === "attack" ? C.HL_ATCK
                    : selectMode === "skill"  ? C.HL_SKILL
                    :                           C.HL_MOVE;
      for (const [key, rec] of tileMeshes) {
        const [side, c, r] = key.split("-");
        const col = parseInt(c), row = parseInt(r);
        const isEnemy = side === "e";
        const hl = highlights.find(h => h.x === col && h.y === row && h.onEnemy === isEnemy);
        rec.mat.color.setHex(hl ? hlColor : rec.baseColor);
        rec.mat.emissive.setHex(hl ? hlColor : 0x000000);
        rec.mat.emissiveIntensity = hl ? 0.3 : 0;
      }
    }

    // ── Raycasting ────────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse2d   = new THREE.Vector2();

    function onPointerDown(e: PointerEvent) {
      const rect = el.getBoundingClientRect();
      mouse2d.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse2d.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse2d, camera);

      // Units have priority
      const unitArr = [...unitMeshes.values()].map(r => r.mesh);
      const unitHits = raycaster.intersectObjects(unitArr, false);
      if (unitHits.length) {
        live.current.onUnitClick(unitHits[0].object.userData.instanceId as string);
        return;
      }
      // Then tiles
      const tileArr = [...tileMeshes.values()].map(r => r.mesh);
      const tileHits = raycaster.intersectObjects(tileArr, false);
      if (tileHits.length) {
        const { col, row, onEnemy } = tileHits[0].object.userData as { col: number; row: number; onEnemy: boolean };
        live.current.onTileClick(col, row, onEnemy);
      }
    }
    el.addEventListener("pointerdown", onPointerDown);

    // ── Resize ────────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      if (!el.clientWidth || !el.clientHeight) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    });
    ro.observe(el);

    // ── Animation loop ────────────────────────────────────────────────────────
    let tick = 0;
    let rafId = 0;
    let alive = true;

    function animate() {
      if (!alive) return;
      rafId = requestAnimationFrame(animate);
      tick++;

      // Torch flicker
      torchLights.forEach((pl, i) => {
        pl.intensity = 2.4 + Math.sin(tick * 0.10 + i * 1.57) * 0.9
                           + Math.sin(tick * 0.23 + i * 0.8)  * 0.4;
      });

      // Water colour pulse
      waterMat.color.setHSL(0.60, 0.65, 0.12 + Math.sin(tick * 0.035) * 0.04);

      syncUnits();
      syncHighlights();
      renderer.render(scene, camera);
    }
    animate();

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      el.removeEventListener("pointerdown", onPointerDown);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []); // intentionally empty — everything is read through `live` ref

  return (
    <div
      ref={mountRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
}
