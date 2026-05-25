const INTRO_DONE_KEY = "ts_intro_done";

export function shouldShowIntro(): boolean {
  return sessionStorage.getItem(INTRO_DONE_KEY) === null;
}

export function markIntroDone(): void {
  sessionStorage.setItem(INTRO_DONE_KEY, "1");
}
