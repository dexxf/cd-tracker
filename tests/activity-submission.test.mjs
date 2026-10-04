import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(
  new URL('../frontend/script/studentclass.js', import.meta.url),
  'utf8'
).replace(/\r\n?/g, '\n');
const boot = '  renderLoadingSkeleton();\n  attachEventHandlers();\n  loadAll();';

function element(value = '') {
  const classes = new Set();
  return {
    value, disabled: false, hidden: true, innerHTML: '', textContent: '', style: {}, dataset: {},
    classList: {
      add(...names) { names.forEach(name => classes.add(name)); },
      remove(...names) { names.forEach(name => classes.delete(name)); },
      toggle(name, on) { if (on) classes.add(name); else classes.delete(name); },
      contains(name) { return classes.has(name); },
    },
    setAttribute() {}, focus() {}, querySelector() { return null; }, addEventListener() {},
  };
}

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

function setup({ request = async () => ({ data: [] }), confirm = async () => true } = {}) {
  const nodes = Object.fromEntries([
    'submissionModal', 'submissionMode', 'repoSelect', 'repositoryName', 'submitAssignmentBtn',
    'activitiesContainer', 'activityLoadNotice', 'closeModal', 'cancelSubmitBtn',
    'assignmentCount', 'pendingCount', 'submittedCount',
  ].map(id => [id, element()]));
  nodes.submissionMode.value = 'existing';
  nodes.repoSelect.value = 'https://github.com/student/assignment.git';
  const alerts = [];
  const context = {
    window: {
      ApiClient: { request }, location: { search: '?classroomId=class-1' },
      AppDialog: { confirm, async alert(message) { alerts.push(message); } },
    },
    document: {
      getElementById(id) { return nodes[id] || null; },
      querySelectorAll() { return []; },
    },
    localStorage: { getItem() { return null; }, setItem() {} },
    URL, URLSearchParams, console: { error() {}, warn() {} },
    setTimeout(callback) { callback(); },
  };
  assert.ok(source.includes(boot), 'the harness must replace only page startup');
  vm.runInNewContext(source.replace(boot, `
    globalThis.flow = { state, submitAssignment, submitPendingActivity, loadAll,
      normalizeGithubRepositoryUrl, renderActivities, loadGithubRepos };`), context);
  const activity = {
    activityId: 'activity-1', title: 'Assignment', submissionStatus: 'PENDING',
    repositoryUrl: 'https://github.com/student/assignment', repositoryName: 'assignment',
  };
  context.flow.state.allActivities = [activity];
  context.flow.state.currentActivity = { activityId: 'activity-2', title: 'New assignment' };
  return { ...context.flow, nodes, alerts, activity };
}

test('a failed final submission restores the button and can be retried', async () => {
  let posts = 0;
  const flow = setup({ request: async (_path, options) => {
    if (options.method === 'POST') { posts++; throw new Error('Please push a commit first'); }
    return { data: [] };
  } });
  const button = element();
  button.innerHTML = 'Submit Activity';
  await flow.submitPendingActivity('activity-1', button);
  assert.equal(button.disabled, false);
  assert.equal(button.innerHTML, 'Submit Activity');
  assert.equal(button.classList.contains('is-disabled'), false);
  await flow.submitPendingActivity('activity-1', button);
  assert.equal(posts, 2);
});

test('duplicate final-submit clicks share one confirmation and one POST', async () => {
  const confirmation = deferred();
  let confirmations = 0, posts = 0;
  const flow = setup({ confirm: () => { confirmations++; return confirmation.promise; },
    request: async (_path, options) => { if (options.method === 'POST') posts++; return { data: [] }; } });
  const first = flow.submitPendingActivity('activity-1', element());
  await flow.submitPendingActivity('activity-1', element());
  assert.equal(confirmations, 1);
  confirmation.resolve(true);
  await first;
  assert.equal(posts, 1);
});

test('canceling final submission unlocks the button without calling the API', async () => {
  let calls = 0;
  const flow = setup({ confirm: async () => false, request: async () => { calls++; } });
  const button = element();
  await flow.submitPendingActivity('activity-1', button);
  assert.equal(button.disabled, false);
  assert.equal(flow.state.activitySubmissionsInFlight.size, 0);
  assert.equal(calls, 0);
});

test('accepted final submission stays submitted when all list refreshes fail', async () => {
  const calls = [];
  const flow = setup({ request: async (path, options) => {
    calls.push({ path, options });
    if (options.method === 'POST') return { data: { submissionStatus: 'SUBMITTED', submittedCommitSha: 'abc' } };
    throw new Error('Refresh temporarily unavailable');
  } });
  await flow.submitPendingActivity('activity-1', element());
  const activity = flow.state.allActivities.find(a => a.activityId === 'activity-1');
  assert.equal(activity.submissionStatus, 'SUBMITTED');
  assert.equal(activity.submittedCommitSha, 'abc');
  assert.equal(calls[0].options.body, undefined, 'submission time is determined on the server');
  assert.equal(flow.nodes.activityLoadNotice.hidden, false);
  assert.equal(flow.alerts.filter(message => /failed/i.test(message)).length, 0);
});

test('duplicate repository attachment clicks issue only one POST', async () => {
  const confirmation = deferred();
  let posts = 0;
  const flow = setup({ confirm: () => confirmation.promise,
    request: async (_path, options) => { if (options.method === 'POST') posts++; return { data: [] }; } });
  const first = flow.submitAssignment();
  await flow.submitAssignment();
  confirmation.resolve(true);
  await first;
  assert.equal(posts, 1);
  assert.equal(flow.state.repositorySubmissionInFlight, false);
});

test('repository attachment stays PENDING and moves to tracked even if the refresh is stale', async () => {
  const calls = [];
  const flow = setup({ request: async (path, options) => {
    calls.push({ path, options });
    if (options.method === 'POST') return { data: { submissionStatus: 'PENDING' } };
    if (path.endsWith('/unsubmitted')) return { data: [{ activityId: 'activity-2', title: 'New assignment' }] };
    return { data: [] };
  } });
  await flow.submitAssignment();
  const activity = flow.state.allActivities.find(a => a.activityId === 'activity-2');
  assert.equal(activity.submissionStatus, 'PENDING');
  assert.equal(activity.repositoryUrl, 'https://github.com/student/assignment');
  assert.equal(flow.state.unsubmitted.some(a => a.activityId === 'activity-2'), false);
  assert.equal(flow.state.currentActivityTab, 'tracked');
  assert.equal(JSON.parse(calls[0].options.body).repositoryUrl, activity.repositoryUrl);
  assert.match(flow.alerts[0], /then click Submit Activity/);
});

test('new repository failure retains the name and permits another attempt', async () => {
  let posts = 0;
  const flow = setup({ request: async (_path, options) => {
    if (options.method === 'POST') { posts++; throw new Error('Choose Use existing repository to retry'); }
    return { data: [] };
  } });
  flow.nodes.submissionMode.value = 'new';
  flow.nodes.repositoryName.value = 'my.assignment';
  await flow.submitAssignment();
  assert.equal(flow.nodes.repositoryName.value, 'my.assignment');
  assert.equal(flow.nodes.submitAssignmentBtn.disabled, false);
  assert.equal(flow.nodes.submissionMode.disabled, false);
  await flow.submitAssignment();
  assert.equal(posts, 2);
});

test('repository type and invalid new names are rejected before any POST', async () => {
  let calls = 0;
  const flow = setup({ request: async () => { calls++; } });
  flow.nodes.submissionMode.value = '';
  await flow.submitAssignment();
  flow.nodes.submissionMode.value = 'new';
  for (const name of ['..', 'bad name', 'https://github.com/student/repo', 'a'.repeat(101)]) {
    flow.nodes.repositoryName.value = name;
    await flow.submitAssignment();
  }
  assert.equal(calls, 0);
  assert.equal(flow.alerts.length, 5);
});

test('repository dropdown uses browser URLs and ignores GitHub REST API URLs', async () => {
  const flow = setup({ request: async () => ({ data: [
    { full_name: 'student/valid', html_url: 'https://github.com/student/valid', url: 'https://api.github.com/repos/student/valid' },
    { full_name: 'student/rest-only', url: 'https://api.github.com/repos/student/rest-only' },
  ] }) });
  await flow.loadGithubRepos();
  assert.match(flow.nodes.repoSelect.innerHTML, /https:\/\/github.com\/student\/valid/);
  assert.doesNotMatch(flow.nodes.repoSelect.innerHTML, /api\.github\.com|rest-only/);
});

test('repository URLs reject lookalikes, credentials, unsafe protocols, and extra paths', () => {
  const { normalizeGithubRepositoryUrl: normalize } = setup();
  assert.equal(normalize('https://github.com/student/repo.git/'), 'https://github.com/student/repo');
  for (const value of [
    'https://github.com.evil.test/student/repo', 'https://evil.test/github.com/student/repo',
    'https://user:password@github.com/student/repo', 'javascript:alert(1)',
    'ftp://github.com/student/repo', 'https://github.com/student/repo/tree/main',
  ]) assert.equal(normalize(value), '', value);
});

test('tracked activities are excluded from stale unsubmitted responses, while old orphan rows remain attachable', async () => {
  const tracked = { activityId: 'activity-1', submissionStatus: 'PENDING', repositoryUrl: 'https://github.com/student/repo' };
  const orphan = { activityId: 'orphan', submissionStatus: 'PENDING', studentActivityId: 'old-row' };
  const flow = setup({ request: async path => {
    if (path.endsWith('/student')) return { data: [tracked, orphan] };
    if (path.endsWith('/unsubmitted')) return { data: [{ activityId: 'activity-1' }] };
    return { data: [] };
  } });
  await flow.loadAll();
  assert.deepEqual([...flow.state.unsubmitted.map(a => a.activityId)], ['orphan']);
  assert.match(flow.nodes.activitiesContainer.innerHTML, /Attach repository/);
});

test('assignment totals include unattached work and pending totals include attached work', async () => {
  const flow = setup({ request: async path => {
    if (path.endsWith('/student')) return { data: [
      { activityId: 'attached', submissionStatus: 'PENDING', repositoryName: 'work' },
      { activityId: 'finished', submissionStatus: 'SUBMITTED', repositoryName: 'finished' },
    ] };
    if (path.endsWith('/unsubmitted')) return { data: [{ activityId: 'new', title: 'New work' }] };
    return { data: [] };
  } });
  await flow.loadAll();
  assert.equal(flow.nodes.assignmentCount.textContent, 3);
  assert.equal(flow.nodes.pendingCount.textContent, 2);
  assert.equal(flow.nodes.submittedCount.textContent, 1);
});
