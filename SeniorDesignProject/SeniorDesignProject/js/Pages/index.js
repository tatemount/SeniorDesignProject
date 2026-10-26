// Page 1: Overview
const state = loadState();

function renderScenarios(){
  $("#scenarios").innerHTML = SCENARIOS.map(s=>`
    <label class="scen">
      <input type="radio" name="scenario" value="${s.id}" ${state.scenario===s.id?"checked":""}>
      <div class="card">
        <h3>${state.scenario===s.id?"●":"○"} ${s.title}</h3>
        <div class="level">${s.level}</div>
        <p>${s.desc}</p>
        <span class="status">${state.progress[s.id].status}</span>
      </div>
    </label>`).join("");
  document.querySelectorAll('input[name="scenario"]').forEach(el=>
    el.addEventListener("change", e=>{
      state.scenario = e.target.value;
      saveState(state);
      renderScenarios();
    }));
}

function renderProgress(){
  $("#progress").innerHTML = SCENARIOS.map(s=>{
    const p = state.progress[s.id];
    return `<tr><td>${s.title}</td><td>${p.status}</td>
      <td class="${p.sec?"":"empty"}">${p.sec||"—"}</td>
      <td class="${p.prod?"":"empty"}">${p.prod||"—"}</td></tr>`;
  }).join("");
}

renderSteps(0);
renderScenarios();
renderProgress();