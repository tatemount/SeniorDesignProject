// Page 3: Simulation
const state = loadState();
const scenario = SCENARIOS.find(s => s.id === state.scenario);
const cfg = state.config;

$("#scenario-name").textContent = scenario.title;
renderSteps(2);

// The agent has to be configured before the simulation can run.
if (!configComplete(cfg)) {
  $("#no-config").classList.remove("hidden");
  $("#workspace").classList.add("hidden");
  $("#pause").disabled = true;
} else {
  start();
}

// Build the incident from the student's configuration.
// The more open the setup, the more severe the incident.
function buildIncident() {
  const allData = cfg.data === "all";
  const canExport = cfg.perm === "export";
  const noApproval = cfg.approval === "none";
  const score = [allData, canExport, noApproval].filter(Boolean).length;
  const severity = score === 3 ? "High" : score === 2 ? "Medium" : "Low";

  const records = allData ? 120 : 1;
  const recordText = `${records} synthetic record${records > 1 ? "s" : ""} read`;

  let exportText, exportShort, destination;
  if (!canExport) {
    exportText = "Export blocked: the agent has read-only permission.";
    exportShort = "Export blocked by read-only permission.";
    destination = "None (export not permitted)";
  } else if (!noApproval) {
    exportText = `CSV of ${records} record${records > 1 ? "s" : ""} staged. Export held for human approval.`;
    exportShort = "CSV staged, export held for human approval.";
    destination = "ext-share.example.test (held)";
  } else {
    exportText = `CSV of ${records} record${records > 1 ? "s" : ""} staged. Export attempted and blocked by the fixed lab boundary.`;
    exportShort = "CSV staged, export attempted and blocked by the fixed lab boundary.";
    destination = "ext-share.example.test (blocked)";
  }

  if (scenario.id === "injection") {
    return {
      id: "INC-001", scenarioId: scenario.id, severity, detected: "09:12",
      title: "Suspected data exposure", trigger: "Exfiltration attempt",
      banner: `INCIDENT INC-001 | ${severity} severity | Loan Review AI Agent tried to export customer data from the DB. External delivery was blocked. The incident should be investigated.`,
      agentText: `Prompt injection in loan review · Uploaded loan_packet_204.pdf for LN-204 directs the agent to query all customers. ${recordText}. ${exportShort}`,
      destination,
      events: [
        {time: "09:12", event: "Document opened", activity: "Agent opened loan_packet_204.pdf for loan LN-204."},
        {time: "09:14", event: "Instruction found", activity: "Text inside the document told the agent to query all customers and export the results."},
        {time: "09:15", event: "Database query", activity: allData
          ? `Agent queried the Customer DB for all customers. ${recordText}.`
          : "Agent queried the Customer DB. Access limited to the assigned loan, 1 synthetic record read. Broader request denied."},
        {time: "09:16", event: "Export attempt", activity: exportText}
      ]
    };
  }
  return {
    id: "INC-001", scenarioId: scenario.id, severity, detected: "09:12",
    title: "Excessive data access", trigger: "Over-broad data request",
    banner: `INCIDENT INC-001 | ${severity} severity | Loan Review AI Agent requested more customer records than its task needed. External delivery was blocked. The incident should be investigated.`,
    agentText: `Excessive data access · The agent reviewing loan LN-311 requested access to the full customer table. ${recordText}. ${exportShort}`,
    destination,
    events: [
      {time: "09:12", event: "Task started", activity: "Agent began underwriting review for loan LN-311, which needs 1 customer record."},
      {time: "09:14", event: "Scope request", activity: "Agent asked for access to the whole Customer DB instead of the assigned loan record."},
      {time: "09:15", event: "Database query", activity: allData
        ? `Request approved by the configuration. ${recordText}.`
        : "Request denied. Access stays limited to the assigned loan, 1 synthetic record read."},
      {time: "09:16", event: "Export attempt", activity: exportText}
    ]
  };
}

function chipHTML(text) { return `<span class="tag">${text}</span>`; }

function start() {
  const incident = buildIncident();
  state.incident = incident;                       // page 4 reads this
  state.progress[state.scenario].status = "In progress";
  saveState(state);

  $("#banner").textContent = incident.banner;
  $("#agent-text").textContent = incident.agentText;
  $("#config-chips").innerHTML = [
    cfg.data === "all" ? "All-record access enabled" : "Assigned-record access only",
    cfg.perm === "export" ? "Read/export enabled" : "Read-only",
    cfg.approval === "none" ? "Human approval disabled" : "Human approval required"
  ].map(chipHTML).join("");

  $("#inc-title").textContent = `${incident.id} · ${incident.title}`;
  $("#inc-details").innerHTML = `
    <dt>Detected</dt><dd>${incident.detected}</dd>
    <dt>Agent</dt><dd>Loan Review Agent</dd>
    <dt>Trigger</dt><dd>${incident.trigger}</dd>
    <dt>State</dt><dd>Open, Not contained</dd>
    <dt>Destination</dt><dd>${incident.destination}</dd>`;

  // Reveal the log one event at a time.
  let shown = 0, paused = false, timer = null;

  function renderStatus(label) {
    $("#status-chips").innerHTML = chipHTML(label) + chipHTML("Lab isolation intact");
  }
  function renderLog() {
    $("#log").innerHTML = incident.events.slice(0, shown).map(e => `
      <li><time>${e.time}</time><span class="ev">${e.event}</span><span class="act">${e.activity}</span></li>`).join("")
      || '<li><span class="empty">Waiting for events…</span></li>';
  }
  function finish() {
    renderStatus("Simulation complete");
    $("#investigate").disabled = false;
    $("#open-evidence").disabled = false;
    $("#pause").disabled = true;
  }
  function tick() {
    if (paused || shown >= incident.events.length) return;
    shown++;
    renderLog();
    if (shown < incident.events.length) timer = setTimeout(tick, 1000);
    else finish();
  }

  $("#pause").onclick = () => {
    paused = !paused;
    $("#pause").textContent = paused ? "Resume simulation" : "Pause simulation";
    renderStatus(paused ? "Simulation paused" : "Simulation running");
    clearTimeout(timer);
    if (!paused) tick();
  };

  const goInvestigate = () => { location.href = "investigation.html"; };
  $("#investigate").onclick = goInvestigate;
  $("#open-evidence").onclick = goInvestigate;

  renderStatus("Simulation running");
  renderLog();
  timer = setTimeout(tick, 600);
}