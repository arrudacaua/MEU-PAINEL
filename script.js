const WORKOUTS={
push:{name:"PUSH",sub:"Peito · Ombro · Tríceps",ex:[["Supino Inclinado",3],["Paralelas (peito)",3],["Crucifixo",3],["Desenvolvimento",3],["Elevação Lateral",3],["Tríceps Francês",3]]},
pull:{name:"PULL",sub:"Costas · Bíceps · Antebraço",ex:[["Puxada Aberta",3],["Remada Pronada (máquina)",3],["Remada Baixa",3],["Rosca Scott",3],["Rosca 45°",3],["Antebraço",3]]},
legs:{name:"LEGS",sub:"Pernas · Panturrilha · Abdômen",ex:[["Leg Press 45°",3],["Cadeira Flexora",3],["Extensora",3],["Adutora",3],["Abdutora",3],["Panturrilha no Leg",4],["Abdômen máquina",3]]},
upper:{name:"UPPER",sub:"Peito · Costas · Ombros · Braços",ex:[["Supino Reto",3],["Puxada Aberta",3],["Supino Inclinado",3],["Remada Pronada (máquina)",3],["Crucifixo Inverso",3],["Elevação Lateral",2],["Tríceps Pulley",2],["Rosca 45°",2]]},
lower:{name:"LOWER",sub:"Pernas · Posterior · Panturrilha · Abdômen",ex:[["Leg Press 45°",3],["Stiff / RDL",3],["Cadeira Flexora",3],["Extensora",3],["Adutora",2],["Abdutora",2],["Panturrilha no Leg",4],["Abdômen máquina",3]]}
};
const DAY_MAP={1:"push",2:"pull",3:"legs",5:"upper",6:"lower"};
const MEALS=["Café da manhã","Almoço","Lanche","Jantar"];
const DEFAULT_GOALS={workouts:5,cardio:40,water:7,meals:5};
let selected=new Date();
let calendarMonth=new Date(selected.getFullYear(),selected.getMonth(),1);

const pad=n=>String(n).padStart(2,"0");
const keyFromDate=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseKey=k=>{const [y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d)};
const selectedKey=()=>keyFromDate(selected);
const todayKey=()=>keyFromDate(new Date());
const getDB=()=>JSON.parse(localStorage.getItem("painelV2")||'{"days":{},"settings":{}}');
const saveDB=db=>localStorage.setItem("painelV2",JSON.stringify(db));
const getDay=(k=selectedKey())=>getDB().days[k]||{};
const updateDay=(patch,k=selectedKey())=>{const db=getDB();db.days[k]={...(db.days[k]||{}),...patch};saveDB(db);refreshAll()};
const workoutFor=d=>DAY_MAP[d.getDay()]||null;
const goals=()=>({...DEFAULT_GOALS,...(getDB().settings.goals||{})});

function show(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===page));
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  if(page==="progresso")renderProgress();
  if(page==="calendario")renderCalendar();
  if(page==="config")renderSettings();
}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>show(b.dataset.page));

function dayScore(data=getDay(),date=selected){
  let pts=0,total=6;
  if((data.water||0)>=2200)pts++;
  if(MEALS.every((_,i)=>(data.meals||{})[i]?.done))pts++;
  if((data.cardio?.minutes||0)>0 || data.cardio?.walk)pts++;
  if(data.workoutDone || !workoutFor(date))pts++;
  if((data.sleepHours||0)>=7)pts++;
  const h=data.habits||{}; if(h.study||h.organize||h.sleepQuality)pts++;
  return Math.round(pts/total*100);
}
function dayHasData(d){return Object.keys(d||{}).length>0}
function formatDate(d){return d.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})}

function refreshHeader(){
  const wk=workoutFor(selected),w=wk?WORKOUTS[wk]:null,d=getDay();
  document.getElementById("selectedDateLabel").textContent=formatDate(selected);
  document.getElementById("selectedWorkout").textContent=w?w.name:"DESCANSO";
  document.getElementById("selectedWorkoutSub").textContent=w?w.sub:"Recuperação";
  document.getElementById("dailyScore").textContent=dayScore()+"%";
  document.getElementById("weightMini").textContent=d.bodyWeight?d.bodyWeight+" kg":"—";
  document.getElementById("sleepMini").textContent=d.sleepHours?d.sleepHours+" h":"—";
  document.getElementById("streakValue").textContent=calcStreak()+" dias";
}

function renderHome(){
  const d=getDay(), water=d.water||0, meals=d.meals||{}, c=d.cardio||{}, h=d.habits||{};
  document.getElementById("waterText").textContent=(water/1000).toFixed(2).replace(".",",")+" / 2,2 L";
  document.getElementById("waterBar").style.width=Math.min(100,water/2200*100)+"%";
  document.getElementById("sleepHours").value=d.sleepHours??"";
  document.getElementById("bodyWeight").value=d.bodyWeight??"";
  document.getElementById("cardioType").value=c.type||"";
  document.getElementById("cardioMinutes").value=c.minutes??"";
  document.getElementById("cardioDistance").value=c.distance??"";
  document.getElementById("cardioIntensity").value=c.intensity||"";
  document.getElementById("walkCheck").checked=!!c.walk;
  document.getElementById("cardioStatus").textContent=(c.minutes||0)+" min";
  document.getElementById("mealSummary").textContent=Object.values(meals).filter(x=>x.done).length+" / 4";
  document.getElementById("mealQuick").innerHTML=MEALS.map((m,i)=>{
    const x=meals[i]||{};
    return `<div class="meal-row">
      <input type="checkbox" data-meal-done="${i}" ${x.done?"checked":""}>
      <input type="time" data-meal-time="${i}" value="${x.time||""}">
      <input type="text" data-meal-note="${i}" value="${x.note||""}" placeholder="${m}">
    </div>`
  }).join("");
  document.getElementById("studyCheck").checked=!!h.study;
  document.getElementById("organizeCheck").checked=!!h.organize;
  document.getElementById("sleepQualityCheck").checked=!!h.sleepQuality;
  document.getElementById("workoutDoneCheck").checked=!!d.workoutDone;
  document.getElementById("dailyNotes").value=d.notes||"";
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-water]");
  if(b){const d=getDay();updateDay({water:(d.water||0)+Number(b.dataset.water)})}
});
document.getElementById("resetWater").onclick=()=>updateDay({water:0});
["sleepHours","bodyWeight"].forEach(id=>{
  document.getElementById(id).addEventListener("input",e=>{
    const db=getDB(); const k=selectedKey(); db.days[k]={...(db.days[k]||{}),[id]:e.target.value===""?"":Number(e.target.value)}; saveDB(db); refreshHeader();
  });
});
function saveCardio(){
  const c={type:cardioType.value,minutes:Number(cardioMinutes.value)||0,distance:Number(cardioDistance.value)||0,intensity:cardioIntensity.value,walk:walkCheck.checked};
  const db=getDB(),k=selectedKey();db.days[k]={...(db.days[k]||{}),cardio:c};saveDB(db);refreshHeader();
}
["cardioType","cardioMinutes","cardioDistance","cardioIntensity","walkCheck"].forEach(id=>document.getElementById(id).addEventListener("input",saveCardio));
document.addEventListener("input",e=>{
  const attrs=["meal-done","meal-time","meal-note"];
  const hit=attrs.find(a=>e.target.dataset[a.replace("-","")]!==undefined);
});
document.addEventListener("change",saveMealEvent);
document.addEventListener("input",saveMealEvent);
function saveMealEvent(e){
  let idx=null,type=null;
  if(e.target.dataset.mealDone!==undefined){idx=e.target.dataset.mealDone;type="done"}
  if(e.target.dataset.mealTime!==undefined){idx=e.target.dataset.mealTime;type="time"}
  if(e.target.dataset.mealNote!==undefined){idx=e.target.dataset.mealNote;type="note"}
  if(idx===null)return;
  const db=getDB(),k=selectedKey(),d=db.days[k]||{},m={...(d.meals||{})},x={...(m[idx]||{})};
  if(type==="done")x.done=e.target.checked; else x[type]=e.target.value;
  m[idx]=x;db.days[k]={...d,meals:m};saveDB(db);refreshHeader();if(type==="done")document.getElementById("mealSummary").textContent=Object.values(m).filter(v=>v.done).length+" / 4";
}
["study","organize","sleepQuality"].forEach(k=>document.getElementById(k+"Check").addEventListener("change",e=>{
  const d=getDay(),h={...(d.habits||{})};h[k]=e.target.checked;updateDay({habits:h});
}));
document.getElementById("workoutDoneCheck").addEventListener("change",e=>updateDay({workoutDone:e.target.checked}));
document.getElementById("dailyNotes").addEventListener("input",e=>{const db=getDB(),k=selectedKey();db.days[k]={...(db.days[k]||{}),notes:e.target.value};saveDB(db)});

function renderCalendar(){
  document.getElementById("monthTitle").textContent=calendarMonth.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
  const y=calendarMonth.getFullYear(),m=calendarMonth.getMonth(),first=new Date(y,m,1),start=new Date(y,m,1-first.getDay());
  let out="";
  for(let i=0;i<42;i++){
    const d=new Date(start);d.setDate(start.getDate()+i);
    const k=keyFromDate(d),data=getDay(k),score=dayScore(data,d),has=dayHasData(data);
    let cls=has?(score>=80?"complete":"partial"):"";
    out+=`<button class="daycell ${d.getMonth()!==m?"other":""} ${k===selectedKey()?"selected":""} ${k===todayKey()?"today":""} ${cls}" data-date="${k}">
      <span class="num">${d.getDate()}</span><div class="day-score">${has?score+"%":""}</div>
    </button>`;
  }
  calendarGrid.innerHTML=out;
  document.querySelectorAll(".daycell").forEach(b=>b.onclick=()=>{selected=parseKey(b.dataset.date);calendarMonth=new Date(selected.getFullYear(),selected.getMonth(),1);refreshAll();show("inicio")});
}
prevMonth.onclick=()=>{calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()-1,1);renderCalendar()};
nextMonth.onclick=()=>{calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,1);renderCalendar()};
todayBtn.onclick=()=>{selected=new Date();calendarMonth=new Date(selected.getFullYear(),selected.getMonth(),1);refreshAll();show("inicio")};

function exerciseKey(name){return name.toLowerCase()}
function getHistory(name,beforeKey=selectedKey()){
  const db=getDB(),arr=[];
  Object.entries(db.days).forEach(([k,d])=>{
    if(k>=beforeKey || !d.workout)return;
    Object.values(d.workout).forEach(ex=>{
      if(ex.name===name && ex.sets)arr.push({date:k,sets:ex.sets});
    });
  });
  return arr.sort((a,b)=>b.date.localeCompare(a.date));
}
function formatSets(sets){
  const vals=Object.values(sets||{}).map(s=>s.reps||"—");
  const kgs=Object.values(sets||{}).map(s=>s.kg).filter(v=>v!==""&&v!==undefined);
  const kg=kgs.length?kgs[0]+" kg":"—";
  return `${kg} — ${vals.join(" / ")}`;
}
function renderWorkout(){
  const wk=workoutFor(selected),container=workoutContainer;
  if(!wk){workoutTitle.textContent="DESCANSO";workoutSub.textContent=formatDate(selected);finishWorkoutBtn.style.display="none";container.innerHTML='<div class="rest-card"><div style="font-size:42px">😴</div><h3>Dia de descanso</h3><p>Sem treino programado.</p></div>';return}
  finishWorkoutBtn.style.display="";
  const w=WORKOUTS[wk],d=getDay(),log=d.workout||{};
  workoutTitle.textContent=w.name;workoutSub.textContent=formatDate(selected)+" · "+w.sub;
  container.innerHTML=w.ex.map((ex,i)=>{
    const saved=log[i]||{},last=getHistory(ex[0])[0];
    return `<div class="exercise" data-ex="${i}" data-name="${ex[0]}">
      <h3>${String(i+1).padStart(2,"0")} · ${ex[0]}</h3>
      <div class="meta">${ex[1]} séries · 8–12 reps</div>
      <div class="last-session">${last?"Último treino: "+formatSets(last.sets):"Sem histórico ainda"}</div>
      <div class="sets"><label></label><label>REPS</label><label>KG</label><label>✓</label>
      ${Array.from({length:ex[1]},(_,s)=>{const st=(saved.sets||{})[s]||{};return `<label>S${s+1}</label><input class="rep" data-set="${s}" type="number" value="${st.reps??""}" placeholder="—"><input class="kg" data-set="${s}" type="number" step="0.5" value="${st.kg??""}" placeholder="—"><input class="setdone" data-set="${s}" type="checkbox" ${st.done?"checked":""}>`}).join("")}
      </div><div class="hint"></div>
    </div>`
  }).join("");
  document.querySelectorAll(".exercise").forEach(card=>{
    const persist=()=>{
      const db=getDB(),k=selectedKey(),d=db.days[k]||{},workout={...(d.workout||{})},sets={};
      card.querySelectorAll(".rep").forEach(r=>{const s=r.dataset.set;sets[s]={reps:r.value===""?"":Number(r.value),kg:card.querySelector(`.kg[data-set="${s}"]`).value===""?"":Number(card.querySelector(`.kg[data-set="${s}"]`).value),done:card.querySelector(`.setdone[data-set="${s}"]`).checked}});
      workout[card.dataset.ex]={name:card.dataset.name,sets};db.days[k]={...d,workout};saveDB(db);updateHint(card);
    };
    card.querySelectorAll("input").forEach(i=>{i.addEventListener("input",persist);i.addEventListener("change",persist)});
    updateHint(card);
  });
}
function updateHint(card){
  const reps=[...card.querySelectorAll(".rep")].map(x=>Number(x.value)||0).filter(Boolean),h=card.querySelector(".hint");
  if(reps.some(r=>r>=13))h.textContent="🚀 13 reps atingidas — considere aumentar a carga no próximo treino.";
  else if(reps.some(r=>r>=8))h.textContent="✅ Dentro da faixa de progressão.";
  else h.textContent="";
}
finishWorkoutBtn.onclick=()=>updateDay({workoutDone:true});

function startOfWeek(d){
  const x=new Date(d);const day=x.getDay();const diff=(day===0?-6:1-day);x.setDate(x.getDate()+diff);x.setHours(0,0,0,0);return x;
}
function weekStats(){
  const start=startOfWeek(selected),end=new Date(start);end.setDate(end.getDate()+6);
  const db=getDB();let workouts=0,cardio=0,water=0,meals=0;
  Object.entries(db.days).forEach(([k,d])=>{const dt=parseKey(k);if(dt<start||dt>end)return;if(d.workoutDone)workouts++;cardio+=d.cardio?.minutes||0;if((d.water||0)>=2200)water++;if(MEALS.every((_,i)=>d.meals?.[i]?.done))meals++});
  return {workouts,cardio,water,meals};
}
function goalRow(label,val,target){
  const p=target?Math.min(100,val/target*100):100;
  return `<div class="goal"><div class="goal-top"><span>${label}</span><span>${val} / ${target}</span></div><div class="bar"><div style="width:${p}%"></div></div></div>`
}
function renderProgress(){
  const y=calendarMonth.getFullYear(),m=calendarMonth.getMonth(),db=getDB();
  const entries=Object.entries(db.days).filter(([k])=>{const d=parseKey(k);return d.getFullYear()===y&&d.getMonth()===m});
  let workouts=0,water=0,mealDays=0,cardio=0,sleep=[],weights=[],sumScore=0,scored=[];
  entries.forEach(([k,d])=>{if(d.workoutDone)workouts++;if((d.water||0)>=2200)water++;if(MEALS.every((_,i)=>d.meals?.[i]?.done))mealDays++;cardio+=d.cardio?.minutes||0;if(d.sleepHours)sleep.push(d.sleepHours);if(d.bodyWeight)weights.push(d.bodyWeight);const sc=dayScore(d,parseKey(k));sumScore+=sc;scored.push([k,sc])});
  summaryMonth.textContent=calendarMonth.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
  statWorkouts.textContent=workouts;statWater.textContent=water;statMeals.textContent=mealDays;statCardio.textContent=cardio;
  statAvgSleep.textContent=sleep.length?(sleep.reduce((a,b)=>a+b,0)/sleep.length).toFixed(1)+"h":"—";
  statAvgWeight.textContent=weights.length?(weights.reduce((a,b)=>a+b,0)/weights.length).toFixed(1)+"kg":"—";
  const avg=entries.length?Math.round(sumScore/entries.length):0;consistencyBar.style.width=avg+"%";consistencyText.textContent=entries.length?`${avg}% de média em ${entries.length} dias registrados.`:"Nenhum dia registrado.";
  const ws=weekStats(),g=goals();weeklyGoals.innerHTML=goalRow("Treinos",ws.workouts,g.workouts)+goalRow("Cardio (min)",ws.cardio,g.cardio)+goalRow("Meta de água",ws.water,g.water)+goalRow("Refeições 4/4",ws.meals,g.meals);
  scored.sort((a,b)=>b[1]-a[1]);bestDays.innerHTML=scored.slice(0,5).map(([k,sc])=>`<div class="best-day"><span>${parseKey(k).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}</span><b>${sc}%</b></div>`).join("")||'<p class="muted">Ainda sem registros.</p>';
  renderHistorySelector();
}
function allExerciseNames(){return [...new Set(Object.values(WORKOUTS).flatMap(w=>w.ex.map(e=>e[0])))].sort()}
function renderHistorySelector(){
  const current=historyExercise.value;
  historyExercise.innerHTML=allExerciseNames().map(n=>`<option>${n}</option>`).join("");
  if(current&&allExerciseNames().includes(current))historyExercise.value=current;
  renderExerciseHistory();
}
function renderExerciseHistory(){
  const name=historyExercise.value,db=getDB(),arr=[];
  Object.entries(db.days).forEach(([k,d])=>Object.values(d.workout||{}).forEach(ex=>{if(ex.name===name)arr.push({date:k,sets:ex.sets})}));
  arr.sort((a,b)=>b.date.localeCompare(a.date));
  exerciseHistory.innerHTML=arr.slice(0,12).map(x=>`<div class="history-item"><div><b>${parseKey(x.date).toLocaleDateString("pt-BR")}</b><br><small>${formatSets(x.sets)}</small></div>${Object.values(x.sets||{}).some(s=>(s.reps||0)>=13)?"<b>🚀</b>":""}</div>`).join("")||'<p class="muted">Sem histórico deste exercício.</p>';
}
historyExercise.addEventListener("change",renderExerciseHistory);

function calcStreak(){
  const db=getDB(),keys=Object.keys(db.days).sort().reverse();if(!keys.length)return 0;
  let d=new Date(),count=0;
  for(let i=0;i<365;i++){const k=keyFromDate(d),data=db.days[k];if(data&&dayScore(data,d)>=60)count++;else if(k!==todayKey())break;d.setDate(d.getDate()-1)}
  return count;
}
function renderSettings(){
  const g=goals();goalWorkouts.value=g.workouts;goalCardio.value=g.cardio;goalWater.value=g.water;goalMeals.value=g.meals;
}
saveGoals.onclick=()=>{const db=getDB();db.settings.goals={workouts:Number(goalWorkouts.value)||0,cardio:Number(goalCardio.value)||0,water:Number(goalWater.value)||0,meals:Number(goalMeals.value)||0};saveDB(db);renderProgress();alert("Metas salvas.")};
exportBtn.onclick=()=>{
  const blob=new Blob([JSON.stringify(getDB(),null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="backup-meu-painel.json";a.click();URL.revokeObjectURL(url);
};
importInput.addEventListener("change",async e=>{
  const file=e.target.files[0];if(!file)return;
  try{const data=JSON.parse(await file.text());if(!data.days)throw new Error();localStorage.setItem("painelV2",JSON.stringify(data));refreshAll();alert("Backup importado com sucesso.");}
  catch{alert("Arquivo de backup inválido.");}
  e.target.value="";
});

function refreshAll(){refreshHeader();renderHome();renderWorkout();renderCalendar();renderProgress()}
refreshAll();
