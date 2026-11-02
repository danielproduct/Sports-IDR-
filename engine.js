/**
 * Collins Cross FC — deliberately small, auditable identity-matching engine.
 * No network access, ML models, tracking or automatic record merges.
 * Demo only: canonical IDs are deterministic display references, not a durable IDR service.
 */

const FIRST_NAME_ALIASES = new Map(Object.entries({
  joe: 'joseph', joey: 'joseph', joseph: 'joseph',
  dan: 'daniel', danny: 'daniel', daniel: 'daniel',
  aidan: 'aidan', aiden: 'aidan',
  sam: 'samuel', sammy: 'samuel', samuel: 'samuel',
  alex: 'alexander', alexander: 'alexander',
  ben: 'benjamin', benjamin: 'benjamin',
  tom: 'thomas', thomas: 'thomas',
  ollie: 'oliver', oliver: 'oliver',
  harry: 'harry', aaron: 'aaron', jack: 'jack', adam: 'adam'
}));

const POSITION_GROUPS = {
  goalkeeper: ['goalkeeper', 'keeper', 'gk'],
  defender: ['defender', 'centre back', 'center back', 'centre-back', 'cb', 'full back', 'full-back', 'left back', 'right back'],
  midfielder: ['midfielder', 'central midfield', 'centre midfield', 'cm', 'defensive midfield', 'wide midfield', 'wide mid'],
  forward: ['forward', 'striker', 'centre forward', 'cf', 'winger', 'attacker']
};

export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

export function splitName(value) {
  const parts = normalizeText(value).split(' ').filter(Boolean);
  if (!parts.length) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: FIRST_NAME_ALIASES.get(parts[0]) ?? parts[0], last: parts.at(-1) };
}

export function normalizePosition(value) {
  const text = normalizeText(value);
  for (const [group, words] of Object.entries(POSITION_GROUPS)) {
    if (words.some(word => normalizeText(word) === text)) return group;
  }
  return text;
}

function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = above;
    }
  }
  return row[b.length];
}

function similarity(a, b) {
  if (!a || !b) return 0;
  return 1 - editDistance(a, b) / Math.max(a.length, b.length);
}

export function isValidDate(value) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function normalizedClub(value) {
  const s = normalizeText(value).replace(/\bfootball club\b/g, '').replace(/\bfc\b/g, '').trim();
  return s === 'cc' ? 'collins cross' : s;
}

export function scoreMatch(left, right) {
  const reasons = [];
  if (left.uid === right.uid) {
    return { eligible: false, score: 0, reasons: ['Same record'] };
  }
  if (left.dob && right.dob && left.dob !== right.dob) {
    return { eligible: false, score: 0, reasons: ['Conflicting dates of birth'], conflict: true };
  }
  // The POC expects external_id to identify a person in a SHARED namespace.
  // Source-specific IDs belong in source_id, never in external_id.
  if (left.external_id && right.external_id && left.external_id !== right.external_id) {
    return { eligible: false, score: 0, reasons: ['Conflicting external identifiers'], conflict: true };
  }

  const a = splitName(left.name);
  const b = splitName(right.name);
  const first = similarity(a.first, b.first);
  const last = similarity(a.last, b.last);
  const matchingDob = Boolean(left.dob && right.dob && left.dob === right.dob);
  const matchingExternalId = Boolean(left.external_id && right.external_id && left.external_id === right.external_id);
  const matchingClub = Boolean(normalizedClub(left.club) && normalizedClub(left.club) === normalizedClub(right.club));
  const matchingPosition = Boolean(normalizePosition(left.position) && normalizePosition(left.position) === normalizePosition(right.position));
  const exactName = Boolean(a.first && a.last && a.first === b.first && a.last === b.last);
  const sameInitial = Boolean(a.first && b.first && a.first[0] === b.first[0]);
  const standardName = first >= 0.62 && last >= 0.79;
  const reversedName = Boolean(a.first && a.last && a.first === b.last && a.last === b.first);
  const sharedIdNameChange = matchingDob && matchingExternalId && first >= 0.9;
  const plausibleVariant = matchingDob && last >= 0.83 && sameInitial;

  // An exact DOB provides extra context for broadening review suggestions.
  // Without matching DOB or shared person ID, require *exact* normalised first
  // and surname, matching club and position; reject loose fuzzy-only evidence.
  if (!standardName && !plausibleVariant && !reversedName && !sharedIdNameChange) {
    return { eligible: false, score: 0, reasons: ['Names do not provide enough evidence'] };
  }
  if (!matchingDob && !matchingExternalId && !(exactName && matchingClub && matchingPosition)) {
    return { eligible: false, score: 0, reasons: ['Insufficient evidence without matching date of birth'] };
  }

  const middleTokens = value => normalizeText(value).split(' ').filter(Boolean).slice(1, -1).join(' ');
  const leftMiddle = middleTokens(left.name);
  const rightMiddle = middleTokens(right.name);
  if (!matchingDob && leftMiddle && rightMiddle && leftMiddle !== rightMiddle) {
    return { eligible: false, score: 0, reasons: ['Conflicting additional name parts without DOB'] };
  }

  // Same-source duplicates are worth reviewing only with matching full DOB.
  // Source record IDs remain distinct and an explicit review is required.
  if (left.source === right.source && !(matchingDob && last >= 0.83 && sameInitial)) {
    return { eligible: false, score: 0, reasons: ['Same source needs stronger identity evidence'] };
  }

  const score = Math.min(100, Math.round((35 * last) + (25 * first) +
    (matchingDob ? 25 : 0) + (matchingClub ? 8 : 0) +
    (matchingPosition ? 7 : 0) + (matchingExternalId ? 20 : 0)));
  if (last === 1) reasons.push('Surname matches');
  else if (last >= 0.79) reasons.push('Similar surname - check spelling');
  else reasons.push('Surname differs - supporting ID evidence required');
  if (first === 1) reasons.push('First name / known variant matches');
  else if (first >= 0.62) reasons.push('Similar first name');
  else reasons.push('First name variant or initials - confirm manually');
  if (matchingDob) reasons.push('Date of birth matches');
  else reasons.push('Date of birth missing from one or both sources');
  if (matchingClub) reasons.push('Club matches');
  if (matchingPosition) reasons.push('Position group matches');
  if (matchingExternalId) reasons.push('Shared external identifier matches');
  if (reversedName) reasons.push('First and last names may be reversed');
  if (left.source === right.source) reasons.push('Potential duplicate within same source');

  // The score is a sorting heuristic, never a calibrated match probability.
  // Missing DOBs, same-source duplicates or nonstandard names demand extra care.
  const strong = matchingDob && standardName && first >= 0.85 && last >= 0.90 &&
    !reversedName && left.source !== right.source && !leftMiddle && !rightMiddle;
  return { eligible: true, score, reasons, tier: strong ? 'Strong candidate' : 'Needs review' };
}

export function findCandidates(records) {
  const matches = [];
  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const left = records[i], right = records[j];
      const result = scoreMatch(left, right);
      if (!result.eligible) continue;
      matches.push({
        id: `${left.uid}|${right.uid}`,
        left: left.uid,
        right: right.uid,
        score: result.score,
        reasons: result.reasons,
        tier: result.tier
      });
    }
  }
  return matches.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

function connectedGroups(records, decisions) {
  const parent = new Map(records.map(record => [record.uid, record.uid]));
  function root(id) {
    let current = id;
    while (parent.get(current) !== current) current = parent.get(current);
    return current;
  }
  for (const [key, status] of decisions.entries()) {
    if (status !== 'approved') continue;
    const [a, b] = key.split('|');
    if (!parent.has(a) || !parent.has(b)) continue;
    parent.set(root(b), root(a));
  }
  const groups = new Map();
  for (const record of records) {
    const leader = root(record.uid);
    if (!groups.has(leader)) groups.set(leader, []);
    groups.get(leader).push(record);
  }
  return [...groups.values()];
}

export function canApprove(records, decisions, candidate) {
  if (!candidate || !candidate.left || !candidate.right ||
      candidate.id !== `${candidate.left}|${candidate.right}`) {
    return { ok: false, reason: 'Invalid candidate' };
  }
  const a = records.find(record => record.uid === candidate.left);
  const b = records.find(record => record.uid === candidate.right);
  if (!a || !b || !scoreMatch(a, b).eligible) {
    return { ok: false, reason: 'Only proposed and eligible links can be approved.' };
  }
  const next = new Map(decisions);
  next.set(candidate.id, 'approved');
  const groups = connectedGroups(records, next);
  for (const group of groups) {
    // A rejected link is a hard exclusion, even if other approved links
    // would otherwise join the two records transitively.
    const groupIds = new Set(group.map(record => record.uid));
    for (const [pairId, decision] of next.entries()) {
      if (decision !== 'rejected') continue;
      const [a, b] = pairId.split('|');
      if (groupIds.has(a) && groupIds.has(b)) {
        return { ok: false, reason: 'Link would contradict a previously rejected player match.' };
      }
    }
    const dobs = new Set(group.map(record => record.dob).filter(Boolean));
    if (dobs.size > 1) return { ok: false, reason: 'Cannot link records with conflicting dates of birth.' };
    const externalIds = new Set(group.map(record => record.external_id).filter(Boolean));
    if (externalIds.size > 1) return { ok: false, reason: 'Cannot link records with conflicting external identifiers.' };
    const sources = group.map(record => `${record.source}:${record.source_id}`);
    if (new Set(sources).size !== sources.length) return { ok: false, reason: 'Duplicate source record in proposed identity.' };
  }
  return { ok: true };
}

function idFor(records) {
  // Provisional display reference. Never rely on this as a persistent production ID.
  const base = records.map(record => record.uid).sort()[0];
  let hash = 2166136261;
  for (const char of base) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return `CCF-${String(hash % 1000000).padStart(6, '0')}`;
}

export function buildRegistry(records, decisions) {
  return connectedGroups(records, decisions)
    .map(group => ({
      id: idFor(group),
      name: group.find(record => record.dob)?.name ?? group[0].name,
      dob: group.find(record => record.dob)?.dob ?? '',
      position: group.find(record => record.position)?.position ?? '',
      sources: [...new Set(group.map(record => record.source))],
      records: group
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function escapeHtml(input) {
  return String(input ?? '').replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
}

export function parseCsv(input) {
  // RFC-4180-style quoted fields including commas, quotes and embedded newlines.
  // Restrict file size/rows at import. No external parser dependency.
  const text = String(input ?? '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { value += '"'; i++; }
      else if (char === '"') quoted = false;
      else value += char;
      continue;
    }
    if (char === '"') {
      if (value !== '') throw new Error('Malformed CSV: quote inside unquoted value.');
      quoted = true;
    } else if (char === ',') {
      row.push(value); value = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(value); value = '';
      if (row.some(cell => cell.trim())) rows.push(row);
      row = [];
    } else {
      value += char;
    }
  }
  if (quoted) throw new Error('Malformed CSV: unclosed quoted field.');
  row.push(value);
  if (row.some(cell => cell.trim())) rows.push(row);
  return rows;
}

export function importCsv(text, source, existingRecords = []) {
  if (text.length > 1000000) throw new Error('CSV exceeds the 1 MB demo limit.');
  if (!/^[a-zA-Z0-9 _-]{1,40}$/.test(source)) throw new Error('Invalid source name.');
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error('CSV must contain a header and at least one data row.');
  if (rows.length > 301) throw new Error('CSV may contain at most 300 data rows.');
  if (existingRecords.length + rows.length - 1 > 500) throw new Error('Demo supports at most 500 total records.');
  const headers = rows.shift().map(header => normalizeText(header).replace(/ /g, '_'));
  for (const required of ['source_id', 'name']) {
    if (!headers.includes(required)) throw new Error(`Missing required column: ${required}`);
  }
  const ids = new Set(existingRecords.map(record => record.uid));
  const imported = rows.map((cells, i) => {
    if (cells.length !== headers.length) throw new Error(`CSV row ${i + 2} has ${cells.length} fields, expected ${headers.length}.`);
    const inputRow = Object.fromEntries(headers.map((header, index) => [header, cells[index].trim()]));
    const sourceId = inputRow.source_id;
    if (!/^[a-zA-Z0-9._:-]{1,64}$/.test(sourceId ?? '') || !inputRow.name || inputRow.name.length > 100) throw new Error(`Row ${i + 2}: invalid source ID or player name.`);
    if (!isValidDate(inputRow.dob ?? '')) throw new Error(`Row ${i + 2}: DOB must be YYYY-MM-DD or blank.`);
    if (['club', 'position', 'external_id'].some(key => (inputRow[key] ?? '').length > 100)) throw new Error(`Row ${i + 2}: field exceeds 100 characters.`);
    const uid = `${source}:${sourceId}`;
    if (ids.has(uid)) throw new Error(`Row ${i + 2}: duplicate source ID (${uid}).`);
    ids.add(uid);
    return {
      uid, source, source_id: sourceId, name: inputRow.name,
      dob: inputRow.dob ?? '', position: inputRow.position ?? '',
      club: inputRow.club ?? '', external_id: inputRow.external_id ?? ''
    };
  });
  return imported;
}

export function toCsv(rows) {
  return rows.map(row => row.map(value => {
    const original = String(value ?? '');
    // Protect spreadsheet consumers from CSV formula injection on imported content.
    const text = /^[\s\u0000-\u001f]*[=+\-@]/.test(original) ? `'${original}` : original;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }).join(',')).join('\r\n') + '\r\n';
}

export function exportRegistry(records, decisions) {
  const groups = buildRegistry(records, decisions);
  const rows = [['club_identity_id', 'source', 'source_id', 'player_name', 'dob', 'club', 'position', 'external_id', 'linked_records']];
  for (const group of groups) {
    for (const r of group.records) {
      rows.push([group.id, r.source, r.source_id, r.name, r.dob, r.club, r.position, r.external_id, group.records.length]);
    }
  }
  return toCsv(rows);
}