// Shared data and helpers used by every page.
const STEPS = ["1. Overview","2. Agent setup","3. Simulation","4. Investigation","5. Response","6. Results"];

const SCENARIOS = [
  {id:"injection", title:"Prompt injection in loan review", level:"Beginner",
   desc:"A loan document injection tries to make the agent export customer data."},
  {id:"excessive", title:"Excessive data access", level:"Intermediate",
   desc:"The agent requests access to more customer DB records than the minimum required."}
];

const CONTROLS = {
  data:{label:"Data access", options:[
    {v:"assigned", t:"Assigned loan records"},
    {v:"all", t:"All customer records"}]},
  perm:{label:"Permissions", options:[
    {v:"read", t:"Read only"},
    {v:"export", t:"Read and export"}]},
  approval:{label:"Human approval", options:[
    {v:"required", t:"Require approval for exports"},
    {v:"none", t:"Allow without approval"}]}
};

// State is kept in localStorage so it carries from one page to the next.
const STORAGE_KEY = "aiSecurityTrainer";
const DEFAULT_STATE = {
  scenario:"injection",
  config:{data:null, perm:null, approval:null},
  progress:{
    injection:{status:"Not started", sec:"", prod:""},
    excessive:{status:"Not started", sec:"", prod:""}
  }
};

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) return Object.assign(structuredClone(DEFAULT_STATE), JSON.parse(raw));
  }catch(e){}
  return structuredClone(DEFAULT_STATE);
}
function saveState(state){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
}

const $ = sel => document.querySelector(sel);
const optionLabel = (key, v) => CONTROLS[key].options.find(o => o.v === v)?.t;
const configComplete = cfg => Object.values(cfg).every(Boolean);

function renderSteps(currentIndex){
  $("#steps").innerHTML = STEPS.map((s,i)=>{
    const cls = i < currentIndex ? "done" : i === currentIndex ? "current" : "";
    return `<li class="${cls}" ${i===currentIndex?'aria-current="step"':''}>${s}${i<currentIndex?" ✓":""}</li>`;
  }).join("");
}

let toastTimer;
function toast(msg){
  const el = $("#toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.add("hidden"), 2200);
}