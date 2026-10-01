import json,pathlib,hashlib,datetime,collections
r=pathlib.Path('artifacts/scoped-registry-phase-4-followup');read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();evidence={}
for name,n in [('qualification',21),('campaign',555)]:
 m=read(r/name/'manifest.json');s=read(r/name/'summary.json');rows=[json.loads(x) for x in (r/name/'samples.jsonl').read_text().splitlines()];key=lambda x:tuple(x[k] for k in ['kind','policy','browser','profile','input','block'])
 assert len(rows)==n and s['passed']==n and s['failed']==0
 assert [key(x) for x in rows]==[key(x) for x in m['jobs']];assert len(set(map(key,rows)))==n
 assert all(x['status']=='ok' and not x['errors'] and not x['failures'] for x in rows)
 for row in rows:
  if row['input']=='abandon':
   assert not row['unused']['open'] and not row['abandoned']['open'];assert row['unused']['defined']==(row['policy']=='eager')
   assert row['abandoned']['defined']==(row['policy']=='eager');assert row['abandoned']['status']=='' and row['abandoned']['busy']=='false'
  if row['policy']=='eager' and row['input']!='abandon':assert not [x for x in row['action']['resources'] if x['name'].endswith('.js')]
  if row['kind']=='retention':assert [c['cycle'] for c in row['checkpoints']]==[0,10,50,100] and all(c['apps']==1 for c in row['checkpoints'])
 counts=collections.Counter('/'.join(key(x)[:-1]) for x in rows)
 assert all(count==(1 if name=='qualification' else 5 if k.startswith('retention/') else 30) for k,count in counts.items())
 for h in m['harness']:assert sha(pathlib.Path('probes/production-registry/phase4-followup')/h['name'])==h['sha256']
 assert sha(r/'protocol.md')==m['protocolSha256']
 evidence[name]={'summary':s,'exactSchedule':True,'configurationCounts':dict(counts),'browserVersions':{b:sorted(set(x['browserVersion'] for x in rows if x['browser']==b)) for b in ['chromium','firefox','webkit']}}
for name in ['support-before.json','workspace-before.json']:
 for h in read(r/name):
  expected=h['sha256']
  if name=='support-before.json' and h['path']=='showcases/performance/src/delivery.mjs':
   audit=read(r/'support-audit.json');assert h['sha256']==audit['beforeSha256'];assert sha(r/audit['preservedBefore'])==audit['beforeSha256'];assert sha(r/audit['preservedAfter'])==audit['afterSha256'];expected=audit['afterSha256']
  assert sha(pathlib.Path(h['path']))==expected,h['path']
for policy in ['intent','route','eager']:
 receipt=read(r/policy/'receipt.json')
 for a in receipt['assets']:assert sha(r/policy/'site'/a['path'])==a['sha256']
assert read(r/'functional.json')['passed']==33
v={'status':'passed','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),**evidence,'productionDefaultUnchanged':True,'measuredSupportUnchanged':True,'unusedHelperChangeAudit':read(r/'support-audit.json'),'eagerFirstUseRequestsNoJavaScript':True,'limitations':['Shared local workstation and emulated network/CPU; not field or physical-device latency.','Immediate interaction follows page readiness; startup-interaction overlap is not tested.','Navigation-to-focus includes automation dispatch; no controlled human reaction-time claim.','Abandonment first observes500ms with no intent, then focus/blur plus500ms; no prediction-accuracy, cache-eviction or navigation-away model.','Resource timing counts completed responses; route loading can straddle the startup snapshot.','Readiness and frame callbacks are not confirmed paint or INP.','Five retention repetitions are descriptive, not proof of no leaks.','Manual screen-reader review remains outstanding.','Thermal/power status may be unavailable; command output preserved.'],'preservedAttempts':['Initial functional acquisition deferred by shared browser lock.','A functional run reached eager before its corrected build receipt was available; complete33-check rerun passed.','Preflight eager build retained a lazy wrapper; replaced before measurements with the existing eager consumer path.','Initial successful21-job qualification superseded by the added no-intent observation.','Final-protocol qualification initially deferred by shared browser lock before any samples.']}
(r/'capture-verification.json').write_text(json.dumps(v,indent=2)+'\n');print(json.dumps({'status':'passed','timingAndObservationSamples':540,'retentionRuns':15}))
