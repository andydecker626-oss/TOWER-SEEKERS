import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/context/SocketContext";

export default function Lobby() {
  const { state, connected, hasStoredSession, createRoom, createAiRoom, joinRoom, reset } = useSocket();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  function copyCode() {
    if (!state.roomCode) return;
    navigator.clipboard.writeText(state.roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const isWaiting = state.phase === "waiting";
  const isReconnecting = hasStoredSession && state.phase === "lobby" && !state.errorMsg;

  return (
    <div className="lobby-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700&display=swap');

        .lobby-root {
          min-height: 100vh;
          background: #07040f;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        /* ── Background image layer ── */
        .lobby-bg-img {
          position: fixed;
          inset: 0;
          background-image: url('/assets/lobby-bg.png');
          background-size: cover;
          background-position: center 40%;
          opacity: 0.75;
          pointer-events: none;
          z-index: 0;
        }

        /* ── Atmosphere layers stacked over bg image ── */
        .lobby-atmosphere {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 70% at 50% 50%, rgba(40,30,60,0.45) 0%, transparent 70%),
            radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.65) 100%);
          pointer-events: none;
          z-index: 1;
        }

        /* ── Film grain overlay ── */
        .lobby-grain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 2;
          opacity: 0.10;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23grain)' opacity='1'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 200px 200px;
        }

        /* ── Drifting motes ── */
        @keyframes mote-float {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(-120px) translateX(8px); opacity: 0; }
        }
        .lobby-motes {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 3;
        }
        .mote {
          position: absolute;
          width: 1.5px;
          height: 1.5px;
          border-radius: 50%;
          background: rgba(245,243,238,0.55);
          animation: mote-float linear infinite;
        }
        .mote:nth-child(1)  { left: 12%; top: 72%; animation-duration: 9s;  animation-delay: 0s; }
        .mote:nth-child(2)  { left: 24%; top: 80%; animation-duration: 11s; animation-delay: 1.2s; }
        .mote:nth-child(3)  { left: 37%; top: 65%; animation-duration: 8s;  animation-delay: 2.5s; }
        .mote:nth-child(4)  { left: 50%; top: 78%; animation-duration: 13s; animation-delay: 0.7s; }
        .mote:nth-child(5)  { left: 62%; top: 70%; animation-duration: 10s; animation-delay: 3.1s; }
        .mote:nth-child(6)  { left: 74%; top: 75%; animation-duration: 12s; animation-delay: 1.8s; }
        .mote:nth-child(7)  { left: 85%; top: 68%; animation-duration: 9s;  animation-delay: 4.0s; }
        .mote:nth-child(8)  { left: 18%; top: 60%; animation-duration: 14s; animation-delay: 0.4s; }
        .mote:nth-child(9)  { left: 43%; top: 85%; animation-duration: 11s; animation-delay: 5.5s; }
        .mote:nth-child(10) { left: 57%; top: 62%; animation-duration: 8s;  animation-delay: 2.2s; }
        .mote:nth-child(11) { left: 30%; top: 88%; animation-duration: 15s; animation-delay: 6.3s; }
        .mote:nth-child(12) { left: 68%; top: 82%; animation-duration: 10s; animation-delay: 3.8s; }

        /* ── Content ── */
        .lobby-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding: 2rem;
          max-width: 520px;
          width: 100%;
        }

        .lobby-logo {
          text-align: center;
        }

        .lobby-title {
          font-family: 'Cinzel Decorative', serif;
          font-size: 3.2rem;
          font-weight: 700;
          background: linear-gradient(180deg, #ffffff 0%, #dde2ec 50%, #aab2c2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: none;
          filter: drop-shadow(0 0 24px rgba(221,226,236,0.25)) drop-shadow(2px 2px 0 rgba(0,0,0,0.8));
          letter-spacing: 0.05em;
          line-height: 1.1;
          margin: 0;
        }

        .lobby-subtitle {
          font-family: 'Cinzel', serif;
          font-size: 0.95rem;
          color: rgba(170,178,194,0.6);
          letter-spacing: 0.3em;
          text-transform: uppercase;
          margin-top: 0.4rem;
        }

        .lobby-divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(221,226,236,0.2), transparent);
        }

        .lobby-card {
          background: linear-gradient(180deg, rgba(20,15,35,0.85), rgba(7,4,15,0.95));
          border: 1px solid rgba(221,226,236,0.12);
          border-radius: 6px;
          padding: 2rem;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04);
        }

        .lobby-card-title {
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          color: rgba(170,178,194,0.6);
          letter-spacing: 0.25em;
          text-transform: uppercase;
          text-align: center;
        }

        /* ── Buttons ── */
        .btn-primary {
          font-family: 'Cinzel', serif;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: #0d0918;
          color: #f5f3ee;
          border: 1px solid rgba(221,226,236,0.4);
          border-radius: 6px;
          padding: 0.85rem 2rem;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }
        .btn-primary:hover:not(:disabled) {
          border-color: #dde2ec;
          box-shadow: inset 0 0 12px rgba(221,226,236,0.08);
          transform: translateY(-1px);
        }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-secondary {
          font-family: 'Cinzel', serif;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: #0d0918;
          color: rgba(245,243,238,0.7);
          border: 1px solid rgba(221,226,236,0.3);
          border-radius: 6px;
          padding: 0.85rem 2rem;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }
        .btn-secondary:hover:not(:disabled) {
          border-color: rgba(221,226,236,0.55);
          box-shadow: inset 0 0 10px rgba(221,226,236,0.06);
        }
        .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-ai {
          font-family: 'Cinzel', serif;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: #0d0918;
          color: #c8d4e6;
          border: 1px solid rgba(200,212,230,0.5);
          border-radius: 6px;
          padding: 0.85rem 2rem;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }
        .btn-ai:hover:not(:disabled) {
          border-color: rgba(200,212,230,0.8);
          box-shadow: inset 0 0 12px rgba(200,212,230,0.08);
          transform: translateY(-1px);
        }
        .btn-ai:active:not(:disabled) { transform: translateY(0); }
        .btn-ai:disabled { opacity: 0.5; cursor: not-allowed; }

        .join-row {
          display: flex;
          gap: 0.75rem;
          width: 100%;
        }

        .join-input {
          font-family: 'Cinzel', serif;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          background: rgba(7,4,15,0.8);
          border: 1px solid rgba(221,226,236,0.25);
          border-radius: 6px;
          padding: 0.85rem 1rem;
          color: #f5f3ee;
          flex: 1;
          outline: none;
          transition: border-color 0.2s;
          text-align: center;
        }
        .join-input::placeholder { color: rgba(170,178,194,0.4); letter-spacing: 0.2em; }
        .join-input:focus { border-color: #c8d4e6; }

        .join-btn {
          font-family: 'Cinzel', serif;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          background: #0d0918;
          color: #f5f3ee;
          border: 1px solid rgba(221,226,236,0.35);
          border-radius: 6px;
          padding: 0.85rem 1.2rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .join-btn:hover:not(:disabled) {
          border-color: rgba(221,226,236,0.65);
          box-shadow: inset 0 0 10px rgba(221,226,236,0.07);
        }
        .join-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 6px;
          background: #c8d4e6;
          box-shadow: 0 0 6px rgba(200,212,230,0.4);
        }
        .status-dot.disconnected { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
        .status-text {
          font-size: 0.75rem;
          color: rgba(170,178,194,0.6);
          text-align: center;
        }

        .waiting-box {
          text-align: center;
          padding: 1rem;
        }
        .waiting-code {
          font-family: 'Cinzel', serif;
          font-size: 2.2rem;
          font-weight: 700;
          letter-spacing: 0.35em;
          background: linear-gradient(180deg, #ffffff 0%, #dde2ec 50%, #aab2c2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 16px rgba(221,226,236,0.3));
          margin: 0.5rem 0;
        }
        .waiting-label {
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          color: rgba(170,178,194,0.6);
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }
        .waiting-hint {
          font-size: 0.85rem;
          color: rgba(170,178,194,0.5);
          margin-top: 0.5rem;
          font-style: italic;
        }
        .copy-btn {
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          background: #0d0918;
          color: rgba(221,226,236,0.75);
          border: 1px solid rgba(221,226,236,0.3);
          border-radius: 6px;
          padding: 0.35rem 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 0.3rem;
        }
        .copy-btn:hover { border-color: rgba(221,226,236,0.6); color: #dde2ec; }
        .copy-btn.copied { color: #86efac; border-color: rgba(134,239,172,0.5); background: rgba(134,239,172,0.08); }

        .reconnecting-box {
          text-align: center;
          padding: 1.5rem 1rem;
        }
        .reconnecting-title {
          font-family: 'Cinzel', serif;
          font-size: 1rem;
          font-weight: 600;
          color: #dde2ec;
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
        }
        .reconnecting-hint {
          font-size: 0.82rem;
          color: rgba(170,178,194,0.55);
          font-style: italic;
        }

        .pulse-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #c8d4e6;
          margin: 0.5rem auto;
          animation: pulse 1.4s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        .error-msg {
          background: rgba(200,40,40,0.15);
          border: 1px solid rgba(200,40,40,0.4);
          border-radius: 6px;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: #fca5a5;
          text-align: center;
        }

        .hub-link-btn {
          font-family: 'Cinzel', serif;
          font-size: 0.78rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          background: #0d0918;
          color: rgba(170,178,194,0.6);
          border: 1px solid rgba(221,226,236,0.18);
          border-radius: 6px;
          padding: 0.55rem 1.2rem;
          cursor: pointer;
          transition: all 0.18s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          width: 100%;
        }
        .hub-link-btn:hover {
          color: #dde2ec;
          border-color: rgba(221,226,236,0.4);
          box-shadow: inset 0 0 10px rgba(221,226,236,0.05);
        }

        .war-room-btn {
          font-family: 'Cinzel Decorative', serif;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          background: rgba(14,8,32,0.96);
          color: #f5f3ee;
          border: 1.5px solid rgba(221,226,236,0.45);
          border-radius: 6px;
          padding: 0.68rem 1.4rem;
          cursor: pointer;
          transition: all 0.18s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          white-space: nowrap;
        }
        .war-room-btn:hover {
          color: #ffffff;
          border-color: rgba(221,226,236,0.85);
          box-shadow: 0 4px 22px rgba(221,226,236,0.18);
        }
      `}</style>

      <div className="lobby-bg-img" />
      <div className="lobby-atmosphere" />
      <div className="lobby-grain" />
      <div className="lobby-motes">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="mote" />
        ))}
      </div>

      <div className="lobby-content">
        <div style={{ width: "100%", display: "flex", justifyContent: "flex-start" }}>
          <button className="war-room-btn" onClick={() => navigate("/warroom")}>
            ← Back to Home
          </button>
        </div>

        <div className="lobby-logo">
          <h1 className="lobby-title">Tower Seekers</h1>
          <p className="lobby-subtitle">Choose Your Battlefield</p>
        </div>

        <div className="lobby-divider" />

        {state.errorMsg && (
          <div className="error-msg">{state.errorMsg}</div>
        )}

        {isReconnecting ? (
          <div className="lobby-card">
            <div className="reconnecting-box">
              <div className="reconnecting-title">Rejoining Your Game</div>
              <div className="pulse-dot" />
              <div className="reconnecting-hint">Reconnecting to your previous match…</div>
            </div>
            <button className="btn-secondary" onClick={reset}>
              Cancel &amp; Return to Lobby
            </button>
          </div>
        ) : isWaiting ? (
          <div className="lobby-card">
            <div className="waiting-box">
              <div className="waiting-label">Waiting for opponent</div>
              <div className="waiting-code">{state.roomCode}</div>
              <div className="waiting-label">Room Code</div>
              <button className={`copy-btn${copied ? " copied" : ""}`} onClick={copyCode}>
                {copied ? "Copied!" : "Copy Code"}
              </button>
              <div className="pulse-dot" />
              <div className="waiting-hint">Share this code with a friend to join</div>
            </div>
            <button className="btn-secondary" onClick={reset}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="lobby-card">
            <div className="lobby-card-title">Begin Your Quest</div>

            <button
              className="btn-primary"
              onClick={createRoom}
              disabled={!connected}
            >
              Create Room
            </button>

            <button
              className="btn-ai"
              onClick={createAiRoom}
              disabled={!connected}
            >
              ⚔ Battle vs AI
            </button>

            <div className="lobby-divider" />

            <div className="lobby-card-title">Or join a room</div>

            <div className="join-row">
              <input
                className="join-input"
                placeholder="XXXXXX"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && joinCode.length === 6) {
                    joinRoom(joinCode);
                  }
                }}
              />
              <button
                className="join-btn"
                onClick={() => joinRoom(joinCode)}
                disabled={!connected || joinCode.length !== 6}
              >
                Join
              </button>
            </div>
          </div>
        )}

        <button className="hub-link-btn" onClick={() => navigate("/hub")}>
          ⚔ Gathering Hub — Manage Parties
        </button>

        <div className="status-text">
          <span className={`status-dot${connected ? "" : " disconnected"}`} />
          {connected ? "Connected to server" : "Connecting…"}
        </div>
      </div>
    </div>
  );
}
