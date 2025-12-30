(() => {
  const $ = (id) => document.getElementById(id);
  const FEEDBACK_KEY = "betaDataFeedback_v1";

  // ---------- Basic matrix (PR x MR -> type) ----------
  // PR = min(Energy, Fingers, Body)
  // MR = Mental
  const MATRIX = {
    1: {1:"RECOVER",  2:"RECOVER",  3:"RECOVER",  4:"RECOVER",  5:"RECOVER"},
    2: {1:"MOVE",     2:"MOVE",     3:"VOLUME",   4:"MOVE",     5:"MOVE"},
    3: {1:"VOLUME",   2:"VOLUME",   3:"BALANCED", 4:"PROJECT",  5:"PROJECT"},
    4: {1:"TECH",     2:"TECH",     3:"BALANCED", 4:"SEND",     5:"SEND"},
    5: {1:"BANK",     2:"BANK",     3:"BALANCED", 4:"SEND",     5:"SEND"},
  };

  // Type -> delta for "Max V − N"
  // null = no climbing
  const CAP_DELTA = {
    RECOVER: null,
    MOVE: 3,
    TECH: 2,
    VOLUME: 2,
    BALANCED: 1,
    PROJECT: 0,
    SEND: 0,
    BANK: 1,
  };

  // ✅ PRESERVED copy (same as frozen general version)
  const COPY = {
    RECOVER: { title:"🟥 Recover",
      do:["No climbing today","Walk + mobility (10–20 min)","Optional: light antagonists if they feel good"],
      avoid:["“Just easy laps”","Testing fingers/back","Turning recovery into training"] },
    MOVE: { title:"🟦 Movement Day",
      do:["Flow / traverse / easy mileage","Slab or vertical; stay smooth","Stop while it still feels easy"],
      avoid:["Crimps/pockets","Repeating hard moves","Any “one more try” energy"] },
    TECH: { title:"🟦 Technique Focus",
      do:["Pick climbs where you can stay precise","Footwork + body position goals","Short session, high quality"],
      avoid:["Power moves","Over-gripping","Attempts piling up"] },
    VOLUME: { title:"🟩 Low-Pressure Volume",
      do:["Easy/moderate mileage","Long rests; stay snappy","Stop before quality drops"],
      avoid:["Chasing grades","Rushing between climbs","Getting pumped/fatigued"] },
    BALANCED: { title:"🟩 Balanced Session",
      do:["Mix: a few easy wins + a few harder tries","Rest enough to keep quality high","Leave a little in the tank"],
      avoid:["Max-effort volume","Session drift","Ignoring early fatigue signals"] },
    PROJECT: { title:"🟨 Focused Projecting",
      do:["Pick 1–2 problems max","Full rests between attempts","End early if fingers feel off"],
      avoid:["Grinding attempts","Jumping between problems","Turning projecting into volume"] },
    SEND: { title:"🟪 Performance Day",
      do:["Long warm-up","Few high-quality send attempts","Stop early when quality drops"],
      avoid:["Overstaying","Ignoring discomfort","Turning sends into volume"] },
    BANK: { title:"🟩 Bank the Day",
      do:["Short, clean session","Technique polish","Leave feeling underworked"],
      avoid:["Forcing psyche","Turning it into a grind","Chasing a send out of obligation"] },
  };

  // ---------- Helpers ----------
  const prFrom = (e, f, b) => Math.min(e, f, b);

  function pickType(e, f, b, m) {
    if (e === 1 || f === 1 || b === 1) return "RECOVER";
    const pr = prFrom(e, f, b);
    return MATRIX[pr][m];
  }

  function capString(type) {
    if (type === "RECOVER") return "No climbing";
    const d = CAP_DELTA[type];
    return `Max V − ${d}`; // general (no V-number)
  }

  // ✅ NEW: one-line reason (no numbers shown)
  function explain(e, f, b, m, type) {
    if (type === "RECOVER") return "One physical system is too taxed today — recovery protects consistency.";
    if (f <= 2 && b <= 2) return "Fingers and body set a lower ceiling today.";
    if (f <= 2) return "Finger readiness limits how hard you should pull today.";
    if (b <= 2) return "Body fatigue caps intensity today.";
    if (m <= 2) return "Low mental bandwidth favors simpler, lower-pressure work today.";
    if (m >= 4 && prFrom(e, f, b) >= 4) return "Strong body + high focus supports higher intent today.";
    return "This matches today’s physical and mental readiness.";
  }

  // ---------- Elements ----------
  const el = {
    screenInput: $("screenInput"),
    screenOutput: $("screenOutput"),

    energy: $("energy"),
    fingers: $("fingers"),
    body: $("body"),
    mental: $("mental"),

    energyVal: $("energyVal"),
    fingersVal: $("fingersVal"),
    bodyVal: $("bodyVal"),
    mentalVal: $("mentalVal"),

    getBetaBtn: $("getBetaBtn"),
    backBtn: $("backBtn"),

    sessionTitle: $("sessionTitle"),
    sessionWhy: $("sessionWhy"),
    doList: $("doList"),
    avoidList: $("avoidList"),
    capText: $("capText"),

    // feedback
    yesBtn: $("yesBtn"),
    noBtn: $("noBtn"),
    noFollowup: $("noFollowup"),
    whyNoBtns: Array.from(document.querySelectorAll(".whyNo")),
    commentBox: $("commentBox"),
    saveFeedbackBtn: $("saveFeedbackBtn"),
    copyFeedbackBtn: $("copyFeedbackBtn"),
    logged: $("logged"),

    toggleSavedBtn: $("toggleSavedBtn"),
    savedWrap: $("savedWrap"),
    savedDump: $("savedDump"),
  };

  // ---------- Slider UI ----------
  function syncVals() {
    el.energyVal.textContent = el.energy.value;
    el.fingersVal.textContent = el.fingers.value;
    el.bodyVal.textContent = el.body.value;
    el.mentalVal.textContent = el.mental.value;
  }
  ["input", "change"].forEach(evt => {
    el.energy.addEventListener(evt, syncVals);
    el.fingers.addEventListener(evt, syncVals);
    el.body.addEventListener(evt, syncVals);
    el.mental.addEventListener(evt, syncVals);
  });
  syncVals();

  // ---------- Feedback storage ----------
  function loadFeedback() {
    try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]"); }
    catch { return []; }
  }
  function saveFeedback(entry) {
    const arr = loadFeedback();
    arr.push(entry);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(arr));
    return arr.length;
  }
  function formatEntries(entries) {
    return entries.map(e => {
      const l1 = `${e.ts}`;
      const l2 = `E ${e.inputs.energy}, F ${e.inputs.fingers}, B ${e.inputs.body}, M ${e.inputs.mental} | PR ${e.pr}`;
      const l3 = `Type: ${e.type} | Cap: ${e.cap}`;
      const l4 = `Feedback: ${e.verdict}${e.reason ? ` (${e.reason})` : ""}`;
      const l5 = `Comment: ${e.comment && e.comment.length ? e.comment : "-"}`;
      return [l1, l2, l3, l4, l5, "---"].join("\n");
    }).join("\n");
  }

  // ---------- Feedback selection cues ----------
  let feedbackState = { verdict: null, reason: null };
  const yesNoBtns = [el.yesBtn, el.noBtn];
  const whyBtns = el.whyNoBtns;

  function clearSelection(group) {
    group.forEach(btn => btn.classList.remove("selected", "dim"));
  }
  function selectButton(btn, group) {
    clearSelection(group);
    btn.classList.add("selected");
    group.forEach(b => { if (b !== btn) b.classList.add("dim"); });
  }
  function resetFeedbackUI() {
    feedbackState = { verdict: null, reason: null };
    el.commentBox.value = "";
    el.logged.textContent = "";
    el.noFollowup.classList.add("hidden");
    clearSelection(yesNoBtns);
    clearSelection(whyBtns);
  }

  // ---------- Main: Get beta ----------
  el.getBetaBtn.addEventListener("click", () => {
    const e = +el.energy.value;
    const f = +el.fingers.value;
    const b = +el.body.value;
    const m = +el.mental.value;

    const type = pickType(e, f, b, m);
    const copy = COPY[type];

    el.sessionTitle.textContent = copy.title;
    el.sessionWhy.textContent = explain(e, f, b, m, type); // ✅ NEW line
    el.doList.innerHTML = copy.do.map(x => `<li>${x}</li>`).join("");
    el.avoidList.innerHTML = copy.avoid.map(x => `<li>${x}</li>`).join("");
    el.capText.textContent = capString(type);

    resetFeedbackUI();
    el.savedWrap.classList.add("hidden");
    el.toggleSavedBtn.textContent = "Show saved feedback";

    el.screenInput.classList.add("hidden");
    el.screenOutput.classList.remove("hidden");
  });

  el.backBtn.addEventListener("click", () => {
    el.screenOutput.classList.add("hidden");
    el.screenInput.classList.remove("hidden");
  });

  // ---------- Feedback handlers ----------
  el.yesBtn.addEventListener("click", () => {
    feedbackState.verdict = "YES";
    feedbackState.reason = null;
    selectButton(el.yesBtn, yesNoBtns);
    el.noFollowup.classList.add("hidden");
    clearSelection(whyBtns);
    el.logged.textContent = "Selected: Yes. Add an optional comment, then Save.";
  });

  el.noBtn.addEventListener("click", () => {
    feedbackState.verdict = "NO";
    selectButton(el.noBtn, yesNoBtns);
    el.noFollowup.classList.remove("hidden");
    el.logged.textContent = "Selected: No. Choose what was off, then Save.";
  });

  whyBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      feedbackState.verdict = "NO";
      feedbackState.reason = btn.dataset.reason;
      selectButton(btn, whyBtns);
      el.logged.textContent = `Selected: ${feedbackState.reason}. Add an optional comment, then Save.`;
    });
  });

  el.saveFeedbackBtn.addEventListener("click", () => {
    if (!feedbackState.verdict) {
      el.logged.textContent = "Please select 👍 Yes or 👎 No first.";
      return;
    }
    if (feedbackState.verdict === "NO" && !feedbackState.reason) {
      el.logged.textContent = "Please select what was off (Too easy / Too hard / Wrong kind).";
      return;
    }

    const e = +el.energy.value;
    const f = +el.fingers.value;
    const b = +el.body.value;
    const m = +el.mental.value;

    const pr = prFrom(e, f, b);
    const type = pickType(e, f, b, m);
    const cap = capString(type);

    const entry = {
      ts: new Date().toISOString(),
      inputs: { energy: e, fingers: f, body: b, mental: m },
      pr,
      type,
      cap,
      verdict: feedbackState.verdict,
      reason: feedbackState.reason,
      comment: el.commentBox.value.trim(),
    };

    const count = saveFeedback(entry);
    el.logged.textContent = `Feedback saved. (Saved on this device: ${count})`;

    if (!el.savedWrap.classList.contains("hidden")) {
      el.savedDump.value = formatEntries(loadFeedback()) || "No saved feedback yet.";
    }
  });

  el.copyFeedbackBtn.addEventListener("click", async () => {
    const entries = loadFeedback();
    if (!entries.length) {
      el.logged.textContent = "No saved feedback to copy yet.";
      return;
    }
    const text = formatEntries(entries).trim();
    try {
      await navigator.clipboard.writeText(text);
      el.logged.textContent = "Copied saved feedback to clipboard.";
    } catch (err) {
      el.logged.textContent = "Clipboard blocked here. Once hosted (https), it usually works.";
      console.error(err);
    }
  });

  el.toggleSavedBtn.addEventListener("click", () => {
    const isOpen = !el.savedWrap.classList.contains("hidden");
    if (isOpen) {
      el.savedWrap.classList.add("hidden");
      el.toggleSavedBtn.textContent = "Show saved feedback";
      return;
    }
    el.savedDump.value = formatEntries(loadFeedback()) || "No saved feedback yet.";
    el.savedWrap.classList.remove("hidden");
    el.toggleSavedBtn.textContent = "Hide saved feedback";
  });
})();
