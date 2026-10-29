const DATA = window.CIA_NINJA_DATA;
const STORAGE_KEY = 'ciaNinjaState.v1';
const RANKS = [
  { name: 'Apprentice', min: 0 },
  { name: 'Shadow Auditor', min: 250 },
  { name: 'Katana Analyst', min: 650 },
  { name: 'Audit Samurai', min: 1200 },
  { name: 'CIA Shogun', min: 2200 }
];
const ROUTE_TITLES = {
  dashboard:'Dashboard', study:'Study Dojo', flashcards:'Flashcards', practice:'Practice Questions', mocks:'Mock Exams', planner:'Study Planner', weak:'Weak Areas', bookmarks:'Bookmarks', resources:'Resources', profile:'Profile', home:'Home', about:'About', privacy:'Privacy Policy', terms:'Terms', contact:'Contact', login:'Login', signup:'Signup'
};
let state = loadState();
let selectedPart = 'p1';
let selectedUnitId = DATA.curriculum[0].units[0].id;
let currentQuestionIndex = 0;
let flashIndex = 0;
let flashFlipped = false;
let mock = null;
let mockTimer = null;
let practiceFilters = { part:'all', unit:'all', diff:'all', hist:'all' };

const app = document.getElementById('app');
const pageTitle = document.getElementById('pageTitle');
const sidebar = document.getElementById('sidebar');
document.getElementById('menuBtn').addEventListener('click', () => sidebar.classList.toggle('open'));
document.addEventListener('click', e => { if(e.target.matches('.nav a')) sidebar.classList.remove('open'); });
window.addEventListener('hashchange', render);
window.addEventListener('load', render);

function loadState(){
  const fallback = { completed:[], bookmarks:[], questionBookmarks:[], questionHistory:{}, mockAttempts:[], planner:[], xp:0, streak:0, lastStudyDate:null, recent:[], profile:{name:'Bader', targetPart:'p1', examDate:''} };
  try { return { ...fallback, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) }; } catch { return fallback; }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); updateTopbar(); }
function toast(message){ const t=document.getElementById('toast'); t.textContent=message; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); }
function updateTopbar(){
  const rank = getRank();
  document.getElementById('xpPill').textContent = `${state.xp} XP`;
  document.getElementById('streakPill').textContent = `${state.streak || 0} day streak`;
  document.getElementById('sidebarRank').textContent = rank.name;
}
function getRank(){ return [...RANKS].reverse().find(r => state.xp >= r.min) || RANKS[0]; }
function route(){ return (location.hash.replace('#/','') || 'dashboard').split('?')[0]; }
function setTitle(name){ pageTitle.textContent = ROUTE_TITLES[name] || 'CIA Ninja'; document.title = `${pageTitle.textContent} | CIA Ninja`; }
function render(){
  const r = route(); setTitle(r); updateTopbar(); setActiveNav(r);
  if(mockTimer) { clearInterval(mockTimer); mockTimer = null; }
  const routes = { dashboard:renderDashboard, study:renderStudy, flashcards:renderFlashcards, practice:renderPractice, mocks:renderMocks, planner:renderPlanner, weak:renderWeak, bookmarks:renderBookmarks, resources:renderResources, profile:renderProfile, home:renderHome, about:renderAbout, privacy:renderPrivacy, terms:renderTerms, contact:renderContact, login:renderLogin, signup:renderSignup };
  (routes[r] || renderDashboard)();
}
function setActiveNav(r){ document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('active', a.dataset.route === r)); }
function allUnits(){ return DATA.curriculum.flatMap(p => p.units.map(u => ({...u, part:p}))); }
function allFlashcards(){ return allUnits().flatMap(u => u.flashcards.map((f,i)=>({...f, id:`${u.id}-f${i}`, unitId:u.id, unitTitle:u.title, part:u.part.id, partTitle:u.part.title}))); }
function unitById(id){ return allUnits().find(u => u.id === id); }
function pct(a,b){ return b ? Math.round((a/b)*100) : 0; }
function progressForPart(partId){ const units=allUnits().filter(u=>u.part.id===partId); return pct(units.filter(u=>state.completed.includes(u.id)).length, units.length); }
function totalProgress(){ const units=allUnits(); return pct(units.filter(u=>state.completed.includes(u.id)).length, units.length); }
function addRecent(text){ state.recent = [{text, date:new Date().toLocaleString()}, ...(state.recent||[])].slice(0,8); }
function awardXP(points, msg){ state.xp += points; state.streak = state.streak || 1; addRecent(`${msg} (+${points} XP)`); saveState(); }
function optionList(items){ return `<ul class="list">${items.map(x=>`<li>${escapeHTML(x)}</li>`).join('')}</ul>`; }
function escapeHTML(s){ return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }
function partLabel(id){ return DATA.curriculum.find(p=>p.id===id)?.title || id; }
function bookmarkKey(type,id){ return `${type}:${id}`; }
function isBookmarked(type,id){ return state.bookmarks.includes(bookmarkKey(type,id)); }
function toggleBookmark(type,id,label){
  const key=bookmarkKey(type,id);
  state.bookmarks = state.bookmarks.includes(key) ? state.bookmarks.filter(x=>x!==key) : [...state.bookmarks,key];
  addRecent(`${state.bookmarks.includes(key) ? 'Bookmarked' : 'Removed bookmark'}: ${label}`);
  saveState(); toast(state.bookmarks.includes(key) ? 'Added to bookmarks' : 'Removed from bookmarks'); render();
}

function renderHome(){
  app.innerHTML = `
  <section class="hero">
    <p class="eyebrow">For working internal auditors</p>
    <h2>Train for the CIA exam inside a focused audit dojo.</h2>
    <p>CIA Ninja combines flexible study units, original practice questions, flashcards, mock exams, planner missions, bookmarks, XP, ranks, and weak-area review in one responsive study platform.</p>
    <div class="hero-actions"><a class="btn" href="#/dashboard">Enter Dashboard</a><a class="btn secondary" href="#/study">Open Study Dojo</a></div>
  </section>
  ${renderMarketingBlocks()}`;
}
function renderMarketingBlocks(){
  return `<section class="section grid three">
    <div class="card"><span class="badge">🥷</span><h3>Flexible Dashboard</h3><p>Jump freely between parts, units, questions, flashcards, mocks, planner tasks, and resources.</p></div>
    <div class="card"><span class="badge">⚔️</span><h3>Exam Combat Mode</h3><p>Practice questions include explanations, topic tags, difficulty, answer history, and bookmarks.</p></div>
    <div class="card"><span class="badge">🏯</span><h3>Working Auditor Focus</h3><p>Original lesson notes use practical internal-audit scenarios, not copied commercial explanations.</p></div>
  </section>`;
}

function renderDashboard(){
  const units=allUnits();
  const answered=Object.values(state.questionHistory||{});
  const correct=answered.filter(x=>x.correct).length;
  const weak=getWeakTopics().slice(0,5);
  const rec=weak[0] ? `Review ${weak[0].topic} flashcards` : 'Complete your next unfinished study unit';
  app.innerHTML = `
  <section class="hero">
    <p class="eyebrow">Dojo Command Center</p>
    <h2>Sharpen your CIA exam readiness.</h2>
    <p>Track progress across all CIA parts, continue your recent missions, and attack weak topics first.</p>
    <div class="hero-actions"><a class="btn" href="#/study">Continue Study</a><a class="btn secondary" href="#/practice">Drill Questions</a><a class="btn secondary" href="#/mocks">Start Mock</a></div>
  </section>
  <section class="section grid four">
    <div class="card metric"><div><span class="label">Overall progress</span><strong>${totalProgress()}%</strong><p>${state.completed.length}/${units.length} units complete</p></div><div class="ring" style="--p:${totalProgress()}"><span>${totalProgress()}%</span></div></div>
    <div class="card metric"><div><span class="label">Question accuracy</span><strong>${pct(correct,answered.length)}%</strong><p>${answered.length} answered</p></div></div>
    <div class="card metric"><div><span class="label">XP / Rank</span><strong>${state.xp}</strong><p>${getRank().name}</p></div></div>
    <div class="card metric"><div><span class="label">Study streak</span><strong>${state.streak || 0}</strong><p>days in motion</p></div></div>
  </section>
  <section class="section grid three">
    ${DATA.curriculum.map(p=>`<div class="card"><h3>${p.title}</h3><p>${p.subtitle}</p><div class="progress"><span style="width:${progressForPart(p.id)}%"></span></div><p class="muted">${progressForPart(p.id)}% complete</p></div>`).join('')}
  </section>
  <section class="section grid two">
    <div class="card"><h3>Recommended Next Mission</h3><p>${rec}</p><a class="btn" href="${weak[0] ? '#/weak' : '#/study'}">Launch mission</a><div class="katana-line"></div><h4>Bookmarked Topics</h4>${renderBookmarkChips()}</div>
    <div class="card"><h3>Recent Study Activity</h3>${(state.recent||[]).length ? optionList((state.recent||[]).map(r=>`${r.text} — ${r.date}`)) : '<div class="empty">No activity yet. Start with Study Dojo.</div>'}</div>
  </section>
  <section class="section grid two">
    <div class="card"><h3>Weak Topics</h3>${weak.length ? renderWeakTable(weak) : '<div class="empty">No weak topics yet. Answer practice questions to generate analysis.</div>'}</div>
    <div class="card"><h3>Mock Exam Scores</h3>${renderMockSummary()}</div>
  </section>`;
}
function renderBookmarkChips(){
  if(!state.bookmarks.length) return '<p class="muted">No bookmarks yet.</p>';
  return `<div class="tag-list">${state.bookmarks.slice(0,8).map(b=>`<span class="tag gold">${escapeHTML(b.split(':')[1])}</span>`).join('')}</div>`;
}
function renderMockSummary(){
  if(!state.mockAttempts.length) return '<div class="empty">No mock attempts yet.</div>';
  return `<table class="table"><tr><th>Part</th><th>Score</th><th>Date</th></tr>${state.mockAttempts.slice(0,5).map(a=>`<tr><td>${partLabel(a.part)}</td><td>${a.score}%</td><td>${a.date}</td></tr>`).join('')}</table>`;
}

function renderStudy(){
  const part = DATA.curriculum.find(p=>p.id===selectedPart) || DATA.curriculum[0];
  const selected = unitById(selectedUnitId) || part.units[0];
  if(!selectedUnitId || selected.part.id !== selectedPart) selectedUnitId = part.units[0].id;
  app.innerHTML = `
    <div class="tabs">${DATA.curriculum.map(p=>`<button class="tab ${p.id===selectedPart?'active':''}" onclick="selectPart('${p.id}')">${p.title}</button>`).join('')}</div>
    <section class="section grid three">
      ${part.units.map(u=>renderUnitCard({...u, part})).join('')}
    </section>
    <section class="section lesson-layout">
      <aside class="lesson-menu card">
        <span class="label">Selected Dojo</span>
        <h3>${selected.title}</h3>
        ${part.units.map(u=>`<button class="btn ${u.id===selectedUnitId?'':'secondary'} small" onclick="selectUnit('${u.id}')">SU ${u.number}: ${u.title}</button>`).join('')}
      </aside>
      <article class="lesson-content card">${renderUnitDetail(selected)}</article>
    </section>`;
}
window.selectPart = id => { selectedPart=id; selectedUnitId = DATA.curriculum.find(p=>p.id===id).units[0].id; renderStudy(); };
window.selectUnit = id => { selectedUnitId=id; renderStudy(); };
function renderUnitCard(u){
  const done = state.completed.includes(u.id);
  return `<div class="card unit-card" onclick="selectUnit('${u.id}')"><div class="metric"><div><span class="label">${u.part.title} • SU ${u.number}</span><h3>${u.title}</h3></div><span class="badge">${done?'✓':'刀'}</span></div><p>${u.overview}</p><div class="tag-list">${u.topics.slice(0,4).map(t=>`<span class="tag">${t}</span>`).join('')}</div><div class="progress"><span style="width:${done?100:20}%"></span></div></div>`;
}
function renderUnitDetail(u){
  const done = state.completed.includes(u.id);
  const bookmarked = isBookmarked('unit',u.id);
  return `<span class="label">${u.part.title} • Study Unit ${u.number}</span><h2>${u.title}</h2><p>${u.overview}</p>
  <div class="hero-actions"><button class="btn" onclick="markComplete('${u.id}')">${done?'Completed':'Mark Complete'}</button><button class="btn secondary" onclick="toggleBookmark('unit','${u.id}','${escapeJS(u.title)}')">${bookmarked?'Remove Bookmark':'Bookmark Unit'}</button><a class="btn secondary" href="#/practice">Practice This Area</a></div>
  <div class="katana-line"></div>
  <h3>Learning Objectives</h3>${optionList(u.objectives)}
  <h3>Original Lesson Notes</h3>${optionList(u.lessonNotes)}
  <h3>Key Concepts</h3>${optionList(u.keyConcepts)}
  <h3>Important Definitions</h3><table class="table"><tr><th>Term</th><th>Definition</th></tr>${u.definitions.map(d=>`<tr><td>${d.term}</td><td>${d.definition}</td></tr>`).join('')}</table>
  <div class="grid two section"><div><h3>Exam-Focus Points</h3>${optionList(u.examFocus)}</div><div><h3>Common Mistakes</h3>${optionList(u.commonMistakes)}</div></div>
  <h3>Practical Internal-Audit Examples</h3>${optionList(u.examples)}
  <h3>Review Checklist</h3>${optionList(u.checklist)}`;
}
function escapeJS(s){ return String(s).replace(/'/g,"\\'"); }
window.markComplete = id => {
  const u=unitById(id);
  if(!state.completed.includes(id)){ state.completed.push(id); awardXP(40, `Completed ${u.title}`); toast('Unit completed. XP awarded.'); }
  render();
};

function renderFlashcards(){
  const cards = allFlashcards().filter(c => !selectedPart || c.part === selectedPart);
  const card = cards[flashIndex % cards.length];
  app.innerHTML = `<section class="card"><div class="toolbar"><div class="field" style="max-width:260px"><label>CIA Part</label><select onchange="selectedPart=this.value; flashIndex=0; renderFlashcards()">${DATA.curriculum.map(p=>`<option value="${p.id}" ${p.id===selectedPart?'selected':''}>${p.title}</option>`).join('')}</select></div><span class="pill">${cards.length} cards</span><span class="pill gold">Click card to flip</span></div>
  <div class="flashcard ${flashFlipped?'flipped':''}" onclick="flashFlipped=!flashFlipped; renderFlashcards()"><div class="flash-inner"><div><span class="label">${card.partTitle} • ${card.unitTitle}</span><strong>${flashFlipped ? card.back : card.front}</strong><p class="muted">Topic: ${card.topic}</p></div></div></div>
  <div class="hero-actions"><button class="btn secondary" onclick="prevFlash()">Previous</button><button class="btn" onclick="nextFlash()">Know it • +5 XP</button><button class="btn secondary" onclick="toggleBookmark('flash','${card.id}','${escapeJS(card.topic)}')">${isBookmarked('flash',card.id)?'Remove Bookmark':'Bookmark'}</button></div></section>`;
}
window.nextFlash = () => { awardXP(5,'Reviewed flashcard'); flashIndex++; flashFlipped=false; renderFlashcards(); };
window.prevFlash = () => { flashIndex = Math.max(0, flashIndex-1); flashFlipped=false; renderFlashcards(); };

function filteredQuestions(){
  const {part, unit, diff, hist} = practiceFilters;
  return DATA.questions.filter(q =>
    (part==='all'||q.part===part) && (unit==='all'||q.unitId===unit) && (diff==='all'||q.difficulty===diff) &&
    (hist==='all'||(hist==='correct'&&state.questionHistory[q.id]?.correct)||(hist==='incorrect'&&state.questionHistory[q.id]&&!state.questionHistory[q.id].correct)||(hist==='unanswered'&&!state.questionHistory[q.id])||(hist==='bookmarked'&&state.questionBookmarks.includes(q.id)))
  );
}
function renderPractice(){
  const units=allUnits();
  const qs=filteredQuestions();
  if(currentQuestionIndex>=qs.length) currentQuestionIndex=0;
  const q=qs[currentQuestionIndex];
  app.innerHTML = `<section class="card"><div class="grid four">
    <div class="field"><label>Part</label><select id="filterPart" onchange="setPracticeFilter('part', this.value)"><option value="all" ${practiceFilters.part==='all'?'selected':''}>All Parts</option>${DATA.curriculum.map(p=>`<option value="${p.id}" ${practiceFilters.part===p.id?'selected':''}>${p.title}</option>`).join('')}</select></div>
    <div class="field"><label>Study Unit</label><select id="filterUnit" onchange="setPracticeFilter('unit', this.value)"><option value="all" ${practiceFilters.unit==='all'?'selected':''}>All Units</option>${units.map(u=>`<option value="${u.id}" ${practiceFilters.unit===u.id?'selected':''}>${u.part.title} SU${u.number}: ${u.title}</option>`).join('')}</select></div>
    <div class="field"><label>Difficulty</label><select id="filterDiff" onchange="setPracticeFilter('diff', this.value)"><option value="all" ${practiceFilters.diff==='all'?'selected':''}>All</option>${['Easy','Medium','Hard'].map(d=>`<option value="${d}" ${practiceFilters.diff===d?'selected':''}>${d}</option>`).join('')}</select></div>
    <div class="field"><label>History</label><select id="filterHist" onchange="setPracticeFilter('hist', this.value)"><option value="all" ${practiceFilters.hist==='all'?'selected':''}>All</option><option value="correct" ${practiceFilters.hist==='correct'?'selected':''}>Correct</option><option value="incorrect" ${practiceFilters.hist==='incorrect'?'selected':''}>Incorrect</option><option value="unanswered" ${practiceFilters.hist==='unanswered'?'selected':''}>Unanswered</option><option value="bookmarked" ${practiceFilters.hist==='bookmarked'?'selected':''}>Bookmarked</option></select></div>
  </div></section><section class="section">${q ? renderQuestion(q, qs) : '<div class="empty">No questions match the selected filters.</div>'}</section>`;
}
window.setPracticeFilter=(key,value)=>{ practiceFilters[key]=value; currentQuestionIndex=0; renderPractice(); };
function renderQuestion(q, qs){
  const h=state.questionHistory[q.id];
  return `<div class="card question-card"><div class="metric"><div><span class="label">${q.partTitle} • SU ${q.unitNumber} • ${q.difficulty}</span><h3>${currentQuestionIndex+1}. ${q.stem}</h3></div><button class="btn secondary small" onclick="toggleQuestionBookmark('${q.id}')">${state.questionBookmarks.includes(q.id)?'★ Bookmarked':'☆ Bookmark'}</button></div><p class="muted">Topic: ${q.topic}</p>
  ${q.choices.map((c,i)=>`<button class="choice ${h ? (i===q.answer?'correct':(h.selected===i?'wrong':'')) : ''}" onclick="answerQuestion('${q.id}',${i})">${String.fromCharCode(65+i)}. ${c}</button>`).join('')}
  ${h ? `<div class="answer-box"><strong>${h.correct?'Correct':'Incorrect'}</strong><p><b>Correct answer:</b> ${String.fromCharCode(65+q.answer)}. ${q.choices[q.answer]}</p><p>${q.explanation}</p><h4>Why the other choices are less appropriate</h4>${optionList(q.whyWrong.map((w,i)=>`${String.fromCharCode(65+i)}. ${w}`))}</div>` : ''}
  <div class="hero-actions"><button class="btn secondary" onclick="currentQuestionIndex=Math.max(0,currentQuestionIndex-1);renderPractice()">Previous</button><button class="btn" onclick="currentQuestionIndex=Math.min(${qs.length-1},currentQuestionIndex+1);renderPractice()">Next</button><span class="pill">${currentQuestionIndex+1}/${qs.length}</span></div></div>`;
}
window.answerQuestion = (id, selected) => {
  const q=DATA.questions.find(x=>x.id===id); const correct = selected === q.answer;
  const previous = state.questionHistory[id]; state.questionHistory[id] = {selected, correct, topic:q.topic, part:q.part, unitId:q.unitId, date:new Date().toISOString()};
  if(!previous) awardXP(correct ? 12 : 4, `Answered ${q.topic}`); else saveState();
  toast(correct ? 'Correct. Katana strike.' : 'Incorrect. Review the explanation.'); renderPractice();
};
window.toggleQuestionBookmark = id => { state.questionBookmarks = state.questionBookmarks.includes(id) ? state.questionBookmarks.filter(x=>x!==id) : [...state.questionBookmarks,id]; saveState(); renderPractice(); };

function renderMocks(){
  if(mock) return renderMockActive();
  app.innerHTML = `<section class="hero"><p class="eyebrow">Timed Combat</p><h2>Mock Exams</h2><p>Start a timed exam by CIA part. Review score, topic performance, weak areas, correct answers, and flagged questions after submission.</p></section>
  <section class="section grid three">${DATA.curriculum.map(p=>`<div class="card"><span class="badge">⏱️</span><h3>${p.title}</h3><p>${p.subtitle}</p><p class="muted">25 questions • 35 minutes • local attempt history</p><button class="btn" onclick="startMock('${p.id}')">Start ${p.title} Mock</button></div>`).join('')}</section>
  <section class="section card"><h3>Previous Attempts</h3>${renderMockSummary()}</section>`;
}
window.startMock = part => {
  const pool=DATA.questions.filter(q=>q.part===part);
  const questions=[...pool].sort(()=>Math.random()-.5).slice(0, Math.min(25,pool.length));
  mock={part, questions, index:0, answers:{}, flagged:[], seconds:35*60, started:new Date().toISOString()};
  renderMockActive();
};
function renderMockActive(){
  if(!mock) return renderMocks();
  const q=mock.questions[mock.index];
  app.innerHTML = `<section class="mock-shell"><div class="card question-card"><span class="label">${partLabel(mock.part)} Mock Exam</span><h3>${mock.index+1}. ${q.stem}</h3><p class="muted">Topic: ${q.topic} • Difficulty: ${q.difficulty}</p>${q.choices.map((c,i)=>`<button class="choice ${mock.answers[q.id]===i?'correct':''}" onclick="mockAnswer('${q.id}',${i})">${String.fromCharCode(65+i)}. ${c}</button>`).join('')}
  <div class="hero-actions"><button class="btn secondary" onclick="mock.index=Math.max(0,mock.index-1);renderMockActive()">Previous</button><button class="btn" onclick="mock.index=Math.min(mock.questions.length-1,mock.index+1);renderMockActive()">Next</button><button class="btn secondary" onclick="flagMock('${q.id}')">${mock.flagged.includes(q.id)?'Unflag':'Flag for Review'}</button><button class="btn danger" onclick="submitMock()">Submit Mock</button></div></div><aside class="card"><span class="label">Countdown</span><div class="timer" id="mockTimer">${formatTime(mock.seconds)}</div><p>${Object.keys(mock.answers).length}/${mock.questions.length} answered</p><div class="qnav">${mock.questions.map((x,i)=>`<button class="${i===mock.index?'active':''} ${mock.flagged.includes(x.id)?'flagged':''}" onclick="mock.index=${i};renderMockActive()">${i+1}</button>`).join('')}</div></aside></section>`;
  startTimer();
}
function startTimer(){ if(mockTimer) clearInterval(mockTimer); mockTimer=setInterval(()=>{ if(!mock) return clearInterval(mockTimer); mock.seconds--; const el=document.getElementById('mockTimer'); if(el) el.textContent=formatTime(mock.seconds); if(mock.seconds<=0) submitMock(true); },1000); }
function formatTime(s){ const m=Math.floor(s/60), sec=s%60; return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; }
window.mockAnswer=(id,i)=>{ mock.answers[id]=i; renderMockActive(); };
window.flagMock=id=>{ mock.flagged = mock.flagged.includes(id) ? mock.flagged.filter(x=>x!==id) : [...mock.flagged,id]; renderMockActive(); };
window.submitMock=(auto=false)=>{
  if(!mock) return;
  if(!auto && !confirm('Submit this mock exam now?')) return;
  const results=mock.questions.map(q=>({q, selected:mock.answers[q.id], correct:mock.answers[q.id]===q.answer}));
  const score=pct(results.filter(r=>r.correct).length, results.length);
  const attempt={part:mock.part, score, date:new Date().toLocaleString(), results:results.map(r=>({id:r.q.id, selected:r.selected, correct:r.correct, topic:r.q.topic}))};
  state.mockAttempts=[attempt,...state.mockAttempts].slice(0,10); awardXP(Math.max(25, Math.round(score/2)), `Completed ${partLabel(mock.part)} mock`);
  mock=null; saveState(); renderMockResults(attempt, results);
};
function renderMockResults(attempt, results){
  const byTopic={}; results.forEach(r=>{ byTopic[r.q.topic]=byTopic[r.q.topic]||{total:0,correct:0}; byTopic[r.q.topic].total++; if(r.correct) byTopic[r.q.topic].correct++; });
  app.innerHTML = `<section class="hero"><p class="eyebrow">Mock Complete</p><h2>Score: ${attempt.score}%</h2><p>${partLabel(attempt.part)} • ${attempt.date}</p><div class="hero-actions"><a class="btn" href="#/mocks">Retake Option</a><a class="btn secondary" href="#/weak">Review Weak Areas</a></div></section>
  <section class="section grid two"><div class="card"><h3>Topic Performance</h3><table class="table"><tr><th>Topic</th><th>Score</th></tr>${Object.entries(byTopic).map(([t,v])=>`<tr><td>${t}</td><td>${pct(v.correct,v.total)}%</td></tr>`).join('')}</table></div><div class="card"><h3>Weak-Area Analysis</h3>${renderWeakTable(getWeakTopics().slice(0,6))}</div></section>
  <section class="section card"><h3>Correct and Incorrect Review</h3>${results.map((r,i)=>`<div class="answer-box"><span class="label">Question ${i+1} • ${r.q.topic}</span><p>${r.q.stem}</p><p><b>Your answer:</b> ${r.selected==null?'Not answered':String.fromCharCode(65+r.selected)} ${r.selected==null?'':r.q.choices[r.selected]}</p><p><b>Correct answer:</b> ${String.fromCharCode(65+r.q.answer)}. ${r.q.choices[r.q.answer]}</p><p>${r.q.explanation}</p></div>`).join('')}</section>`;
}

function getWeakTopics(){
  const map={};
  Object.values(state.questionHistory||{}).forEach(h=>{ map[h.topic]=map[h.topic]||{topic:h.topic,total:0,missed:0,part:h.part,unitId:h.unitId}; map[h.topic].total++; if(!h.correct) map[h.topic].missed++; });
  (state.mockAttempts||[]).forEach(a=>a.results.forEach(r=>{ map[r.topic]=map[r.topic]||{topic:r.topic,total:0,missed:0,part:a.part,unitId:null}; map[r.topic].total++; if(!r.correct) map[r.topic].missed++; }));
  return Object.values(map).filter(x=>x.missed>0).map(x=>({...x,severity:pct(x.missed,x.total)})).sort((a,b)=>b.severity-a.severity||b.missed-a.missed);
}
function renderWeak(){ const weak=getWeakTopics(); app.innerHTML = `<section class="hero"><p class="eyebrow">Weak-Area Review</p><h2>Attack the weakest topics first.</h2><p>Topics are ranked by missed-answer severity from practice and mock attempts.</p></section><section class="section card">${weak.length?renderWeakTable(weak,true):'<div class="empty">No weak areas yet. Answer questions or complete a mock exam.</div>'}</section>`; }
function renderWeakTable(weak, detailed=false){
  if(!weak.length) return '<div class="empty">No weak areas currently available.</div>';
  return `<table class="table"><tr><th>Topic</th><th>Missed</th><th>Severity</th>${detailed?'<th>Recommended Action</th>':''}</tr>${weak.map(w=>`<tr><td>${w.topic}</td><td>${w.missed}/${w.total}</td><td>${w.severity}%</td>${detailed?`<td><a class="btn small" href="#/flashcards">Flashcards</a> <a class="btn secondary small" href="#/practice">Practice</a></td>`:''}</tr>`).join('')}</table>`;
}

function renderPlanner(){
  app.innerHTML = `<section class="grid two"><div class="card"><h3>Generate Personalized Study Schedule</h3><div class="grid two"><div class="field"><label>Exam Date</label><input class="input" id="examDate" type="date" value="${state.profile.examDate||''}"></div><div class="field"><label>CIA Part</label><select id="planPart">${DATA.curriculum.map(p=>`<option value="${p.id}" ${state.profile.targetPart===p.id?'selected':''}>${p.title}</option>`).join('')}</select></div><div class="field"><label>Days available per week</label><input class="input" id="daysWeek" type="number" min="1" max="7" value="5"></div><div class="field"><label>Study hours per day</label><input class="input" id="hoursDay" type="number" min="1" max="8" value="1"></div></div><div class="hero-actions"><button class="btn" onclick="generatePlan()">Generate Study Missions</button><button class="btn secondary" onclick="state.planner=[];saveState();renderPlanner()">Clear Plan</button></div></div><div class="card"><h3>Upcoming Study Missions</h3>${renderPlan()}</div></section>`;
}
window.generatePlan=()=>{
  const partId=document.getElementById('planPart').value; const date=document.getElementById('examDate').value; const days=Number(document.getElementById('daysWeek').value||5); const hours=Number(document.getElementById('hoursDay').value||1);
  const units=DATA.curriculum.find(p=>p.id===partId).units; const tasks=[]; let d=new Date();
  const maxTasks = units.length * 3;
  for(let i=0;i<maxTasks;i++){
    d.setDate(d.getDate()+1); if((i % 7) >= days) d.setDate(d.getDate()+1);
    const u=units[i % units.length]; const type=['Lesson notes','Flashcards','Practice questions'][i%3];
    tasks.push({id:`task-${Date.now()}-${i}`, date:d.toISOString().slice(0,10), title:`${type}: SU ${u.number} ${u.title}`, part:partId, unitId:u.id, hours, complete:false});
  }
  state.profile.examDate=date; state.profile.targetPart=partId; state.planner=tasks; awardXP(20,'Generated study planner'); renderPlanner();
};
function renderPlan(){ if(!state.planner.length) return '<div class="empty">No plan yet. Generate your study missions.</div>'; return state.planner.slice(0,12).map(t=>`<div class="planner-day"><span class="label">${t.date} • ${t.hours}h</span><h4>${t.title}</h4><button class="btn small ${t.complete?'secondary':''}" onclick="toggleTask('${t.id}')">${t.complete?'Completed':'Mark Complete'}</button> <button class="btn secondary small" onclick="rescheduleTask('${t.id}')">Reschedule +1 day</button></div>`).join(''); }
window.toggleTask=id=>{ const t=state.planner.find(x=>x.id===id); if(t){ t.complete=!t.complete; if(t.complete) awardXP(15,'Completed planner mission'); else saveState(); renderPlanner(); }};
window.rescheduleTask=id=>{ const t=state.planner.find(x=>x.id===id); if(t){ const d=new Date(t.date); d.setDate(d.getDate()+1); t.date=d.toISOString().slice(0,10); saveState(); renderPlanner(); }};

function renderBookmarks(){
  const unitMarks=state.bookmarks.filter(b=>b.startsWith('unit:')).map(b=>unitById(b.split(':')[1])).filter(Boolean);
  const flashMarks=state.bookmarks.filter(b=>b.startsWith('flash:'));
  const qMarks=state.questionBookmarks.map(id=>DATA.questions.find(q=>q.id===id)).filter(Boolean);
  app.innerHTML = `<section class="grid three"><div class="card"><h3>Bookmarked Units</h3>${unitMarks.length?optionList(unitMarks.map(u=>`${u.part.title} SU${u.number}: ${u.title}`)):'<div class="empty">No unit bookmarks.</div>'}</div><div class="card"><h3>Bookmarked Flashcards</h3>${flashMarks.length?optionList(flashMarks):'<div class="empty">No flashcard bookmarks.</div>'}</div><div class="card"><h3>Bookmarked Questions</h3>${qMarks.length?optionList(qMarks.map(q=>`${q.partTitle} • ${q.topic}`)):'<div class="empty">No question bookmarks.</div>'}</div></section>`;
}

function renderResources(){
  app.innerHTML = `<section class="hero"><p class="eyebrow">Resource Armory</p><h2>Downloadable-ready study assets.</h2><p>These resources are structured as internal-audit study tools and can later be connected to file downloads or CMS records.</p></section><section class="section grid two">${DATA.resources.map(r=>`<div class="card"><span class="label">${r.type}</span><h3>${r.title}</h3><p>${r.desc}</p><a class="btn secondary" href="${r.link}">Open</a></div>`).join('')}</section><section class="section card"><h3>Site Pages</h3><div class="footer-links"><a class="btn secondary small" href="#/home">Home</a><a class="btn secondary small" href="#/about">About</a><a class="btn secondary small" href="#/privacy">Privacy Policy</a><a class="btn secondary small" href="#/terms">Terms</a><a class="btn secondary small" href="#/contact">Contact</a><a class="btn secondary small" href="#/login">Login</a><a class="btn secondary small" href="#/signup">Signup</a></div></section>`;
}
function renderProfile(){
  app.innerHTML = `<section class="grid two"><div class="card login-card"><h3>Student Profile</h3><div class="field"><label>Name</label><input class="input" id="profileName" value="${escapeHTML(state.profile.name||'')}"></div><div class="field"><label>Target Part</label><select id="profilePart">${DATA.curriculum.map(p=>`<option value="${p.id}" ${state.profile.targetPart===p.id?'selected':''}>${p.title}</option>`).join('')}</select></div><div class="field"><label>Exam Date</label><input class="input" id="profileExam" type="date" value="${state.profile.examDate||''}"></div><div class="hero-actions"><button class="btn" onclick="saveProfile()">Save Profile</button><button class="btn secondary" onclick="exportProgress()">Export Progress JSON</button></div></div><div class="card"><h3>Achievements</h3><div class="grid two"><div><span class="badge">${state.completed.length?'🏯':'🔒'}</span><h4>Dojo Starter</h4><p>Complete one study unit.</p></div><div><span class="badge">${Object.keys(state.questionHistory).length>=10?'⚔️':'🔒'}</span><h4>Question Blade</h4><p>Answer 10 practice questions.</p></div><div><span class="badge">${state.mockAttempts.length?'⏱️':'🔒'}</span><h4>Mock Warrior</h4><p>Finish one mock exam.</p></div><div><span class="badge">${state.xp>=650?'🥷':'🔒'}</span><h4>Katana Analyst</h4><p>Reach 650 XP.</p></div></div></div></section>`;
}
window.saveProfile=()=>{ state.profile.name=document.getElementById('profileName').value; state.profile.targetPart=document.getElementById('profilePart').value; state.profile.examDate=document.getElementById('profileExam').value; saveState(); toast('Profile saved.'); };
window.exportProgress=()=>{ const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='cia-ninja-progress.json'; a.click(); };

function renderAbout(){ app.innerHTML=`<section class="card"><h2>About CIA Ninja</h2><p>CIA Ninja is a responsive exam-preparation platform for working internal auditors. It provides flexible navigation across study units, flashcards, original questions, mock exams, weak-area review, planner missions, bookmarks, progress tracking, XP, and ranks.</p><p>The design uses a premium ninja and samurai visual identity while keeping long-form study pages readable.</p></section>`; }
function renderPrivacy(){ app.innerHTML=`<section class="card"><h2>Privacy Policy</h2><p>This static version stores progress locally in your browser using localStorage. No data is transmitted to a server unless you later connect a backend.</p><p>Do not enter sensitive personal data. A production deployment should add authentication, encryption, retention rules, and consent notices.</p></section>`; }
function renderTerms(){ app.innerHTML=`<section class="card"><h2>Terms</h2><p>CIA Ninja is an educational study tool. It does not guarantee exam results and should be used together with official CIA exam guidance and ethical study practices.</p><p>Course content and questions in this package are original and should not reproduce proprietary commercial test-bank questions.</p></section>`; }
function renderContact(){ app.innerHTML=`<section class="card login-card"><h2>Contact</h2><p>Use this page as a placeholder for support routing.</p><div class="field"><label>Name</label><input class="input"></div><div class="field"><label>Email</label><input class="input"></div><div class="field"><label>Message</label><textarea rows="5"></textarea></div><button class="btn" onclick="toast('Static demo: connect a backend to send messages.')">Send Message</button></section>`; }
function renderLogin(){ app.innerHTML=`<section class="card login-card"><h2>Login</h2><p class="muted">Static demo authentication screen. Connect a backend to activate real accounts.</p><div class="field"><label>Email</label><input class="input" type="email"></div><div class="field"><label>Password</label><input class="input" type="password"></div><button class="btn" onclick="toast('Demo login only. Progress is saved locally.')">Login</button></section>`; }
function renderSignup(){ app.innerHTML=`<section class="card login-card"><h2>Signup</h2><p class="muted">Static demo signup screen. Connect a backend for production accounts.</p><div class="field"><label>Name</label><input class="input"></div><div class="field"><label>Email</label><input class="input" type="email"></div><div class="field"><label>Password</label><input class="input" type="password"></div><button class="btn" onclick="toast('Demo signup only. Local progress is active.')">Create Account</button></section>`; }

updateTopbar();
