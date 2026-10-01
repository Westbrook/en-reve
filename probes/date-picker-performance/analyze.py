import os
"""Matched exploratory bootstrap summaries; no trimming or p95 claims at n=30."""
from pathlib import Path
import json,statistics,random,sys,collections,math
base=Path(os.environ.get('PHASE6_BASE','artifacts/scoped-registry-phase-6'));runs=sys.argv[1:] or ['final-cold','final-warm'];groups=collections.defaultdict(list)
def quantile(a,p):
 a=sorted(a);pos=(len(a)-1)*p;lo=math.floor(pos);hi=math.ceil(pos);return a[lo]+(a[hi]-a[lo])*(pos-lo)
def summary(a):return dict(n=len(a),median=statistics.median(a),p75=quantile(a,.75),minimum=min(a),maximum=max(a))
for run in runs:
 for line in (base/run/'samples.jsonl').read_text().splitlines():
  x=json.loads(line);groups[(run,x['path'],x['mode'],x['browser'],x['profile'],x['input'],x['kind'])].append(x)
rows=[];retention=[]
for key,samples in sorted(groups.items()):
 run,path,mode,browser,profile,action,kind=key;common=dict(run=run,arm=path,mode=mode,actualModes=sorted(set(x['startup']['mode'] for x in samples)),browser=browser,profile=profile,action=action)
 if kind=='retention':
  for sample in samples:
   a=next(c for c in sample['checkpoints'] if c['cycle']==10);b=sample['checkpoints'][-1];retention.append(dict(**common,block=sample['block'],heapGrowth=b['heapBytes']-a['heapBytes'],nodesGrowth=b['dom']['nodes']-a['dom']['nodes'],listenersGrowth=b['dom']['jsEventListeners']-a['dom']['jsEventListeners'],documents=b['dom']['documents']))
  continue
 for metric in samples[0]['metrics']:
  values=[s['metrics'][metric] for s in samples if s['metrics'][metric] is not None]
  if not values:continue
  row=dict(**common,metric=metric,**summary(values));control=groups.get((run,'parent/eager',mode,browser,profile,action,kind))
  if path!='parent/eager' and control:
   pairs=[(s['metrics'][metric],next(c['metrics'][metric] for c in control if c['block']==s['block'])) for s in samples];pairs=[p for p in pairs if None not in p];a=[p[0] for p in pairs];b=[p[1] for p in pairs];delta=statistics.median(a)-statistics.median(b);rng=random.Random(62026);boots=[]
   for _ in range(3000):
    indexes=[rng.randrange(len(pairs)) for _ in pairs];boots.append(statistics.median([a[i] for i in indexes])-statistics.median([b[i] for i in indexes]))
   row.update(parentMedian=statistics.median(b),change=delta,percent=100*delta/statistics.median(b) if statistics.median(b) else None,interval=[quantile(boots,.025),quantile(boots,.975)])
  rows.append(row)
output=dict(runs=runs,method='Untrimmed samples, interpolated p75, 3000 matched-block bootstrap resamples of difference of medians; exploratory 95% intervals, no multiple-comparison correction.',rows=rows,retention=retention)
(base/'analysis.json').write_text(json.dumps(output,indent=2)+'\n')
print(len(rows),'metric rows;',len(retention),'retention repetitions')
