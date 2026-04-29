import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { GridUnit } from "@/lib/types";

type SelectMode = "none" | "move" | "attack" | "skill";

// ── Grid constants ────────────────────────────────────────────────────────────
const CELL    = 1.0;
const GAP     = 0.5;
const COLS    = 4;
const ROWS    = 4;
const ALLY_X  = 0;
const WATER_X = COLS * CELL;
const ENEMY_X = WATER_X + GAP;
const TOTAL_W = ENEMY_X + COLS * CELL; // 8.5
const TOTAL_D = ROWS * CELL;           // 4.0
const CX      = TOTAL_W / 2;           // 4.25
const CZ      = TOTAL_D / 2;           // 2.0

const TILE_H  = 0.10;
const TOWER_H = 3.6;
const TOWER_W = 1.0;

const C = {
  STONE_L:   0x8a8072,
  STONE_D:   0x6a6055,
  MORTAR:    0x2e2820,
  COURT:     0x3d352b,  // courtyard stone
  COURT2:    0x4a4038,  // courtyard alternate
  GROUND:    0x0e0c09,
  TOWER:     0x50473c,
  TOWER_C:   0x706050,
  WATER:     0x1a3860,
  ALLY:      0x2255cc,
  ALLY_D:    0x112299,
  ENEMY:     0xcc2222,
  ENEMY_D:   0x881111,
  WEAPON:    0x888877,
  SELECTED:  0x44bbff,
  QUEUED:    0x4477dd,
  HL_MOVE:   0x44cc55,
  HL_ATCK:   0xff4422,
  HL_SKILL:  0xaa44ff,
  FLAME:     0xff7711,
  SKY_TOP:   0x080420,
  MOUNTAIN:  0x0c0918,
  TREE_T:    0x321c08,
  TREE_L:    0x091608,
};

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

  // ── Three.js setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current as HTMLDivElement;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch { return; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(C.SKY_TOP, 0.016);

    // ── Camera ──────────────────────────────────────────────────────────────
    const camera  = new THREE.PerspectiveCamera(44, el.clientWidth / el.clientHeight, 0.1, 300);
    const camPos  = PRESETS[0].pos.clone();
    const camLook = PRESETS[0].look.clone();
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    // ── Sky sphere ──────────────────────────────────────────────────────────
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(200, 16, 10),
      new THREE.MeshBasicMaterial({ color: C.SKY_TOP, side: THREE.BackSide }),
    );
    scene.add(sky);

    // ── Lights ──────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xfff0e0, 0.40));
    scene.add(new THREE.HemisphereLight(0x2233aa, 0x221a10, 0.35));

    const sun = new THREE.DirectionalLight(0xfff4e8, 1.0);
    sun.position.set(CX, 16, TOTAL_D + 8);
    sun.target.position.set(CX, 0, CZ);
    sun.castShadow = true;
    sun.shadow.mapSize.setScalar(1024);
    const sc = sun.shadow.camera as THREE.OrthographicCamera;
    sc.left = -16; sc.right = 16; sc.top = 12; sc.bottom = -12;
    scene.add(sun); scene.add(sun.target);

    // ── Extended ground ──────────────────────────────────────────────────────
    const groundMat = new THREE.MeshLambertMaterial({ color: C.GROUND });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(CX, -0.02, CZ);
    ground.receiveShadow = true;
    scene.add(ground);

    // ── Courtyard paving around the battle grid ──────────────────────────────
    // Large alternating stone tiles filling the area around the grid
    const courtGeos = [
      new THREE.BoxGeometry(1.8, 0.04, 1.8),
      new THREE.BoxGeometry(1.8, 0.04, 1.8),
    ];
    const courtMats = [
      new THREE.MeshLambertMaterial({ color: C.COURT }),
      new THREE.MeshLambertMaterial({ color: C.COURT2 }),
    ];
    const COURT_MARGIN = 4.0; // how far the courtyard extends beyond the grid
    const COURT_TILE   = 1.8;
    const cx0 = -COURT_MARGIN;
    const cz0 = -COURT_MARGIN;
    const cxEnd = TOTAL_W + COURT_MARGIN;
    const czEnd = TOTAL_D + COURT_MARGIN;
    for (let tx = cx0; tx < cxEnd; tx += COURT_TILE) {
      for (let tz = cz0; tz < czEnd; tz += COURT_TILE) {
        // Skip tiles that are under the battle grid (those are floor tiles)
        const underGrid = (tx + COURT_TILE > ALLY_X - 0.1  && tx < TOTAL_W + 0.1
                        && tz + COURT_TILE > -0.1           && tz < TOTAL_D + 0.1);
        const idx = (Math.round(tx / COURT_TILE) + Math.round(tz / COURT_TILE)) % 2;
        const mesh = new THREE.Mesh(courtGeos[idx], courtMats[idx]);
        mesh.position.set(tx + COURT_TILE / 2, underGrid ? -0.05 : 0.0, tz + COURT_TILE / 2);
        mesh.receiveShadow = true;
        scene.add(mesh);
      }
    }

    // ── Battle floor tiles ───────────────────────────────────────────────────
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

    // Mortar base
    const mortarMat = new THREE.MeshLambertMaterial({ color: C.MORTAR });
    [[ALLY_X + COLS * CELL / 2], [ENEMY_X + COLS * CELL / 2]].forEach(([mx]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(COLS * CELL, TOTAL_D), mortarMat.clone());
      m.rotation.x = -Math.PI / 2;
      m.position.set(mx, 0.001, TOTAL_D / 2);
      scene.add(m);
    });

    // ── Water channel ────────────────────────────────────────────────────────
    const waterMat = new THREE.MeshLambertMaterial({ color: C.WATER });
    const waterMesh = new THREE.Mesh(new THREE.BoxGeometry(GAP, TILE_H * 0.5, TOTAL_D + 0.2), waterMat);
    waterMesh.position.set(WATER_X + GAP / 2, TILE_H * 0.25, TOTAL_D / 2);
    scene.add(waterMesh);

    // ── Torch helper ─────────────────────────────────────────────────────────
    const sconceMat  = new THREE.MeshLambertMaterial({ color: 0x2a2415 });
    const flameMeshes: THREE.Mesh[] = [];
    const torchLights: THREE.PointLight[] = [];

    function addTorch(x: number, groundY: number, z: number, intensity = 2.6, range = 9) {
      const sconce = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 0.32, 7), sconceMat);
      sconce.position.set(x, groundY + 0.16, z);
      scene.add(sconce);

      const flameMat = new THREE.MeshBasicMaterial({
        color: C.FLAME, transparent: true, opacity: 0.9,
      });
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.28, 7), flameMat);
      flame.position.set(x, groundY + 0.45, z);
      scene.add(flame);
      flameMeshes.push(flame);

      const pl = new THREE.PointLight(0xff8822, intensity, range);
      pl.position.set(x, groundY + 0.5, z);
      scene.add(pl);
      torchLights.push(pl);
    }

    // ── Lamp-post helper (post + torch on top) ───────────────────────────────
    const postMat = new THREE.MeshLambertMaterial({ color: 0x1c1510 });
    function addLampPost(x: number, z: number) {
      const postH = 2.2;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.10, postH, 7), postMat);
      post.position.set(x, postH / 2, z);
      post.castShadow = true;
      scene.add(post);
      // Bracket arm
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.06, 0.06), postMat);
      arm.position.set(x + 0.15, postH - 0.12, z);
      scene.add(arm);
      addTorch(x + 0.30, postH - 0.18, z, 2.0, 7);
    }

    // Courtyard lamp posts — symmetrically placed
    const POST_Z: number[] = [-1.8, CZ, TOTAL_D + 1.8];
    POST_Z.forEach(pz => {
      addLampPost(-COURT_MARGIN + 0.6, pz);
      addLampPost(TOTAL_W + COURT_MARGIN - 0.6, pz);
    });
    // Front/back center posts
    addLampPost(CX - 2.5, -COURT_MARGIN + 0.5);
    addLampPost(CX + 2.5, -COURT_MARGIN + 0.5);
    addLampPost(CX - 2.5, TOTAL_D + COURT_MARGIN - 0.5);
    addLampPost(CX + 2.5, TOTAL_D + COURT_MARGIN - 0.5);

    // ── Corner towers ────────────────────────────────────────────────────────
    const towerBodyMat = new THREE.MeshLambertMaterial({ color: C.TOWER });
    const towerCapMat  = new THREE.MeshLambertMaterial({ color: C.TOWER_C });

    const TOWER_CENTERS: [number, number, number, number][] = [
      // [x, z, bannerColor, bannerFaceSign]
      [ALLY_X  - TOWER_W - 0.5, -TOWER_W - 0.5, C.ALLY_D,  1],
      [TOTAL_W + TOWER_W + 0.5, -TOWER_W - 0.5, C.ENEMY_D,-1],
      [ALLY_X  - TOWER_W - 0.5,  TOTAL_D + TOWER_W + 0.5, C.ALLY_D,  1],
      [TOTAL_W + TOWER_W + 0.5,  TOTAL_D + TOWER_W + 0.5, C.ENEMY_D,-1],
    ];

    TOWER_CENTERS.forEach(([tx, tz, bannerColor, faceSign]) => {
      // Shaft
      const body = new THREE.Mesh(new THREE.BoxGeometry(TOWER_W, TOWER_H, TOWER_W), towerBodyMat);
      body.position.set(tx, TOWER_H / 2, tz);
      body.castShadow = true; body.receiveShadow = true;
      scene.add(body);

      // Roof deck
      const deck = new THREE.Mesh(new THREE.BoxGeometry(TOWER_W + 0.16, 0.14, TOWER_W + 0.16), towerCapMat);
      deck.position.set(tx, TOWER_H + 0.07, tz);
      scene.add(deck);

      // Battlements (4 merlons)
      const mW = 0.22, mH = 0.34;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(mW, mH, mW), towerBodyMat);
        m.position.set(tx + sx * (TOWER_W / 2 - mW / 2), TOWER_H + 0.14 + mH / 2, tz + sz * (TOWER_W / 2 - mW / 2));
        scene.add(m);
      });

      // Tower torch (on roof)
      addTorch(tx, TOWER_H + 0.14, tz, 3.0, 11);

      // Hanging banner
      const bannerMat = new THREE.MeshLambertMaterial({
        color: bannerColor, emissive: bannerColor, emissiveIntensity: 0.08,
      });
      const banner = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.5, 0.22), bannerMat);
      banner.position.set(tx + faceSign * (TOWER_W / 2 + 0.04), TOWER_H - 0.62, tz);
      scene.add(banner);
      // Gold trim
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.26), new THREE.MeshBasicMaterial({ color: 0xd4aa33 }));
      trim.position.set(tx + faceSign * (TOWER_W / 2 + 0.04), TOWER_H - 0.12, tz);
      scene.add(trim);
    });

    // ── Rear archway ─────────────────────────────────────────────────────────
    const archMat = new THREE.MeshLambertMaterial({ color: 0x2e2618 });
    const ARCH_Z = -COURT_MARGIN - 1.0;
    const ARCH_H = 4.2;
    [CX - 2.4, CX + 2.4].forEach(px => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.60, ARCH_H, 0.60), archMat);
      p.position.set(px, ARCH_H / 2, ARCH_Z);
      p.castShadow = true;
      scene.add(p);
    });
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.55, 0.60), archMat);
    lintel.position.set(CX, ARCH_H + 0.28, ARCH_Z);
    scene.add(lintel);
    const keystone = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.55, 0.50), towerCapMat);
    keystone.position.set(CX, ARCH_H + 0.83, ARCH_Z);
    scene.add(keystone);

    // ── Mountains (far background) ────────────────────────────────────────────
    const mountainMat = new THREE.MeshLambertMaterial({ color: C.MOUNTAIN });
    const PEAKS = [
      { x: -20, z: -40, h: 14, r: 6.0 }, { x: -9,  z: -45, h: 18, r: 7.5 },
      { x:  1,  z: -42, h: 13, r: 5.5 }, { x: 10,  z: -46, h: 17, r: 7.0 },
      { x: 19,  z: -41, h: 13, r: 5.8 }, { x: 27,  z: -44, h: 11, r: 5.0 },
      { x: -14, z: -52, h: 22, r: 9.0 }, { x:  5,  z: -54, h: 20, r: 8.5 },
      { x: 20,  z: -50, h: 18, r: 8.0 },
      // Side peaks
      { x: -28, z: -5,  h: 11, r: 5.0 }, { x: -30, z: 8,   h: 13, r: 5.5 },
      { x:  36, z: -5,  h: 11, r: 5.0 }, { x:  38, z: 8,   h: 13, r: 5.5 },
    ];
    PEAKS.forEach(({ x, z, h, r }) => {
      const peak = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), mountainMat);
      peak.position.set(x, h / 2 - 0.5, z);
      scene.add(peak);
    });

    // ── Trees (atmospheric, flanking the courtyard) ───────────────────────────
    const trunkMat  = new THREE.MeshLambertMaterial({ color: C.TREE_T });
    const leavesMat = new THREE.MeshLambertMaterial({ color: C.TREE_L });
    const TREES = [
      // Left flank
      { x: -6.5, z: -2.0, h: 3.5 }, { x: -7.5, z: 0.5, h: 4.2 },
      { x: -6.8, z: 2.5,  h: 3.8 }, { x: -7.2, z: 4.5, h: 4.5 },
      { x: -6.5, z: 6.5,  h: 3.2 }, { x: -5.0, z: -4.0,h: 2.8 },
      // Right flank
      { x: 15.0, z: -2.0, h: 3.5 }, { x: 16.0, z: 0.5, h: 4.2 },
      { x: 15.5, z: 2.5,  h: 3.8 }, { x: 16.2, z: 4.5, h: 4.5 },
      { x: 15.0, z: 6.5,  h: 3.2 }, { x: 13.5, z: -4.0,h: 2.8 },
      // Back row
      { x: -2.0, z: -8.5, h: 3.0 }, { x: 2.5,  z: -9.0,h: 3.6 },
      { x: 6.0,  z: -8.0, h: 2.8 }, { x: 10.0, z: -9.2,h: 3.4 },
      { x: 12.5, z: -8.4, h: 3.1 },
    ];
    TREES.forEach(({ x, z, h }) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, h, 7), trunkMat);
      trunk.position.set(x, h / 2, z);
      trunk.castShadow = true;
      scene.add(trunk);
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.0, 7), leavesMat);
      canopy.position.set(x, h + 0.8, z);
      canopy.castShadow = true;
      scene.add(canopy);
    });

    // ── Unit meshes (humanoid characters) ─────────────────────────────────────
    const shadowGeo = new THREE.CircleGeometry(0.27, 12);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 });

    interface UnitRecord {
      group: THREE.Group;
      shadow: THREE.Mesh;
      armorMat: THREE.MeshLambertMaterial;
      detailMat: THREE.MeshLambertMaterial;
      isEnemy: boolean;
    }
    const unitMeshes = new Map<string, UnitRecord>();

    function buildCharacter(isEnemy: boolean): Omit<UnitRecord, "shadow" | "group"> & { group: THREE.Group } {
      const aColor = isEnemy ? C.ENEMY   : C.ALLY;
      const dColor = isEnemy ? C.ENEMY_D : C.ALLY_D;
      const armorMat  = new THREE.MeshLambertMaterial({ color: aColor });
      const detailMat = new THREE.MeshLambertMaterial({ color: dColor });
      const weaponMat = new THREE.MeshLambertMaterial({ color: C.WEAPON });

      const group = new THREE.Group();

      // Base plate
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.07, 10), detailMat);
      base.position.y = 0.035;

      // Lower body / shins
      const shin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.15), armorMat);
      shin.position.y = 0.18;

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.24, 0.17), armorMat);
      torso.position.y = 0.38;

      // Pauldrons
      [-0.22, 0.22].forEach(ox => {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.09, 7, 5), detailMat);
        p.position.set(ox, 0.43, 0);
        group.add(p);
      });

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 8, 7), armorMat);
      head.position.y = 0.60;

      // Helmet
      const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.115, 0.10, 8), detailMat);
      helmet.position.y = 0.69;

      // Plume
      const plume = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.03), armorMat);
      plume.position.y = 0.81;

      // Weapon
      const weapon = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.44, 0.05), weaponMat);
      weapon.position.set(0.26, 0.44, 0);

      group.add(base, shin, torso, head, helmet, plume, weapon);

      // Propagate instanceId through children for raycasting
      group.traverse(child => {
        if (child instanceof THREE.Mesh) child.castShadow = true;
      });

      return { group, armorMat, detailMat, isEnemy };
    }

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
        rec.armorMat.color.setHex(C.SELECTED);
        rec.detailMat.color.setHex(0x2288bb);
      } else if (!rec.isEnemy && queued[instanceId]) {
        rec.armorMat.color.setHex(C.QUEUED);
        rec.detailMat.color.setHex(C.ALLY_D);
      } else {
        rec.armorMat.color.setHex(rec.isEnemy ? C.ENEMY : C.ALLY);
        rec.detailMat.color.setHex(rec.isEnemy ? C.ENEMY_D : C.ALLY_D);
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
        const wx = TX(unit.x, unit.isEnemy);
        const wz = TZ(unit.y);

        if (!unit.alive) {
          const rec = unitMeshes.get(unit.instanceId);
          if (rec) { scene.remove(rec.group); scene.remove(rec.shadow); unitMeshes.delete(unit.instanceId); }
          continue;
        }

        let rec = unitMeshes.get(unit.instanceId);
        if (!rec) {
          const built = buildCharacter(unit.isEnemy);
          // Tag every child for raycasting
          built.group.traverse(child => {
            if (child instanceof THREE.Mesh)
              child.userData = { type: "unit", instanceId: unit.instanceId, isEnemy: unit.isEnemy };
          });
          built.group.userData = { type: "unit", instanceId: unit.instanceId, isEnemy: unit.isEnemy };

          const shadow = new THREE.Mesh(shadowGeo, shadowMat.clone());
          shadow.rotation.x = -Math.PI / 2;
          scene.add(built.group); scene.add(shadow);

          rec = { ...built, shadow };
          unitMeshes.set(unit.instanceId, rec);
        }

        rec.group.position.set(wx, TILE_H, wz);
        rec.shadow.position.set(wx, TILE_H + 0.005, wz);
        applyUnitColors(rec, unit.instanceId);
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
        const hl = highlights.find(h => h.x === col && h.y === row && h.onEnemy === (side === "e"));
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

      // Raycast into unit groups (recursive so child meshes are included)
      const unitGroups = [...unitMeshes.values()].map(r => r.group);
      const unitHits   = raycaster.intersectObjects(unitGroups, true);
      if (unitHits.length) {
        const id = unitHits[0].object.userData.instanceId as string;
        if (id) { live.current.onUnitClick(id); return; }
      }
      const tileArr  = [...tileMeshes.values()].map(r => r.mesh);
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
    let isAlive = true;

    function animate() {
      if (!isAlive) return;
      rafId = requestAnimationFrame(animate);
      tick++;

      // Camera lerp
      const preset = PRESETS[camIdxRef.current];
      camPos.lerp(preset.pos, 0.045);
      camLook.lerp(preset.look, 0.045);
      camera.position.copy(camPos);
      camera.lookAt(camLook);

      // Torch flicker (lights + flames)
      torchLights.forEach((pl, i) => {
        pl.intensity = pl.userData.base_int !== undefined
          ? (pl.userData.base_int as number)
          : (pl.userData.base_int = pl.intensity);
        pl.intensity = pl.userData.base_int as number
          + Math.sin(tick * 0.12 + i * 1.37) * 0.8
          + Math.sin(tick * 0.29 + i * 0.71) * 0.35;
      });

      flameMeshes.forEach((f, i) => {
        const s = 0.88 + Math.sin(tick * 0.19 + i * 1.3) * 0.14 + Math.sin(tick * 0.43 + i * 0.7) * 0.07;
        f.scale.set(s, s, s);
        (f.material as THREE.MeshBasicMaterial).opacity = 0.72 + Math.sin(tick * 0.17 + i) * 0.22;
      });

      // Water shimmer
      waterMat.color.setHSL(0.60, 0.65, 0.12 + Math.sin(tick * 0.033) * 0.04);

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
