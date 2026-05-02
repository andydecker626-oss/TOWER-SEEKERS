import { useState, useEffect } from "react";
import { audioManager } from "@/lib/audio";

const INTRO_SESSION_KEY = "ts_intro_played";

type Phase = "altamentum" | "copyright" | "done";

interface IntroSequenceProps {
  onComplete: () => void;
}

export default function IntroSequence({ onComplete }: IntroSequenceProps) {
  const [phase, setPhase] = useState<Phase>("altamentum");
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Try to start music immediately; browser autoplay policy may defer it
    audioManager.play("skyforge");
    const onInteract = () => audioManager.play("skyforge");
    document.addEventListener("click", onInteract, { once: true });
    document.addEventListener("keydown", onInteract as EventListener, { once: true });
    return () => {
      document.removeEventListener("click", onInteract);
      document.removeEventListener("keydown", onInteract as EventListener);
      // Do NOT stop — music persists to title screen
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    async function runSequence() {
      // Altamentum logo: fade in 1s, hold 2.5s, fade out 1s
      setPhase("altamentum");
      setOpacity(0);
      await delay(50);
      if (!mounted) return;
      setOpacity(1); // fade in (1s via CSS transition)
      await delay(1000 + 2500);
      if (!mounted) return;
      setOpacity(0); // fade out (1s via CSS transition)
      await delay(1000 + 300);
      if (!mounted) return;

      // Copyright screen: fade in, hold 2.5s, fade out
      setPhase("copyright");
      setOpacity(0);
      await delay(50);
      if (!mounted) return;
      setOpacity(1);
      await delay(1000 + 2500);
      if (!mounted) return;
      setOpacity(0);
      await delay(1000 + 200);
      if (!mounted) return;

      sessionStorage.setItem(INTRO_SESSION_KEY, "1");
      setPhase("done");
      onComplete();
    }

    runSequence();

    return () => {
      mounted = false;
    };
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "#000",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      opacity,
      transition: "opacity 1s ease",
    }}>
      {phase === "altamentum" && (
        <div style={{ textAlign: "center" }}>
          <img
            src="/assets/altaris-logo.png"
            alt="Altaris"
            style={{
              maxWidth: "320px",
              maxHeight: "200px",
              objectFit: "contain",
            }}
          />
        </div>
      )}

      {phase === "copyright" && (
        <p style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "clamp(11px, 1.4vw, 14px)",
          color: "rgba(255,255,255,0.7)",
          letterSpacing: "0.06em",
          textAlign: "center",
          margin: 0,
        }}>
          © 2026 Seekers Franchise
        </p>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@900&display=swap');
      `}</style>
    </div>
  );
}

export function shouldShowIntro(): boolean {
  return !sessionStorage.getItem(INTRO_SESSION_KEY);
}
