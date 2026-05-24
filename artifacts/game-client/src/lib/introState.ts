const INTRO_KEY = "ts_intro_seen";

export function shouldShowIntro(): boolean {
  return !sessionStorage.getItem(INTRO_KEY);
}

export function markIntroSeen(): void {
  sessionStorage.setItem(INTRO_KEY, "1");
}
