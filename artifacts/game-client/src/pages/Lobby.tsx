import { useState } from "react";
import { useSocket } from "@/context/SocketContext";

export default function Lobby() {
  const { state, connected, createRoom, joinRoom, reset } = useSocket();
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

  return (
    <div className="lobby-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700&display=swap');

        .lobby-root {
          min-height: 100vh;
          background: #08060f;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .lobby-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(80,40,160,0.25) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 80%, rgba(40,20,80,0.3) 0%, transparent 60%),
            radial-gradient(ellipse 50% 30% at 80% 70%, rgba(20,40,100,0.2) 0%, transparent 50%);
          pointer-events: none;
        }

        .lobby-stars {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 30% 50%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 60% 10%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 80% 30%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 50% 70%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 90% 60%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 15% 85%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 70% 90%, rgba(255,255,255,0.4) 0%, transparent 100%);
          pointer-events: none;
        }

        .lobby-content {
          position: relative;
          z-index: 1;
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
          color: #f0c040;
          text-shadow:
            0 0 20px rgba(240,192,64,0.6),
            0 0 40px rgba(200,140,0,0.4),
            2px 2px 0 rgba(0,0,0,0.8);
          letter-spacing: 0.05em;
          line-height: 1.1;
          margin: 0;
        }

        .lobby-subtitle {
          font-family: 'Cinzel', serif;
          font-size: 0.95rem;
          color: rgba(200,170,100,0.7);
          letter-spacing: 0.3em;
          text-transform: uppercase;
          margin-top: 0.4rem;
        }

        .lobby-divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(240,192,64,0.4), transparent);
        }

        .lobby-card {
          background: rgba(15,10,30,0.8);
          border: 1px solid rgba(240,192,64,0.2);
          border-radius: 12px;
          padding: 2rem;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .lobby-card-title {
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          color: rgba(200,170,100,0.6);
          letter-spacing: 0.25em;
          text-transform: uppercase;
          text-align: center;
        }

        .btn-primary {
          font-family: 'Cinzel', serif;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          background: linear-gradient(135deg, #c89000, #f0c040, #c89000);
          color: #0a0810;
          border: none;
          border-radius: 8px;
          padding: 0.85rem 2rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(240,192,64,0.3), 0 2px 4px rgba(0,0,0,0.4);
          width: 100%;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(240,192,64,0.45), 0 2px 4px rgba(0,0,0,0.4);
        }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled {
          opacity: 0.5; cursor: not-allowed;
        }

        .btn-secondary {
          font-family: 'Cinzel', serif;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          background: transparent;
          color: #f0c040;
          border: 1px solid rgba(240,192,64,0.4);
          border-radius: 8px;
          padding: 0.85rem 2rem;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }
        .btn-secondary:hover:not(:disabled) {
          background: rgba(240,192,64,0.1);
          border-color: rgba(240,192,64,0.6);
        }
        .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

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
          background: rgba(10,8,20,0.8);
          border: 1px solid rgba(240,192,64,0.3);
          border-radius: 8px;
          padding: 0.85rem 1rem;
          color: #f0c040;
          flex: 1;
          outline: none;
          transition: border-color 0.2s;
          text-align: center;
        }
        .join-input::placeholder { color: rgba(240,192,64,0.3); letter-spacing: 0.2em; }
        .join-input:focus { border-color: rgba(240,192,64,0.7); }

        .join-btn {
          font-family: 'Cinzel', serif;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          background: rgba(30,20,60,0.9);
          color: #f0c040;
          border: 1px solid rgba(240,192,64,0.4);
          border-radius: 8px;
          padding: 0.85rem 1.2rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .join-btn:hover:not(:disabled) {
          background: rgba(240,192,64,0.15);
          border-color: rgba(240,192,64,0.6);
        }
        .join-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 6px;
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e;
        }
        .status-dot.disconnected { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
        .status-text {
          font-size: 0.75rem;
          color: rgba(200,170,100,0.6);
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
          color: #f0c040;
          text-shadow: 0 0 20px rgba(240,192,64,0.5);
          margin: 0.5rem 0;
        }
        .waiting-label {
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          color: rgba(200,170,100,0.6);
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }
        .waiting-hint {
          font-size: 0.85rem;
          color: rgba(200,170,100,0.5);
          margin-top: 0.5rem;
          font-style: italic;
        }
        .copy-btn {
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          background: rgba(240,192,64,0.1);
          color: rgba(240,192,64,0.8);
          border: 1px solid rgba(240,192,64,0.3);
          border-radius: 6px;
          padding: 0.35rem 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 0.3rem;
        }
        .copy-btn:hover { background: rgba(240,192,64,0.2); border-color: rgba(240,192,64,0.6); color: #f0c040; }
        .copy-btn.copied { color: #86efac; border-color: rgba(134,239,172,0.5); background: rgba(134,239,172,0.08); }

        .pulse-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #f0c040;
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
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: #fca5a5;
          text-align: center;
        }
      `}</style>

      <div className="lobby-bg" />
      <div className="lobby-stars" />

      <div className="lobby-content">
        <div className="lobby-logo">
          <h1 className="lobby-title">Tower Seekers</h1>
          <p className="lobby-subtitle">Turn-Based PvP Battler</p>
        </div>

        <div className="lobby-divider" />

        {state.errorMsg && (
          <div className="error-msg">{state.errorMsg}</div>
        )}

        {isWaiting ? (
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

        <div className="status-text">
          <span className={`status-dot${connected ? "" : " disconnected"}`} />
          {connected ? "Connected to server" : "Connecting…"}
        </div>
      </div>
    </div>
  );
}
