// Synthetic control vectors only. These are not captured timing or retention evidence.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {summarizeTiming, summarizeRetention, qualificationAgreement} from './reveal-analysis.mjs';
const options = {seed: 20260924, evidenceQualified: true};
const configurations = [['chromium','desktop'],['firefox','desktop'],['webkit','desktop'],['chromium','mobile']];
function timing(delta = 1) {
  const jobs = [];
  for (const workload of ['activity','document']) for (const [browser,profile] of configurations)
    for (const arm of ['reference','candidate']) for (let block = 0; block < 30; block++) {
      const value = 10 + block % 3 + (arm === 'candidate' ? delta : 0);
      jobs.push({id: `${workload}/${browser}/${profile}/${arm}/${block}`, workload,browser,profile,arm,block,status:'ok',errors:[],
        actions: [{endpoint:'initial',status:'ok',firstAlignedMs:value,stableSixFramesMs:value+50},
          {endpoint:'repeat',status:'ok',firstAlignedMs:value+5,stableSixFramesMs:value+55}]});
    }
  return jobs;
}
test('synthetic complete timing pass retains whole vectors and correlated endpoint draws', () => {
  const jobs = timing(), before = structuredClone(jobs), result = summarizeTiming(jobs,options);
  assert.equal(result.status,'pass'); assert.equal(result.complete,true);
  assert.equal(result.comparisons.length,32); assert.equal(result.cells.length,8);
  for (const cell of result.cells) {
    assert.equal(cell.jobs.reference.length,30); assert.equal(cell.jobs.candidate.length,30);
    const rows = result.comparisons.filter(r => r.workload===cell.workload && r.browser===cell.browser && r.profile===cell.profile);
    for (const row of rows) {
      assert.equal(row.change.differenceMs,1); assert.equal(row.gate.status,'pass');
      assert.deepEqual(row.change.ci95,rows[0].change.ci95);
      assert.equal(row.gate.marginMs,Math.max(4,0.1*row.reference.median));
      assert.equal(row.gate.excessMs,1-row.gate.marginMs);
      assert.equal(row.bootstrap.unit,'whole fresh-browser job vector');
    }
    for (const row of cell.jobs.reference) {
      assert.equal(row.values['initial.stableSixFramesMs']-row.values['initial.firstAlignedMs'],50);
      assert.equal(row.values['repeat.firstAlignedMs']-row.values['initial.firstAlignedMs'],5);
    }
  }
  assert.deepEqual(jobs,before);
});
test('synthetic known timing regression remains a regression in every cell', () => {
  const result = summarizeTiming(timing(30),options);
  assert.equal(result.status,'regression'); assert.equal(result.complete,true);
  assert.ok(result.comparisons.every(r=>r.gate.status==='regression' && r.gate.excessCi95[0]>0 && r.change.differenceMs===30));
});
test('synthetic incomplete, duplicate and broken action vectors cannot qualify', () => {
  const jobs = timing().slice(0,60); jobs.pop();
  jobs[1].id=jobs[0].id;
  jobs[2].actions[1].stableSixFramesMs=NaN;
  jobs[3].actions[1].endpoint='initial';
  jobs[4].status='not-run';
  const result=summarizeTiming(jobs,options);
  assert.equal(result.status,'unqualified'); assert.equal(result.complete,false);
  assert.ok(result.issues.some(s=>s.includes('Duplicate job id')));
  assert.ok(result.issues.some(s=>s.includes('Invalid repeat.stableSixFramesMs')));
  assert.ok(result.issues.some(s=>s.includes('One successful repeat action required')));
  assert.ok(result.issues.some(s=>s.includes('exactly 30')));
  assert.equal(result.counts['not-run'],1);
  assert.ok(result.comparisons.every(r=>r.gate.status==='unqualified'));
  assert.throws(()=>summarizeTiming([], {seed:1.5}),/safe-integer/);
});
const kinds=['completion','supersession','trusted-interruption','active-removal'];
function retention() {
  return ['activity','document'].flatMap(workload=>['reference','candidate'].flatMap(arm=>Array.from({length:5},(_,block)=>({
    id:`${workload}/${arm}/${block}`,workload,arm,block,browser:'chromium',profile:'desktop',status:'ok',errors:[],
    retention:{kind:'retention',workload,status:'ok',completedCycles:100,requestedCheckpoints:[0,10,50,100],
      caseCounts:Object.fromEntries(kinds.map(k=>[k,25])),cycles:Array.from({length:100},(_,i)=>({cycle:i+1,kind:kinds[i%4],status:'ok'})),
      checkpoints:[0,10,50,100].map(cycle=>({cycle,heap:{usedSize:1000+cycle*(arm==='reference'?10:20)},
        dom:{documents:1,nodes:100+cycle*(arm==='reference'?0:2),jsEventListeners:2+cycle*(arm==='reference'?0:1)}}))}
  }))));
}
test('synthetic retention uses actual-cycle growth/slope and percentage-point arithmetic', () => {
  const result=summarizeRetention(retention(),options);
  assert.equal(result.complete,true); assert.equal(result.status,'unresolved-positive');
  for (const workload of result.workloads) {
    const r=workload.runs.reference[0].values,c=workload.runs.candidate[0].values;
    assert.equal(r['jsHeapUsedBytes.warmup'],100); assert.equal(r['jsHeapUsedBytes.growth'],900);
    assert.equal(r['jsHeapUsedBytes.slope'],10); assert.equal(c['jsHeapUsedBytes.slope'],20);
    assert.equal(c['nodes.warmup'],20); assert.equal(c['nodes.growth'],180); assert.equal(c['nodes.slope'],2);
    assert.equal(c['jsEventListeners.growth'],90); assert.equal(c['jsEventListeners.slope'],1);
    const heap=workload.comparisons.find(v=>v.key==='jsHeapUsedBytes.relativeGrowthPercent');
    const difference=150-100*900/1100;
    assert.equal(heap.units.change,'percentage points'); assert.equal(heap.change.difference,difference);
    assert.deepEqual(heap.change.ci95,[difference,difference]);
    assert.ok(workload.rawPositiveObservations.some(s=>s.metric==='nodes' && s.measure==='growth' && s.value===180));
  }
  assert.ok(result.signals.every(s=>s.disposition==='unresolved'));
});
test('synthetic shortened lifecycle and missing retention checkpoint remain unqualified', () => {
  const jobs=retention().slice(0,2);
  jobs[0].retention.completedCycles=4; jobs[0].retention.requestedCheckpoints=[0,1,2,3,4];
  jobs[1].retention.checkpoints.pop();
  const result=summarizeRetention(jobs,options);
  assert.equal(result.status,'unqualified'); assert.equal(result.complete,false);
  assert.ok(result.issues.some(s=>s.includes('100-lifetime')));
  assert.ok(result.issues.some(s=>s.includes('cycle 100')));
});

// Synthetic qualification accounting. This models a terminal stop without
// importing, rewriting or relabeling any archived campaign evidence.
function qualificationFinal(workload) {
  return {offset: 100, scrollHeight: 1000, clientHeight: 500,
    targetTop: 48, targetBottom: 96, targetLeft: 0, targetRight: 400, targetHeight: 48,
    viewportTop: 48, viewportBottom: 476, viewportLeft: 0, viewportRight: 400, viewportWidth: 400,
    itemCount: workload === 'document' ? 500 : 160, targetKey: workload === 'document' ? 'row-150' : 'history-119',
    modelRevision: workload === 'document' ? 4 : null, modelAnchorOffset: workload === 'document' ? 0 : null,
    modelTotalSize: workload === 'document' ? 24000 : null, mountedKeys: ['synthetic-visible-row'],
    interaction: {focus: 1, selection: null, inputSelection: null}};
}
function qualificationJobs() {
  return ['activity','document'].flatMap(workload => ['reference','candidate'].flatMap(arm =>
    configurations.flatMap(([browser,profile]) => ['off','on'].map(observer => ({
      id: `${workload}/${arm}/${browser}/${profile}/${observer}`, workload,arm,browser,profile,observer,lane:'timing',
      status:'not-run',reason:'Synthetic terminal stop; no replacement',errors:[],
    })))));
}
function qualificationSuccess(job) {
  job.status='ok'; delete job.reason;
  job.actions=['initial','repeat'].map(endpoint=>({endpoint,status:'ok',final:qualificationFinal(job.workload)}));
  return job;
}
const qualificationPair = (result,workload='activity',arm='reference',browser='chromium',profile='desktop') =>
  result.comparisons.find(row=>row.workload===workload && row.arm===arm && row.browser===browser && row.profile===profile);

test('qualification planned not-run and absent jobs are unexecuted, never observed mismatches', () => {
  for (const jobs of [[],qualificationJobs()]) {
    const result=qualificationAgreement(jobs);
    assert.equal(result.status,'incomplete');
    assert.deepEqual(result.counts,{ok:0,mismatch:0,incomplete:16,invalid:0});
    for (const pair of result.comparisons) {
      assert.equal(pair.executed,0); assert.equal(pair.complete,false);
      assert.equal(pair.recorded,jobs.length ? 2 : 0);
      for (const endpoint of pair.endpoints) {
        assert.equal(endpoint.compared,false); assert.equal(endpoint.status,'unavailable');
        assert.deepEqual(endpoint.differences,[]); assert.equal(endpoint.unavailable.length,2);
      }
    }
  }
  assert.throws(()=>qualificationAgreement(null),/array/);
});

test('qualification terminal-contention shape preserves one agreement and fifteen incomplete pairs', () => {
  const jobs=qualificationJobs();
  const select=(workload,arm,browser,profile,observer)=>jobs.find(row=>
    row.workload===workload&&row.arm===arm&&row.browser===browser&&row.profile===profile&&row.observer===observer);
  for (const identity of [
    ['document','reference','webkit','desktop','off'], ['document','candidate','chromium','desktop','on'],
    ['activity','candidate','firefox','desktop','on'], ['activity','candidate','chromium','desktop','off'],
    ['document','candidate','webkit','desktop','on'], ['activity','reference','chromium','desktop','off'],
    ['document','candidate','webkit','desktop','off'],
  ]) qualificationSuccess(select(...identity));
  const interrupted=select('activity','candidate','chromium','mobile','on');
  interrupted.status='failed'; interrupted.errors=[{type:'contention',reason:'Synthetic external contention breach'}];
  delete interrupted.reason;
  // Four planned lifecycle records are outside off/on geometry agreement.
  jobs.push(...['activity','document'].flatMap(workload=>['reference','candidate'].map(arm=>({
    id:`${workload}/${arm}/lifecycle`,workload,arm,browser:'chromium',profile:'desktop',observer:'retention-only',lane:'retention-qualification',status:'not-run',errors:[],
  }))));
  const before=structuredClone(jobs),result=qualificationAgreement(jobs);
  assert.equal(result.status,'incomplete');
  assert.deepEqual(result.counts,{ok:1,mismatch:0,incomplete:15,invalid:0});
  assert.equal(result.comparisons.reduce((sum,row)=>sum+row.executed,0),8);
  assert.equal(result.comparisons.reduce((sum,row)=>sum+row.successful,0),7);
  const complete=qualificationPair(result,'document','candidate','webkit');
  assert.equal(complete.executed,2); assert.equal(complete.status,'ok'); assert.equal(complete.complete,true);
  assert.ok(complete.endpoints.every(row=>row.compared&&row.status==='ok'));
  const stopped=qualificationPair(result,'activity','candidate','chromium','mobile');
  assert.equal(stopped.executed,1); assert.equal(stopped.successful,0); assert.equal(stopped.status,'incomplete');
  assert.deepEqual(stopped.sides.on.jobs[0].errors,interrupted.errors);
  assert.ok(stopped.endpoints.every(row=>!row.compared&&row.differences.length===0));
  assert.deepEqual(jobs,before);
});

test('qualification distinguishes actual mismatches from missing final evidence and rejects incomplete jobs', () => {
  const jobs=qualificationJobs().map(qualificationSuccess);
  assert.equal(qualificationAgreement(jobs).status,'ok');
  jobs[1].actions[0].final.offset++;
  let result=qualificationAgreement(jobs),pair=qualificationPair(result);
  assert.equal(result.status,'mismatch'); assert.equal(pair.complete,true); assert.equal(pair.executed,2);
  assert.deepEqual(pair.endpoints[0].differences,['offset']); assert.equal(pair.endpoints[0].compared,true);
  assert.equal(pair.endpoints[1].status,'ok');
  // Missing evidence fails admission without inventing a numeric disagreement.
  delete jobs[1].actions[0].final;
  result=qualificationAgreement(jobs); pair=qualificationPair(result);
  assert.equal(result.status,'incomplete'); assert.equal(pair.executed,2); assert.equal(pair.complete,false);
  assert.deepEqual(pair.endpoints[0].differences,[]); assert.equal(pair.endpoints[0].compared,false);
  assert.equal(pair.endpoints[1].status,'ok');
  jobs[1].actions[0].final=qualificationFinal('activity'); delete jobs[1].actions[0].final.modelRevision;
  pair=qualificationPair(qualificationAgreement(jobs));
  assert.deepEqual(pair.endpoints[0].unavailable[0].missingFields,['modelRevision']);
  jobs[1].status='failed';jobs[1].errors=[{type:'contention',reason:'synthetic'}];
  pair=qualificationPair(qualificationAgreement(jobs));
  assert.equal(pair.executed,2); assert.equal(pair.complete,false); assert.equal(pair.status,'incomplete');
  assert.ok(pair.endpoints.every(row=>!row.compared&&row.differences.length===0));
});

test('qualification duplicate variants and malformed records cannot establish agreement', () => {
  const jobs=qualificationJobs().map(qualificationSuccess);
  jobs[1].observer='off';
  let pair=qualificationPair(qualificationAgreement(jobs));
  assert.equal(pair.status,'invalid'); assert.equal(pair.complete,false); assert.equal(pair.executed,2);
  assert.ok(pair.issues.includes('Duplicate off jobs'));
  assert.ok(pair.endpoints.every(row=>!row.compared&&row.differences.length===0));
  jobs[1].observer='on';delete jobs[1].status;
  pair=qualificationPair(qualificationAgreement(jobs));
  assert.equal(pair.status,'invalid');assert.equal(pair.executed,1);
  assert.ok(pair.issues.includes('Missing or unexpected job status'));
});


test('qualification preserves an explicit mismatch witness after runner invalidates its successful job', () => {
  const jobs=qualificationJobs().map(qualificationSuccess);
  jobs[1].actions[0].final.offset++;
  const observed=qualificationAgreement(jobs).comparisons.filter(row=>row.executed===2&&row.status!=='ok');
  assert.equal(observed.length,1);assert.equal(observed[0].status,'mismatch');
  // This is the runner's reporting-only invalidation, not a failed observation.
  jobs[1].observerAgreementFailure={jobStatusAtObservation:'ok',comparisons:structuredClone(observed)};
  jobs[1].status='failed';jobs[1].errors=[{type:'observer-agreement',message:'Synthetic observed mismatch'}];
  const before=structuredClone(jobs),result=qualificationAgreement(jobs),pair=qualificationPair(result);
  assert.equal(result.status,'mismatch');assert.equal(pair.status,'mismatch');
  assert.equal(pair.complete,false);assert.equal(pair.successful,1);
  assert.ok(pair.endpoints.every(row=>!row.compared&&row.differences.length===0));
  assert.equal(pair.observedMismatch.sourceJobId,jobs[1].id);
  assert.equal(pair.observedMismatch.jobStatusAtObservation,'ok');
  assert.deepEqual(pair.observedMismatch.comparison.endpoints[0].differences,['offset']);
  assert.deepEqual(jobs,before);
  // Merely retaining finals on a failed/contention job never implies success.
  jobs[1].errors.push({type:'contention',reason:'Synthetic interruption'});
  const interrupted=qualificationPair(qualificationAgreement(jobs));
  assert.equal(interrupted.status,'incomplete');assert.equal(interrupted.observedMismatch,null);
});

// Additive synthetic numerical controls. Keep the existing tests intact.
// Expectations: oracles/timing/oracle.py, an independent Python full-sort oracle.
// No performance observations or empirical qualification evidence enter this test.
function assertOracleNumber(actual, expected, label) {
  assert.ok(Number.isFinite(actual), `${label}: expected a finite number, received ${actual}`);
  assert.ok(Math.abs(actual - expected) <= 1e-9,
    `${label}: expected ${expected}, received ${actual}`);
}
function assertOracleInterval(actual, expected, label) {
  assert.equal(actual.length, 2, `${label}: interval length`);
  actual.forEach((value, index) => assertOracleNumber(value, expected[index], `${label}[${index}]`));
}
function heterogeneousTiming() {
  return timing().map(job => {
    const x = 20 + 1.5 * job.block + 0.125 * (job.block % 5) + (job.arm === 'candidate' ? 5 : 0);
    return {...job, id: `${job.workload}/${job.browser}/${job.profile}/${job.arm}/${String(job.block).padStart(2,'0')}`,
      actions: [{endpoint:'initial',status:'ok',firstAlignedMs:x,stableSixFramesMs:x+50},
        {endpoint:'repeat',status:'ok',firstAlignedMs:0.5*x+3,stableSixFramesMs:1.5*x+75}]};
  });
}
// The correlated endpoint vectors deliberately include reference resamples on
// both sides of max(4 ms, 10%). Independent arms have broad intervals; paired
// same-index arms incorrectly collapse every latency interval to one point.
const heterogeneousTimingExpected = {
  "activity/chromium/desktop": {
    "seed": 1516645656,
    "delta": [
      -5.9375,
      15.75
    ],
    "excess": [
      [
        -10.568750000000001,
        11.75
      ],
      [
        -15.568750000000001,
        7.168749999999999
      ],
      [
        -6.96875,
        3.875
      ],
      [
        -23.353125,
        10.753124999999999
      ]
    ]
  },
  "activity/firefox/desktop": {
    "seed": 842289715,
    "delta": [
      -5.75,
      15.75
    ],
    "excess": [
      [
        -10.46921875,
        11.75
      ],
      [
        -15.46921875,
        7.0875
      ],
      [
        -6.875,
        3.875
      ],
      [
        -23.203828125,
        10.63125
      ]
    ]
  },
  "activity/webkit/desktop": {
    "seed": 1081910066,
    "delta": [
      -5.75,
      15.75
    ],
    "excess": [
      [
        -10.43125,
        11.75
      ],
      [
        -15.43125,
        7.0875
      ],
      [
        -6.875,
        3.875
      ],
      [
        -23.146875,
        10.63125
      ]
    ]
  },
  "activity/chromium/mobile": {
    "seed": 2199670122,
    "delta": [
      -5.75,
      15.9375
    ],
    "excess": [
      [
        -10.5321875,
        11.9375
      ],
      [
        -15.5321875,
        7.34375
      ],
      [
        -6.875,
        3.96875
      ],
      [
        -23.29828125,
        11.015625
      ]
    ]
  },
  "document/chromium/desktop": {
    "seed": 1472847372,
    "delta": [
      -5.75,
      15.75
    ],
    "excess": [
      [
        -10.568750000000001,
        11.75
      ],
      [
        -15.568750000000001,
        7.03125
      ],
      [
        -6.875,
        3.875
      ],
      [
        -23.353125,
        10.546875
      ]
    ]
  },
  "document/firefox/desktop": {
    "seed": 2467302559,
    "delta": [
      -5.75,
      15.75
    ],
    "excess": [
      [
        -10.4875,
        11.75
      ],
      [
        -15.4875,
        7.049999999999999
      ],
      [
        -6.875,
        3.875
      ],
      [
        -23.231250000000003,
        10.575
      ]
    ]
  },
  "document/webkit/desktop": {
    "seed": 3591720574,
    "delta": [
      -5.9375,
      15.75
    ],
    "excess": [
      [
        -10.65,
        11.75
      ],
      [
        -15.65,
        7.0875
      ],
      [
        -6.96875,
        3.875
      ],
      [
        -23.475,
        10.63125
      ]
    ]
  },
  "document/chromium/mobile": {
    "seed": 158154662,
    "delta": [
      -5.75,
      15.75
    ],
    "excess": [
      [
        -10.4875,
        11.75
      ],
      [
        -15.4875,
        7.03125
      ],
      [
        -6.875,
        3.875
      ],
      [
        -23.231250000000003,
        10.546875
      ]
    ]
  }
};
test('heterogeneous seeded timing oracle preserves independent arms and whole endpoint vectors', () => {
  const jobs = heterogeneousTiming(), before = structuredClone(jobs);
  const result = summarizeTiming(jobs, options);
  assert.equal(result.complete, true);
  assert.equal(result.status, 'inconclusive');
  assert.equal(result.comparisons.length, 32);
  const endpointKeys = ['initial.firstAlignedMs','initial.stableSixFramesMs',
    'repeat.firstAlignedMs','repeat.stableSixFramesMs'];
  const referenceMedians = [42,92,24,138], candidateMedians = [47,97,26.5,145.5];
  const scales = [1,1,0.5,1.5];
  for (const comparison of result.comparisons) {
    const label = `${comparison.workload}/${comparison.browser}/${comparison.profile}`;
    const expected = heterogeneousTimingExpected[label];
    const column = endpointKeys.indexOf(`${comparison.endpoint}.${comparison.metric}`);
    assert.notEqual(column, -1);
    assert.equal(comparison.bootstrap.seed, expected.seed, `${label}: bootstrap seed`);
    assertOracleNumber(comparison.reference.median, referenceMedians[column], `${label}: reference median`);
    assertOracleNumber(comparison.candidate.median, candidateMedians[column], `${label}: candidate median`);
    assertOracleNumber(comparison.change.differenceMs, 5 * scales[column], `${label}: difference`);
    assertOracleInterval(comparison.change.ci95, expected.delta.map(value => value * scales[column]),
      `${label}/${endpointKeys[column]}: independent-arm latency interval`);
    assertOracleInterval(comparison.gate.excessCi95, expected.excess[column],
      `${label}/${endpointKeys[column]}: resampled-reference-margin excess interval`);
    assertOracleNumber(comparison.gate.marginMs, Math.max(4,0.1*referenceMedians[column]), `${label}: observed margin`);
    assert.equal(comparison.gate.status, 'inconclusive');
    assert.equal(comparison.gate.statisticalStatus, 'inconclusive');
    assert.ok(comparison.gate.excessCi95[0] < 0 && comparison.gate.excessCi95[1] > 0,
      `${label}: inconclusive must cross zero, not land on a degenerate boundary`);
  }
  // Concrete fixed-margin mutant discriminator in activity/Chromium/desktop:
  // fixed observed margin gives [-10.1375,11.55], while the correct interval is
  // [-10.56875,11.75]. A paired-arm mutant gives [5,5] for the latency interval.
  assert.deepEqual(jobs, before);
});

// Additive proposal for reveal-analysis.test.mjs; synthetic data only.
// Reuses existing options/retention() plus the timing proposal's
// assertOracleNumber(actual, expected, label) and assertOracleInterval(...).
// Expected constants were derived by standalone Python, never this analyzer.
// At n=5, these marginal CIs do NOT establish cross-metric draw reuse; see README.
const heterogeneousRetentionVectors = {
  reference: [
    [[1000,1500,1495,1490], [2,3,3,2], [80,100,105,100], [8,12,13,12]],
    [[2000,2500,2600,2700], [4,5,5,6], [180,200,197,199], [18,22,20,21]],
    [[500,800,920,820], [1,2,3,2], [70,100,120,110], [5,10,14,11]],
    [[5000,8000,8050,8150], [7,8,8,8], [500,520,520,520], [30,35,35,35]],
    [[3000,3200,3100,3190], [4,4,3,4], [200,215,207,212], [21,24,22,23]],
  ],
  candidate: [
    [[900,1550,1640,1725], [2,3,3,4], [85,110,116,115], [7,13,14,14]],
    [[2100,2350,2330,2450], [4,4,3,5], [190,205,199,208], [19,21,18,22]],
    [[550,860,900,945], [1,2,2,3], [75,105,107,117], [6,11,11,13]],
    [[5200,7900,8000,8045], [8,8,9,8], [510,525,530,528], [32,36,38,37]],
    [[2900,3350,3300,3290], [3,4,4,3], [195,218,220,214], [20,25,24,23]],
  ],
};
function heterogeneousRetention() {
  return retention().map(job => {
    const [heap,documents,nodes,listeners] = heterogeneousRetentionVectors[job.arm][job.block];
    job.retention.checkpoints = [0,10,50,100].map((cycle,index) => ({cycle,
      heap: {usedSize: heap[index]},
      dom: {documents: documents[index],nodes: nodes[index],jsEventListeners: listeners[index]},
    }));
    return job;
  }).reverse();
}

// Tuples: observed difference; reference median CI; candidate median CI; change CI.
// Both workload streams produce these intervals despite having distinct seeds.
const heterogeneousRetentionExpected = {
  'jsHeapUsedBytes.checkpoint.10': [-150,[800,8000],[860,7900],[-5650,5400]],
  'jsHeapUsedBytes.warmup': [-50,[200,3000],[250,2700],[-2550,2200]],
  'jsHeapUsedBytes.growth': [80,[-10,200],[-60,175],[-115,155]],
  'jsHeapUsedBytes.slope': [1.0327868852459017,
    [-0.11065573770491803,2.2131147540983607],[-0.6475409836065573,1.9344262295081969],
    [-1.2704918032786885,1.8032786885245904]],
  'jsHeapUsedBytes.relativeGrowthPercent': [2.38031914893617,
    [-0.6666666666666666,8],[-1.791044776119403,11.290322580645162],
    [-4.291044776119403,10.550387596899224]],
  'documents.growth': [1,[-1,1],[-1,1],[-1,2]],
  'nodes.growth': [3,[-3,10],[-4,12],[-7,12]],
  'nodes.slope': [0.04344262295081967,
    [-0.027868852459016397,0.09836065573770492],[-0.04754098360655738,0.1360655737704918],
    [-0.059016393442622946,0.14016393442622951]],
  'jsEventListeners.growth': [1,[-1,1],[-2,2],[-2,2]],
  'jsEventListeners.slope': [0.011475409836065573,
    [-0.009836065573770493,0.008196721311475409],[-0.02213114754098361,0.02295081967213115],
    [-0.021311475409836068,0.02377049180327869]],
};
const heterogeneousRetentionDerived = {
  'jsHeapUsedBytes.warmup': {reference:[500,500,300,3000,200],candidate:[650,250,310,2700,450]},
  'jsHeapUsedBytes.growth': {reference:[-10,200,20,150,-10],candidate:[175,100,85,145,-60]},
  'jsHeapUsedBytes.slope': {
    reference:[-0.11065573770491803,2.2131147540983607,0.13114754098360654,1.6803278688524592,-0.03278688524590162],
    candidate:[1.9344262295081969,1.1639344262295082,0.9426229508196722,1.5819672131147544,-0.6475409836065573],
  },
  'jsHeapUsedBytes.relativeGrowthPercent': {
    reference:[-0.6666666666666666,8,2.5,1.875,-0.3125],
    candidate:[11.290322580645162,4.25531914893617,9.883720930232558,1.8354430379746836,-1.791044776119403],
  },
  'nodes.growth': {reference:[0,-1,10,0,-3],candidate:[5,3,12,3,-4]},
};
test('heterogeneous retention preserves within-run checkpoints, independent arms and nonlinear per-run summaries', () => {
  const jobs = heterogeneousRetention(), before = structuredClone(jobs);
  const result = summarizeRetention(jobs,options);
  assert.equal(result.complete,true);
  assert.equal(result.status,'unresolved-positive');
  assert.equal(result.workloads.length,2);
  for (const workload of result.workloads) {
    const label = workload.workload;
    assert.equal(workload.bootstrap.seed,{activity:3843372266,document:2457539238}[label]);
    assert.equal(workload.bootstrap.iterations,10000);
    assert.equal(workload.comparisons.length,29);
    for (const [key,[difference,referenceCi,candidateCi,changeCi]] of Object.entries(heterogeneousRetentionExpected)) {
      const comparison = workload.comparisons.find(row => row.key===key);
      assert.ok(comparison,`${label}/${key} exists`);
      assertOracleNumber(comparison.change.difference,difference,`${label}/${key} difference`);
      assertOracleInterval(comparison.reference.medianCi95,referenceCi,`${label}/${key} reference interval`);
      assertOracleInterval(comparison.candidate.medianCi95,candidateCi,`${label}/${key} candidate interval`);
      assertOracleInterval(comparison.change.ci95,changeCi,`${label}/${key} change interval`);
    }
    for (const [key,arms] of Object.entries(heterogeneousRetentionDerived)) {
      const comparison = workload.comparisons.find(row => row.key===key);
      for (const arm of ['reference','candidate']) {
        assert.equal(comparison[arm].values.length,5);
        comparison[arm].values.forEach((value,index) =>
          assertOracleNumber(value,arms[arm][index],`${label}/${arm}/${key}/${index}`));
      }
    }
    const relative = workload.comparisons.find(row => row.key==='jsHeapUsedBytes.relativeGrowthPercent');
    assert.equal(relative.units.arm,'percent');
    assert.equal(relative.units.change,'percentage points');
    assert.ok(workload.rawPositiveObservations.some(row =>
      row.arm==='reference' && row.metric==='nodes' && row.measure==='growth' && row.value===10));
    assert.ok(workload.rawPositiveObservations.some(row =>
      row.arm==='candidate' && row.metric==='nodes' && row.measure==='growth' && row.value===12));
  }
  assert.ok(result.signals.every(signal => signal.disposition==='unresolved'));
  assert.deepEqual(jobs,before);
});
