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

  const prFrom = (e,f,b) => Math.min(e,f,b);
  const pickType = (e,f,b,m) => (e===1||f===1||b===1) ? "RECOVER" : MATRIX[prFrom(e,f,b)][m];
  const capString = (t) => t==="RECOVER" ? "No climbing" : `Vₘₐₓ − ${CAP_DELTA[t]}`;

  function explain(e,f,b,m,t){
  const pr = Math.min(e, f, b);

  // Special: true "everything aligned" day (matches your unicorn vibe without changing the modal logic)
  if (pr === 5 && m === 5) {
    return "Everything is lining up today. If you’ve got a unicorn in mind, this is the day — take a few high-quality attempts and don’t overstay.";
  }

  // Hard guardrail
  if (t === "RECOVER") {
    return "One system is too taxed today. Even if parts of you feel okay, pushing now risks stealing from tomorrow.";
  }

  // Limiter-first explanations (most useful for prevention)
  if (f <= 2) {
    return "Fingers are the limiter today. You’ve got some energy and body capacity, but this isn’t a day to load grips—keep it smooth and low-stress.";
  }
  if (b <= 2) {
    return "Body/back is the limiter today. You can still climb, but keep intensity and attempts low—avoid big tension moves and stop early.";
  }
  if (m <= 2) {
    return "Focus is limited today. Keep it simple: easy wins, clean movement, longer rests, and leave before the session gets messy.";
  }

  // Archetype-specific (covers the remaining cases so it never feels generic)
  switch (t) {
    case "MOVE":
      return "Physical capacity is limited, but you can still get a productive session. Think flow and movement quality—easy terrain, low effort, high control.";
    case "TECH":
      return "You’re capable of climbing today, but the best value is precision over power. Use this as a quality session: feet, positions, and smooth execution.";
    case "VOLUME":
      return "You’re good enough for mileage. Keep it low-pressure and sustainable—steady movement, real rests, stop before quality drops.";
    case "BALANCED":
      return "Nothing is strongly limiting today. Mix a few harder tries with easier wins—stay honest about fatigue and keep the session tidy.";
    case "PROJECT":
      return "You’ve got enough body and focus for a narrow project. Pick 1–2 problems, rest fully, and keep attempts high-quality.";
    case "SEND":
      return "You’re in a good window to try hard. Take a small number of serious attempts with full recovery—send energy, not send volume.";
    case "BANK":
      return "You’re capable today, but there’s no need to empty the tank. A short, clean session keeps momentum without cost.";
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
    yesBtn:$("yesBtn"),
    noBtn:$("noBtn"),
    commentBox:$("commentBox"),
    saveFeedbackBtn:$("saveFeedbackBtn"),
    copyFeedbackBtn:$("copyFeedbackBtn"),
    logged:$("logged"),
    toggleSavedBtn:$("toggleSavedBtn"),
    savedWrap:$("savedWrap"),
    savedDump:$("savedDump"),
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
    el.doList.innerHTML = COPY[t].do.map(x=>`<li>${x}</li>`).join("");
    el.avoidList.innerHTML = COPY[t].avoid.map(x=>`<li>${x}</li>`).join("");
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
