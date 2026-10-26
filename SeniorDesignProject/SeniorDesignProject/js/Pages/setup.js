// Page 2: Agent setup
const state = loadState();
const scenario = SCENARIOS.find(s => s.id === state.scenario);

function renderControls(){
  document.querySelectorAll(".ctrl").forEach(c=>{
    const key = c.dataset.key;
    c.querySelector(".seg").innerHTML = CONTROLS[key].options.map(o=>`
      <label class="opt"><input type="radio" name="${key}" value="${o.v}" ${state.config[key]===o.v?"checked":""}><span>${o.t}</span></label>`).join("");
    c.querySelectorAll("input").forEach(el=>el.addEventListener("change", e=>{
      state.config[key] = e.target.value;
      renderSummary();
      updateButtons();
    }));
  });
}

function renderSummary(saved){
  const c = state.config;
  if(!configComplete(c)){
    const left = Object.keys(c).filter(k=>!c[k]).map(k=>CONTROLS[k].label.toLowerCase());
    $("#summary").innerHTML = `<b>Configuration summary:</b> choose ${left.join(", ")} to continue.`;
    return;
  }
  $("#summary").innerHTML = `<b>Configuration summary:</b>
    <ul>
      <li>Data access: ${optionLabel("data",c.data)}</li>
      <li>Permissions: ${optionLabel("perm",c.perm)}</li>
      <li>Human approval: ${optionLabel("approval",c.approval)}</li>
    </ul>${saved?'<div class="hint">Configuration saved.</div>':""}`;
}

function updateButtons(){
  const ok = configComplete(state.config);
  $("#save").disabled = !ok;
  $("#start").disabled = !ok;
}

$("#save").onclick = ()=>{
  saveState(state);
  renderSummary(true);
  toast("Configuration saved");
};
$("#start").onclick = ()=>{
  state.progress[state.scenario].status = "In progress";
  saveState(state);
  renderSummary(true);
  // When page 3 exists, replace the toast with: location.href = "simulation.html";
  toast("Simulation page is the next screen to build");
};

$("#setup-banner").textContent =
  `Scenario: ${scenario.title} (${scenario.level}). Set the three controls, then start the simulation.`;
renderSteps(1);
renderControls();
renderSummary();
updateButtons();