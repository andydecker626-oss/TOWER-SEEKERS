import { VariantAPhone, VARIANT_A_CSS } from "./VariantA";
import { VariantBPhone, VARIANT_B_CSS } from "./VariantB";
import { VariantCPhone, VARIANT_C_CSS } from "./VariantC";

const VARIANTS = [
  {
    badge: "Variant A",
    name: "The Clash Hub",
    desc: "Direct Clash Royale adaptation — bottom nav, chest row, central BATTLE button, mode chips, seasonal ribbon",
    Phone: VariantAPhone,
  },
  {
    badge: "Variant B",
    name: "The War Room",
    desc: "RPG lobby split — left identity panel with portrait & stats, right stacked mode cards on darkened world art",
    Phone: VariantBPhone,
  },
  {
    badge: "Variant C",
    name: "The Town Square",
    desc: "Immersive overlay — full-bleed city art behind a floating HUD strip, parchment party card, and arc icon buttons",
    Phone: VariantCPhone,
  },
];

const COMPARISON_ROWS = [
  ["Navigation",       "5-tab bottom nav",                       "4 compact bottom icons",              "4 floating arc buttons"],
  ["World visibility", "City art behind UI",                     "City blurred to 30%",                 "Full-bleed city art"],
  ["Player identity",  "Top bar (name, resources)",              "Left panel (portrait, rank, stats)",   "Floating HUD pill"],
  ["Play modes",       "2 chip toggles + BATTLE btn",            "3 stacked mode cards",                "FIND MATCH + 2 pill toggles"],
  ["Feel",             "Mobile-game familiar",                   "Desktop RPG lobby",                   "Cinematic / immersive"],
  ["Party preview",    "None on main view",                      "3 silhouette icons in side panel",    "3 unit icons in center card"],
  ["Season / events",  "Top ribbon",                             "Bottom season card",                  "Not shown (can be added)"],
];

export default function MainMenuComparison() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#04020c",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px 24px 60px",
    }}>
      <style>{CMP_CSS}</style>
      {/* Inject variant styles once */}
      <style>{VARIANT_A_CSS}</style>
      <style>{VARIANT_B_CSS}</style>
      <style>{VARIANT_C_CSS}</style>

      <div className="cmp-header">
        <h1 className="cmp-title">TOWER SEEKERS</h1>
        <p className="cmp-subtitle">Main Menu Redesign · 3 Variants</p>
        <div className="cmp-rule" />
      </div>

      <div className="cmp-row">
        {VARIANTS.map(({ badge, name, desc, Phone }) => (
          <div key={badge} className="cmp-col">
            <div className="cmp-label-block">
              <div className="cmp-variant-badge">{badge}</div>
              <div className="cmp-variant-name">{name}</div>
              <div className="cmp-variant-desc">{desc}</div>
            </div>
            <Phone />
          </div>
        ))}
      </div>

      <div className="cmp-table-wrap">
        <table className="cmp-table">
          <thead>
            <tr>
              {["Feature", "A · Clash Hub", "B · War Room", "C · Town Square"].map(h => (
                <th key={h} className="cmp-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map(([feature, ...cells]) => (
              <tr key={feature} className="cmp-tr">
                <td className="cmp-td feature">{feature}</td>
                {cells.map((cell, i) => (
                  <td key={i} className="cmp-td">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const CMP_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700;900&display=swap');

  .cmp-header {
    text-align: center;
    margin-bottom: 36px;
  }

  .cmp-title {
    font-family: 'Cinzel Decorative', serif;
    font-size: 28px;
    font-weight: 900;
    color: #f0e0a0;
    letter-spacing: 0.12em;
    margin: 0 0 6px;
    text-shadow: 0 0 40px rgba(240,192,64,0.3);
  }

  .cmp-subtitle {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    letter-spacing: 0.28em;
    color: rgba(240,192,64,0.45);
    text-transform: uppercase;
    margin: 0 0 16px;
  }

  .cmp-rule {
    width: 200px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(240,192,64,0.35), transparent);
    margin: 0 auto;
  }

  .cmp-row {
    display: flex;
    gap: 32px;
    align-items: flex-start;
    flex-wrap: wrap;
    justify-content: center;
  }

  .cmp-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .cmp-label-block {
    text-align: center;
    max-width: 390px;
  }

  .cmp-variant-badge {
    display: inline-block;
    font-family: 'Cinzel', serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(240,192,64,0.6);
    background: rgba(240,192,64,0.08);
    border: 1px solid rgba(240,192,64,0.2);
    border-radius: 20px;
    padding: 3px 12px;
    margin-bottom: 6px;
  }

  .cmp-variant-name {
    font-family: 'Cinzel Decorative', serif;
    font-size: 16px;
    font-weight: 700;
    color: #f0e0b0;
    letter-spacing: 0.06em;
    margin-bottom: 6px;
  }

  .cmp-variant-desc {
    font-family: 'Cinzel', serif;
    font-size: 9px;
    color: rgba(180,155,110,0.6);
    letter-spacing: 0.04em;
    line-height: 1.7;
  }

  .cmp-table-wrap {
    margin-top: 52px;
    width: 100%;
    max-width: 1300px;
    overflow-x: auto;
    padding: 0 16px;
  }

  .cmp-table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'Cinzel', serif;
  }

  .cmp-th {
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(240,192,64,0.55);
    padding: 10px 16px;
    border-bottom: 1px solid rgba(240,192,64,0.15);
    text-align: left;
    background: rgba(10,6,22,0.7);
  }
  .cmp-th:first-child { border-radius: 8px 0 0 0; }
  .cmp-th:last-child { border-radius: 0 8px 0 0; }

  .cmp-tr:nth-child(even) { background: rgba(255,255,255,0.015); }

  .cmp-td {
    font-size: 10px;
    color: rgba(200,175,130,0.7);
    padding: 10px 16px;
    border-bottom: 1px solid rgba(240,192,64,0.06);
    letter-spacing: 0.03em;
    vertical-align: top;
  }
  .cmp-td.feature {
    font-weight: 600;
    color: rgba(240,220,160,0.65);
    letter-spacing: 0.1em;
    font-size: 9px;
    text-transform: uppercase;
    width: 130px;
  }
`;
