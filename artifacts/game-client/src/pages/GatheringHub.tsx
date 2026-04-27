import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ALL_UNITS } from "@/lib/units";
import { useParties, type Party } from "@/hooks/useParties";
import type { UnitDef } from "@/lib/types";
import WandererSlashAnim from "@/components/WandererSlashAnim";

function spriteCSS() {
  return `
    .sprite { display:inline-block; background-repeat:no-repeat; image-rendering:pixelated; flex-shrink:0; }
    .sprite--blade-knight { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/3/30/Blade_Knight.png'); }
    .sprite--rune-archer  { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/d/dd/Rune_Archer.png'); }
    .sprite--cleric       { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/a/a4/Cleric.png'); }
    .sprite--guardian     { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/2/2b/Guardian.png'); }
    .sprite--lancer       { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/e/e7/Lancer.png'); }
    .sprite--hex-mage     { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/0/03/Hex_Mage.png'); }
    .sprite--invoker      { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/5/50/Invoker.png'); }
    .sprite--fell-duelist { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/8/8c/Fell_Duelist.png'); }
    .sprite--phantom-blade { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/8/8c/Fell_Duelist.png'); filter: hue-rotate(200deg); }
    .sprite--storm-sage   { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/5/50/Invoker.png'); filter: hue-rotate(140deg) saturate(1.4); }
    .sprite--vanguard     { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/2/2b/Guardian.png'); filter: hue-rotate(30deg) saturate(1.2); }
    .sprite--ranger       { background-image: url('https://rpg.hamsterrepublic.com/wiki-images/d/dd/Rune_Archer.png'); filter: hue-rotate(90deg); }
  `;
}

function UnitSprite({ unit, size = 48 }: { unit: UnitDef; size?: number }) {
  return (
    <div
      className={`sprite sprite--${unit.cls}`}
      style={{ width: size, height: Math.round(size * 1.33), backgroundSize: "contain", backgroundPosition: "center bottom", backgroundRepeat: "no-repeat" }}
    />
  );
}

function PartyCard({
  party,
  onEdit,
  onDelete,
}: {
  party: Party;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const units = party.unitIds.map((id) => ALL_UNITS.find((u) => u.id === id)).filter(Boolean) as UnitDef[];

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
        {units.map((u) => (
          <div key={u.id} className="party-unit-slot">
            <UnitSprite unit={u} size={40} />
            <div className="party-unit-name">{u.name}</div>
          </div>
        ))}
        {units.length < 4 &&
          Array.from({ length: 4 - units.length }).map((_, i) => (
            <div key={`empty-${i}`} className="party-unit-slot party-unit-empty">
              <div style={{ width: 40, height: 53, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(240,192,64,0.2)", fontSize: 20 }}>?</div>
              <div className="party-unit-name" style={{ color: "rgba(240,192,64,0.2)" }}>—</div>
            </div>
          ))}
      </div>
    </div>
  );
}

function PartyModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Party;
  onSave: (name: string, unitIds: string[]) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [selected, setSelected] = useState<string[]>(initial?.unitIds ?? []);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }

  const canSave = selected.length === 4;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel">
        <div className="modal-header">
          <span className="modal-title">{initial ? "Edit Party" : "New Party"}</span>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label className="field-label">Party Name</label>
            <input
              className="field-input"
              placeholder="Enter a name…"
              value={name}
              maxLength={32}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <label className="field-label">
              Select 4 Units&nbsp;
              <span style={{ color: selected.length === 4 ? "#86efac" : "#f0c040", fontWeight: 700 }}>
                {selected.length}/4
              </span>
            </label>
            <div className="unit-picker-grid">
              {ALL_UNITS.map((u) => {
                const isSelected = selected.includes(u.id);
                const isDisabled = !isSelected && selected.length >= 4;
                return (
                  <div
                    key={u.id}
                    className={`picker-card${isSelected ? " picker-selected" : ""}${isDisabled ? " picker-disabled" : ""}`}
                    onClick={() => !isDisabled && toggle(u.id)}
                  >
                    <UnitSprite unit={u} size={36} />
                    {isSelected && <div className="picker-check">✓</div>}
                    <div className="picker-name">{u.name}</div>
                    <div className="picker-cls">{u.cls.replace(/-/g, " ")}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn-gold"
            disabled={!canSave}
            onClick={() => canSave && onSave(name, selected)}
          >
            Save Party
          </button>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, max, color = "#f0c040" }: { label: string; value: number; max: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontFamily: "Cinzel, serif", fontSize: "0.65rem", color: "rgba(200,170,100,0.6)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontFamily: "Cinzel, serif", fontSize: "0.7rem", color, fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

function UnitDetailPanel({ unit, onClose }: { unit: UnitDef; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"art" | "preview">("art");
  const hasPortrait = unit.id === "wanderer";
  const hasAnimation = unit.id === "wanderer";

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

        {hasAnimation && (
          <div className="detail-tabs">
            <button className={`detail-tab${activeTab === "art" ? " active" : ""}`} onClick={() => setActiveTab("art")}>Portrait</button>
            <button className={`detail-tab${activeTab === "preview" ? " active" : ""}`} onClick={() => setActiveTab("preview")}>Attack Preview</button>
          </div>
        )}

        <div className="detail-visual">
          {activeTab === "art" || !hasAnimation ? (
            hasPortrait ? (
              <img
                src="/assets/units/wanderer-portrait.png"
                alt="Wanderer portrait"
                style={{ width: "100%", maxHeight: 260, objectFit: "cover", objectPosition: "top", borderRadius: 6, display: "block" }}
              />
            ) : (
              <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className={`sprite sprite--${unit.cls}`} style={{ width: 64, height: 85, backgroundSize: "contain", backgroundPosition: "center bottom" }} />
              </div>
            )
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "1rem 0" }}>
              <div style={{ fontSize: "0.65rem", fontFamily: "Cinzel, serif", color: "rgba(200,170,100,0.5)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                Draw Slash · 12 Frames · 20 FPS
              </div>
              <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 8, padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 180, gap: "2rem" }}>
                <WandererSlashAnim mode="loop" scale={2} />
              </div>
              <div style={{ fontSize: "0.6rem", fontFamily: "Cinzel, serif", color: "rgba(200,170,100,0.35)", letterSpacing: "0.12em" }}>
                Anticipation · Dash · Strike · Reaction · Recovery
              </div>
            </div>
          )}
        </div>

        <div className="detail-body">
          <div className="detail-section-label">Stats</div>
          <div style={{ marginBottom: "1rem" }}>
            <StatRow label="HP" value={unit.baseHp} max={160} color="#86efac" />
            <StatRow label="Phys Atk" value={unit.physAtk} max={100} color="#f0c040" />
            <StatRow label="Mag Atk" value={unit.magAtk} max={100} color="#c084fc" />
            <StatRow label="Phys Def" value={unit.physDef} max={100} color="#60a5fa" />
            <StatRow label="Mag Def" value={unit.magDef} max={100} color="#818cf8" />
            <StatRow label="Speed" value={unit.speed} max={100} color="#fb923c" />
            <StatRow label="Move" value={unit.moveDist} max={4} color="#34d399" />
            <StatRow label="Evasion" value={Math.round(unit.evasion * 100)} max={40} color="#f472b6" />
          </div>

          <div className="detail-section-label">Active Skills</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
            {unit.skills.map((sk) => (
              <div key={sk.id} className="skill-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span className="skill-name">{sk.name}</span>
                  <span className="skill-ap">{sk.ap} AP</span>
                </div>
                <div className="skill-type-row">
                  <span className={`skill-badge skill-badge--${sk.type}`}>{sk.type}</span>
                  {sk.power && <span className="skill-power">PWR {sk.power}</span>}
                  {sk.accuracy && <span className="skill-acc">ACC {sk.accuracy}%</span>}
                  {sk.healAmount && <span className="skill-power">+{sk.healAmount} HP</span>}
                </div>
                {sk.effect && <div className="skill-effect">{sk.effect}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GatheringHub() {
  const navigate = useNavigate();
  const { parties, saveParty, deleteParty } = useParties();
  const [modalOpen, setModalOpen] = useState(false);
  const [editParty, setEditParty] = useState<Party | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<UnitDef | null>(null);

  function openNew() {
    setEditParty(undefined);
    setModalOpen(true);
  }

  function openEdit(party: Party) {
    setEditParty(party);
    setModalOpen(true);
  }

  function handleSave(name: string, unitIds: string[]) {
    saveParty(name, unitIds, editParty?.id);
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700&display=swap');
        ${spriteCSS()}

        .hub-root {
          min-height: 100vh;
          background: #08060f;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow-x: hidden;
        }

        .hub-bg {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(80,40,160,0.22) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 80%, rgba(40,20,80,0.28) 0%, transparent 60%),
            radial-gradient(ellipse 50% 30% at 80% 70%, rgba(20,40,100,0.18) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }

        .hub-header {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem 2rem 1rem;
          border-bottom: 1px solid rgba(240,192,64,0.12);
        }

        .back-btn {
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          background: transparent;
          color: rgba(240,192,64,0.7);
          border: 1px solid rgba(240,192,64,0.25);
          border-radius: 6px;
          padding: 0.45rem 0.9rem;
          cursor: pointer;
          transition: all 0.18s;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          white-space: nowrap;
        }
        .back-btn:hover { color: #f0c040; border-color: rgba(240,192,64,0.55); background: rgba(240,192,64,0.06); }

        .hub-title-wrap { flex: 1; }
        .hub-title {
          font-family: 'Cinzel Decorative', serif;
          font-size: 2rem;
          font-weight: 700;
          color: #f0c040;
          text-shadow: 0 0 20px rgba(240,192,64,0.5), 2px 2px 0 rgba(0,0,0,0.8);
          margin: 0;
        }
        .hub-subtitle {
          font-family: 'Cinzel', serif;
          font-size: 0.72rem;
          color: rgba(200,170,100,0.55);
          letter-spacing: 0.28em;
          text-transform: uppercase;
          margin-top: 0.2rem;
        }

        .hub-body {
          position: relative;
          z-index: 1;
          flex: 1;
          padding: 2rem;
          max-width: 1100px;
          width: 100%;
          margin: 0 auto;
        }

        .hub-section-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .section-label {
          font-family: 'Cinzel', serif;
          font-size: 0.78rem;
          color: rgba(200,170,100,0.55);
          letter-spacing: 0.25em;
          text-transform: uppercase;
        }

        .btn-gold {
          font-family: 'Cinzel', serif;
          font-size: 0.88rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          background: linear-gradient(135deg, #c89000, #f0c040, #c89000);
          color: #0a0810;
          border: none;
          border-radius: 8px;
          padding: 0.6rem 1.4rem;
          cursor: pointer;
          transition: all 0.18s;
          box-shadow: 0 3px 12px rgba(240,192,64,0.25);
        }
        .btn-gold:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 20px rgba(240,192,64,0.4); }
        .btn-gold:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .btn-ghost {
          font-family: 'Cinzel', serif;
          font-size: 0.88rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          background: transparent;
          color: rgba(200,170,100,0.7);
          border: 1px solid rgba(240,192,64,0.25);
          border-radius: 8px;
          padding: 0.6rem 1.4rem;
          cursor: pointer;
          transition: all 0.18s;
        }
        .btn-ghost:hover { background: rgba(240,192,64,0.07); color: #f0c040; border-color: rgba(240,192,64,0.45); }

        .parties-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1.25rem;
        }

        .party-card {
          background: rgba(14,10,28,0.85);
          border: 1px solid rgba(240,192,64,0.18);
          border-radius: 12px;
          padding: 1.2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          backdrop-filter: blur(10px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.5);
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .party-card:hover { border-color: rgba(240,192,64,0.38); box-shadow: 0 8px 32px rgba(240,192,64,0.08); }

        .party-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .party-name {
          font-family: 'Cinzel', serif;
          font-size: 0.95rem;
          font-weight: 600;
          color: #f0c040;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .party-actions { display: flex; gap: 0.4rem; flex-shrink: 0; }

        .icon-btn {
          background: transparent;
          border: 1px solid rgba(240,192,64,0.2);
          color: rgba(240,192,64,0.6);
          border-radius: 5px;
          width: 28px;
          height: 28px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.15s;
        }
        .icon-btn:hover { background: rgba(240,192,64,0.1); color: #f0c040; border-color: rgba(240,192,64,0.5); }
        .icon-btn-danger { border-color: rgba(200,60,60,0.3); color: rgba(200,60,60,0.7); }
        .icon-btn-danger:hover { background: rgba(200,60,60,0.15); color: #fca5a5; border-color: rgba(200,60,60,0.6); }

        .party-sprites {
          display: flex;
          gap: 0.5rem;
          justify-content: space-around;
          align-items: flex-end;
          padding: 0.5rem 0;
          border-top: 1px solid rgba(240,192,64,0.08);
        }

        .party-unit-slot {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          flex: 1;
        }
        .party-unit-name {
          font-family: 'Cinzel', serif;
          font-size: 0.58rem;
          color: rgba(200,170,100,0.65);
          letter-spacing: 0.05em;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 60px;
        }
        .party-unit-empty { opacity: 0.4; }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 4rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .empty-icon { font-size: 3rem; opacity: 0.25; }
        .empty-text {
          font-family: 'Cinzel', serif;
          font-size: 0.9rem;
          color: rgba(200,170,100,0.4);
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }
        .empty-hint { font-size: 0.8rem; color: rgba(200,170,100,0.3); font-style: italic; }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .modal-panel {
          background: #0d0920;
          border: 1px solid rgba(240,192,64,0.28);
          border-radius: 14px;
          width: 100%;
          max-width: 720px;
          max-height: 88vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(80,40,160,0.2);
          overflow: hidden;
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.2rem 1.5rem;
          border-bottom: 1px solid rgba(240,192,64,0.12);
          flex-shrink: 0;
        }
        .modal-title {
          font-family: 'Cinzel', serif;
          font-size: 1rem;
          font-weight: 700;
          color: #f0c040;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.4rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(240,192,64,0.2) transparent;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(240,192,64,0.12);
          flex-shrink: 0;
        }

        .modal-field { display: flex; flex-direction: column; gap: 0.6rem; }
        .field-label {
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          color: rgba(200,170,100,0.6);
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }
        .field-input {
          font-family: 'Cinzel', serif;
          font-size: 0.95rem;
          background: rgba(10,8,20,0.8);
          border: 1px solid rgba(240,192,64,0.28);
          border-radius: 8px;
          padding: 0.7rem 1rem;
          color: #f0c040;
          outline: none;
          transition: border-color 0.18s;
        }
        .field-input::placeholder { color: rgba(240,192,64,0.3); }
        .field-input:focus { border-color: rgba(240,192,64,0.65); }

        .unit-picker-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          gap: 0.6rem;
        }

        .picker-card {
          background: rgba(12,9,25,0.9);
          border: 1px solid rgba(240,192,64,0.15);
          border-radius: 8px;
          padding: 0.55rem 0.4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
          cursor: pointer;
          position: relative;
          transition: all 0.15s;
          user-select: none;
        }
        .picker-card:hover:not(.picker-disabled) { border-color: rgba(240,192,64,0.45); background: rgba(240,192,64,0.05); }
        .picker-selected {
          border-color: #f0c040 !important;
          background: rgba(240,192,64,0.1) !important;
          box-shadow: 0 0 12px rgba(240,192,64,0.2);
        }
        .picker-disabled { opacity: 0.35; cursor: not-allowed; }
        .picker-check {
          position: absolute;
          top: 4px; right: 5px;
          font-size: 0.75rem;
          color: #f0c040;
          font-weight: 700;
        }
        .picker-name {
          font-family: 'Cinzel', serif;
          font-size: 0.62rem;
          font-weight: 600;
          color: rgba(240,220,160,0.85);
          text-align: center;
          line-height: 1.2;
        }
        .picker-cls {
          font-size: 0.54rem;
          color: rgba(200,170,100,0.45);
          text-align: center;
          text-transform: capitalize;
          line-height: 1.1;
        }

        .divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(240,192,64,0.3), transparent);
          margin: 0.5rem 0;
        }

        /* Roster section */
        .roster-section { margin-top: 2.5rem; }
        .roster-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 0.6rem;
        }
        .roster-card {
          background: rgba(12,9,25,0.85);
          border: 1px solid rgba(240,192,64,0.13);
          border-radius: 8px;
          padding: 0.55rem 0.3rem 0.4rem;
          display: flex; flex-direction: column; align-items: center; gap: 0.28rem;
          cursor: pointer;
          transition: all 0.15s;
          position: relative;
        }
        .roster-card:hover { border-color: rgba(240,192,64,0.45); background: rgba(240,192,64,0.06); transform: translateY(-2px); }
        .roster-card.has-anim::after {
          content: "▶";
          position: absolute; top: 3px; right: 4px;
          font-size: 0.45rem; color: rgba(240,192,64,0.5);
        }
        .roster-card-name {
          font-family: 'Cinzel', serif; font-size: 0.58rem; font-weight: 600;
          color: rgba(220,190,120,0.85); text-align: center; line-height: 1.2;
        }
        .roster-card-cls {
          font-size: 0.5rem; color: rgba(200,170,100,0.4);
          text-transform: capitalize; text-align: center;
        }

        /* Unit detail panel */
        .detail-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(3px);
          display: flex; justify-content: flex-end;
        }
        .detail-panel {
          width: 340px; max-width: 100vw;
          height: 100vh;
          background: #0b0818;
          border-left: 1px solid rgba(240,192,64,0.2);
          display: flex; flex-direction: column;
          overflow: hidden;
          box-shadow: -8px 0 40px rgba(0,0,0,0.7);
          animation: slideIn 0.2s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .detail-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.2rem 1.2rem 0.9rem;
          border-bottom: 1px solid rgba(240,192,64,0.1);
          flex-shrink: 0;
        }
        .detail-name {
          font-family: 'Cinzel', serif; font-size: 1.1rem; font-weight: 700; color: #f0c040;
        }
        .detail-cls {
          font-family: 'Cinzel', serif; font-size: 0.65rem;
          color: rgba(200,170,100,0.5); letter-spacing: 0.18em; text-transform: uppercase;
          margin-top: 0.15rem;
        }
        .detail-tabs {
          display: flex; flex-shrink: 0;
          border-bottom: 1px solid rgba(240,192,64,0.1);
        }
        .detail-tab {
          flex: 1; font-family: 'Cinzel', serif; font-size: 0.68rem; letter-spacing: 0.12em;
          text-transform: uppercase; color: rgba(200,170,100,0.5);
          background: transparent; border: none; padding: 0.6rem 0; cursor: pointer;
          border-bottom: 2px solid transparent; transition: all 0.15s;
        }
        .detail-tab:hover { color: rgba(240,192,64,0.8); }
        .detail-tab.active { color: #f0c040; border-bottom-color: #f0c040; }
        .detail-visual { flex-shrink: 0; overflow: hidden; }
        .detail-body {
          flex: 1; overflow-y: auto; padding: 1rem 1.2rem;
          scrollbar-width: thin; scrollbar-color: rgba(240,192,64,0.15) transparent;
        }
        .detail-section-label {
          font-family: 'Cinzel', serif; font-size: 0.65rem; letter-spacing: 0.22em;
          text-transform: uppercase; color: rgba(200,170,100,0.5);
          margin-bottom: 0.6rem; margin-top: 0.2rem;
          padding-bottom: 0.3rem; border-bottom: 1px solid rgba(240,192,64,0.08);
        }
        .skill-card {
          background: rgba(15,11,30,0.9);
          border: 1px solid rgba(240,192,64,0.12);
          border-radius: 6px; padding: 0.6rem 0.7rem;
        }
        .skill-name {
          font-family: 'Cinzel', serif; font-size: 0.75rem; font-weight: 600; color: #f0c040;
        }
        .skill-ap {
          font-family: 'Cinzel', serif; font-size: 0.65rem; font-weight: 700;
          color: #c084fc; background: rgba(192,132,252,0.12);
          border-radius: 4px; padding: 1px 6px;
        }
        .skill-type-row {
          display: flex; gap: 0.35rem; margin-top: 0.3rem; flex-wrap: wrap;
        }
        .skill-badge {
          font-size: 0.55rem; letter-spacing: 0.08em; text-transform: uppercase;
          border-radius: 3px; padding: 1px 5px; font-weight: 600;
        }
        .skill-badge--physical { background: rgba(251,146,60,0.18); color: #fb923c; }
        .skill-badge--magical  { background: rgba(192,132,252,0.18); color: #c084fc; }
        .skill-badge--healing  { background: rgba(134,239,172,0.18); color: #86efac; }
        .skill-badge--buff     { background: rgba(96,165,250,0.18);  color: #60a5fa; }
        .skill-badge--special  { background: rgba(240,192,64,0.18);  color: #f0c040; }
        .skill-power { font-size: 0.6rem; color: rgba(200,170,100,0.55); }
        .skill-acc   { font-size: 0.6rem; color: rgba(200,170,100,0.45); }
        .skill-effect {
          font-size: 0.62rem; color: rgba(200,170,100,0.5); margin-top: 0.3rem;
          font-style: italic; line-height: 1.4;
        }
      `}</style>

      <div className="hub-bg" />

      <header className="hub-header">
        <button className="back-btn" onClick={() => navigate("/lobby")}>
          ← Lobby
        </button>
        <div className="hub-title-wrap">
          <h1 className="hub-title">Gathering Hub</h1>
          <p className="hub-subtitle">Saved Parties</p>
        </div>
        <button className="btn-gold" onClick={openNew}>
          + New Party
        </button>
      </header>

      <main className="hub-body">
        <div className="hub-section-bar">
          <span className="section-label">
            {parties.length === 0
              ? "No parties yet"
              : `${parties.length} ${parties.length === 1 ? "Party" : "Parties"}`}
          </span>
        </div>

        <div className="parties-grid">
          {parties.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">⚔</div>
              <div className="empty-text">No parties saved</div>
              <div className="empty-hint">Create a party to save your favourite team compositions.</div>
              <button className="btn-gold" style={{ marginTop: "0.5rem" }} onClick={openNew}>
                + New Party
              </button>
            </div>
          )}
          {parties.map((party) => (
            <PartyCard
              key={party.id}
              party={party}
              onEdit={() => openEdit(party)}
              onDelete={() => handleDelete(party.id)}
            />
          ))}
        </div>

        <div className="roster-section">
          <div className="hub-section-bar">
            <span className="section-label">Unit Roster — click any unit to inspect</span>
          </div>
          <div className="roster-grid">
            {ALL_UNITS.map((u) => (
              <div
                key={u.id}
                className={`roster-card${u.id === "wanderer" ? " has-anim" : ""}`}
                onClick={() => setSelectedUnit(u)}
              >
                <UnitSprite unit={u} size={36} />
                <div className="roster-card-name">{u.name}</div>
                <div className="roster-card-cls">{u.cls.replace(/-/g, " ")}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {modalOpen && (
        <PartyModal
          initial={editParty}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditParty(undefined); }}
        />
      )}

      {selectedUnit && (
        <UnitDetailPanel
          unit={selectedUnit}
          onClose={() => setSelectedUnit(null)}
        />
      )}
    </div>
  );
}
