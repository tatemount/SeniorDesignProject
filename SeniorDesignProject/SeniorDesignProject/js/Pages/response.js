// Page 5: Response
const state = loadState();
const incident = state.incident;
renderSteps(4);

const CONFIRMED = {
  injection: "Prompt injection has been confirmed originating from Loan Review Agent",
  excessive: "Excessive data access has been confirmed originating from Loan Review Agent"
};

// Rule-based estimates, not measured results.
const RESPONSES = [
  {
    id: "pause", title: "Pause agent",
    desc: "Stop the Loan Review Agent until the incident is reviewed.",
    sec: {label: "High security", detail: "Stops the AI agent completely."},
    prod: {label: "Moderate disruption", detail: "Loan review stops until the agent is restarted."},
    plan: [
      ["Pause the Loan Review Agent", "Until the incident is reviewed"],
      ["Review the incident evidence", "INC-001"],
      ["Keep logging and alerts on", "Always"]
    ],
    outcomes: {security: "Secured", productivity: "Disrupted", incident: "Contained"}
  },
  {
    id: "restrict", title: "Restrict access and require approval",
    desc: "Limit the Loan Review Agent to assigned loan records and require human approval before exports.",
    sec: {label: "Medium security", detail: "Reduces access and adds a human check before exports are made."},
    prod: {label: "Low disruption", detail: "Review continues with less access and approval prompts."},
    plan: [
      ["Limit data access", "Assigned loan records only"],
      ["Require human approval", "Before exports"],
      ["Keep logging and alerts on", "Always"]
    ],
    outcomes: {security: "Restricted", productivity: "Managed", incident: "Contained"}
  },
  {
    id: "monitor", title: "Continue monitoring",
    desc: "Keep the Loan Review Agent running as usual and rely on logging and alerts to detect issues in the future.",
    sec: {label: "Lower security", detail: "The agent remains active while monitoring continues."},
    prod: {label: "No disruption", detail: "Further incident activity may still cause later impact."},
    plan: [
      ["Keep the agent running", "As currently configured"],
      ["Rely on logging and alerts", "Always"],
      ["Review alerts", "As they arrive"]
    ],
    outcomes: {security: "Exposed", productivity: "Uninterrupted", incident: "Not contained"}
  }
];

let choice = null;

if (!incident) {
  $("#blocked").innerHTML = 'There is no incident to respond to yet. <a href="setup.html">Configure the agent</a> and run the simulation first.';
  $("#blocked").classList.remove("hidden");
  $("#content").classList.add("hidden");
  $("#page-sub").textContent = "";
} else if (!state.investigation) {
  $("#blocked").innerHTML = 'Finish the investigation first. <a href="investigation.html">Go to Investigation</a> and pick the likely cause.';
  $("#blocked").classList.remove("hidden");
  $("#content").classList.add("hidden");
  $("#page-sub").textContent = `${incident.id} | ${incident.title}`;
} else {
  init();
}

function init() {
  $("#page-sub").textContent = `${incident.id} | ${CONFIRMED[incident.scenarioId]}`;

  // Restore an earlier choice if the student comes back.
  const prev = state.response && state.response.scenarioId === incident.scenarioId ? state.response : null;
  if (prev) {
    choice = prev.choice;
    $("#reason").value = prev.reason || "";
  }

  renderOptions();
  renderPlan();
  updateButton();

  $("#reason").addEventListener("input", save);
  $("#apply").onclick = apply;
}

function renderOptions() {
  $("#options").innerHTML = RESPONSES.map(r => `
    <label class="resp">
      <input type="radio" name="response" value="${r.id}" ${choice === r.id ? "checked" : ""}>
      <div class="card">
        <h3>${choice === r.id ? "●" : "○"} ${r.title}</h3>
        <p>${r.desc}</p>
        <div class="est">Security estimate</div>
        <p class="estdetail">${r.sec.label} | ${r.sec.detail}</p>
        <div class="est">Productivity estimate</div>
        <p class="estdetail">${r.prod.label} | ${r.prod.detail}</p>
      </div>
    </label>`).join("");

  document.querySelectorAll('input[name="response"]').forEach(el =>
    el.addEventListener("change", e => {
      choice = e.target.value;
      save();
      renderOptions();
      renderPlan();
      updateButton();
    }));
}

function renderPlan() {
  const r = RESPONSES.find(x => x.id === choice);
  $("#plan").innerHTML = r
    ? r.plan.map((p, i) => `<tr><td>${i + 1}</td><td>${p[0]}</td><td>${p[1]}</td></tr>`).join("")
    : '<tr><td colspan="3" class="hint-row">Choose a response to see its plan.</td></tr>';
}

function updateButton() {
  $("#apply").disabled = !choice;
}

function save() {
  state.response = {scenarioId: incident.scenarioId, choice, reason: $("#reason").value};
  saveState(state);
}

function apply() {
  const r = RESPONSES.find(x => x.id === choice);
  save();
  state.response.outcomes = r.outcomes;
  const p = state.progress[incident.scenarioId];
  p.status = "Completed";
  p.sec = `${r.sec.label}: ${r.sec.detail}`;
  p.prod = `${r.prod.label}: ${r.prod.detail}`;
  saveState(state);
  location.href = "results.html";   // results.html is built in the next step
}