import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { FESpriteAnimator } from "@/lib/FESpriteAnimator";
import type { FrameEntry } from "@/lib/myrmidonAnim";
import {
  idleClip as myrIdleClip,
  attackClip as myrAtkClip,
  ALL_MYRMIDON_FILES,
  MYRMIDON_HIT_FRAME,
} from "@/lib/myrmidonAnim";
import {
  idleClip as wdrIdleClip,
  attackClip as wdrAtkClip,
  ALL_WANDERER_FILES,
  WANDERER_HIT_FRAME,
} from "@/lib/wandererAnim";
import { audioManager } from "@/lib/audio";

// ── Arena constants (mirrors BattleRenderer) ─────────────────────────────────
const CELL    = 1.0;
const GAP     = 0.5;
const COLS    = 4;
const ROWS    = 4;
const ALLY_X  = 0;
const WATER_X = COLS * CELL;
const ENEMY_X = WATER_X + GAP;
const TOTAL_W = ENEMY_X + COLS * CELL;
const TOTAL_D = ROWS * CELL;
const CX      = TOTAL_W / 2;
const CZ      = TOTAL_D / 2;
const PLAT_Y  = 0.12;
const TILE_H  = 0.14;

const TX = (col: number, onEnemy: boolean) =>
  (onEnemy ? ENEMY_X : ALLY_X) + col * CELL + CELL / 2;
const TZ = (row: number) => row * CELL + CELL / 2;

// ── Shared spawn tile (same for all units) ────────────────────────────────────
const SPR_COL = 2;
const SPR_ROW = 1;
const SPR_X   = TX(SPR_COL, false);
const SPR_Z   = TZ(SPR_ROW);
const SPR_Y   = PLAT_Y + TILE_H;

const DASH_MS   = 420;
const RETURN_MS = 480;

const BASE_PATH = (import.meta.env.BASE_URL as string)?.replace(/\/$/, "") ?? "";

// ── Per-unit configuration ────────────────────────────────────────────────────
interface UnitConfig {
  id:            string;
  label:         string;
  frameLabel:    string;
  assetBase:     string;
  allFiles:      string[];
  idleClip:      FrameEntry[];
  attackClip:    FrameEntry[];
  hitFrame:      string;
  sprHeight:     number;
  charXShift:    number;
  charYCenter:   number;
  isEnemy:       boolean;
  textureFilter: THREE.MagnificationTextureFilter;
}

const UNITS: UnitConfig[] = [
  {
    id:          "myrmidon",
    label:       "Myrmidon",
    frameLabel:  "FE-Repo · Leo_Link Alt Myrmidon · 39 frames · NearestFilter",
    assetBase:   `${BASE_PATH}/assets/units/myrmidon`,
    allFiles:    ALL_MYRMIDON_FILES,
    idleClip:    myrIdleClip,
    attackClip:  myrAtkClip,
    hitFrame:    MYRMIDON_HIT_FRAME,
    sprHeight:   3.40,
    charXShift:  -3.40 * 0.166,
    charYCenter: 3.40 * 0.16,
    isEnemy:     true,
    textureFilter: THREE.NearestFilter,
  },
  {
    id:          "wanderer",
    label:       "Wanderer",
    frameLabel:  "HD-2D · Wanderer · 10 frames · LinearFilter",
    assetBase:   `${BASE_PATH}/assets/units/wanderer`,
    allFiles:    ALL_WANDERER_FILES,
    idleClip:    wdrIdleClip,
    attackClip:  wdrAtkClip,
    hitFrame:    WANDERER_HIT_FRAME,
    sprHeight:   3.40,
    charXShift:  0.10,
    charYCenter: 1.30,
    isEnemy:     false,
    textureFilter: THREE.LinearFilter,
  },
];

// ── Colours ───────────────────────────────────────────────────────────────────
const C_PLAT_SIDE  = 0x5a5040;
const C_PLAT_TOP   = 0x6a5e4a;
const C_ALLY_TILE  = 0x2a3e5a;
const C_ENEMY_TILE = 0x4a2020;
const C_ENEMY_HOV  = 0x7a3030;
const C_ENEMY_ATK  = 0xcc3300;
const C_WATER      = 0x1a2c5a;
const C_DIVIDER    = 0x8a7a60;

interface EnemyTileRec {
  mesh: THREE.Mesh;
  mat:  THREE.MeshLambertMaterial;
  base: number;
  col:  number;
  row:  number;
}

// ── Movement state ────────────────────────────────────────────────────────────
type MovePhase = "idle" | "approach" | "attacking" | "return";
interface MoveState {
  phase:    MovePhase;
  startMs:  number;
  duration: number;
  fromX: number; fromZ: number;
  toX:   number; toZ:   number;
  tileKey: string;
}

const IDLE_STATE: MoveState = {
  phase: "idle", startMs: 0, duration: 0,
  fromX: 0, fromZ: 0, toX: 0, toZ: 0, tileKey: "",
};

function easeOutQuad(t: number) { return t * (2 - t); }

export default function SpriteTestPage() {
  const mountRef   = useRef<HTMLDivElement>(null);
  const animRef    = useRef<FESpriteAnimator | null>(null);
  const spriteRef  = useRef<THREE.Sprite | null>(null);
  const shadowRef  = useRef<THREE.Mesh | null>(null);
  const enemyTiles = useRef<Map<string, EnemyTileRec>>(new Map());
  const moveState  = useRef<MoveState>({ ...IDLE_STATE });
  const loadedRef  = useRef(false);
  const hoveredRef = useRef<string | null>(null);
  const raycaster  = useRef(new THREE.Raycaster());
  const pointer    = useRef(new THREE.Vector2());

  const [selectedUnit, setSelectedUnit] = useState<string>("myrmidon");
  const [loaded,  setLoaded]  = useState(false);
  const [status,  setStatus]  = useState("Loading frames…");
  const [target,  setTarget]  = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    // ── Reset transient state on every unit switch ──────────────────────────
    moveState.current  = { ...IDLE_STATE };
    hoveredRef.current = null;
    loadedRef.current  = false;
    setLoaded(false);
    setStatus("Loading frames…");
    setTarget(null);

    const cfg = UNITS.find(u => u.id === selectedUnit) ?? UNITS[0]!;
    const el  = mountRef.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch { return; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    // ── Scene ─────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0820);
    scene.fog = new THREE.Fog(0x0c0820, 14, 22);

    // ── Camera ────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      45, el.clientWidth / el.clientHeight, 0.1, 60,
    );
    camera.position.set(CX, 6.5, TOTAL_D + 6.0);
    camera.lookAt(CX, 0.4, CZ - 0.5);

    // ── Lights ────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffeedd, 0.6));
    const sun = new THREE.DirectionalLight(0xfff0d0, 1.3);
    sun.position.set(CX, 10, -2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);
    const fill = new THREE.PointLight(0x4466ff, 0.5, 12);
    fill.position.set(CX, 3, CZ + 5);
    scene.add(fill);

    // ── Platform ─────────────────────────────────────────────────────────
    const platSide = new THREE.MeshLambertMaterial({ color: C_PLAT_SIDE });
    const platTop  = new THREE.MeshLambertMaterial({ color: C_PLAT_TOP });
    const plat = new THREE.Mesh(
      new THREE.BoxGeometry(TOTAL_W + 1.4, PLAT_Y, TOTAL_D + 1.4), platSide,
    );
    plat.position.set(CX, PLAT_Y / 2 - 0.01, CZ);
    plat.receiveShadow = true;
    scene.add(plat);
    const platFace = new THREE.Mesh(
      new THREE.PlaneGeometry(TOTAL_W + 1.4, TOTAL_D + 1.4), platTop,
    );
    platFace.rotation.x = -Math.PI / 2;
    platFace.position.set(CX, PLAT_Y + 0.001, CZ);
    scene.add(platFace);

    // ── Tiles ─────────────────────────────────────────────────────────────
    const tileGeo = new THREE.BoxGeometry(CELL * 0.92, TILE_H, CELL * 0.92);
    const allyMat = new THREE.MeshLambertMaterial({ color: C_ALLY_TILE });

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const at = new THREE.Mesh(tileGeo, allyMat);
        at.position.set(TX(c, false), PLAT_Y + TILE_H / 2, TZ(r));
        at.receiveShadow = true;
        scene.add(at);

        const em = new THREE.MeshLambertMaterial({ color: C_ENEMY_TILE });
        const et = new THREE.Mesh(tileGeo, em);
        et.position.set(TX(c, true), PLAT_Y + TILE_H / 2, TZ(r));
        et.receiveShadow = true;
        et.userData = { kind: "enemyTile", col: c, row: r };
        scene.add(et);
        enemyTiles.current.set(`${c}-${r}`, { mesh: et, mat: em, base: C_ENEMY_TILE, col: c, row: r });

        const dm   = new THREE.MeshLambertMaterial({ color: 0x993322 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.22), dm);
        body.position.set(TX(c, true), PLAT_Y + TILE_H + 0.16, TZ(r));
        body.castShadow = true;
        scene.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), dm);
        head.position.set(TX(c, true), PLAT_Y + TILE_H + 0.44, TZ(r));
        head.castShadow = true;
        scene.add(head);
      }
    }

    // ── Water / divider ───────────────────────────────────────────────────
    const water = new THREE.Mesh(
      new THREE.BoxGeometry(GAP, TILE_H * 0.4, TOTAL_D + 0.2),
      new THREE.MeshLambertMaterial({ color: C_WATER }),
    );
    water.position.set(WATER_X + GAP / 2, PLAT_Y + TILE_H * 0.2, CZ);
    scene.add(water);

    const pillarMat = new THREE.MeshLambertMaterial({ color: C_DIVIDER });
    for (let r = 0; r <= ROWS; r++) {
      const p = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.09, TILE_H * 2.5, 6), pillarMat,
      );
      p.position.set(WATER_X + GAP / 2, PLAT_Y + TILE_H * 1.25, r * CELL);
      scene.add(p);
    }

    const towerMat = new THREE.MeshLambertMaterial({ color: 0x4a4035 });
    for (const [tx, tz] of [
      [ALLY_X - 0.9, -0.9], [ALLY_X - 0.9, TOTAL_D + 0.9],
      [TOTAL_W + 0.9, -0.9], [TOTAL_W + 0.9, TOTAL_D + 0.9],
    ] as [number, number][]) {
      const tw = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.26, 1.4, 8), towerMat,
      );
      tw.position.set(tx, 0.7, tz);
      tw.castShadow = true;
      scene.add(tw);
    }

    // ── Sprite ────────────────────────────────────────────────────────────
    const animator = new FESpriteAnimator(cfg.assetBase, cfg.isEnemy, cfg.textureFilter);
    animRef.current = animator;

    animator.sprite.scale.set(cfg.sprHeight, cfg.sprHeight, 1);
    animator.sprite.position.set(
      SPR_X + cfg.charXShift,
      SPR_Y + cfg.charYCenter,
      SPR_Z,
    );
    scene.add(animator.sprite);
    spriteRef.current = animator.sprite;

    const shadowGeo  = new THREE.CircleGeometry(0.28, 12);
    const shadowMesh = new THREE.Mesh(shadowGeo,
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 }),
    );
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(SPR_X - CELL, SPR_Y + 0.003, SPR_Z);
    scene.add(shadowMesh);
    shadowRef.current = shadowMesh;

    animator.preload(cfg.allFiles).then(() => {
      animator.playClip(cfg.idleClip, true);
      loadedRef.current = true;
      setLoaded(true);
      setStatus("Click an enemy tile to attack");
    });

    // ── Pointer interaction ───────────────────────────────────────────────
    const tileList = () => [...enemyTiles.current.values()].map(r => r.mesh);

    function getPointerTile(e: PointerEvent) {
      const rect = el!.getBoundingClientRect();
      pointer.current.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.current.setFromCamera(pointer.current, camera);
      const hits = raycaster.current.intersectObjects(tileList(), false);
      if (!hits.length) return null;
      const { col, row } = hits[0].object.userData as { col: number; row: number };
      return { key: `${col}-${row}`, col, row };
    }

    function onPointerMove(e: PointerEvent) {
      const hit    = getPointerTile(e);
      const newKey = hit?.key ?? null;
      if (newKey === hoveredRef.current) return;

      if (hoveredRef.current) {
        const prev = enemyTiles.current.get(hoveredRef.current);
        if (prev && moveState.current.phase === "idle") prev.mat.color.setHex(prev.base);
      }
      if (newKey) {
        const rec = enemyTiles.current.get(newKey);
        if (rec && moveState.current.phase === "idle") rec.mat.color.setHex(C_ENEMY_HOV);
        el!.style.cursor = "pointer";
      } else {
        el!.style.cursor = "";
      }
      hoveredRef.current = newKey;
    }

    function onPointerDown(e: PointerEvent) {
      if (e.button !== 0 || !loadedRef.current) return;
      if (moveState.current.phase !== "idle") return;

      const hit = getPointerTile(e);
      if (!hit) return;
      const rec = enemyTiles.current.get(hit.key);
      if (!rec) return;

      for (const [k, r] of enemyTiles.current) {
        r.mat.color.setHex(k === hit.key ? C_ENEMY_HOV : r.base);
      }

      moveState.current = {
        phase:    "approach",
        startMs:  performance.now(),
        duration: DASH_MS,
        fromX: SPR_X, fromZ: SPR_Z,
        toX:   TX(hit.col, true), toZ: TZ(hit.row),
        tileKey: hit.key,
      };
      setTarget(hit.key);
      setStatus(`Dashing to col ${hit.col + 1} · row ${hit.row + 1}…`);
    }

    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerdown", onPointerDown);

    // ── Resize ────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      if (!el.clientWidth || !el.clientHeight) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    });
    ro.observe(el);

    // ── Render loop ───────────────────────────────────────────────────────
    let rafId = 0;
    let alive = true;

    function loop() {
      if (!alive) return;
      rafId = requestAnimationFrame(loop);
      const nowMs = performance.now();
      animator.update(nowMs);

      const ms = moveState.current;

      if (ms.phase === "approach" || ms.phase === "return") {
        const tween = easeOutQuad(Math.min((nowMs - ms.startMs) / ms.duration, 1));
        const charX = ms.fromX + (ms.toX - ms.fromX) * tween;
        const charZ = ms.fromZ + (ms.toZ - ms.fromZ) * tween;

        if (spriteRef.current) {
          spriteRef.current.position.x = charX + cfg.charXShift;
          spriteRef.current.position.z = charZ;
        }
        if (shadowRef.current) {
          shadowRef.current.position.x = charX - CELL;
          shadowRef.current.position.z = charZ;
        }

        if (tween >= 1) {
          if (ms.phase === "approach") {
            const rec = enemyTiles.current.get(ms.tileKey);
            if (rec) rec.mat.color.setHex(C_ENEMY_ATK);
            moveState.current = { ...ms, phase: "attacking" };
            setStatus(`Attacking col ${Number(ms.tileKey.split("-")[0]) + 1}…`);

            animator.onFrameChange((file) => {
              if (file === cfg.hitFrame) audioManager.playSwordSlash();
            });
            animator.playClip(cfg.attackClip, false, () => {
              animator.onFrameChange(null);
              const rec2 = enemyTiles.current.get(ms.tileKey);
              if (rec2) rec2.mat.color.setHex(rec2.base);
              moveState.current = {
                phase:    "return",
                startMs:  performance.now(),
                duration: RETURN_MS,
                fromX: ms.toX, fromZ: ms.toZ,
                toX: SPR_X,    toZ: SPR_Z,
                tileKey: ms.tileKey,
              };
              animator.playClip(cfg.idleClip, true);
              setStatus("Returning…");
            });
          } else {
            if (spriteRef.current) {
              spriteRef.current.position.x = SPR_X + cfg.charXShift;
              spriteRef.current.position.z = SPR_Z;
            }
            if (shadowRef.current) {
              shadowRef.current.position.x = SPR_X - CELL;
              shadowRef.current.position.z = SPR_Z;
            }
            moveState.current = { ...IDLE_STATE };
            setTarget(null);
            setStatus("Click an enemy tile to attack");
          }
        }
      }

      renderer.render(scene, camera);
    }
    loop();

    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerdown", onPointerDown);
      animator.dispose();
      animRef.current  = null;
      spriteRef.current = null;
      shadowRef.current = null;
      enemyTiles.current.clear();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [selectedUnit]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCfg = UNITS.find(u => u.id === selectedUnit) ?? UNITS[0]!;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#07040f", display: "flex", flexDirection: "column", fontFamily: "'Cinzel', serif" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", background: "rgba(5,3,12,0.95)", borderBottom: "1px solid rgba(240,192,64,0.18)", flexShrink: 0, zIndex: 10 }}>
        <button onClick={() => navigate("/")} style={btn}>← Back</button>

        {/* Unit picker */}
        <div style={{ display: "flex", gap: 5 }}>
          {UNITS.map(u => (
            <button
              key={u.id}
              onClick={() => { if (u.id !== selectedUnit) setSelectedUnit(u.id); }}
              style={u.id === selectedUnit ? activeUnitBtn : unitBtn}
            >
              {u.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.28em", color: "rgba(240,192,64,0.40)", textTransform: "uppercase" }}>Sprite Test</div>
          <div style={{ fontSize: 14, color: "#f0e0a0", letterSpacing: "0.06em", fontWeight: 700 }}>
            {activeCfg.label} · Attack Animation
          </div>
        </div>

        <div style={{ fontSize: 10, color: target ? "rgba(255,140,80,0.9)" : "rgba(200,170,100,0.45)", letterSpacing: "0.08em", minWidth: 160, textAlign: "right" }}>
          {status}
        </div>
      </div>

      <div ref={mountRef} style={{ flex: 1, position: "relative" }} />

      {/* ── Footer ── */}
      <div style={{ display: "flex", gap: 24, justifyContent: "center", alignItems: "center", padding: "10px 20px", background: "rgba(5,3,12,0.85)", borderTop: "1px solid rgba(240,192,64,0.12)", flexShrink: 0, zIndex: 10, fontSize: 10, color: "rgba(180,150,100,0.4)", letterSpacing: "0.1em" }}>
        <span>ALLY ← Left 4×4</span>
        <span style={{ color: "rgba(240,192,64,0.25)" }}>|</span>
        <span style={{ color: loaded ? "rgba(255,120,80,0.6)" : "rgba(120,80,60,0.3)" }}>
          {loaded ? "Click enemy tile → unit dashes, attacks, returns" : "Loading frames…"}
        </span>
        <span style={{ color: "rgba(240,192,64,0.25)" }}>|</span>
        <span>{activeCfg.frameLabel}</span>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const btn: React.CSSProperties = {
  fontFamily: "'Cinzel', serif",
  fontSize: 10,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "rgba(220,190,120,0.8)",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(240,192,64,0.22)",
  borderRadius: 7,
  padding: "6px 14px",
  cursor: "pointer",
  flexShrink: 0,
};

const unitBtn: React.CSSProperties = {
  fontFamily: "'Cinzel', serif",
  fontSize: 10,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "rgba(180,150,100,0.55)",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(240,192,64,0.14)",
  borderRadius: 6,
  padding: "5px 13px",
  cursor: "pointer",
};

const activeUnitBtn: React.CSSProperties = {
  ...unitBtn,
  color: "#f0c840",
  background: "rgba(240,192,64,0.12)",
  border: "1px solid rgba(240,192,64,0.50)",
};
