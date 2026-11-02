import { buildRegistry, canApprove, escapeHtml, exportRegistry, findCandidates, importCsv, toCsv } from './engine.js';
import { DEMO_RECORDS } from './sample-data.js';

const state = {
  records: DEMO_RECORDS.map(record => ({ ...record })),
  decisions: new Map(),
  history: [],
  candidates: [],
  selected: '',
  filter: 'pending',
  query: '',
  view: 'review',
  notice: null
};
const workspace = document.querySelector('#workspace');
const stats = document.querySelector('#stats');
const notification = document.querySelector('#notification');
const h = escapeHtml;
function icon(name) { return `<svg aria-hidden="true" class="icon"><use href="#icon-${name}"></use></svg>`; }
function recordById(id) { return state.records.find(record => record.uid === id); }
function recordStatus(candidate) { return state.decisions.get(candidate.id) ?? 'pending'; }
function sourceLabel(source) { return h(source); }
function shortDate(value) { return value || 'Not recorded'; }
function notify(message, isError = false) {
  state.notice = { message, isError };
  notification.innerHTML = `<div class="notification ${isError ? 'error' : ''}"><span>${h(message)}</span><button type="button" data-action="dismiss" aria-label="Dismiss notification">${icon('x')}</button></div>`;
}
function clearNotice() { state.notice = null; notification.innerHTML = ''; }
function updateCandidates() {
  state.candidates = findCandidates(state.records);
  state.selected = state.candidates.find(item => recordStatus(item) === 'pending')?.id ?? state.candidates[0]?.id ?? '';
}
function renderStats() {
  const pending = state.candidates.filter(c => recordStatus(c) === 'pending').length;
  const approved = state.candidates.filter(c => recordStatus(c) === 'approved').length;
  const identities = buildRegistry(state.records, state.decisions).length;
  const items = [
    { label: 'Source records', value: state.records.length, sub: 'Across imported datasets', icon: 'files' },
    { label: 'Suggested matches', value: state.candidates.length, sub: 'All require manual review', icon: 'link' },
    { label: 'Approved links', value: approved, sub: 'Human-verified decisions', icon: 'check' },
    { label: 'Unique identities', value: identities, sub: `${pending} candidate${pending === 1 ? '' : 's'} awaiting review`, icon: 'users' }
  ];
  stats.innerHTML = items.map(item => `<article class="stat"><div class="stat-top"><span class="stat-label">${h(item.label)}</span><span class="stat-icon">${icon(item.icon)}</span></div><div class="stat-number">${item.value}</div><div class="stat-sub">${h(item.sub)}</div></article>`).join('');
  document.querySelector('#pending-pill').textContent = String(pending);
}
function title(eyebrow, heading, description, actions = '') {
  return `<div class="workspace-heading"><div><div class="heading-eyebrow">${h(eyebrow)}</div><h2>${h(heading)}</h2><p class="workspace-description">${h(description)}</p></div>${actions}</div>`;
}
function filteredCandidates() {
  return state.candidates.filter(candidate => {
    if (state.filter !== 'all' && recordStatus(candidate) !== state.filter) return false;
    const a = recordById(candidate.left), b = recordById(candidate.right);
    const phrase = `${a.name} ${b.name} ${a.source} ${b.source} ${a.source_id} ${b.source_id}`.toLowerCase();
    return phrase.includes(state.query.toLowerCase().trim());
  });
}
function matchItem(candidate) {
  const left = recordById(candidate.left), right = recordById(candidate.right);
  const status = recordStatus(candidate);
  const label = status === 'pending' ? (candidate.tier === 'Strong candidate' ? 'STRONG MATCH' : 'REVIEW') : status.toUpperCase();
  const statusClass = status === 'pending' ? (candidate.tier === 'Needs review' ? 'review' : '') : status;
  return `<button class="match-item ${state.selected === candidate.id ? 'is-selected' : ''}" type="button" data-action="select" data-id="${h(candidate.id)}" aria-pressed="${state.selected === candidate.id}">
    <span class="match-item-main"><span class="match-names">${h(left.name)} <span>↔</span> ${h(right.name)}</span><span class="status ${statusClass}">${label}</span></span>
    <span class="match-sources">${sourceLabel(left.source)} · ${sourceLabel(right.source)}</span>
    <span class="match-bottom"><span class="confidence"><progress class="meter" value="${candidate.score}" max="100" aria-label="Match signal score"></progress>${candidate.score}/100 signal score</span><span class="match-arrow">${icon('chevron')}</span></span></button>`;
}
function renderMatchList() {
  const list = document.querySelector('#match-list');
  if (!list) return;
  const visible = filteredCandidates();
  if (!visible.some(candidate => candidate.id === state.selected)) state.selected = visible[0]?.id ?? '';
  list.innerHTML = visible.length
    ? visible.map(matchItem).join('')
    : `<div class="empty-state">${icon('search')}<strong>No matches in this view</strong><p>Change the status filter or search terms to see more results.</p></div>`;
  const count = document.querySelector('#visible-count');
  if (count) count.textContent = `${visible.length} shown`;
  renderDetail();
}
function detailRecord(record, index) {
  return `<article class="record-box"><div class="record-top"><span class="record-source">SOURCE ${index} / ${sourceLabel(record.source)}</span><span class="record-source-id">${h(record.source_id)}</span></div><div class="record-name">${h(record.name)}</div><dl class="record-fields"><div><dt>Date of birth</dt><dd>${h(shortDate(record.dob))}</dd></div><div><dt>Playing position</dt><dd>${h(record.position || 'Unknown')}</dd></div><div><dt>Club</dt><dd>${h(record.club || 'Not recorded')}</dd></div><div><dt>Source reference</dt><dd>${h(record.source_id)}</dd></div></dl></article>`;
}
function renderDetail() {
  const target = document.querySelector('#match-detail');
  if (!target) return;
  const candidate = state.candidates.find(item => item.id === state.selected);
  if (!candidate) {
    target.innerHTML = `<div class="empty-state">${icon('link')}<strong>Choose a potential match</strong><p>Select a candidate on the left to compare its underlying records.</p></div>`;
    return;
  }
  const left = recordById(candidate.left), right = recordById(candidate.right);
  const status = recordStatus(candidate);
  target.innerHTML = `<div class="detail-header"><div><h3>Compare source records</h3><p>Check the evidence before making a decision.</p></div><div class="detail-score">${candidate.score}<span>SIGNAL SCORE / 100</span></div></div>
    <div class="detail-content">
      ${detailRecord(left, '01')}
      <div class="record-connector"><span>${icon('link')}</span></div>
      ${detailRecord(right, '02')}
      <div class="evidence"><h4>Why was this suggested?</h4>${candidate.reasons.map(reason => `<div class="signal">${icon('check')}<span>${h(reason)}</span></div>`).join('')}</div>
      <div class="review-warning">A match score is a heuristic indicator, not a verified probability. Records are <strong>never merged automatically</strong>. Confirm identity using trusted evidence before approval.</div>
      <div class="detail-actions">${status === 'pending' ? `<span class="detail-meta">Decision required</span><div class="detail-actions-main"><button type="button" class="btn btn-reject" data-action="reject" data-id="${h(candidate.id)}">${icon('x')}Not same player</button><button type="button" class="btn btn-success" data-action="approve" data-id="${h(candidate.id)}">${icon('check')}Approve link</button></div>` : `<span class="status ${status}">${status.toUpperCase()}</span><button type="button" class="btn btn-small" data-action="undo" data-id="${h(candidate.id)}">${icon('rotate')}Undo decision</button>`}</div>
    </div>`;
}
function renderReview() {
  workspace.innerHTML = title('01 / RESOLUTION WORKFLOW', 'Match review', 'Review every proposed link. The engine never merges players automatically.', `<button type="button" class="btn btn-primary" data-action="export">${icon('download')} Export identity register</button>`) +
  `<div class="review-layout">
    <section class="panel" aria-label="Matching candidates"><div class="panel-header"><div class="panel-heading-row"><span class="panel-heading">Potential identity links</span><span class="count-badge" id="visible-count"></span></div><div class="panel-sub">Prioritised by matching evidence</div></div>
    <div class="review-toolbar"><div class="segment" role="group" aria-label="Filter decisions">${[['pending','Pending'],['approved','Approved'],['rejected','Rejected'],['all','All']].map(([key,label]) => `<button data-filter="${key}" aria-pressed="${key === state.filter}" class="${key === state.filter ? 'selected' : ''}" type="button">${label}</button>`).join('')}</div><label class="search-box">${icon('search')}<input type="search" id="match-search" value="${h(state.query)}" placeholder="Find player..." aria-label="Search match candidates"></label></div>
    <div class="match-list" id="match-list"></div></section>
    <section class="panel" id="match-detail" aria-label="Selected match details"></section>
  </div>`;
  renderMatchList();
}
function initials(name) { return name.split(/\s+/).slice(0, 2).map(p => p.slice(0,1).toUpperCase()).join(''); }
function renderRegistry() {
  const list = buildRegistry(state.records, state.decisions);
  workspace.innerHTML = title('02 / CLUB DATA MODEL', 'Player identity register', 'Each identity connects the records you have explicitly approved. IDs are demo-only references.', `<button type="button" class="btn btn-primary" data-action="export">${icon('download')} Export CSV</button>`) +
    `<div class="registry-grid">${list.map(person => `<article class="identity-card"><div class="identity-card-head"><span class="identity-avatar">${h(initials(person.name))}</span><span class="mini-tag ${person.records.length > 1 ? 'linked' : ''}">${person.records.length > 1 ? `${person.records.length} records linked` : 'Unlinked'}</span></div><div class="identity-name">${h(person.name)}</div><div class="identity-id">${h(person.id)}</div><div class="identity-info"><span><strong>DOB</strong> ${h(person.dob || 'Unknown')}</span><span><strong>Role</strong> ${h(person.position || 'Unknown')}</span></div><div class="identity-info">${person.sources.map(source => `<span class="mini-tag">${h(source)}</span>`).join('')}</div></article>`).join('')}</div>`;
}
function renderSources() {
  const sources = new Map();
  for (const record of state.records) sources.set(record.source, (sources.get(record.source) ?? 0) + 1);
  workspace.innerHTML = title('03 / DATA INGESTION', 'Club data sources', 'Three fictional sources are preloaded. You can also add synthetic records using CSV.', `<button type="button" class="btn" data-action="template">${icon('download')} Sample CSV</button>`) +
    `<div class="source-grid">${[...sources].map(([name,count]) => `<article class="source-card"><span class="source-icon">${icon('files')}</span><h3>${h(name)}</h3><p>Local, simulated dataset</p><div class="source-count">${count} <span class="source-count-label">records</span></div></article>`).join('')}</div>
    <div class="info-panel"><div><h3>Add another synthetic data source</h3><p>CSV columns: <code>source_id,name,dob,club,position,external_id</code>. Date of birth uses YYYY-MM-DD. Maximum 300 rows per file, 500 in total. No records are sent to a server or saved across refreshes. <strong>Do not upload real personal data.</strong></p></div><button type="button" class="btn btn-primary" data-action="select-file">${icon('upload')} Import demo CSV</button><input type="file" id="csv-file" accept=".csv,text/csv" hidden></div>`;
}
function renderActivity() {
  workspace.innerHTML = title('04 / AUDITABILITY', 'Decision log', 'A temporary, local view of the actions you have taken in this demonstration.', `<button type="button" class="btn" data-action="reset">${icon('rotate')} Reset all decisions</button>`) +
    (state.history.length ? `<div class="activity-list">${[...state.history].reverse().map(item => `<div class="activity-item"><div class="activity-symbol ${h(item.status)}">${icon(item.status === 'approved' ? 'check' : item.status === 'rejected' ? 'x' : 'rotate')}</div><div><strong>${h(item.label)}</strong><p>${h(item.message)}</p></div></div>`).join('')}</div>` : `<div class="panel empty-state">${icon('clock')}<strong>Nothing reviewed yet</strong><p>Approve, reject or undo a link in Match review to see decisions here.</p></div>`);
}
function render() {
  renderStats();
  document.querySelectorAll('[data-view]').forEach(button => {
    const active = button.dataset.view === state.view;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
  });
  if (state.view === 'review') renderReview();
  else if (state.view === 'registry') renderRegistry();
  else if (state.view === 'sources') renderSources();
  else renderActivity();
}
function decide(id, status) {
  const candidate = state.candidates.find(item => item.id === id);
  if (!candidate) return;
  if (status === 'approved') {
    const result = canApprove(state.records, state.decisions, candidate);
    if (!result.ok) { notify(result.reason, true); return; }
  }
  if (status === 'pending') state.decisions.delete(id);
  else state.decisions.set(id, status);
  const left = recordById(candidate.left), right = recordById(candidate.right);
  state.history.push({ status, label: `${left.name} ↔ ${right.name}`, message: status === 'pending' ? 'Decision reversed.' : status === 'approved' ? 'Link explicitly approved.' : 'Link rejected as different people.' });
  if (state.filter === 'pending') state.selected = state.candidates.find(c => recordStatus(c) === 'pending')?.id ?? '';
  clearNotice();
  render();
}
function download(content, filename, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function reset() {
  state.records = DEMO_RECORDS.map(record => ({ ...record }));
  state.decisions.clear(); state.history = []; state.filter = 'pending'; state.query = ''; state.view = 'review';
  updateCandidates(); render(); notify('Demo reset. All approval decisions were cleared.');
}
document.addEventListener('click', event => {
  const nav = event.target.closest('button[data-view]');
  if (nav) { state.view = nav.dataset.view; clearNotice(); render(); return; }
  const filter = event.target.closest('button[data-filter]');
  if (filter) { state.filter = filter.dataset.filter; clearNotice(); render(); return; }
  const action = event.target.closest('[data-action]');
  if (!action) return;
  const id = action.dataset.id;
  if (action.dataset.action === 'select') {
    state.selected = id;
    renderMatchList();
  } else if (action.dataset.action === 'approve') decide(id, 'approved');
  else if (action.dataset.action === 'reject') decide(id, 'rejected');
  else if (action.dataset.action === 'undo') decide(id, 'pending');
  else if (action.dataset.action === 'export') {
    download(exportRegistry(state.records, state.decisions), 'collins-cross-fc-identity-register.csv');
    notify('Identity register exported. IDs are provisional demonstration references.');
  } else if (action.dataset.action === 'template') {
    download(toCsv([
      ['source_id','name','dob','club','position','external_id'],
      ['D-001','Joseph Taylor','1999-02-14','Collins Cross FC','Midfielder',''],
      ['D-002','Isabel Martin','2001-03-06','Collins Cross FC','Defender',''],
      ['D-003','Liam Evans','','Collins Cross FC','Forward','']
    ]), 'collins-cross-fc-sample.csv');
  } else if (action.dataset.action === 'select-file') {
    document.querySelector('#csv-file')?.click();
  } else if (action.dataset.action === 'dismiss') clearNotice();
  else if (action.dataset.action === 'reset') reset();
});
document.addEventListener('input', event => {
  if (event.target.id === 'match-search') {
    state.query = event.target.value;
    renderMatchList();
  }
});
document.addEventListener('change', async event => {
  if (event.target.id !== 'csv-file') return;
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    if (file.size > 1000000) throw new Error('CSV exceeds the 1 MB limit.');
    const name = file.name.replace(/\.csv$/i, '').replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0,40);
    if (!name) throw new Error('Please use a readable filename for the data source.');
    const source = `Demo ${name}`.slice(0,40);
    const items = importCsv(await file.text(), source, state.records);
    state.records.push(...items);
    state.decisions.clear(); state.history = []; state.filter = 'pending';
    updateCandidates(); render(); notify(`${items.length} synthetic record${items.length === 1 ? '' : 's'} added from ${file.name}. Previous review decisions reset.`);
  } catch (error) {
    notify(error instanceof Error ? error.message : 'Unable to import CSV.', true);
  }
});
updateCandidates();
render();