// Page 6: Results and Lessons Learned
const state = loadState();
const incident = state.incident;
const resp = state.response;
const inv = state.investigation;
renderSteps(5);

const RESPONSE_TITLES = {
  pause: "Pause agent",
  restrict: "Restrict access and require approval",
  monitor: "Continue monitoring"
};

const OUTCOME_NOTES = {
  security: {
    Secured: "The agent was stopped, so it can reach nothing more.",
    Restricted: "Access was reduced and exports now need approval.",
    Exposed: "The agent is still active with the same access."
  },
  productivity: {
    Disrupted: "Loan review is paused until the agent is restarted.",
    Managed: "Review continues with fewer permissions.",
    Uninterrupted: "Daily work is unchanged."
  },
  incident: {
    Contained: "Further exposure was prevented.",
    "Not contained": "The same incident could happen again."
  }
};

const SCENARIO_TEXT = {
  injection: {
    summary: "A loan packet for LN-204 contained hidden text telling the AI agent to ignore its instructions, query every customer, and export the results. The agent treated text inside a document as a command instead of as data.",
    cause: "hidden instructions in the loan document were treated as commands (prompt injection)",
    takeaways: [
      "Treat anything inside a document as untrusted data. It should never be followed as an instruction.",
      "Give the agent the least access it needs. Assigned loan records only keeps a single bad document from reaching every customer.",
      "Put a human approval step in front of exports, since exports are how data leaves."
    ]
  },
  excessive: {
    summary: "While reviewing LN-311, the agent asked for the whole customer table when the task needed one record. Nothing was hidden: the agent itself asked for more than it should have.",
    cause: "the agent requested far more customer data than the task needed (excessive data access)",
    takeaways: [
      "Scope access to the task. An agent that needs one record should be able to read one record.",
      "Compare every access request with what the task actually requires, and treat the gap as a warning sign.",
      "Read-only permission and export approval limit what an over-broad request can turn into."
    ]
  }
};

const esc = s => String(s).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));

if (!incident || !inv || !resp || !resp.outcomes) {
  $("#blocked").innerHTML = 'There are no results yet. Finish the <a href="response.html">response step</a> first, or <a href="setup.html">start a scenario</a>.';
  $("#blocked").classList.remove("hidden");
  $("#content").classList.add("hidden");
  $("#retry").disabled = true;
  $("#return").disabled = true;
} else {
  init();
}

function init() {
  const sid = incident.scenarioId;
  const scenario = SCENARIOS.find(s => s.id === sid);
  const text = SCENARIO_TEXT[sid];
  const cfg = state.config;
  const out = resp.outcomes;

  $("#page-sub").textContent = scenario.title;

  $("#banner").textContent =
    `${incident.id} | Response applied: ${RESPONSE_TITLES[resp.choice]} | Likely cause: ${inv.correct ? "identified correctly" : "not supported by the evidence"}`;

  $("#outcomes").innerHTML = [
    ["Security outcome", "security", out.security],
    ["Productivity outcome", "productivity", out.productivity],
    ["Incident outcome", "incident", out.incident]
  ].map(([title, key, value]) => `
    <div class="card">
      <h2>${title}</h2>
      <div class="big">${value}</div>
      <p>${OUTCOME_NOTES[key][value] || ""}</p>
    </div>`).join("");

  // --- What happened and why ---
  const records = cfg.data === "all" ? 120 : 1;
  const why = [
    cfg.data === "all"
      ? `All-record access let the agent read ${records} records instead of 1.`
      : "Assigned-record access kept the query to 1 record.",
    cfg.perm === "read"
      ? "Read-only permission blocked the export."
      : cfg.approval === "none"
        ? "Export was allowed with no human approval, so only the fixed lab boundary stopped the data leaving."
        : "Export was allowed, but human approval held it before anything left."
  ].join(" ");

  const investigation = inv.correct
    ? `You identified the likely cause correctly: ${text.cause}.`
    : `The cause you selected was not supported by the evidence. The supported cause was: ${text.cause}.`;

  const assessment = {
    pause: "Pausing removes the risk right away, but loan review stops until the agent is restarted.",
    restrict: "Restricting access and requiring approval limits the damage a future incident could do while loan review continues.",
    monitor: "Monitoring alone detects problems after they happen. It does not reduce what the agent can reach, so a similar incident could still expose data."
  }[resp.choice];

  const reason = (resp.reason || "").trim();

  $("#what-happened").insertAdjacentHTML("beforeend", `
    <h3>The incident</h3>
    <p>${text.summary}</p>
    <h3>Why it went the way it did</h3>
    <p>${why}</p>
    <h3>Your investigation</h3>
    <p>${investigation}</p>
    <h3>Your response</h3>
    <p>You chose <strong>${RESPONSE_TITLES[resp.choice]}</strong>. ${assessment}</p>
    ${reason ? `<p>Your reasoning:</p><blockquote>${esc(reason)}</blockquote>` : "<p>You did not enter a reason for this response.</p>"}`);

  // --- Learning takeaways ---
  const takeaways = text.takeaways.slice();
  const openSetup = cfg.data === "all" && cfg.perm === "export" && cfg.approval === "none";
  takeaways.push(openSetup
    ? "Your setup had all three risky settings turned on. Changing even one of them would have reduced the impact."
    : "Your setup limited the impact. Layered controls mean one failure does not become a data leak.");
  takeaways.push({
    pause: "Pausing is the strongest response, but it has a cost. Match the response to how serious the incident is.",
    restrict: "Restricting access balances security and productivity, which is often the right first move.",
    monitor: "Detection is not prevention. Logging and alerts help, but they work best alongside tighter access."
  }[resp.choice]);
  $("#takeaways").innerHTML = takeaways.map(t => `<li>${t}</li>`).join("");

  // --- Progress ---
  const done = SCENARIOS.filter(s => state.progress[s.id].status === "Completed");
  const left = SCENARIOS.filter(s => state.progress[s.id].status !== "Completed");
  $("#saved").textContent = `Progress saved: ${done.length} of ${SCENARIOS.length} scenarios completed` +
    (left.length
      ? " | " + left.map(s => `${s.title} remains ${state.progress[s.id].status.toLowerCase()}.`).join(" ")
      : " | All scenarios completed.");

  // --- Buttons ---
  function resetRun(nextScenario) {
    state.config = {data: null, perm: null, approval: null};
    delete state.incident;
    delete state.investigation;
    delete state.response;
    if (nextScenario) state.scenario = nextScenario;
    saveState(state);
  }

  $("#retry").onclick = () => {
    resetRun();
    location.href = "setup.html";
  };
  $("#return").onclick = () => {
    resetRun(left.length ? left[0].id : state.scenario);
    location.href = "../";
  };
}