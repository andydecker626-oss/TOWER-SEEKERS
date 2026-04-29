import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { GridUnit } from "@/lib/types";

type SelectMode = "none" | "move" | "attack" | "skill";

// ── Grid layout ───────────────────────────────────────────────────────────────
const CELL    = 1.0;
const GAP     = 0.5;
const COLS    = 4;
const ROWS    = 4;
const ALLY_X  = 0;
const WATER_X = COLS * CELL;
const ENEMY_X = WATER_X + GAP;
const TOTAL_W = ENEMY_X + COLS * CELL;   // 8.5
const TOTAL_D = ROWS * CELL;             // 4.0
const CX      = TOTAL_W / 2;            // 4.25
const CZ      = TOTAL_D / 2;            // 2.0
const TILE_H  = 0.14;
const PLAT_Y  = 0.12;   // platform top face

// Team colours
const ALLY_C  = 0x2255cc;
const ALLY_D  = 0x112299;
const ENEMY_C = 0xcc2222;
const ENEMY_D = 0x881111;
const WEAPON  = 0x888877;
const GOLD    = 0xd4aa33;

// Tile highlight colours
const HL_MOVE  = 0x44cc55;
const HL_ATCK  = 0xff4422;
const HL_SKILL = 0xaa44ff;

const STONE_L = 0x8a8072;
const STONE_D = 0x6a6055;
const MORTAR  = 0x2e2820;

const TX = (col: number, onEnemy: boolean) =>
  (onEnemy ? ENEMY_X : ALLY_X) + col * CELL + CELL / 2;
const TZ = (row: number) => row * CELL + CELL / 2;

// ── Camera presets ────────────────────────────────────────────────────────────
const PRESETS = [
  { name: "Overview",  pos: new THREE.Vector3(CX,    9.0, TOTAL_D + 6.5), look: new THREE.Vector3(CX, 0, CZ - 0.5) },
  { name: "Ally View", pos: new THREE.Vector3(-4.5,  3.5, TOTAL_D + 5.5), look: new THREE.Vector3(CX + 1, 0.3, CZ) },
  { name: "Side",      pos: new THREE.Vector3(14.0,  5.5, CZ),            look: new THREE.Vector3(CX, 0, CZ) },
  { name: "Cinematic", pos: new THREE.Vector3(CX,    2.2, TOTAL_D + 9.5), look: new THREE.Vector3(CX, 0.6, CZ) },
  { name: "Aerial",    pos: new THREE.Vector3(CX,   15.5, CZ + 1.5),      look: new THREE.Vector3(CX, 0, CZ) },
];

// ── Props ─────────────────────────────────────────────────────────────────────
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

// ── Character builder ─────────────────────────────────────────────────────────
// Each returns the THREE.Group — armour + detail materials are stored on group.userData
interface CharInfo {
  group:     THREE.Group;
  armorMat:  THREE.MeshLambertMaterial;
  detailMat: THREE.MeshLambertMaterial;
}

function mk(
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  px: number, py: number, pz: number,
  group: THREE.Group,
  rx = 0, ry = 0, rz = 0,
) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(px, py, pz);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  group.add(m);
  return m;
}

function baseHumanoid(
  aColor: number, dColor: number,
  bodyW = 0.28, bodyH = 0.24,
): CharInfo & { group: THREE.Group; weaponMat: THREE.MeshLambertMaterial } {
  const armorMat  = new THREE.MeshLambertMaterial({ color: aColor });
  const detailMat = new THREE.MeshLambertMaterial({ color: dColor });
  const weaponMat = new THREE.MeshLambertMaterial({ color: WEAPON });
  const group = new THREE.Group();

  // Disc base
  mk(new THREE.CylinderGeometry(0.24, 0.26, 0.06, 10), detailMat, 0, 0.03, 0, group);
  // Legs
  mk(new THREE.BoxGeometry(0.20, 0.22, 0.14), armorMat, 0, 0.17, 0, group);
  // Torso
  mk(new THREE.BoxGeometry(bodyW, bodyH, 0.16), armorMat, 0, 0.35, 0, group);
  // Pauldrons
  mk(new THREE.SphereGeometry(0.09, 6, 5), detailMat, -bodyW * 0.6, 0.39, 0, group);
  mk(new THREE.SphereGeometry(0.09, 6, 5), detailMat,  bodyW * 0.6, 0.39, 0, group);
  // Head (sphere)
  mk(new THREE.SphereGeometry(0.11, 8, 7), armorMat, 0, 0.58, 0, group);

  return { group, armorMat, detailMat, weaponMat };
}

function buildKnight(aC: number, dC: number): CharInfo {
  const { group, armorMat, detailMat, weaponMat } = baseHumanoid(aC, dC, 0.32, 0.26);
  // Great helm — box
  mk(new THREE.BoxGeometry(0.23, 0.19, 0.20), detailMat, 0, 0.60, 0, group);
  // Visor slit
  mk(new THREE.BoxGeometry(0.14, 0.03, 0.21), new THREE.MeshLambertMaterial({ color: 0x111111 }), 0, 0.61, 0, group);
  // Large shield (left)
  mk(new THREE.BoxGeometry(0.05, 0.32, 0.22), detailMat, -0.28, 0.36, 0, group);
  // Sword (right, pointing up)
  mk(new THREE.BoxGeometry(0.05, 0.40, 0.04), weaponMat, 0.28, 0.46, 0, group);
  // Cross guard
  mk(new THREE.BoxGeometry(0.15, 0.04, 0.04), weaponMat, 0.28, 0.55, 0, group);
  return { group, armorMat, detailMat };
}

function buildPaladin(aC: number, dC: number): CharInfo {
  const { group, armorMat, detailMat, weaponMat } = baseHumanoid(aC, dC, 0.30, 0.25);
  // Round-top helm
  mk(new THREE.SphereGeometry(0.13, 8, 6), detailMat, 0, 0.60, 0, group);
  // Holy cross emblem on chest
  mk(new THREE.BoxGeometry(0.04, 0.16, 0.03), new THREE.MeshLambertMaterial({ color: GOLD }), 0, 0.35, 0.09, group);
  mk(new THREE.BoxGeometry(0.12, 0.04, 0.03), new THREE.MeshLambertMaterial({ color: GOLD }), 0, 0.38, 0.09, group);
  // Shield with cross
  mk(new THREE.BoxGeometry(0.05, 0.30, 0.20), detailMat, -0.26, 0.36, 0, group);
  mk(new THREE.BoxGeometry(0.06, 0.14, 0.03), new THREE.MeshLambertMaterial({ color: GOLD }), -0.22, 0.36, 0.12, group);
  // Holy sword (glowing golden)
  mk(new THREE.BoxGeometry(0.05, 0.38, 0.04), new THREE.MeshLambertMaterial({ color: 0xd4c060 }), 0.26, 0.46, 0, group);
  mk(new THREE.BoxGeometry(0.14, 0.04, 0.04), weaponMat, 0.26, 0.54, 0, group);
  return { group, armorMat, detailMat };
}

function buildBerserker(aC: number, dC: number): CharInfo {
  const { group, armorMat, detailMat, weaponMat } = baseHumanoid(aC, dC, 0.36, 0.28);
  group.scale.set(1.1, 1.1, 1.1);
  // Horned helm
  mk(new THREE.BoxGeometry(0.26, 0.18, 0.22), detailMat, 0, 0.61, 0, group);
  mk(new THREE.ConeGeometry(0.05, 0.22, 6), detailMat, -0.11, 0.76, 0, group); // horn L
  mk(new THREE.ConeGeometry(0.05, 0.22, 6), detailMat,  0.11, 0.76, 0, group); // horn R
  // Massive two-handed axe
  mk(new THREE.BoxGeometry(0.05, 0.52, 0.05), weaponMat, 0.30, 0.40, 0, group); // haft
  mk(new THREE.BoxGeometry(0.06, 0.22, 0.28), detailMat, 0.30, 0.63, 0.10, group); // top blade
  mk(new THREE.BoxGeometry(0.06, 0.14, 0.20), detailMat, 0.30, 0.30, -0.08, group); // bottom blade
  return { group, armorMat, detailMat };
}

function buildLancer(aC: number, dC: number): CharInfo {
  const { group, armorMat, detailMat, weaponMat } = baseHumanoid(aC, dC, 0.26, 0.22);
  // Crested helm — cylinder with fin
  mk(new THREE.CylinderGeometry(0.10, 0.12, 0.14, 8), detailMat, 0, 0.61, 0, group);
  mk(new THREE.BoxGeometry(0.04, 0.18, 0.06), detailMat, 0, 0.72, 0, group); // fin/crest
  // Tall spear (landmark silhouette)
  mk(new THREE.CylinderGeometry(0.025, 0.025, 1.30, 7), weaponMat, 0.24, 0.80, 0, group);
  mk(new THREE.ConeGeometry(0.05, 0.22, 6), new THREE.MeshLambertMaterial({ color: 0xaaaacc }), 0.24, 1.50, 0, group); // spear tip
  return { group, armorMat, detailMat };
}

function buildWanderer(aC: number, dC: number): CharInfo {
  const { group, armorMat, detailMat, weaponMat } = baseHumanoid(aC, dC, 0.24, 0.20);
  // Conical travelling hat
  mk(new THREE.ConeGeometry(0.16, 0.30, 8), detailMat, 0, 0.75, 0, group);
  mk(new THREE.TorusGeometry(0.15, 0.025, 6, 12), detailMat, 0, 0.63, 0, group); // brim
  // Diagonal katana
  mk(new THREE.BoxGeometry(0.04, 0.48, 0.03), weaponMat, 0.24, 0.46, 0, group, 0, 0, -0.22);
  mk(new THREE.BoxGeometry(0.10, 0.05, 0.05), new THREE.MeshLambertMaterial({ color: 0x8a7040 }), 0.24, 0.35, 0, group); // tsuba
  return { group, armorMat, detailMat };
}

function buildRogue(aC: number, dC: number): CharInfo {
  const { group, armorMat, detailMat, weaponMat } = baseHumanoid(aC, dC, 0.22, 0.18);
  group.scale.set(0.92, 0.92, 0.92);
  group.position.y = -0.04; // crouched
  // Hood (dark)
  mk(new THREE.SphereGeometry(0.13, 8, 7), detailMat, 0, 0.60, 0, group);
  mk(new THREE.BoxGeometry(0.10, 0.04, 0.14), new THREE.MeshLambertMaterial({ color: 0x111111 }), 0, 0.60, 0.06, group); // mask slit
  // Dual short daggers
  mk(new THREE.BoxGeometry(0.04, 0.28, 0.04), weaponMat, -0.26, 0.38, 0, group, 0, 0,  0.18);
  mk(new THREE.BoxGeometry(0.04, 0.28, 0.04), weaponMat,  0.26, 0.38, 0, group, 0, 0, -0.18);
  return { group, armorMat, detailMat };
}

function buildArcher(aC: number, dC: number): CharInfo {
  const { group, armorMat, detailMat } = baseHumanoid(aC, dC, 0.24, 0.20);
  const weaponMat = new THREE.MeshLambertMaterial({ color: 0x5c3a10 });
  // Simple cap / ranger hood
  mk(new THREE.CylinderGeometry(0.09, 0.12, 0.10, 8), detailMat, 0, 0.62, 0, group);
  mk(new THREE.ConeGeometry(0.09, 0.14, 8), detailMat, 0, 0.72, 0, group);
  // Bow — half-torus on left side
  mk(new THREE.TorusGeometry(0.22, 0.028, 7, 12, Math.PI), weaponMat, -0.32, 0.42, 0, group, 0, Math.PI / 2, 0);
  // Bowstring (thin)
  mk(new THREE.CylinderGeometry(0.006, 0.006, 0.44, 5), new THREE.MeshBasicMaterial({ color: 0xddccaa }), -0.32, 0.42, 0, group, 0, 0, Math.PI / 2);
  // Quiver on back
  mk(new THREE.CylinderGeometry(0.06, 0.06, 0.28, 7), detailMat, 0, 0.38, -0.14, group, 0.3, 0, 0);
  // Arrow in bow
  mk(new THREE.CylinderGeometry(0.01, 0.01, 0.36, 5), new THREE.MeshLambertMaterial({ color: 0xb08040 }), -0.12, 0.42, 0, group, 0, 0, Math.PI / 2);
  return { group, armorMat, detailMat };
}

function buildMage(aC: number, dC: number): CharInfo {
  const armorMat  = new THREE.MeshLambertMaterial({ color: aC });
  const detailMat = new THREE.MeshLambertMaterial({ color: dC });
  const group = new THREE.Group();
  // Robe — wide flared cylinder bottom
  mk(new THREE.CylinderGeometry(0.26, 0.34, 0.38, 10), armorMat, 0, 0.19, 0, group);
  // Upper robe / torso
  mk(new THREE.CylinderGeometry(0.18, 0.26, 0.20, 10), armorMat, 0, 0.48, 0, group);
  // Head
  mk(new THREE.SphereGeometry(0.11, 8, 7), armorMat, 0, 0.66, 0, group);
  // Tall pointed hat
  mk(new THREE.CylinderGeometry(0.01, 0.14, 0.46, 8), detailMat, 0, 0.92, 0, group);
  mk(new THREE.TorusGeometry(0.14, 0.022, 6, 12), detailMat, 0, 0.70, 0, group); // hat brim
  // Staff
  mk(new THREE.CylinderGeometry(0.025, 0.025, 0.80, 7), new THREE.MeshLambertMaterial({ color: 0x5c3a10 }), 0.28, 0.55, 0, group);
  // Glowing orb atop staff
  const orbMat = new THREE.MeshBasicMaterial({ color: 0x88aaff });
  mk(new THREE.SphereGeometry(0.07, 8, 7), orbMat, 0.28, 0.98, 0, group);
  return { group, armorMat, detailMat };
}

function buildCleric(aC: number, dC: number): CharInfo {
  const armorMat  = new THREE.MeshLambertMaterial({ color: aC });
  const detailMat = new THREE.MeshLambertMaterial({ color: dC });
  const goldMat   = new THREE.MeshLambertMaterial({ color: GOLD });
  const group = new THREE.Group();
  // Wide flowing robe
  mk(new THREE.CylinderGeometry(0.28, 0.38, 0.42, 10), armorMat, 0, 0.21, 0, group);
  mk(new THREE.CylinderGeometry(0.19, 0.28, 0.20, 10), armorMat, 0, 0.51, 0, group);
  // Head
  mk(new THREE.SphereGeometry(0.11, 8, 7), armorMat, 0, 0.69, 0, group);
  // Hood dome
  mk(new THREE.SphereGeometry(0.14, 8, 5), detailMat, 0, 0.72, 0, group);
  // Staff with holy cross on top
  mk(new THREE.CylinderGeometry(0.025, 0.025, 0.72, 7), new THREE.MeshLambertMaterial({ color: 0x7a6030 }), 0.28, 0.50, 0, group);
  mk(new THREE.BoxGeometry(0.04, 0.30, 0.04), goldMat, 0.28, 0.89, 0, group); // vertical
  mk(new THREE.BoxGeometry(0.16, 0.04, 0.04), goldMat, 0.28, 0.96, 0, group); // horizontal
  // Glowing holy aura disk (subtle glow below)
  mk(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 12), new THREE.MeshBasicMaterial({ color: 0xffffcc, transparent: true, opacity: 0.4 }), 0, 0.07, 0, group);
  return { group, armorMat, detailMat };
}

function buildWarlock(aC: number, dC: number): CharInfo {
  const armorMat  = new THREE.MeshLambertMaterial({ color: aC });
  const detailMat = new THREE.MeshLambertMaterial({ color: dC });
  const darkMat   = new THREE.MeshLambertMaterial({ color: 0x110820 });
  const group = new THREE.Group();
  // Dark tattered robe (slim, angular)
  mk(new THREE.CylinderGeometry(0.20, 0.30, 0.44, 8), armorMat, 0, 0.22, 0, group);
  mk(new THREE.CylinderGeometry(0.16, 0.20, 0.22, 8), armorMat, 0, 0.53, 0, group);
  // Head
  mk(new THREE.SphereGeometry(0.11, 8, 7), darkMat, 0, 0.68, 0, group);
  // Horned skull helmet
  mk(new THREE.BoxGeometry(0.22, 0.18, 0.20), detailMat, 0, 0.69, 0, group);
  mk(new THREE.ConeGeometry(0.045, 0.24, 6), armorMat, -0.09, 0.85, 0, group, 0.2, 0, -0.3); // horn L
  mk(new THREE.ConeGeometry(0.045, 0.24, 6), armorMat,  0.09, 0.85, 0, group, 0.2, 0,  0.3); // horn R
  // Dark staff
  mk(new THREE.CylinderGeometry(0.025, 0.025, 0.82, 7), new THREE.MeshLambertMaterial({ color: 0x220a30 }), 0.28, 0.55, 0, group);
  // Pulsing dark orb
  const darkOrb = new THREE.MeshBasicMaterial({ color: 0x6600aa });
  mk(new THREE.SphereGeometry(0.08, 8, 7), darkOrb, 0.28, 1.00, 0, group);
  // Skull face plates
  mk(new THREE.BoxGeometry(0.06, 0.04, 0.21), new THREE.MeshLambertMaterial({ color: 0x221a22 }), 0, 0.70, 0, group); // eye slit
  return { group, armorMat, detailMat };
}

function buildDefaultUnit(aC: number, dC: number): CharInfo {
  const { group, armorMat, detailMat } = baseHumanoid(aC, dC);
  // Simple round helm
  mk(new THREE.SphereGeometry(0.13, 8, 6), detailMat, 0, 0.61, 0, group);
  mk(new THREE.BoxGeometry(0.05, 0.40, 0.04), new THREE.MeshLambertMaterial({ color: WEAPON }), 0.24, 0.44, 0, group);
  return { group, armorMat, detailMat };
}

function buildCharacterFor(defId: string, isEnemy: boolean): CharInfo {
  const aC = isEnemy ? ENEMY_C : ALLY_C;
  const dC = isEnemy ? ENEMY_D : ALLY_D;
  switch (defId) {
    case "knight":    return buildKnight(aC, dC);
    case "paladin":   return buildPaladin(aC, dC);
    case "berserker": return buildBerserker(aC, dC);
    case "lancer":    return buildLancer(aC, dC);
    case "wanderer":  return buildWanderer(aC, dC);
    case "rogue":     return buildRogue(aC, dC);
    case "archer":    return buildArcher(aC, dC);
    case "mage":      return buildMage(aC, dC);
    case "cleric":    return buildCleric(aC, dC);
    case "warlock":   return buildWarlock(aC, dC);
    default:          return buildDefaultUnit(aC, dC);
  }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BattleRenderer({
  myUnits, enemyUnits, selectedId, highlights, selectMode,
  queued, flashUnits, onUnitClick, onTileClick,
}: Props) {
  const mountRef  = useRef<HTMLDivElement>(null);
  const camIdxRef = useRef(0);
  const [camName, setCamName] = useState(PRESETS[0].name);

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

  function cycleCamera() {
    const next = (camIdxRef.current + 1) % PRESETS.length;
    camIdxRef.current = next;
    setCamName(PRESETS[next].name);
  }

  useEffect(() => {
    const el = mountRef.current!;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }); }
    catch { return; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // Warm amber-orange fog matches the horizon — fills any distant void
    scene.fog = new THREE.Fog(0xb06020, 50, 140);

    // ── Camera ──────────────────────────────────────────────────────────────
    const camera  = new THREE.PerspectiveCamera(44, el.clientWidth / el.clientHeight, 0.1, 300);
    const camPos  = PRESETS[0].pos.clone();
    const camLook = PRESETS[0].look.clone();
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    // ── Sky dome (vertex-coloured gradient: warm horizon → deep purple zenith) ─
    {
      const skyGeo = new THREE.SphereGeometry(200, 32, 18);
      const pos = skyGeo.attributes.position as THREE.BufferAttribute;
      const cols = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const t = Math.max(-1, Math.min(1, y / 200)); // -1 south pole → 1 north pole
        // horizon (t≈0): warm amber rgb(0.69, 0.37, 0.12)
        // zenith (t=1):  deep purple rgb(0.04, 0.02, 0.18)
        // nadir (t=-1):  very dark ground rgb(0.06, 0.04, 0.02)
        const hr = 0.69, hg = 0.37, hb = 0.12;
        const zr = 0.04, zg = 0.02, zb = 0.18;
        const gr = 0.06, gg = 0.04, gb = 0.02;
        if (t >= 0) {
          cols[i * 3 + 0] = hr + t * (zr - hr);
          cols[i * 3 + 1] = hg + t * (zg - hg);
          cols[i * 3 + 2] = hb + t * (zb - hb);
        } else {
          const ft = -t;
          cols[i * 3 + 0] = hr + ft * (gr - hr);
          cols[i * 3 + 1] = hg + ft * (gg - hg);
          cols[i * 3 + 2] = hb + ft * (gb - hb);
        }
      }
      skyGeo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
      scene.add(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    }

    // ── Lights ──────────────────────────────────────────────────────────────
    // Hemisphere: warm orange sky fill + dark green ground fill
    scene.add(new THREE.HemisphereLight(0xffa040, 0x203808, 0.7));
    scene.add(new THREE.AmbientLight(0xfff0d0, 0.3));

    const sun = new THREE.DirectionalLight(0xffb060, 1.2);
    sun.position.set(CX - 10, 18, TOTAL_D + 12);
    sun.target.position.set(CX, 0, CZ);
    sun.castShadow = true;
    sun.shadow.mapSize.setScalar(1024);
    const sc = sun.shadow.camera as THREE.OrthographicCamera;
    sc.left = -20; sc.right = 20; sc.top = 14; sc.bottom = -14;
    scene.add(sun); scene.add(sun.target);

    // Torch warm fill lights (on corner towers)
    const torchLights: THREE.PointLight[] = [];
    const flameMeshes: THREE.Mesh[]       = [];

    function addTorchAt(x: number, y: number, z: number, intensity = 2.8, range = 10) {
      const pl = new THREE.PointLight(0xff8822, intensity, range);
      pl.position.set(x, y, z);
      pl.userData.base = intensity;
      scene.add(pl);
      torchLights.push(pl);

      const sconce = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.07, 0.30, 7),
        new THREE.MeshLambertMaterial({ color: 0x1c1508 }),
      );
      sconce.position.set(x, y - 0.15, z);
      scene.add(sconce);

      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.26, 7),
        new THREE.MeshBasicMaterial({ color: 0xff8822, transparent: true, opacity: 0.9 }),
      );
      flame.position.set(x, y + 0.12, z);
      scene.add(flame);
      flameMeshes.push(flame);
    }

    // ── Natural grass ground ─────────────────────────────────────────────────
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x1e3010 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), grassMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(CX, -0.01, CZ);
    ground.receiveShadow = true;
    scene.add(ground);

    // Dirt patches (slightly lighter ground variation)
    const dirtMat = new THREE.MeshLambertMaterial({ color: 0x3a2a14 });
    const DIRT_PATCHES: [number, number, number, number][] = [
      [-8, -5, 14, 10], [12, -3, 12, 8], [2, 8, 16, 6], [-5, 3, 8, 7],
    ];
    DIRT_PATCHES.forEach(([px, pz, pw, pd]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, pd), dirtMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(px + CX, 0.003, pz + CZ);
      scene.add(m);
    });

    // Gentle terrain hills (very wide, very flat cylinders)
    const hillMat = new THREE.MeshLambertMaterial({ color: 0x172509 });
    const HILLS: [number, number, number, number][] = [
      // [x, z, radius, height]
      [-20, -15, 28, 2.5], [22, -12, 24, 2.0], [-18, 12, 20, 1.8],
      [26,  10,  22, 2.2], [5, -30, 30, 3.5],
    ];
    HILLS.forEach(([hx, hz, hr, hh]) => {
      const hill = new THREE.Mesh(new THREE.CylinderGeometry(hr, hr + 8, hh, 14), hillMat);
      hill.position.set(hx + CX, hh / 2 - hh - 0.5, hz + CZ);
      scene.add(hill);
    });

    // Scattered rocks / boulders
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x5a5040 });
    const ROCKS: [number, number, number][] = [
      [-6, -3, 0.4], [14, 2, 0.6], [-7, 5, 0.35], [12, -2, 0.5],
      [3, -7, 0.55], [8, 7, 0.45], [-4, 6, 0.3],
    ];
    ROCKS.forEach(([rx, rz, rr]) => {
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(rr, 0), rockMat);
      rock.scale.y = 0.65;
      rock.position.set(rx + CX, rr * 0.3, rz + CZ);
      rock.castShadow = true;
      scene.add(rock);
    });

    // ── Battle platform (stone dias) ─────────────────────────────────────────
    const platMat = new THREE.MeshLambertMaterial({ color: 0x5a5040 });
    const platTop = new THREE.MeshLambertMaterial({ color: 0x6a5e4a });
    // Main platform slab
    const plat = new THREE.Mesh(new THREE.BoxGeometry(TOTAL_W + 1.6, PLAT_Y, TOTAL_D + 1.6), platMat);
    plat.position.set(CX, PLAT_Y / 2 - 0.01, CZ);
    plat.receiveShadow = true;
    scene.add(plat);
    // Top face (slightly lighter)
    const platFace = new THREE.Mesh(new THREE.PlaneGeometry(TOTAL_W + 1.6, TOTAL_D + 1.6), platTop);
    platFace.rotation.x = -Math.PI / 2;
    platFace.position.set(CX, PLAT_Y + 0.001, CZ);
    platFace.receiveShadow = true;
    scene.add(platFace);
    // Step edge around platform
    const stepMat = new THREE.MeshLambertMaterial({ color: 0x4a4030 });
    const STEP = 0.18;
    [[CX, CZ - (TOTAL_D + 1.6) / 2, TOTAL_W + 1.6 + STEP * 2, STEP],  // front
     [CX, CZ + (TOTAL_D + 1.6) / 2, TOTAL_W + 1.6 + STEP * 2, STEP],  // back
     [ALLY_X - 0.8 - STEP / 2, CZ, STEP, TOTAL_D + 1.6],               // left
     [TOTAL_W + 0.8 + STEP / 2, CZ, STEP, TOTAL_D + 1.6],              // right
    ].forEach(([sx, sz, sw, sd]) => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(sw, PLAT_Y * 0.6, sd), stepMat);
      s.position.set(sx, PLAT_Y * 0.3 - 0.01, sz);
      scene.add(s);
    });

    // ── Battle floor tiles ────────────────────────────────────────────────────
    const tileGeo = new THREE.BoxGeometry(CELL * 0.92, TILE_H, CELL * 0.92);
    interface TileRecord { mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; baseColor: number }
    const tileMeshes = new Map<string, TileRecord>();

    function makeTiles(onEnemy: boolean) {
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const baseColor = (row + col) % 2 === 0 ? STONE_L : STONE_D;
          const mat  = new THREE.MeshLambertMaterial({ color: baseColor });
          const mesh = new THREE.Mesh(tileGeo, mat);
          mesh.position.set(TX(col, onEnemy), PLAT_Y + TILE_H / 2, TZ(row));
          mesh.receiveShadow = true;
          mesh.userData = { type: "tile", col, row, onEnemy };
          scene.add(mesh);
          tileMeshes.set(`${onEnemy ? "e" : "a"}-${col}-${row}`, { mesh, mat, baseColor });
        }
      }
    }
    makeTiles(false);
    makeTiles(true);

    // Mortar bases
    const mortarMat = new THREE.MeshLambertMaterial({ color: MORTAR });
    [[ALLY_X + COLS * CELL / 2], [ENEMY_X + COLS * CELL / 2]].forEach(([mx]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(COLS * CELL, TOTAL_D), mortarMat.clone());
      m.rotation.x = -Math.PI / 2;
      m.position.set(mx, PLAT_Y + 0.002, TOTAL_D / 2);
      scene.add(m);
    });

    // Water channel
    const waterMat = new THREE.MeshLambertMaterial({ color: 0x1a3860 });
    const water = new THREE.Mesh(new THREE.BoxGeometry(GAP, TILE_H * 0.5, TOTAL_D + 0.2), waterMat);
    water.position.set(WATER_X + GAP / 2, PLAT_Y + TILE_H * 0.25, TOTAL_D / 2);
    scene.add(water);

    // ── Corner towers ─────────────────────────────────────────────────────────
    const towerBodyMat = new THREE.MeshLambertMaterial({ color: 0x50473c });
    const towerCapMat  = new THREE.MeshLambertMaterial({ color: 0x706050 });
    const TOWER_H = 3.8;
    const TOWER_W = 1.0;

    const TOWER_POS: [number, number, number][] = [
      [ALLY_X  - TOWER_W - 0.8, -TOWER_W - 0.8, 1],   // back-left  (ally)
      [TOTAL_W + TOWER_W + 0.8, -TOWER_W - 0.8,-1],   // back-right (enemy)
      [ALLY_X  - TOWER_W - 0.8,  TOTAL_D + TOWER_W + 0.8, 1], // front-left (ally)
      [TOTAL_W + TOWER_W + 0.8,  TOTAL_D + TOWER_W + 0.8,-1], // front-right (enemy)
    ];

    TOWER_POS.forEach(([tx, tz, side]) => {
      const isAlly = side === 1;
      // Shaft
      const body = new THREE.Mesh(new THREE.BoxGeometry(TOWER_W, TOWER_H, TOWER_W), towerBodyMat);
      body.position.set(tx, TOWER_H / 2, tz);
      body.castShadow = true; body.receiveShadow = true;
      scene.add(body);
      // Roof deck
      const deck = new THREE.Mesh(new THREE.BoxGeometry(TOWER_W + 0.18, 0.14, TOWER_W + 0.18), towerCapMat);
      deck.position.set(tx, TOWER_H + 0.07, tz);
      scene.add(deck);
      // Battlements
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz]) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.22), towerBodyMat);
        m.position.set(tx + sx * 0.35, TOWER_H + 0.23, tz + sz * 0.35);
        scene.add(m);
      });
      // Tower torch
      addTorchAt(tx, TOWER_H + 0.35, tz, 3.2, 12);
      // Banner
      const bannerColor = isAlly ? ALLY_D : ENEMY_D;
      const bannerFX = isAlly ? 0.58 : -0.58;
      const bannerMat = new THREE.MeshLambertMaterial({ color: bannerColor, emissive: bannerColor, emissiveIntensity: 0.08 });
      const banner = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.5, 0.24), bannerMat);
      banner.position.set(tx + bannerFX, TOWER_H - 0.62, tz);
      scene.add(banner);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.27), new THREE.MeshBasicMaterial({ color: GOLD }));
      trim.position.set(tx + bannerFX, TOWER_H - 0.12, tz);
      scene.add(trim);
    });

    // ── Dense forest flanks ───────────────────────────────────────────────────
    const trunkMat  = new THREE.MeshLambertMaterial({ color: 0x3a1c08 });
    const leavesMat = new THREE.MeshLambertMaterial({ color: 0x0e2208 });
    const leavesMatB = new THREE.MeshLambertMaterial({ color: 0x091c06 });
    const TREES: [number, number, number][] = [
      // Left
      [-7.5,-2,3.6], [-8.5,0.5,4.4], [-7.8,2.5,3.9], [-8.2,4.5,4.7],
      [-7.5,6.5,3.3], [-9.0,-0.5,5.2], [-6.8,1.5,3.1], [-9.5,3.5,4.0],
      // Right
      [16.0,-2,3.6], [17.0,0.5,4.4], [16.3,2.5,3.9], [16.7,4.5,4.7],
      [16.0,6.5,3.3], [17.5,-0.5,5.2], [15.3,1.5,3.1], [18.0,3.5,4.0],
      // Back row
      [-3,-10,3.2], [0.5,-11,3.8], [3,-9.5,3.0], [5.5,-11.5,3.5],
      [8,-10,3.2], [10.5,-11,3.8], [12,-9.5,3.0], [13.5,-11,2.8],
      // Front row
      [-3,9,3.0], [1,10,3.5], [4,9.5,2.9], [7,10.5,3.3], [10,9,3.1], [13,9.5,3.4],
    ];
    TREES.forEach(([tx, tz, th], i) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.20, th, 7), trunkMat);
      trunk.position.set(tx + CX, th / 2, tz + CZ);
      trunk.castShadow = true;
      scene.add(trunk);
      const lMat = i % 2 === 0 ? leavesMat : leavesMatB;
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.05, 2.2, 7), lMat);
      canopy.position.set(tx + CX, th + 0.9, tz + CZ);
      canopy.castShadow = true;
      scene.add(canopy);
      // Second canopy tier for tall trees
      if (th > 3.8) {
        const upper = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.6, 7), lMat);
        upper.position.set(tx + CX, th + 2.1, tz + CZ);
        scene.add(upper);
      }
    });

    // ── Background mountains ──────────────────────────────────────────────────
    const mountainMat = new THREE.MeshLambertMaterial({ color: 0x0d0a16 });
    const PEAKS: [number, number, number, number][] = [
      [-22,-45,16,7.5], [-10,-48,20,9], [2,-44,15,6.5], [11,-49,18,8],
      [21,-45,16,7], [29,-47,14,6], [-15,-55,26,11], [8,-57,24,10.5],
      // sides
      [-32,-4,14,6], [-34,6,16,7], [40,-4,14,6], [42,7,16,7],
    ];
    PEAKS.forEach(([px, pz, ph, pr]) => {
      const peak = new THREE.Mesh(new THREE.ConeGeometry(pr, ph, 9), mountainMat);
      peak.position.set(px + CX, ph / 2 - 1, pz + CZ);
      scene.add(peak);
    });

    // ── Rear archway ─────────────────────────────────────────────────────────
    const archMat = new THREE.MeshLambertMaterial({ color: 0x2e2618 });
    const ARCH_Z  = -8.0;
    const ARCH_H  = 5.0;
    [CX - 2.8, CX + 2.8].forEach(px => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.65, ARCH_H, 0.65), archMat);
      p.position.set(px, ARCH_H / 2, ARCH_Z + CZ);
      p.castShadow = true;
      scene.add(p);
    });
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.60, 0.65), archMat);
    lintel.position.set(CX, ARCH_H + 0.30, ARCH_Z + CZ);
    scene.add(lintel);

    // ── Unit management ───────────────────────────────────────────────────────
    const shadowGeo = new THREE.CircleGeometry(0.25, 12);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 });

    interface UnitRecord {
      group:     THREE.Group;
      shadow:    THREE.Mesh;
      armorMat:  THREE.MeshLambertMaterial;
      detailMat: THREE.MeshLambertMaterial;
      isEnemy:   boolean;
    }
    const unitMeshes = new Map<string, UnitRecord>();

    function applyUnitColors(rec: UnitRecord, instanceId: string) {
      const { selectedId, queued, flashUnits } = live.current;
      const flash = flashUnits[instanceId];
      if (flash === "damage") {
        rec.armorMat.color.setHex(0xffffff);
        rec.detailMat.color.setHex(0xdddddd);
      } else if (flash === "ko") {
        rec.armorMat.color.setHex(0x222222);
        rec.detailMat.color.setHex(0x111111);
      } else if (instanceId === selectedId) {
        rec.armorMat.color.setHex(0x44bbff);
        rec.detailMat.color.setHex(0x2288bb);
      } else if (!rec.isEnemy && queued[instanceId]) {
        rec.armorMat.color.setHex(0x4477dd);
        rec.detailMat.color.setHex(ALLY_D);
      } else {
        rec.armorMat.color.setHex(rec.isEnemy ? ENEMY_C : ALLY_C);
        rec.detailMat.color.setHex(rec.isEnemy ? ENEMY_D : ALLY_D);
      }
    }

    function syncUnits() {
      const { myUnits, enemyUnits } = live.current;
      const all = [
        ...myUnits.map(u  => ({ ...u, isEnemy: false })),
        ...enemyUnits.map(u => ({ ...u, isEnemy: true })),
      ];
      for (const [id, rec] of unitMeshes) {
        if (!all.find(u => u.instanceId === id)) {
          scene.remove(rec.group); scene.remove(rec.shadow);
          unitMeshes.delete(id);
        }
      }
      for (const unit of all) {
        if (!unit.alive) {
          const rec = unitMeshes.get(unit.instanceId);
          if (rec) { scene.remove(rec.group); scene.remove(rec.shadow); unitMeshes.delete(unit.instanceId); }
          continue;
        }
        const wx = TX(unit.x, unit.isEnemy);
        const wz = TZ(unit.y);
        // Enemy side faces left (toward ally), ally faces right — rotate 180° for enemy
        const facingY = unit.isEnemy ? Math.PI : 0;

        let rec = unitMeshes.get(unit.instanceId);
        if (!rec) {
          const built = buildCharacterFor(unit.defId, unit.isEnemy);
          built.group.traverse(c => {
            if (c instanceof THREE.Mesh) {
              c.userData = { type: "unit", instanceId: unit.instanceId, isEnemy: unit.isEnemy };
            }
          });
          built.group.userData = { type: "unit", instanceId: unit.instanceId, isEnemy: unit.isEnemy };

          const shadow = new THREE.Mesh(shadowGeo, shadowMat.clone());
          shadow.rotation.x = -Math.PI / 2;
          scene.add(built.group); scene.add(shadow);
          rec = { group: built.group, shadow, armorMat: built.armorMat, detailMat: built.detailMat, isEnemy: unit.isEnemy };
          unitMeshes.set(unit.instanceId, rec);
        }
        rec.group.position.set(wx, PLAT_Y + TILE_H, wz);
        rec.group.rotation.y = facingY;
        rec.shadow.position.set(wx, PLAT_Y + TILE_H + 0.005, wz);
        applyUnitColors(rec, unit.instanceId);
      }
    }

    // ── Tile highlights ───────────────────────────────────────────────────────
    function syncHighlights() {
      const { highlights, selectMode } = live.current;
      const hlColor = selectMode === "attack" ? HL_ATCK
                    : selectMode === "skill"  ? HL_SKILL
                    :                           HL_MOVE;
      for (const [key, rec] of tileMeshes) {
        const [side, c, r] = key.split("-");
        const hl = highlights.find(h => h.x === +c && h.y === +r && h.onEnemy === (side === "e"));
        rec.mat.color.setHex(hl ? hlColor : rec.baseColor);
        rec.mat.emissive.setHex(hl ? hlColor : 0x000000);
        rec.mat.emissiveIntensity = hl ? 0.32 : 0;
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
      const unitGroups = [...unitMeshes.values()].map(r => r.group);
      const unitHits   = raycaster.intersectObjects(unitGroups, true);
      if (unitHits.length) {
        const id = unitHits[0].object.userData.instanceId as string;
        if (id) { live.current.onUnitClick(id); return; }
      }
      const tileHits = raycaster.intersectObjects([...tileMeshes.values()].map(r => r.mesh), false);
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
    let tick = 0, rafId = 0, isAlive = true;
    function animate() {
      if (!isAlive) return;
      rafId = requestAnimationFrame(animate);
      tick++;

      // Smooth camera
      const preset = PRESETS[camIdxRef.current];
      camPos.lerp(preset.pos, 0.045);
      camLook.lerp(preset.look, 0.045);
      camera.position.copy(camPos);
      camera.lookAt(camLook);

      // Torch flicker
      torchLights.forEach((pl, i) => {
        pl.intensity = (pl.userData.base as number)
          + Math.sin(tick * 0.12 + i * 1.37) * 0.9
          + Math.sin(tick * 0.31 + i * 0.73) * 0.35;
      });
      flameMeshes.forEach((f, i) => {
        const s = 0.88 + Math.sin(tick * 0.2 + i * 1.3) * 0.14 + Math.sin(tick * 0.45 + i * 0.7) * 0.07;
        f.scale.set(s, s, s);
        (f.material as THREE.MeshBasicMaterial).opacity = 0.72 + Math.sin(tick * 0.18 + i) * 0.22;
      });
      // Water shimmer
      waterMat.color.setHSL(0.60, 0.68, 0.13 + Math.sin(tick * 0.033) * 0.04);

      syncUnits();
      syncHighlights();
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      isAlive = false;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      el.removeEventListener("pointerdown", onPointerDown);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />
      <button
        onClick={cycleCamera}
        style={{
          position: "absolute", bottom: 12, right: 12, zIndex: 30,
          fontFamily: "'Cinzel', serif", fontSize: 11,
          letterSpacing: "0.14em", textTransform: "uppercase",
          color: "rgba(240,210,130,0.88)",
          background: "rgba(6,4,16,0.80)",
          border: "1px solid rgba(240,192,64,0.28)", borderRadius: 6,
          padding: "6px 13px", cursor: "pointer",
          backdropFilter: "blur(4px)", userSelect: "none",
          display: "flex", alignItems: "center", gap: 6,
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
