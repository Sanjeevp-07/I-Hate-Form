import { StoredSessionData } from "../types";

const DEFAULT_SESSION: StoredSessionData = {
  token: null,
  refreshToken: null,
  sessionId: null,
  currentUrl: null,
  currentDomain: null,
  detectedFields: [],
  currentMappings: [],
};

const SESSION_KEY = "copilot_session_state";

export async function getSessionState(): Promise<StoredSessionData> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.session) {
      const data = await chrome.storage.session.get(SESSION_KEY);
      return data[SESSION_KEY] || DEFAULT_SESSION;
    }
  } catch (err) {
    console.warn("Could not read chrome.storage.session, fallback to default", err);
  }
  return DEFAULT_SESSION;
}

export async function setSessionState(partial: Partial<StoredSessionData>): Promise<StoredSessionData> {
  const current = await getSessionState();
  const updated: StoredSessionData = { ...current, ...partial };

  try {
    if (typeof chrome !== "undefined" && chrome.storage?.session) {
      await chrome.storage.session.set({ [SESSION_KEY]: updated });
    }
  } catch (err) {
    console.warn("Could not write chrome.storage.session", err);
  }

  return updated;
}

export async function clearSessionState(): Promise<void> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.session) {
      await chrome.storage.session.remove(SESSION_KEY);
    }
  } catch (err) {
    console.warn("Could not clear chrome.storage.session", err);
  }
}
