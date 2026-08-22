import { getSessionState, setSessionState } from "../storage/chrome-storage";
import { ExtensionMessage } from "../types";

// Alarm name for keep-alive and periodic session maintenance
const ALARM_HEARTBEAT = "copilot_sw_heartbeat";

// Setup alarm listener on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_HEARTBEAT, { periodInMinutes: 1 });
});

// Periodic alarm handler for service worker wakeups and session cleanup
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_HEARTBEAT) {
    // Rehydrate session state on periodic wakeup
    await getSessionState();
  }
});

// Open side panel on action button click
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Track active tab URL and domain in session storage
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      const urlObj = new URL(tab.url);
      await setSessionState({
        currentUrl: tab.url,
        currentDomain: urlObj.hostname,
      });
    }
  } catch (err) {
    console.warn("Could not inspect active tab", err);
  }
});

// Background message dispatcher & multi-frame script runner
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === "GET_SESSION_STATE") {
    getSessionState().then((state) => sendResponse(state));
    return true;
  }

  if (message.type === "SET_SESSION_STATE") {
    setSessionState(message.payload as Record<string, unknown>).then((state) =>
      sendResponse(state)
    );
    return true;
  }

  if (message.type === "SCAN_FORM") {
    // Coordinate multi-frame scan across top + same-origin frames via scripting API
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          // Send message directly to all active content frames
          chrome.tabs.sendMessage(tab.id, message, (response) => {
            sendResponse(response);
          });
        }
      } catch (err) {
        sendResponse({ error: "Failed to dispatch scan to frames" });
      }
    })();
    return true;
  }
});
