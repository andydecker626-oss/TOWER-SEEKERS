import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ALL_UNITS, getUnitDef } from "@/lib/units";
import { useParties, type Party, type UnitLoadout } from "@/hooks/useParties";
import type { UnitDef, SkillDef, PassiveDef } from "@/lib/types";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700&display=swap');`;

function UnitSprite({ unit, size = 48 }: { unit: UnitDef; size?: number }) {
  return (
    <img
      src={`/assets/units/${unit.id}-sprite.png`}
      alt={unit.name}
      style={{ width: size, height: size, imageRendering: "pixelated", objectFit: "contain", display: "block", flexShrink: 0 }}
    />
  );
}

function StatRow({ label, value, max, color = "#f0c040" }: { label: string; value: number; max: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ marginBottom: "0.45rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontFamily: "Cinzel, serif", fontSize: "0.6rem", color: "rgba(200,170,100,0.55)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontFamily: "Cinzel, serif", fontSize: "0.65rem", color, fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
    </div>
  );
}

function SkillBadge({ type }: { type: string }) {
  const map: Record<string, [string, string]> = {
    physical: ["#fb923c", "rgba(251,146,60,0.15)"],
    magical: ["#c084fc", "rgba(192,132,252,0.15)"],
    healing: ["#86efac", "rgba(134,239,172,0.15)"],
    buff: ["#60a5fa", "rgba(96,165,250,0.15)"],
    special: ["#f0c040", "rgba(240,192,64,0.15)"],
  };
  const [c, bg] = map[type] ?? ["#aaa", "rgba(150,150,150,0.1)"];
  return (
    <span style={{ fontSize: "0.52rem", letterSpacing: "0.06em", textTransform: "uppercase", borderRadius: 3, padding: "1px 5px", fontWeight: 700, color: c, background: bg }}>
      {type}
    </span>
  );
}

function PartyCard({ party, onEdit, onDelete }: { party: Party; onEdit: () => void; onDelete: () => void }) {
  const units = party.units.map(ul => getUnitDef(ul.unitId)).filter(Boolean) as UnitDef[];

  return (
    <div className="party-card">
      <div className="party-card-header">
        <span className="party-name">{party.name}</span>
        <div className="party-actions">
          <button className="icon-btn" onClick={onEdit} title="Edit">✎</button>
          <button className="icon-btn icon-btn-danger" onClick={onDelete} title="Delete">✕</button>
        </div>
      </div>
      <div className="party-sprites">
        {units.map((u, i) => (
          <div key={`${u.id}-${i}`} className="party-unit-slot">
            <UnitSprite unit={u} size={36} />
            <div className="party-unit-name">{u.name}</div>
          </div>
        ))}
        {Array.from({ length: Math.max(0, 6 - units.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="party-unit-slot party-unit-empty">
            <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(240,192,64,0.18)", fontSize: 16 }}>?</div>
            <div className="party-unit-name" style={{ color: "rgba(240,192,64,0.18)" }}>—</div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ModalState {
  step: 1 | 2;
  name: string;
  selectedSlots: string[];
  currentUnitIdx: number;
  loadouts: Record<number, { skillIds: string[]; passiveId: string }>;
}

function initLoadoutsForUnit(unit: UnitDef): { skillIds: string[]; passiveId: string } {
  return {
    skillIds: unit.skills.slice(0, 4).map(s => s.id),
    passiveId: unit.passives[0]?.id ?? "",
  };
}

function PartyModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Party;
  onSave: (name: string, units: UnitLoadout[]) => void;
  onClose: () => void;
}) {
  const [state, setState] = useState<ModalState>(() => {
    if (initial) {
      const slots = initial.units.map(ul => ul.unitId);
      const loadouts: Record<number, { skillIds: string[]; passiveId: string }> = {};
      initial.units.forEach((ul, i) => { loadouts[i] = { skillIds: ul.skillIds, passiveId: ul.passiveId }; });
      return { step: 1, name: initial.name, selectedSlots: slots, currentUnitIdx: 0, loadouts };
    }
    return { step: 1, name: "", selectedSlots: [], currentUnitIdx: 0, loadouts: {} };
  });

  function addUnit(id: string) {
    setState(s => {
      const count = s.selectedSlots.filter(x => x === id).length;
      if (count >= 2 || s.selectedSlots.length >= 6) return s;
      const unit = getUnitDef(id);
      const newSlots = [...s.selectedSlots, id];
      const newIdx = newSlots.length - 1;
      return { ...s, selectedSlots: newSlots, loadouts: { ...s.loadouts, [newIdx]: unit ? initLoadoutsForUnit(unit) : { skillIds: [], passiveId: "" } } };
    });
  }

  function removeUnit(id: string) {
    setState(s => {
      const idx = s.selectedSlots.lastIndexOf(id);
      if (idx === -1) return s;
      const newSlots = [...s.selectedSlots.slice(0, idx), ...s.selectedSlots.slice(idx + 1)];
      const newLoadouts: Record<number, { skillIds: string[]; passiveId: string }> = {};
      newSlots.forEach((_, i) => {
        const oldIdx = i < idx ? i : i + 1;
        newLoadouts[i] = s.loadouts[oldIdx] ?? { skillIds: [], passiveId: "" };
      });
      return { ...s, selectedSlots: newSlots, loadouts: newLoadouts };
    });
  }

  function goToLoadout() {
    setState(s => ({ ...s, step: 2, currentUnitIdx: 0 }));
  }

  function toggleSkill(skillId: string) {
    setState(s => {
      const idx = s.currentUnitIdx;
      const cur = s.loadouts[idx] ?? { skillIds: [], passiveId: "" };
      const has = cur.skillIds.includes(skillId);
      const skillIds = has
        ? cur.skillIds.filter(x => x !== skillId)
        : cur.skillIds.length < 4 ? [...cur.skillIds, skillId] : cur.skillIds;
      return { ...s, loadouts: { ...s.loadouts, [idx]: { ...cur, skillIds } } };
    });
  }

  function setPassive(passiveId: string) {
    setState(s => {
      const idx = s.currentUnitIdx;
      const cur = s.loadouts[idx] ?? { skillIds: [], passiveId: "" };
      return { ...s, loadouts: { ...s.loadouts, [idx]: { ...cur, passiveId } } };
    });
  }

  function handleSave() {
    const units: UnitLoadout[] = state.selectedSlots.map((unitId, i) => ({
      unitId,
      skillIds: state.loadouts[i]?.skillIds ?? [],
      passiveId: state.loadouts[i]?.passiveId ?? "",
    }));
    onSave(state.name, units);
  }

  const canProceed = state.selectedSlots.length === 6;
  const currentUnit = getUnitDef(state.selectedSlots[state.currentUnitIdx]);
  const currentLoadout = state.loadouts[state.currentUnitIdx] ?? { skillIds: [], passiveId: "" };
  const allConfigured = state.selectedSlots.every((_, i) => (state.loadouts[i]?.skillIds.length ?? 0) === 4 && state.loadouts[i]?.passiveId);
  const isLastUnit = state.currentUnitIdx === state.selectedSlots.length - 1;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel">
        <div className="modal-header">
          <span className="modal-title">{initial ? "Edit Party" : "New Party"}</span>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {state.step === 1 && (
            <>
              <div className="modal-field">
                <label className="field-label">Party Name</label>
                <input className="field-input" placeholder="Enter a name…" value={state.name} maxLength={32}
                  onChange={(e) => setState(s => ({ ...s, name: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label className="field-label">
                  Select 6 Units <em style={{ fontSize: "0.6rem", color: "rgba(200,170,100,0.4)", fontStyle: "normal" }}>(up to 2 of same)</em>
                  &nbsp;<span style={{ color: state.selectedSlots.length === 6 ? "#86efac" : "#f0c040", fontWeight: 700 }}>{state.selectedSlots.length}/6</span>
                </label>

                {state.selectedSlots.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.75rem" }}>
                    {state.selectedSlots.map((uid, i) => {
                      const u = getUnitDef(uid);
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(240,192,64,0.1)", border: "1px solid rgba(240,192,64,0.25)", borderRadius: 6, padding: "2px 6px 2px 4px" }}>
                          {u && <img src={`/assets/units/${u.id}-sprite.png`} alt={u.name} style={{ width: 20, height: 20, imageRendering: "pixelated", objectFit: "contain" }} />}
                          <span style={{ fontFamily: "Cinzel, serif", fontSize: "0.62rem", color: "#f0c040" }}>{u?.name ?? uid}</span>
                          <button onClick={() => removeUnit(uid)} style={{ background: "none", border: "none", color: "rgba(240,192,64,0.5)", cursor: "pointer", padding: 0, fontSize: "0.6rem", lineHeight: 1 }}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="unit-picker-grid">
                  {ALL_UNITS.map((u) => {
                    const count = state.selectedSlots.filter(x => x === u.id).length;
                    const canAdd = count < 2 && state.selectedSlots.length < 6;
                    const isSelected = count > 0;
                    return (
                      <div key={u.id}
                        className={`picker-card${isSelected ? " picker-selected" : ""}${!canAdd && !isSelected ? " picker-disabled" : ""}`}
                        onClick={() => canAdd ? addUnit(u.id) : undefined}
                        title={count === 2 ? "Max 2 of this unit" : count === 1 ? "Click to add a second copy" : state.selectedSlots.length >= 6 ? "Party is full" : `Add ${u.name}`}
                      >
                        <UnitSprite unit={u} size={36} />
                        {count > 0 && <div className="picker-check">×{count}</div>}
                        <div className="picker-name">{u.name}</div>
                        <div className="picker-cls">{u.cls.replace(/-/g, " ")}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {state.step === 2 && currentUnit && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <button className="btn-ghost" style={{ padding: "0.3rem 0.7rem", fontSize: "0.68rem" }}
                  disabled={state.currentUnitIdx === 0}
                  onClick={() => setState(s => ({ ...s, currentUnitIdx: s.currentUnitIdx - 1 }))}>
                  ← Prev
                </button>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "Cinzel, serif", fontSize: "0.65rem", color: "rgba(200,170,100,0.5)", letterSpacing: "0.14em" }}>
                    UNIT {state.currentUnitIdx + 1} OF {state.selectedSlots.length}
                  </div>
                  <div style={{ fontFamily: "Cinzel, serif", fontSize: "1rem", fontWeight: 700, color: "#f0c040", marginTop: 2 }}>
                    {currentUnit.name}
                  </div>
                </div>
                {!isLastUnit ? (
                  <button className="btn-ghost" style={{ padding: "0.3rem 0.7rem", fontSize: "0.68rem" }}
                    onClick={() => setState(s => ({ ...s, currentUnitIdx: s.currentUnitIdx + 1 }))}>
                    Next →
                  </button>
                ) : (
                  <div style={{ width: 70 }} />
                )}
              </div>

              <div className="modal-field">
                <label className="field-label">
                  Skills — pick 4{" "}
                  <span style={{ color: currentLoadout.skillIds.length === 4 ? "#86efac" : "#f0c040", fontWeight: 700 }}>{currentLoadout.skillIds.length}/4</span>
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  {currentUnit.skills.map((sk) => {
                    const isChosen = currentLoadout.skillIds.includes(sk.id);
                    const disabled = !isChosen && currentLoadout.skillIds.length >= 4;
                    return (
                      <div key={sk.id}
                        onClick={() => !disabled && toggleSkill(sk.id)}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.4rem 0.55rem",
                          background: isChosen ? "rgba(240,192,64,0.1)" : "rgba(12,9,25,0.7)",
                          border: `1px solid ${isChosen ? "rgba(240,192,64,0.4)" : "rgba(240,192,64,0.08)"}`,
                          borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
                          transition: "all 0.12s",
                        }}>
                        <div style={{ width: 14, height: 14, border: `2px solid ${isChosen ? "#f0c040" : "rgba(240,192,64,0.3)"}`, borderRadius: 3, background: isChosen ? "#f0c040" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                          {isChosen && <span style={{ fontSize: "0.5rem", color: "#000", fontWeight: 900 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontFamily: "Cinzel, serif", fontSize: "0.72rem", fontWeight: 700, color: isChosen ? "#f0c040" : "rgba(220,190,120,0.7)" }}>{sk.name}</span>
                            <SkillBadge type={sk.type} />
                            <span style={{ fontSize: "0.6rem", color: "#c084fc", fontWeight: 700, marginLeft: "auto" }}>{sk.ap} AP</span>
                          </div>
                          {sk.effect && <div style={{ fontSize: "0.6rem", color: "rgba(200,170,100,0.45)", marginTop: 2, fontStyle: "italic" }}>{sk.effect}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-field" style={{ marginTop: "0.75rem" }}>
                <label className="field-label">Passive — pick 1</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  {currentUnit.passives.map((p) => {
                    const isChosen = currentLoadout.passiveId === p.id;
                    return (
                      <div key={p.id}
                        onClick={() => setPassive(p.id)}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.4rem 0.55rem",
                          background: isChosen ? "rgba(192,132,252,0.1)" : "rgba(12,9,25,0.7)",
                          border: `1px solid ${isChosen ? "rgba(192,132,252,0.4)" : "rgba(240,192,64,0.08)"}`,
                          borderRadius: 6, cursor: "pointer", transition: "all 0.12s",
                        }}>
                        <div style={{ width: 14, height: 14, border: `2px solid ${isChosen ? "#c084fc" : "rgba(192,132,252,0.3)"}`, borderRadius: "50%", background: isChosen ? "#c084fc" : "transparent", flexShrink: 0, marginTop: 2 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "Cinzel, serif", fontSize: "0.72rem", fontWeight: 700, color: isChosen ? "#c084fc" : "rgba(180,150,200,0.7)" }}>{p.name}</div>
                          <div style={{ fontSize: "0.6rem", color: "rgba(200,170,100,0.45)", marginTop: 2 }}>{p.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {state.step === 1 ? (
            <>
              <button className="btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn-gold" disabled={!canProceed}
                onClick={goToLoadout}>
                Configure Loadouts →
              </button>
            </>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => setState(s => ({ ...s, step: 1 }))}>← Units</button>
              {isLastUnit ? (
                <button className="btn-gold" disabled={!allConfigured} onClick={handleSave}>
                  Save Party
                </button>
              ) : (
                <button className="btn-gold" onClick={() => setState(s => ({ ...s, currentUnitIdx: s.currentUnitIdx + 1 }))}>
                  Next Unit →
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function UnitDetailPanel({ unit, onClose }: { unit: UnitDef; onClose: () => void }) {
  return (
    <div className="detail-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="detail-panel">
        <div className="detail-header">
          <div>
            <div className="detail-name">{unit.name}</div>
            <div className="detail-cls">{unit.cls.replace(/-/g, " ")}</div>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="detail-portrait">
          <img src={`/assets/units/${unit.id}-portrait.png`} alt={`${unit.name} portrait`}
            style={{ width: "100%", maxHeight: 220, objectFit: "cover", objectPosition: "top center", display: "block" }} />
          <div className="detail-portrait-fade" />
        </div>

        <div className="detail-body">
          <p className="detail-description">{unit.description}</p>
          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginBottom: "0.85rem" }}>
            <span className="detail-tag">⚔ {unit.baseAttackStyle.replace(/-/g, " ")}</span>
            <span className="detail-tag">★ {unit.primaryStat === "physAtk" ? "Phys" : "Mag"}</span>
            <span className="detail-tag">💨 SPD {unit.speed}</span>
            <span className="detail-tag">🦶 MOVE {unit.moveDist}</span>
            <span className="detail-tag">👁 EVA {Math.round(unit.evasion * 100)}%</span>
          </div>

          <div className="detail-section-label">Stats</div>
          <div style={{ marginBottom: "1rem" }}>
            <StatRow label="HP" value={unit.baseHp} max={160} color="#86efac" />
            <StatRow label="Phys Atk" value={unit.physAtk} max={100} color="#f0c040" />
            <StatRow label="Mag Atk" value={unit.magAtk} max={100} color="#c084fc" />
            <StatRow label="Phys Def" value={unit.physDef} max={100} color="#60a5fa" />
            <StatRow label="Mag Def" value={unit.magDef} max={100} color="#818cf8" />
            <StatRow label="Speed" value={unit.speed} max={100} color="#fb923c" />
          </div>

          <div className="detail-section-label">Skill Pool ({unit.skills.length} skills — pick 4)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1rem" }}>
            {unit.skills.map((sk) => (
              <div key={sk.id} className="skill-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                  <span className="skill-name">{sk.name}</span>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <SkillBadge type={sk.type} />
                    <span className="skill-ap">{sk.ap} AP</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
                  {sk.power && <span className="skill-stat">PWR {sk.power}</span>}
                  {sk.accuracy && <span className="skill-stat">ACC {sk.accuracy}%</span>}
                  {sk.healAmount && <span className="skill-stat">+{sk.healAmount} HP</span>}
                  {sk.style && <span className="skill-stat">{sk.style.replace(/-/g, " ")}</span>}
                </div>
                {sk.effect && <div className="skill-effect">{sk.effect}</div>}
              </div>
            ))}
          </div>

          <div className="detail-section-label">Passives (pick 1)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {unit.passives.map((p) => (
              <div key={p.id} className="passive-card">
                <div className="passive-name">{p.name}</div>
                <div className="passive-desc">{p.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const HUB_CSS = `
  .hub-root {
    min-height: 100vh;
    background: #06040e;
    display: flex; flex-direction: column;
    position: relative; overflow-x: hidden;
  }
  .hub-backdrop {
    position: fixed; inset: 0; z-index: 0;
    background-image: url('/assets/hub/tavern-backdrop.png');
    background-size: cover; background-position: center bottom;
    opacity: 0.22;
    pointer-events: none;
  }
  .hub-backdrop-overlay {
    position: fixed; inset: 0; z-index: 0;
    background: linear-gradient(to bottom, rgba(6,4,14,0.55) 0%, rgba(6,4,14,0.2) 35%, rgba(6,4,14,0.65) 70%, rgba(6,4,14,0.92) 100%);
    pointer-events: none;
  }
  .hub-header {
    position: relative; z-index: 2;
    display: flex; align-items: center; gap: 1.5rem;
    padding: 1.5rem 2rem 1rem;
    border-bottom: 1px solid rgba(240,192,64,0.12);
    backdrop-filter: blur(4px);
    background: rgba(6,4,14,0.35);
  }
  .back-btn {
    font-family: 'Cinzel', serif; font-size: 0.78rem; letter-spacing: 0.12em; text-transform: uppercase;
    background: transparent; color: rgba(240,192,64,0.7);
    border: 1px solid rgba(240,192,64,0.25); border-radius: 6px;
    padding: 0.45rem 0.9rem; cursor: pointer; transition: all 0.15s;
    white-space: nowrap;
  }
  .back-btn:hover { color: #f0c040; border-color: rgba(240,192,64,0.55); background: rgba(240,192,64,0.07); }
  .hub-title-wrap { flex: 1; }
  .hub-title {
    font-family: 'Cinzel Decorative', serif; font-size: 2rem; font-weight: 700;
    color: #f0c040; text-shadow: 0 0 20px rgba(240,192,64,0.5), 2px 2px 0 rgba(0,0,0,0.9); margin: 0;
  }
  .hub-subtitle {
    font-family: 'Cinzel', serif; font-size: 0.7rem;
    color: rgba(200,170,100,0.5); letter-spacing: 0.28em; text-transform: uppercase; margin-top: 0.2rem;
  }
  .hub-body {
    position: relative; z-index: 1; flex: 1;
    padding: 2rem; max-width: 1100px; width: 100%; margin: 0 auto;
  }
  .hub-section-bar {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;
  }
  .section-label {
    font-family: 'Cinzel', serif; font-size: 0.68rem; letter-spacing: 0.22em;
    text-transform: uppercase; color: rgba(200,170,100,0.45);
  }
  .btn-gold {
    font-family: 'Cinzel', serif; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    background: linear-gradient(135deg, #f0c040, #e0a820); color: #1a1000;
    border: none; border-radius: 7px; padding: 0.55rem 1.25rem; cursor: pointer; transition: all 0.15s;
  }
  .btn-gold:hover:not(:disabled) { background: linear-gradient(135deg, #ffd060, #f0b830); box-shadow: 0 0 15px rgba(240,192,64,0.35); }
  .btn-gold:disabled { opacity: 0.35; cursor: not-allowed; }
  .btn-ghost {
    font-family: 'Cinzel', serif; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase;
    background: transparent; color: rgba(200,170,100,0.55);
    border: 1px solid rgba(240,192,64,0.2); border-radius: 6px; padding: 0.45rem 0.9rem; cursor: pointer; transition: all 0.15s;
  }
  .btn-ghost:hover:not(:disabled) { color: rgba(240,192,64,0.8); border-color: rgba(240,192,64,0.4); }
  .btn-ghost:disabled { opacity: 0.3; cursor: not-allowed; }
  .icon-btn {
    background: transparent; border: 1px solid rgba(240,192,64,0.15); border-radius: 5px;
    color: rgba(240,192,64,0.5); cursor: pointer; font-size: 0.8rem; padding: 0.25rem 0.5rem; transition: all 0.13s;
  }
  .icon-btn:hover { color: #f0c040; border-color: rgba(240,192,64,0.4); }
  .icon-btn-danger:hover { color: #f87171; border-color: rgba(248,113,113,0.4); }

  /* Parties */
  .parties-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 2.5rem;
  }
  .party-card {
    background: rgba(10,7,22,0.88); border: 1px solid rgba(240,192,64,0.16); border-radius: 10px;
    padding: 0.9rem; backdrop-filter: blur(6px); transition: border-color 0.15s;
  }
  .party-card:hover { border-color: rgba(240,192,64,0.32); }
  .party-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.7rem; }
  .party-name { font-family: 'Cinzel', serif; font-size: 0.88rem; font-weight: 700; color: #f0c040; }
  .party-actions { display: flex; gap: 0.3rem; }
  .party-sprites { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.3rem; }
  .party-unit-slot { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
  .party-unit-name { font-family: 'Cinzel', serif; font-size: 0.48rem; font-weight: 600; color: rgba(240,220,160,0.7); text-align: center; line-height: 1.2; }
  .party-unit-empty { opacity: 0.35; }

  /* Roster */
  .roster-grid {
    display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.5rem;
  }
  .roster-card {
    background: rgba(10,7,22,0.8); border: 1px solid rgba(240,192,64,0.1); border-radius: 8px;
    padding: 0.55rem 0.3rem 0.4rem;
    display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
    cursor: pointer; transition: all 0.14s; position: relative;
  }
  .roster-card:hover { border-color: rgba(240,192,64,0.4); background: rgba(240,192,64,0.06); transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
  .roster-card-name { font-family: 'Cinzel', serif; font-size: 0.58rem; font-weight: 600; color: rgba(220,190,120,0.85); text-align: center; line-height: 1.2; }
  .roster-card-cls { font-size: 0.5rem; color: rgba(200,170,100,0.35); text-transform: capitalize; text-align: center; }

  /* Modal */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1rem;
  }
  .modal-panel {
    background: #09071a; border: 1px solid rgba(240,192,64,0.2); border-radius: 12px;
    width: 100%; max-width: 680px; max-height: 90vh; display: flex; flex-direction: column;
    box-shadow: 0 20px 60px rgba(0,0,0,0.8);
  }
  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.1rem 1.3rem 0.9rem; border-bottom: 1px solid rgba(240,192,64,0.1); flex-shrink: 0;
  }
  .modal-title { font-family: 'Cinzel', serif; font-size: 1rem; font-weight: 700; color: #f0c040; }
  .modal-body { flex: 1; overflow-y: auto; padding: 1.1rem 1.3rem; scrollbar-width: thin; scrollbar-color: rgba(240,192,64,0.15) transparent; }
  .modal-footer { padding: 0.9rem 1.3rem; border-top: 1px solid rgba(240,192,64,0.1); display: flex; justify-content: flex-end; gap: 0.6rem; flex-shrink: 0; }
  .modal-field { margin-bottom: 1rem; }
  .field-label { font-family: 'Cinzel', serif; font-size: 0.65rem; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(200,170,100,0.5); display: block; margin-bottom: 0.45rem; }
  .field-input {
    width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.04); border: 1px solid rgba(240,192,64,0.2);
    border-radius: 7px; padding: 0.55rem 0.75rem;
    font-family: 'Cinzel', serif; font-size: 0.82rem; color: #f0c040; outline: none; transition: border-color 0.15s;
  }
  .field-input:focus { border-color: rgba(240,192,64,0.5); }
  .field-input::placeholder { color: rgba(200,170,100,0.2); }
  .unit-picker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(68px, 1fr)); gap: 0.4rem; }
  .picker-card {
    background: rgba(12,9,25,0.85); border: 1px solid rgba(240,192,64,0.1); border-radius: 7px;
    padding: 0.45rem 0.25rem 0.35rem; display: flex; flex-direction: column; align-items: center; gap: 0.2rem;
    cursor: pointer; transition: all 0.13s; position: relative;
  }
  .picker-card:hover:not(.picker-disabled) { border-color: rgba(240,192,64,0.4); background: rgba(240,192,64,0.06); }
  .picker-selected { border-color: rgba(240,192,64,0.5) !important; background: rgba(240,192,64,0.1) !important; }
  .picker-disabled { opacity: 0.3; cursor: not-allowed; }
  .picker-check {
    position: absolute; top: 2px; right: 3px;
    background: #f0c040; color: #1a1000; font-size: 0.48rem; font-weight: 900;
    border-radius: 3px; padding: 1px 3px; font-family: 'Cinzel', serif;
  }
  .picker-name { font-family: 'Cinzel', serif; font-size: 0.55rem; font-weight: 600; color: rgba(220,190,120,0.85); text-align: center; line-height: 1.2; }
  .picker-cls { font-size: 0.48rem; color: rgba(200,170,100,0.35); text-transform: capitalize; text-align: center; }

  /* Empty state */
  .empty-state { text-align: center; padding: 2.5rem 1rem; }
  .empty-icon { font-size: 2rem; opacity: 0.2; margin-bottom: 0.5rem; }
  .empty-text { font-family: 'Cinzel', serif; font-size: 0.85rem; color: rgba(200,170,100,0.4); margin-bottom: 0.3rem; text-transform: uppercase; letter-spacing: 0.2em; }
  .empty-hint { font-size: 0.72rem; color: rgba(200,170,100,0.25); margin-bottom: 0.75rem; }

  /* Detail panel */
  .detail-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.65); backdrop-filter: blur(4px);
    display: flex; justify-content: flex-end;
  }
  .detail-panel {
    width: 360px; max-width: 100vw; height: 100vh;
    background: #080618; border-left: 1px solid rgba(240,192,64,0.18);
    display: flex; flex-direction: column; overflow: hidden;
    box-shadow: -10px 0 50px rgba(0,0,0,0.8);
    animation: slideIn 0.2s ease-out;
  }
  @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .detail-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.1rem 1.1rem 0.8rem; border-bottom: 1px solid rgba(240,192,64,0.1); flex-shrink: 0;
  }
  .detail-name { font-family: 'Cinzel', serif; font-size: 1.05rem; font-weight: 700; color: #f0c040; }
  .detail-cls { font-family: 'Cinzel', serif; font-size: 0.6rem; color: rgba(200,170,100,0.45); letter-spacing: 0.18em; text-transform: uppercase; margin-top: 0.1rem; }
  .detail-portrait { flex-shrink: 0; position: relative; }
  .detail-portrait-fade { position: absolute; bottom: 0; left: 0; right: 0; height: 40px; background: linear-gradient(transparent, #080618); }
  .detail-body { flex: 1; overflow-y: auto; padding: 0.85rem 1.1rem; scrollbar-width: thin; scrollbar-color: rgba(240,192,64,0.12) transparent; }
  .detail-description { font-size: 0.7rem; color: rgba(200,175,130,0.65); line-height: 1.55; margin: 0 0 0.75rem; font-style: italic; }
  .detail-tag { font-family: 'Cinzel', serif; font-size: 0.55rem; letter-spacing: 0.08em; text-transform: uppercase; background: rgba(240,192,64,0.08); border: 1px solid rgba(240,192,64,0.15); border-radius: 4px; padding: 2px 6px; color: rgba(200,170,100,0.55); }
  .detail-section-label {
    font-family: 'Cinzel', serif; font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(200,170,100,0.45); margin: 0.75rem 0 0.5rem;
    padding-bottom: 0.25rem; border-bottom: 1px solid rgba(240,192,64,0.07);
  }
  .skill-card { background: rgba(12,9,28,0.9); border: 1px solid rgba(240,192,64,0.1); border-radius: 6px; padding: 0.5rem 0.6rem; }
  .skill-name { font-family: 'Cinzel', serif; font-size: 0.72rem; font-weight: 600; color: #f0c040; }
  .skill-ap { font-family: 'Cinzel', serif; font-size: 0.62rem; font-weight: 700; color: #c084fc; background: rgba(192,132,252,0.1); border-radius: 4px; padding: 1px 5px; }
  .skill-stat { font-size: 0.56rem; color: rgba(200,170,100,0.45); }
  .skill-effect { font-size: 0.6rem; color: rgba(200,170,100,0.45); margin-top: 0.25rem; font-style: italic; line-height: 1.4; }
  .passive-card { background: rgba(12,9,28,0.9); border: 1px solid rgba(192,132,252,0.12); border-radius: 6px; padding: 0.5rem 0.6rem; }
  .passive-name { font-family: 'Cinzel', serif; font-size: 0.72rem; font-weight: 600; color: #c084fc; margin-bottom: 0.2rem; }
  .passive-desc { font-size: 0.6rem; color: rgba(200,170,100,0.45); line-height: 1.4; }
`;

export default function GatheringHub() {
  const navigate = useNavigate();
  const { parties, saveParty, deleteParty } = useParties();
  const [modalOpen, setModalOpen] = useState(false);
  const [editParty, setEditParty] = useState<Party | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<UnitDef | null>(null);

  function openNew() { setEditParty(undefined); setModalOpen(true); }
  function openEdit(party: Party) { setEditParty(party); setModalOpen(true); }

  function handleSave(name: string, units: UnitLoadout[]) {
    saveParty(name, units, editParty?.id);
    setModalOpen(false);
    setEditParty(undefined);
  }

  function handleDelete(id: string) {
    if (deleteConfirm === id) {
      deleteParty(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  }

  return (
    <div className="hub-root">
      <style>{FONTS + HUB_CSS}</style>

      <div className="hub-backdrop" />
      <div className="hub-backdrop-overlay" />

      <header className="hub-header">
        <button className="back-btn" onClick={() => navigate("/lobby")}>← Lobby</button>
        <div className="hub-title-wrap">
          <h1 className="hub-title">Gathering Hub</h1>
          <p className="hub-subtitle">Party Builder</p>
        </div>
        <button className="btn-gold" onClick={openNew}>+ New Party</button>
      </header>

      <main className="hub-body">
        <div className="hub-section-bar">
          <span className="section-label">
            {parties.length === 0 ? "No parties yet" : `${parties.length} ${parties.length === 1 ? "Party" : "Parties"} Saved`}
          </span>
        </div>

        {parties.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⚔</div>
            <div className="empty-text">No parties saved</div>
            <div className="empty-hint">Build a 6-unit party with customised skill and passive loadouts.</div>
            <button className="btn-gold" onClick={openNew}>+ New Party</button>
          </div>
        ) : (
          <div className="parties-grid">
            {parties.map((party) => (
              <PartyCard key={party.id} party={party}
                onEdit={() => openEdit(party)}
                onDelete={() => handleDelete(party.id)} />
            ))}
          </div>
        )}

        <div className="hub-section-bar">
          <span className="section-label">Unit Roster — click to inspect</span>
        </div>
        <div className="roster-grid">
          {ALL_UNITS.map((u) => (
            <div key={u.id} className="roster-card" onClick={() => setSelectedUnit(u)}>
              <UnitSprite unit={u} size={40} />
              <div className="roster-card-name">{u.name}</div>
              <div className="roster-card-cls">{u.cls.replace(/-/g, " ")}</div>
            </div>
          ))}
        </div>
      </main>

      {modalOpen && (
        <PartyModal initial={editParty} onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditParty(undefined); }} />
      )}

      {selectedUnit && (
        <UnitDetailPanel unit={selectedUnit} onClose={() => setSelectedUnit(null)} />
      )}
    </div>
  );
}
