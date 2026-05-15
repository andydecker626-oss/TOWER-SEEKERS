const INTRO_KEY = "ts_intro_v2";

export function shouldShowIntro(): boolean {
  return !localStorage.getItem(INTRO_KEY);
}

export function markIntroSeen(): void {
  localStorage.setItem(INTRO_KEY, "1");
}
