import { CONFIG } from "./config.js";
import { createRunner } from "./runner.js";
const api = globalThis.browser ?? globalThis.chrome;
const runner = createRunner(api, CONFIG);
api.runtime.onMessage.addListener((message, sender, respond) => {
  const popup =
    sender.id === api.runtime.id &&
    sender.url === api.runtime.getURL("popup.html");
  const content =
    sender.id === api.runtime.id &&
    sender.tab &&
    sender.frameId === 0 &&
    /^https:\/\/(x\.com|twitter\.com)\//.test(sender.url || "");
  if (
    !(
      popup &&
      ["state", "refresh", "start", "cancel", "inspect"].includes(message?.type)
    ) &&
    !(
      content &&
      ["ready", "navigateFailed", "sessionResult", "blockResult"].includes(
        message?.type,
      )
    )
  )
    return;
  runner.dispatch(message, sender).then(
    (data) => respond({ ok: true, data }),
    (error) => respond({ ok: false, error: error.message }),
  );
  return true;
});
api.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "block-next") runner.tick().catch(() => {});
});
api.tabs.onUpdated.addListener((id, change) => {
  if (change.status === "complete") runner.tick().catch(() => {});
});
api.runtime.onStartup.addListener(() => runner.startup().catch(() => {}));
api.runtime.onInstalled.addListener(() => runner.startup().catch(() => {}));
