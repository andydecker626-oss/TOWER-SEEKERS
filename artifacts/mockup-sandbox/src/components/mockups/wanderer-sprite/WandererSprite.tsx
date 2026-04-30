import { useState } from "react";

const STATS = [
  { label: "HP",       value: 110, max: 160, color: "#44cc66" },
  { label: "PhysAtk",  value: 72,  max: 100, color: "#ff8844" },
  { label: "MagAtk",   value: 55,  max: 100, color: "#aa44ff" },
  { label: "PhysDef",  value: 47,  max: 100, color: "#4488ff" },
  { label: "MagDef",   value: 48,  max: 100, color: "#cc44aa" },
  { label: "Speed",    value: 75,  max: 100, color: "#ffcc44" },
  { label: "Evasion",  value: 30,  max: 100, color: "#44cccc" },
  { label: "Move",     value: 3,   max: 4,   color: "#88ddff" },
];

const SKILLS = [
  { name: "Feint",          ap: 1, type: "Buff",     desc: "Next offensive move is a guaranteed crit" },
  { name: "Rising Slash",   ap: 2, type: "Physical", desc: "Upward strike — combos with Falling Edge" },
  { name: "Falling Edge",   ap: 2, type: "Physical", desc: "Crits and +20 power if Rising Slash used same turn" },
  { name: "Shadow Step",    ap: 2, type: "Buff",     desc: "Move 3 tiles and gain +15% evasion for 2 turns" },
  { name: "Phantom Strike", ap: 3, type: "Physical", desc: "Teleport-slash — crits and ignores PhysDef if Shadow Step used" },
  { name: "Mirage Veil",    ap: 4, type: "Buff",     desc: "+40% evasion for 4 turns" },
  { name: "Wind Slash",     ap: 2, type: "Magical",  desc: "Blade of wind up to 4 tiles; combos into Elemental Surge" },
  { name: "Arcane Tempest", ap: 6, type: "Magical",  desc: "Storm of magical blades hitting all enemies (Phantom Stance only)" },
];

const PASSIVES = [
  { name: "Nomad's Instinct", desc: "Each successful hit or evasion raises evasion +5%; resets on taking a hit" },
  { name: "Blade Flow",       desc: "Successful crits restore 2 AP" },
  { name: "Ghost Stride",     desc: "Movement costs 0 AP while evasion is above 30%" },
];

const FRAME_LABELS = ["Idle", "Walk", "Attack", "Dodge", "Cast", "KO"];
const TYPE_COLOR: Record<string, string> = {
  Physical: "#ff8844",
  Magical:  "#aa44ff",
  Buff:     "#44cccc",
};

export default function WandererSprite() {
  const [activeFrame, setActiveFrame] = useState(0);
  const [tab, setTab] = useState<"skills" | "passives" | "stats">("skills");
  const [loaded, setLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div style={ROOT}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={HEADER}>
        <div style={CLASS_BADGE}>Fell-Duelist</div>
        <div style={UNIT_TITLE}>
          <span style={UNIT_NAME}>Wanderer</span>
          <span style={UNIT_SUB}>Masterless Swordsman · Hybrid Physical / Magical</span>
        </div>
        <div style={MOVE_DIST}>Move <strong>3</strong></div>
      </div>

      {/* Main layout */}
      <div style={BODY}>

        {/* Left — sprite + frame picker */}
        <div style={LEFT_COL}>
          <div style={SPRITE_STAGE}>
            {/* Sprite image or placeholder */}
            {!imgError && (
              <img
                src="/assets/sprites/wanderer.png"
                alt="Wanderer sprite"
                onLoad={() => setLoaded(true)}
                onError={() => setImgError(true)}
                style={{
                  ...SPRITE_IMG,
                  opacity: loaded ? 1 : 0,
                }}
              />
            )}
            {(!loaded || imgError) && (
              <div style={PLACEHOLDER}>
                <div style={PLACEHOLDER_ICON}>🌪</div>
                <div style={PLACEHOLDER_LABEL}>Sprite sheet pending</div>
                <div style={PLACEHOLDER_PATH}>public/assets/sprites/wanderer.png</div>
              </div>
            )}

            {/* Corner accent lines */}
            <div style={{ ...CORNER, top: 6, left: 6, borderTop: "1.5px solid rgba(68,204,204,0.5)", borderLeft: "1.5px solid rgba(68,204,204,0.5)" }} />
            <div style={{ ...CORNER, top: 6, right: 6, borderTop: "1.5px solid rgba(68,204,204,0.5)", borderRight: "1.5px solid rgba(68,204,204,0.5)" }} />
            <div style={{ ...CORNER, bottom: 6, left: 6, borderBottom: "1.5px solid rgba(68,204,204,0.5)", borderLeft: "1.5px solid rgba(68,204,204,0.5)" }} />
            <div style={{ ...CORNER, bottom: 6, right: 6, borderBottom: "1.5px solid rgba(68,204,204,0.5)", borderRight: "1.5px solid rgba(68,204,204,0.5)" }} />

            {/* Ambient glow */}
            <div style={STAGE_GLOW} />
          </div>

          {/* Animation frame selector */}
          <div style={FRAME_STRIP_LABEL}>ANIMATION FRAMES</div>
          <div style={FRAME_STRIP}>
            {FRAME_LABELS.map((lbl, i) => (
              <button
                key={lbl}
                style={{
                  ...FRAME_BTN,
                  ...(activeFrame === i ? FRAME_BTN_ACTIVE : {}),
                }}
                onClick={() => setActiveFrame(i)}
              >
                {lbl}
              </button>
            ))}
          </div>

          {/* Passive traits */}
          <div style={SECTION_TITLE} data-section="passives">PASSIVES</div>
          {PASSIVES.map(p => (
            <div key={p.name} style={PASSIVE_ROW}>
              <span style={PASSIVE_NAME}>{p.name}</span>
              <span style={PASSIVE_DESC}>{p.desc}</span>
            </div>
          ))}
        </div>

        {/* Right — stats + skills */}
        <div style={RIGHT_COL}>

          {/* Stat bars */}
          <div style={SECTION_TITLE}>BASE STATS</div>
          <div style={STATS_GRID}>
            {STATS.map(s => (
              <div key={s.label} style={STAT_ROW}>
                <span style={STAT_LABEL}>{s.label}</span>
                <div style={BAR_TRACK}>
                  <div style={{ ...BAR_FILL, width: `${(s.value / s.max) * 100}%`, background: s.color }} />
                </div>
                <span style={{ ...STAT_NUM, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Skill tabs */}
          <div style={TAB_ROW}>
            {(["skills", "passives", "stats"] as const).map(t => (
              <button
                key={t}
                style={{ ...TAB_BTN, ...(tab === t ? TAB_ACTIVE : {}) }}
                onClick={() => setTab(t)}
              >
                {t === "skills" ? "Skills" : t === "passives" ? "Passives" : "Details"}
              </button>
            ))}
          </div>

          {tab === "skills" && (
            <div style={SKILLS_LIST}>
              {SKILLS.map(skill => (
                <div key={skill.name} style={SKILL_ROW}>
                  <div style={SKILL_HEADER}>
                    <span style={SKILL_NAME}>{skill.name}</span>
                    <span style={{ ...SKILL_TYPE, color: TYPE_COLOR[skill.type] ?? "#aaa" }}>{skill.type}</span>
                    <span style={SKILL_AP}>{skill.ap} AP</span>
                  </div>
                  <div style={SKILL_DESC}>{skill.desc}</div>
                </div>
              ))}
            </div>
          )}

          {tab === "passives" && (
            <div style={SKILLS_LIST}>
              {PASSIVES.map(p => (
                <div key={p.name} style={SKILL_ROW}>
                  <div style={SKILL_HEADER}>
                    <span style={SKILL_NAME}>{p.name}</span>
                    <span style={{ ...SKILL_TYPE, color: "#44cccc" }}>Passive</span>
                  </div>
                  <div style={SKILL_DESC}>{p.desc}</div>
                </div>
              ))}
            </div>
          )}

          {tab === "stats" && (
            <div style={SKILLS_LIST}>
              <div style={DETAIL_GRID}>
                {[
                  ["Base HP",       "110"],
                  ["PhysAtk",       "72"],
                  ["MagAtk",        "55"],
                  ["PhysDef",       "47"],
                  ["MagDef",        "48"],
                  ["Speed",         "75"],
                  ["Evasion",       "30%"],
                  ["Move Dist",     "3 tiles"],
                  ["Attack Style",  "Melee"],
                  ["Primary Stat",  "PhysAtk"],
                  ["Class",         "Fell-Duelist"],
                  ["Role",          "Hybrid/Skirmisher"],
                ].map(([k, v]) => (
                  <div key={k} style={DETAIL_ROW}>
                    <span style={DETAIL_KEY}>{k}</span>
                    <span style={DETAIL_VAL}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lore blurb */}
          <div style={LORE_BOX}>
            A masterless swordsman with a hybrid physical-magical fighting style.
            Exceptionally evasive and mobile, chains attacks into devastating combos
            and grows more untouchable with each successful hit or dodge.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Styles ────────────────────────────────────────────────────────────────── */
const ROOT: React.CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  background: "#07040f",
  fontFamily: "'Cinzel', serif",
  color: "#e8d8b0",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const HEADER: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  padding: "14px 24px",
  borderBottom: "1px solid rgba(68,204,204,0.18)",
  background: "rgba(5,3,12,0.7)",
  backdropFilter: "blur(8px)",
  flexShrink: 0,
};
const CLASS_BADGE: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "rgba(68,204,204,0.7)",
  background: "rgba(68,204,204,0.1)",
  border: "1px solid rgba(68,204,204,0.25)",
  borderRadius: 6,
  padding: "3px 10px",
  whiteSpace: "nowrap",
  flexShrink: 0,
};
const UNIT_TITLE: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};
const UNIT_NAME: React.CSSProperties = {
  fontFamily: "'Cinzel Decorative', serif",
  fontSize: 20,
  fontWeight: 700,
  color: "#f0e0a0",
  letterSpacing: "0.06em",
  lineHeight: 1,
};
const UNIT_SUB: React.CSSProperties = {
  fontSize: 9,
  color: "rgba(200,180,140,0.5)",
  letterSpacing: "0.1em",
};
const MOVE_DIST: React.CSSProperties = {
  fontSize: 10,
  color: "rgba(136,221,255,0.6)",
  letterSpacing: "0.08em",
  textAlign: "right",
  flexShrink: 0,
};

const BODY: React.CSSProperties = {
  flex: 1,
  display: "flex",
  gap: 16,
  padding: 16,
  minHeight: 0,
  overflow: "hidden",
};

const LEFT_COL: React.CSSProperties = {
  width: 220,
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const SPRITE_STAGE: React.CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "1",
  background: "linear-gradient(180deg, rgba(14,8,28,0.9) 0%, rgba(8,4,16,0.98) 100%)",
  border: "1px solid rgba(68,204,204,0.2)",
  borderRadius: 12,
  overflow: "hidden",
  flexShrink: 0,
};
const SPRITE_IMG: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "contain",
  imageRendering: "pixelated",
  padding: 12,
  transition: "opacity 0.3s",
};
const PLACEHOLDER: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};
const PLACEHOLDER_ICON: React.CSSProperties = { fontSize: 48, opacity: 0.25 };
const PLACEHOLDER_LABEL: React.CSSProperties = {
  fontSize: 9,
  color: "rgba(200,170,100,0.25)",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};
const PLACEHOLDER_PATH: React.CSSProperties = {
  fontFamily: "'Courier New', monospace",
  fontSize: 8,
  color: "rgba(68,204,204,0.2)",
  letterSpacing: "0.04em",
};
const CORNER: React.CSSProperties = {
  position: "absolute",
  width: 12,
  height: 12,
};
const STAGE_GLOW: React.CSSProperties = {
  position: "absolute",
  bottom: 0,
  left: "50%",
  transform: "translateX(-50%)",
  width: "70%",
  height: 30,
  background: "rgba(68,204,204,0.08)",
  borderRadius: "50%",
  filter: "blur(8px)",
};

const FRAME_STRIP_LABEL: React.CSSProperties = {
  fontSize: 7,
  letterSpacing: "0.22em",
  color: "rgba(68,204,204,0.35)",
  textTransform: "uppercase",
  marginBottom: -4,
};
const FRAME_STRIP: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
};
const FRAME_BTN: React.CSSProperties = {
  padding: "4px 9px",
  borderRadius: 20,
  border: "1px solid rgba(68,204,204,0.18)",
  background: "rgba(10,5,22,0.7)",
  color: "rgba(68,204,204,0.45)",
  fontFamily: "'Cinzel', serif",
  fontSize: 8,
  letterSpacing: "0.1em",
  cursor: "pointer",
  transition: "all 0.15s",
};
const FRAME_BTN_ACTIVE: React.CSSProperties = {
  background: "rgba(68,204,204,0.14)",
  borderColor: "rgba(68,204,204,0.55)",
  color: "#44cccc",
  boxShadow: "0 0 8px rgba(68,204,204,0.12)",
};

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 7,
  letterSpacing: "0.22em",
  color: "rgba(240,192,64,0.4)",
  textTransform: "uppercase",
  paddingBottom: 4,
  borderBottom: "1px solid rgba(240,192,64,0.1)",
};

const PASSIVE_ROW: React.CSSProperties = {
  background: "rgba(10,5,22,0.7)",
  border: "1px solid rgba(68,204,204,0.1)",
  borderRadius: 8,
  padding: "6px 10px",
  display: "flex",
  flexDirection: "column",
  gap: 2,
};
const PASSIVE_NAME: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  color: "rgba(68,204,204,0.8)",
  letterSpacing: "0.06em",
};
const PASSIVE_DESC: React.CSSProperties = {
  fontSize: 8,
  color: "rgba(180,160,120,0.55)",
  letterSpacing: "0.03em",
  lineHeight: 1.4,
};

const RIGHT_COL: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  minWidth: 0,
  overflow: "hidden",
};

const STATS_GRID: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 5 };
const STAT_ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};
const STAT_LABEL: React.CSSProperties = {
  fontSize: 8,
  letterSpacing: "0.08em",
  color: "rgba(200,170,100,0.5)",
  width: 48,
  flexShrink: 0,
};
const BAR_TRACK: React.CSSProperties = {
  flex: 1,
  height: 5,
  background: "rgba(255,255,255,0.06)",
  borderRadius: 4,
  overflow: "hidden",
};
const BAR_FILL: React.CSSProperties = {
  height: "100%",
  borderRadius: 4,
  transition: "width 0.4s ease",
  opacity: 0.75,
};
const STAT_NUM: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  width: 24,
  textAlign: "right",
  flexShrink: 0,
};

const TAB_ROW: React.CSSProperties = { display: "flex", gap: 4, marginTop: 2 };
const TAB_BTN: React.CSSProperties = {
  padding: "5px 14px",
  borderRadius: 20,
  border: "1px solid rgba(240,192,64,0.18)",
  background: "rgba(14,8,28,0.7)",
  color: "rgba(200,170,100,0.45)",
  fontFamily: "'Cinzel', serif",
  fontSize: 8,
  letterSpacing: "0.10em",
  cursor: "pointer",
  transition: "all 0.15s",
};
const TAB_ACTIVE: React.CSSProperties = {
  background: "rgba(240,192,64,0.14)",
  borderColor: "rgba(240,192,64,0.55)",
  color: "#f0c040",
};

const SKILLS_LIST: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 5,
  overflowY: "auto",
  flex: 1,
  minHeight: 0,
  paddingRight: 2,
};
const SKILL_ROW: React.CSSProperties = {
  background: "rgba(10,5,22,0.75)",
  border: "1px solid rgba(240,192,64,0.1)",
  borderRadius: 8,
  padding: "7px 10px",
  flexShrink: 0,
};
const SKILL_HEADER: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginBottom: 3,
};
const SKILL_NAME: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  color: "#f0e0a0",
  letterSpacing: "0.05em",
  flex: 1,
};
const SKILL_TYPE: React.CSSProperties = {
  fontSize: 7,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  opacity: 0.8,
};
const SKILL_AP: React.CSSProperties = {
  fontSize: 8,
  color: "rgba(240,192,64,0.6)",
  letterSpacing: "0.06em",
  whiteSpace: "nowrap",
};
const SKILL_DESC: React.CSSProperties = {
  fontSize: 8,
  color: "rgba(180,160,120,0.55)",
  letterSpacing: "0.03em",
  lineHeight: 1.4,
};

const DETAIL_GRID: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 5,
};
const DETAIL_ROW: React.CSSProperties = {
  background: "rgba(10,5,22,0.6)",
  border: "1px solid rgba(240,192,64,0.08)",
  borderRadius: 6,
  padding: "5px 9px",
  display: "flex",
  flexDirection: "column",
  gap: 2,
};
const DETAIL_KEY: React.CSSProperties = {
  fontSize: 7,
  color: "rgba(200,170,100,0.4)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};
const DETAIL_VAL: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  color: "#f0e0a0",
  letterSpacing: "0.04em",
};

const LORE_BOX: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(14,8,28,0.7), rgba(8,4,16,0.85))",
  border: "1px solid rgba(68,204,204,0.12)",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 8,
  color: "rgba(200,180,140,0.45)",
  letterSpacing: "0.04em",
  lineHeight: 1.6,
  flexShrink: 0,
  fontStyle: "italic",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: rgba(10,5,20,0.4); }
  ::-webkit-scrollbar-thumb { background: rgba(68,204,204,0.25); border-radius: 2px; }
`;
