export const HAS_SEEN_ONBOARDING = "hasSeenOnboarding";

export function markOnboardingSeen() {
  try {
    localStorage.setItem(HAS_SEEN_ONBOARDING, "true");
  } catch {
    // storage indisponível (modo privado) — segue o fluxo normalmente
  }
}

export function hasSeenOnboarding() {
  try {
    return localStorage.getItem(HAS_SEEN_ONBOARDING) === "true";
  } catch {
    return false;
  }
}
