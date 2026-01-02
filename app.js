(() => {
  const $ = (id) => document.getElementById(id);
  const FEEDBACK_KEY = "betaDataFeedback_v001";
  const INPUT_HELPER_TEXT = "Rate how you feel right now (1–5). Then get today’s beta.";

  const MATRIX = {
    1:{1:"RECOVER",2:"RECOVER",3:"RECOVER",4:"RECOVER",5:"RECOVER"},
    2:{1:"MOVE",2:"MOVE",3:"VOLUME",4:"MOVE",5:"MOVE"},
    3:{1:"VOLUME",2:"VOLUME",3:"BALANCED",4:"PROJECT",5:"PROJECT"},
    4:{1:"TECH",2:"TECH",3:"BALANCED",4:"SEND",5:"SEND"},
    5:{1:"BANK",2:"BANK",3:"BALANCED",4:"SEND",5:"SEND"}
  };

  const CAP_DELTA = {
    RECOVER:null, MOVE:3, TECH:2, VOLUME:2,
    BALANCED:1, PROJECT:0, SEND:0, BANK:1
  };

  const COPY = {
    RECOVER:{title:"🟥 Recover",do:["No climbing today","Walk + mobility (10–20 min)","Optional: light antagonists if they feel good"],avoid:["“Just easy laps”","Testing fingers/back","Turning recovery into training"]},
    MOVE:{title:"🟦 Movement Day",do:["Flow / traverse / easy mileage","Slab or vertical; stay smooth","Stop while it still feels easy"],avoid:["Crimps/pockets","Repeating hard moves","Any “one more try” energy"]},
    TECH:{title:"🟦 Technique Focus",do:["Pick climbs where you can stay precise","Footwork + body position goals","Short session, high quality"],avoid:["Power moves","Over-gripping","Attempts piling up"]},
    VOLUME:{title:"🟩 Low-Pressure Volume",do:["Easy/moderate mileage","Long rests; stay snappy","Stop before quality drops"],avoid:["Chasing grades","Rushing between climbs","Getting pumped/fatigued"]},
    BALANCED:{title:"🟩 Balanced Session",do:["Mix: a few easy wins + a few harder tries","Rest enough to keep quality high","Leave a little in the tank"],avoid:["Max-effort volume","Session drift","Ignoring early fatigue signals"]},
    PROJECT:{title:"🟨 Focused Projecting",do:["Pick 1–2 problems max","Full rests between attempts","End early if fingers feel off"],avoid:["Grinding attempts","Jumping between problems","Turning projecting into volume"]},
    SEND:{title:"🟪 Performance Day",do:["Long warm-up","Few high-quality send attempts","Stop early when quality drops"],avoid:["Overstaying","Ignoring discomfort","Turning sends into volume"]},
    BANK:{title:"🟩 Bank the Day",do:["Short, clean session","Technique polish","Leave feeling underworked"],avoid:["Forcing psyche","Turning it into a grind","Chasing a send out of obligation"]}
  };
// Workout-mode copy: only swaps Do/Avoid lists (titles/why/caps stay the same)
const WORKOUT_COPY = {
  RECOVER:{do:["Walk + mobility (10–20 min)","Gentle yoga or stretching","Optional: light shoulder/scap prep"],avoid:["Hard training","Max effort","“Since I’m here…” decisions"]},
  MOVE:{do:["Easy cardio (10–20 min)","Mobility + light movement circuits","Leave feeling looser than you started"],avoid:["Intervals","Heavy lifting","Anything that spikes fatigue"]},
  TECH:{do:["Shoulder + core control (bands / bodyweight)","Mobility with slow control","Practice clean movement patterns"],avoid:["High-effort sets","Grip-heavy pulling","Training to failure"]},
  VOLUME:{do:["Moderate full-body work at easy effort","Leg + core stability focus","Stop before fatigue creeps in"],avoid:["Max lifts","High volume to burn","Grip-intensive pulling"]},
  BALANCED:{do:["Moderate strength or conditioning (submax)","A few quality sets with real rests","Finish with mobility"],avoid:["Chasing PRs","Back-to-back grinders","Turning it into a long session"]},
  PROJECT:{do:["Pick 1–2 focus lifts/movements","Full rests, high-quality reps","Keep volume tight"],avoid:["Adding “just one more” exercises","High fatigue finishers","Grip-heavy max pulling"]},
  SEND:{do:["High-quality efforts, low total volume","Long warm-up + full rests","Stop early while sharp"],avoid:["Too many heavy attempts","Failure reps","Overstaying once form drops"]},
  BANK:{do:["Short, clean maintenance session","Light technique or accessories","Leave feeling underworked"],avoid:["Grinding","Obligation training","Turning it into a test day"]}
};


  const prFrom = (e,f,b) => Math.min(e,f,b);
  const pickType = (e,f,b,m) => (e===1||f===1||b===1) ? "RECOVER" : MATRIX[prFrom(e,f,b)][m];
  const capString = (t) => t==="RECOVER" ? "No climbing" : `Vₘₐₓ − ${CAP_DELTA[t]}`;

  // ℹ️ Why-today detail (shown via info button next to the Why today line)
  const WHY_DETAIL = {
    RECOVER: `One or more systems are too taxed to benefit from training right now. Pushing through would create cost without meaningful upside. Today’s value comes from restoring capacity and letting things settle so future sessions can be productive. If you finish feeling calmer and looser than when you started, you did it right.`,
    MOVE: `Your readiness supports movement, but not load. This is a day to stay loose, explore positions, and let your body warm into itself without pressure. If you start treating movement as training or feel compelled to escalate difficulty, you’ve gone beyond today’s intent. The goal is to leave feeling better than you arrived.`,
    TECH: `This session should feel deliberate and light, not hard-but-clean. You’re here to notice feet, body position, and timing—not to prove strength or push limits. If you catch yourself over-gripping, muscling through moves, or stacking attempts, you’ve drifted off task. End the session while precision still feels easy and repeatable.`,
    VOLUME: `Volume today is about accumulating quality movement without fatigue. You should feel capable of repeating what you’re doing again tomorrow. If you’re getting pumped, rushing rests, or justifying "one more" because you’re already tired, the session has become too costly. The win is stopping before quality drops, not after.`,
    BALANCED: `This is a moderation day, not an indecisive one. You’re aiming for a mix of effort and ease, with neither dominating the session. If everything feels hard, you’re overreaching; if everything feels trivial, you’re underusing the day. Finish feeling satisfied but not spent, with enough clarity to recognize when it was time to stop.`,
    PROJECT: `Today supports focused effort, but only in small doses. Progress comes from quality attempts with full recovery, not from volume or persistence. If you start adding problems, shortening rests, or pushing through declining quality, the session has lost its edge. The goal is clarity and learning, not exhaustion.`,
    SEND: `Your readiness supports high-quality performance, but only briefly. This is a day to show up prepared, take a few serious attempts, and then step away while things still feel sharp. If you stay hoping something will turn around, you’re likely giving back what you earned. Ending early is part of executing the day well.`,
    BANK: `Today is about preservation, even if you feel good. The goal isn’t to capitalize on energy; it’s to protect it. If you start chasing difficulty out of obligation or "because it’s there," you’re undermining the purpose. Success looks like leaving underworked, confident you’ve saved capacity for later.`
  };

 
  // Why today (one sentence in the UI). Use the info button to expand.
  function explain(e, f, b, m, t) {
    switch (t) {
      case "RECOVER":
        return "You’re too taxed to benefit from training today—recovery protects tomorrow.";
      case "MOVE":
        return "You can move today, but loading will cost you—keep it light and leave better.";
      case "TECH":
        return "Today is for precision and control, not effort—stay light and deliberate.";
      case "VOLUME":
        return "You can accumulate quality reps today, as long as you avoid fatigue and stop early.";
      case "BALANCED":
        return "Nothing is strongly limiting—mix effort and ease, and keep the session tidy.";
      case "PROJECT":
        return "You have a window for focused effort—keep it narrow and protect attempt quality.";
      case "SEND":
        return "You’re primed to try hard—take a few serious attempts and stop while sharp.";
      case "BANK":
        return "You’re capable today, but there’s no need to spend it—save more for later.";
      default:
        return "This matches today’s physical and mental readiness.";
    }
  }


const el = {
    topHelper:$("topHelper"),
    screenInput:$("screenInput"),
    screenOutput:$("screenOutput"),
    energy:$("energy"),
    fingers:$("fingers"),
    body:$("body"),
    mental:$("mental"),
    energyVal:$("energyVal"),
    fingersVal:$("fingersVal"),
    bodyVal:$("bodyVal"),
    mentalVal:$("mentalVal"),
    getBetaBtn:$("getBetaBtn"),
    backBtn:$("backBtn"),
    sessionTitle:$("sessionTitle"),
    sessionWhy:$("sessionWhy"),
    doList:$("doList"),
    avoidList:$("avoidList"),
    capText:$("capText"),

    // Mode toggle (Output screen)
    modeClimbBtn:$("modeClimbBtn"),
    modeWorkoutBtn:$("modeWorkoutBtn"),
    yesBtn:$("yesBtn"),
    noBtn:$("noBtn"),
    commentBox:$("commentBox"),
    saveFeedbackBtn:$("saveFeedbackBtn"),
    copyFeedbackBtn:$("copyFeedbackBtn"),
    logged:$("logged"),
    toggleSavedBtn:$("toggleSavedBtn"),
    savedWrap:$("savedWrap"),
    savedDump:$("savedDump"),

    // ℹ️ Readiness info modal
    infoModal:$("infoModal"),
    infoTitle:$("infoTitle"),
    infoBody:$("infoBody"),
    closeInfo:$("closeInfo"),
    infoBtns: document.querySelectorAll(".infoBtn"),
    unicornModal:$("unicornModal"),
    closeUnicorn:$("closeUnicorn")
  };

  // Ensure unicorn starts hidden
  if (el.unicornModal) el.unicornModal.classList.add("hidden");

  const sync = () => {
    el.energyVal.textContent = el.energy.value;
    el.fingersVal.textContent = el.fingers.value;
    el.bodyVal.textContent = el.body.value;
    el.mentalVal.textContent = el.mental.value;
  };
  ["input","change"].forEach(evt=>{
    el.energy.addEventListener(evt,sync);
    el.fingers.addEventListener(evt,sync);
    el.body.addEventListener(evt,sync);
    el.mental.addEventListener(evt,sync);
  });

// Mode toggle state (default: Climbing)
let mode = "climb"; // "climb" | "workout"
let lastType = null; // most recent archetype, used when toggling

function applyModeUI(){
  if(!el.modeClimbBtn || !el.modeWorkoutBtn) return;
  el.modeClimbBtn.classList.toggle("selected", mode === "climb");
  el.modeWorkoutBtn.classList.toggle("selected", mode === "workout");
  el.modeClimbBtn.classList.toggle("dim", mode === "workout");
  el.modeWorkoutBtn.classList.toggle("dim", mode === "climb");
}

function setMode(next){
  mode = next;
  applyModeUI();
  if(lastType){
    renderDoAvoid(lastType);
  }
}

if(el.modeClimbBtn) el.modeClimbBtn.onclick = () => setMode("climb");
if(el.modeWorkoutBtn) el.modeWorkoutBtn.onclick = () => setMode("workout");
applyModeUI();

  sync();

  // Feedback selection UI state
  let usedBeta = null;
  function setUsedBeta(val){
    usedBeta = val;
    el.yesBtn.classList.toggle("selected", val === true);
    el.noBtn.classList.toggle("selected", val === false);
    el.yesBtn.classList.toggle("dim", val === false);
    el.noBtn.classList.toggle("dim", val === true);
  }
  el.yesBtn.onclick = () => { setUsedBeta(true); el.logged.textContent = ""; };
  el.noBtn.onclick  = () => { setUsedBeta(false); el.logged.textContent = ""; };

  // Track the most recent computed recommendation so feedback saves context
  let lastContext = null; // { inputs, pr, mr, archetype, cap }

  function closeUnicorn(){
    if (!el.unicornModal) return;
    el.unicornModal.classList.add("hidden");
  }
  if (el.closeUnicorn) el.closeUnicorn.onclick = closeUnicorn;
  if (el.unicornModal) {
    el.unicornModal.addEventListener("click", (e) => {
      if (e.target === el.unicornModal) closeUnicorn();
    });
  }

  // ℹ️ Readiness info content + modal handlers
  const READINESS_INFO = {
    energy: {
      title: "Energy",
      items: [
        ["5", "Fully charged", "Rested and fueled. Warm-up feels easy and you don’t fade late."],
        ["4", "Good", "Plenty to work with. You might tire eventually, but not early."],
        ["3", "Okay", "You can climb, but pacing matters. Rushing will cost you."],
        ["2", "Low", "Energy drops quickly once you start. Pushing will shorten the session."],
        ["1", "Depleted", "Run-down or foggy. Even easy climbing feels heavy."]
      ],
      footer: "Think about how you feel after warming up, not how motivated you are."
    },
    fingers: {
      title: "Fingers / Joints",
      items: [
        ["5", "Bulletproof", "No soreness or warning signs. You don’t think about your fingers."],
        ["4", "Good", "Slight stiffness early, gone after warm-up. Loading feels okay if managed."],
        ["3", "Aware", "Noticeable soreness or tightness. Loading feels costly but possible."],
        ["2", "Sensitive", "Ongoing soreness or irritation. Crimping feels sketchy."],
        ["1", "Injured", "Sharp pain, swelling, or known injury. Loading would make it worse."]
      ],
      footer: "If you’re asking “will this be okay?”, it’s probably a 3 or lower."
    },
    body: {
      title: "Body / Back",
      items: [
        ["5", "Fresh", "No soreness or restriction. Big moves feel controlled."],
        ["4", "Good", "Minor tightness, not limiting. You can engage normally."],
        ["3", "Tight", "Stiffness or DOMS. Hard to maintain tension late."],
        ["2", "Fatigued", "Heavy soreness or nagging tightness. Big moves feel risky."],
        ["1", "Painful", "Pain with movement or restricted range."]
      ],
      footer: "Rate how your body feels moving, not standing still."
    },
    mental: {
      title: "Mental",
      items: [
        ["5", "Locked in", "Calm, focused, intentional. You can rest and commit fully."],
        ["4", "Good", "Motivated and mostly focused. Minor frustration is manageable."],
        ["3", "Neutral", "Focus comes and goes. Easy to drift without structure."],
        ["2", "Scattered", "Distracted or irritable. Hard to rest or commit."],
        ["1", "Fried", "Emotionally drained or stressed. Decision-making is poor."]
      ],
      footer: "This is about bandwidth, not stoke."
    }
  };

  function closeInfo(){
    if (!el.infoModal) return;
    el.infoModal.classList.add("hidden");
  }

  function openInfo(key){
    // "Why today" expanded info (uses the same modal as readiness sliders)
    if(key === "why"){
      if (!el.infoModal) return;
      const t = lastType;
      if (el.infoTitle) el.infoTitle.textContent = "Why today";
      if (el.infoBody) {
        const p = (t && WHY_DETAIL[t]) ? WHY_DETAIL[t] : "Get today’s beta first.";
        el.infoBody.innerHTML = `<p style="margin:10px 0;">${p}</p>`;
      }
      el.infoModal.classList.remove("hidden");
      return;
    }
    const cfg = READINESS_INFO[key];
    if (!cfg || !el.infoModal) return;

    if (el.infoTitle) el.infoTitle.textContent = cfg.title;

    if (el.infoBody) {
      const html = cfg.items.map(([n, label, desc]) =>
        `<p style="margin:10px 0;"><strong>${n} — ${label}</strong><br>${desc}</p>`
      ).join("");
      el.infoBody.innerHTML = html + `<p class="muted small" style="margin-top:12px;">${cfg.footer}</p>`;
    }

    el.infoModal.classList.remove("hidden");
  }

  if (el.closeInfo) el.closeInfo.onclick = closeInfo;
  if (el.infoModal) {
    el.infoModal.addEventListener("click", (e) => {
      if (e.target === el.infoModal) closeInfo();
    });
  }
  if (el.infoBtns && el.infoBtns.length) {
    el.infoBtns.forEach((btn) => {
      btn.addEventListener("click", () => openInfo(btn.dataset.info));
    });
  }


  function loadFeedback(){
    try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]"); }
    catch { return []; }
  }
  function saveFeedback(entry){
    const arr = loadFeedback();
    arr.push(entry);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(arr));
    return arr.length;
  }


function renderDoAvoid(t){
  const src = (mode === "workout") ? WORKOUT_COPY[t] : COPY[t];
  if(!src) return;
  el.doList.innerHTML = src.do.map(x=>`<li>${x}</li>`).join("");
  el.avoidList.innerHTML = src.avoid.map(x=>`<li>${x}</li>`).join("");
}

  el.getBetaBtn.onclick = () => {
    const e=+el.energy.value, f=+el.fingers.value, b=+el.body.value, m=+el.mental.value;
    const t = pickType(e,f,b,m);
    const pr = prFrom(e,f,b);
    const mr = m;
    const cap = capString(t);

    // Update top helper line
    el.topHelper.textContent = `You today: Energy ${e} · Fingers ${f} · Body ${b} · Mental ${m}`;

    // Fill output
    el.sessionTitle.textContent = COPY[t].title;
    el.sessionWhy.textContent = explain(e,f,b,m,t);
    // Render Do/Avoid based on current mode
    lastType = t;
    renderDoAvoid(t);
    el.capText.textContent = cap;

    // Save context for feedback (NO UI change)
    lastContext = {
      inputs: { energy: e, fingers: f, body: b, mental: m },
      pr,
      mr,
      archetype: t,
      cap
    };

    // Reset feedback UI
    setUsedBeta(null);
    el.commentBox.value = "";
    el.logged.textContent = "";
    el.savedWrap.classList.add("hidden");
    el.toggleSavedBtn.textContent = "Show saved feedback";

    // Navigate
    el.screenInput.classList.add("hidden");
    el.screenOutput.classList.remove("hidden");

    // Unicorn trigger (unchanged): all sliders are 5
    closeUnicorn();
    if(e===5 && f===5 && b===5 && m===5 && el.unicornModal){
      el.unicornModal.classList.remove("hidden");
    }
  };

  el.backBtn.onclick = () => {
    el.topHelper.textContent = INPUT_HELPER_TEXT;
    closeUnicorn();
    el.screenOutput.classList.add("hidden");
    el.screenInput.classList.remove("hidden");
  };

  // ✅ Only change here: what we save per entry (schema upgrade)
  el.saveFeedbackBtn.onclick = () => {
    if(usedBeta === null){
      el.logged.textContent = "Select Yes or No first.";
      return;
    }
    if(!lastContext){
      // Shouldn't happen unless they somehow hit Save without generating beta
      el.logged.textContent = "Get Today’s Beta first.";
      return;
    }

    const entry = {
      ts: new Date().toISOString(),
      inputs: lastContext.inputs,
      pr: lastContext.pr,
      mr: lastContext.mr,
      archetype: lastContext.archetype,
      cap: lastContext.cap,
      usedBeta,
      comment: el.commentBox.value.trim()
    };

    saveFeedback(entry);
    el.logged.textContent = "Feedback saved on this device.";
  };

  el.copyFeedbackBtn.onclick = async () => {
    const data = loadFeedback();
    if(!data.length){
      el.logged.textContent = "No feedback to copy.";
      return;
    }
    try{
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      el.logged.textContent = "Copied feedback.";
    }catch{
      el.logged.textContent = "Clipboard blocked here (usually works once hosted on https).";
    }
  };

  el.toggleSavedBtn.onclick = () => {
    el.savedWrap.classList.toggle("hidden");
    el.savedDump.value = JSON.stringify(loadFeedback(), null, 2);
    el.toggleSavedBtn.textContent = el.savedWrap.classList.contains("hidden")
      ? "Show saved feedback"
      : "Hide saved feedback";
  };
})();
