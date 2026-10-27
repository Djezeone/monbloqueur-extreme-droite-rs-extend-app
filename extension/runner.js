import { readListResponse } from "./core.js";
const ALARM = "block-next",
  NEXT_DELAY = 250;
export function createRunner(
  chrome,
  config,
  fetcher = globalThis.fetch,
  defer = setTimeout,
) {
  let serial = Promise.resolve(),
    wakeTimer;
  const locked = (fn) => {
    const next = serial.then(fn);
    serial = next.catch(() => {});
    return next;
  };
  const read = async () => (await chrome.storage.local.get("job")).job;
  const save = (job) => chrome.storage.local.set({ job });
  const schedule = async (when) => {
    await chrome.alarms.create(ALARM, { when });
    // Les alarmes servent de secours si Chrome arrête le service worker.
    clearTimeout(wakeTimer);
    wakeTimer = defer(
      () => locked(drive).catch(() => {}),
      Math.max(100, when - Date.now()),
    );
  };
  async function list() {
    const response = await fetcher(config.listUrl, {
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    const list = await readListResponse(response);
    if (!list.accounts.length)
      throw new Error("La liste est vide pour le moment.");
    await chrome.storage.local.set({ list, checkedAt: Date.now() });
    return list;
  }
  async function pause(job, message) {
    job.status = "paused";
    job.message = message;
    clearTimeout(wakeTimer);
    await save(job);
    await chrome.alarms.clear(ALARM);
  }
  async function workspace(previous) {
    if (previous?.tabId) {
      try {
        const tab = await chrome.tabs.get(previous.tabId);
        if (new URL(tab.url).hostname === "x.com") {
          await chrome.tabs.update(tab.id, {
            url: "https://x.com/home",
            muted: true,
            autoDiscardable: false,
          });
          return { tabId: tab.id };
        }
      } catch {}
    }
    const tab = await chrome.tabs.create({
      url: "https://x.com/home",
      active: false,
    });
    await chrome.tabs.update(tab.id, { muted: true, autoDiscardable: false });
    return { tabId: tab.id };
  }
  async function closeOwnedTab(job) {
    try {
      const tab = await chrome.tabs.get(job.tabId);
      if (new URL(tab.url).hostname === "x.com")
        await chrome.tabs.remove(job.tabId);
    } catch {}
  }
  async function finish(job) {
    job.status = "done";
    job.message = job.failed.length
      ? `${job.confirmed} compte(s) bloqué(s), ${job.failed.length} compte(s) indisponible(s).`
      : `${job.confirmed} compte(s) bloqué(s). C’est fait !`;
    clearTimeout(wakeTimer);
    await save(job);
    await chrome.alarms.clear(ALARM);
    await closeOwnedTab(job);
  }
  async function drive() {
    const job = await read();
    if (job?.status !== "running") return;
    if (job.index >= job.accounts.length) {
      await finish(job);
      return;
    }
    if (job.phase === "delay") {
      if (job.nextAt > Date.now()) {
        await schedule(job.nextAt);
        return;
      }
      job.phase = "loading";
      job.documentReady = false;
      job.softNavigation = false;
      job.attempt = crypto.randomUUID();
      job.deadline = Date.now() + 60000;
      await save(job);
      try {
        try {
          const accepted =
            !job.navigationFallback &&
            (await chrome.tabs.sendMessage(job.tabId, {
              type: "navigate",
              jobId: job.id,
              attempt: job.attempt,
              account: job.accounts[job.index],
              owner: job.owner,
            }));
          if (accepted?.accepted) {
            job.softNavigation = true;
            await save(job);
            await schedule(job.deadline + 100);
            return;
          }
        } catch {}
        await chrome.tabs.update(job.tabId, {
          url: `https://x.com/${job.accounts[job.index].username}`,
        });
        // Firefox peut encore renvoyer l’ancienne URL juste après update().
        // Le nouveau document nous prévient dès que son script est prêt.
        await schedule(Date.now() + 1000);
        return;
      } catch {
        await pause(
          job,
          "L’onglet de blocage a été fermé. Cliquez pour reprendre.",
        );
        return;
      }
    }
    if (job.deadline < Date.now()) {
      await pause(
        job,
        "X ne répond pas ou demande une vérification. Ouvrez l’onglet X, puis cliquez pour reprendre.",
      );
      return;
    }
    if (["inspecting", "blocking"].includes(job.phase)) {
      await schedule(job.deadline + 100);
      return;
    }
    let tab;
    try {
      tab = await chrome.tabs.get(job.tabId);
    } catch {
      await pause(
        job,
        "L’onglet de blocage a été fermé. Cliquez pour reprendre.",
      );
      return;
    }
    if (
      (tab.status !== "complete" || job.softNavigation) &&
      !job.documentReady
    ) {
      await schedule(Date.now() + 1000);
      return;
    }
    if (!tab.url || tab.url === "about:blank") {
      await schedule(Date.now() + 500);
      return;
    }
    let url;
    try {
      url = new URL(tab.url);
    } catch {
      await pause(job, "L’onglet X a changé. Cliquez pour reprendre.");
      return;
    }
    if (
      url.hostname !== "x.com" ||
      (job.phase === "loading" &&
        url.pathname.toLowerCase() !==
          `/${job.accounts[job.index].username.toLowerCase()}`)
    ) {
      await pause(
        job,
        "Connectez-vous à X dans l’onglet ouvert, puis cliquez pour reprendre.",
      );
      return;
    }
    const session = job.phase === "sessionLoading";
    job.phase = session ? "inspecting" : "blocking";
    job.deadline = Date.now() + 35000;
    await save(job);
    try {
      const accepted = await chrome.tabs.sendMessage(job.tabId, {
        type: session ? "inspect" : "block",
        jobId: job.id,
        attempt: job.attempt,
        account: job.accounts[job.index],
        owner: job.owner,
      });
      if (!accepted?.accepted) throw new Error("not-ready");
    } catch {
      job.phase = session ? "sessionLoading" : "loading";
      await save(job);
      await schedule(Date.now() + 500);
      return;
    }
    await schedule(job.deadline + 100);
  }
  async function result(message, sender) {
    const job = await read();
    if (
      job?.status !== "running" ||
      sender.tab?.id !== job.tabId ||
      sender.frameId !== 0 ||
      job.id !== message.jobId ||
      job.attempt !== message.attempt
    )
      return;
    if (message.type === "sessionResult" && job.phase === "inspecting") {
      if (!message.owner || !/^[A-Za-z0-9_]{1,15}$/.test(message.owner)) {
        await pause(
          job,
          "Connectez-vous à X dans l’onglet ouvert, puis cliquez pour reprendre.",
        );
        return;
      }
      if (
        job.owner &&
        job.owner.toLowerCase() !== message.owner.toLowerCase()
      ) {
        await pause(
          job,
          "Le compte X connecté a changé. Revenez au compte utilisé au lancement.",
        );
        return;
      }
      job.owner = message.owner;
      job.phase = "delay";
      job.nextAt = Date.now();
      job.message = "Blocage en cours…";
      await save(job);
      await drive();
      return;
    }
    if (message.type !== "blockResult" || job.phase !== "blocking") return;
    if (["blocked", "already"].includes(message.outcome)) {
      job.confirmed++;
      job.index++;
    } else if (message.outcome === "unavailable") {
      job.failed.push(job.accounts[job.index]);
      job.index++;
    } else {
      await pause(
        job,
        message.error ||
          "X a interrompu le blocage. Ouvrez l’onglet X, puis cliquez pour reprendre.",
      );
      return;
    }
    if (job.index >= job.accounts.length) {
      await finish(job);
      return;
    }
    job.phase = "delay";
    job.nextAt = Date.now() + NEXT_DELAY;
    job.message = `${job.confirmed} / ${job.accounts.length} comptes bloqués…`;
    await save(job);
    await schedule(job.nextAt);
  }
  return {
    dispatch(message, sender = {}) {
      if (message?.type === "state")
        return chrome.storage.local.get(["list", "job", "checkedAt"]);
      if (message?.type === "refresh") return list();
      return locked(async () => {
        if (message?.type === "navigateFailed") {
          const job = await read();
          if (
            job?.status !== "running" ||
            job.phase !== "loading" ||
            !job.softNavigation ||
            job.tabId !== sender.tab?.id ||
            sender.frameId !== 0 ||
            job.id !== message.jobId ||
            job.attempt !== message.attempt
          )
            return;
          job.softNavigation = false;
          job.navigationFallback = true;
          job.documentReady = false;
          await save(job);
          try {
            await chrome.tabs.update(job.tabId, {
              url: `https://x.com/${job.accounts[job.index].username}`,
            });
            await schedule(Date.now() + 1000);
          } catch {
            await pause(
              job,
              "L’onglet de blocage a été fermé. Cliquez pour reprendre.",
            );
          }
          return;
        }
        if (message?.type === "ready") {
          const job = await read();
          if (
            job?.status !== "running" ||
            job.tabId !== sender.tab?.id ||
            sender.frameId !== 0 ||
            (message.jobId &&
              (message.jobId !== job.id || message.attempt !== job.attempt)) ||
            !["loading", "sessionLoading"].includes(job.phase)
          )
            return;
          const expected =
            job.phase === "sessionLoading"
              ? "/home"
              : `/${job.accounts[job.index].username.toLowerCase()}`;
          const url = new URL(message.url || sender.url);
          if (
            url.hostname !== "x.com" ||
            url.pathname.toLowerCase() !== expected
          )
            return;
          job.documentReady = true;
          await save(job);
          await drive();
          return;
        }
        if (["sessionResult", "blockResult"].includes(message?.type))
          return result(message, sender);
        const old = await read();
        if (message?.type === "inspect") {
          if (old?.status === "paused") {
            const tab = await chrome.tabs.get(old.tabId);
            if (new URL(tab.url).hostname === "x.com") {
              await chrome.tabs.update(tab.id, { active: true });
              await chrome.windows.update(tab.windowId, { focused: true });
            }
          }
          return;
        }
        if (message?.type === "cancel") {
          clearTimeout(wakeTimer);
          if (old) {
            old.status = "cancelled";
            old.message = "Arrêté. Les blocages déjà faits restent actifs.";
            await save(old);
            await closeOwnedTab(old);
          }
          await chrome.alarms.clear(ALARM);
          return;
        }
        if (message?.type !== "start") throw new Error("Commande inconnue.");
        if (old?.status === "running") return;
        const accounts =
          old?.status === "paused" ? old.accounts : (await list()).accounts;
        const work = await workspace(old?.status === "paused" ? old : null);
        if (old?.status === "paused" && work.tabId !== old.tabId)
          await closeOwnedTab(old);
        const job =
          old?.status === "paused"
            ? old
            : {
                id: crypto.randomUUID(),
                accounts,
                index: 0,
                confirmed: 0,
                failed: [],
                owner: null,
              };
        Object.assign(job, {
          status: "running",
          phase: "sessionLoading",
          ...work,
          documentReady: false,
          softNavigation: false,
          attempt: crypto.randomUUID(),
          deadline: Date.now() + 60000,
          message: "Vérification de votre session X…",
        });
        await save(job);
        await schedule(Date.now() + 250);
      });
    },
    tick: () => locked(drive),
    startup: () =>
      locked(async () => {
        const job = await read();
        if (job?.status === "running")
          await pause(
            job,
            "Le navigateur a redémarré. Cliquez pour reprendre.",
          );
      }),
  };
}
