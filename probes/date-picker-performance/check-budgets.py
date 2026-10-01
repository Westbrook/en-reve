"""Evaluate the unchanged practical budgets, preserving primary and confirmation evidence."""
from pathlib import Path
import os,json,statistics,sys
base=Path(os.environ.get('PHASE6_BASE','artifacts/scoped-registry-phase-6'))
data=json.loads((base/'analysis.json').read_text());budgets=json.loads((base/'budgets.json').read_text());checks=[]
assert budgets==json.loads(Path('showcases/performance/baselines/scoped-registry-phase-6-v1/budgets.json').read_text()),'Budget changed'
keys=['browser','profile','action','mode','metric']
for r in data['rows']:
 if r['arm']!='candidate/dom' or r['run']!='final-cold':continue
 desktop=r['profile']=='desktop';key={'firstFocusMs':'desktopFirstFocus' if desktop else 'constrainedFirstFocus','secondFocusMs':'desktopRepeatedFocus' if desktop else 'constrainedRepeatedFocus','shellReadyMs':'desktopShellReady' if desktop else 'constrainedShellReady'}.get(r['metric']);limit=budgets['maximumAddedLatencyMs'].get(key) if key else budgets['maximumAddedUnusedDeliveryBytes'] if r['metric'] in ['startupJSBytes','unusedBytes','abandonedBytes'] else None
 if limit is None:continue
 status='within' if r['interval'][1]<=limit else 'confirmation_required' if r['change']<=limit else 'over_budget'
 check={k:r[k] for k in keys+['n','change','interval']}|{'limit':limit,'primaryStatus':status,'status':status,'confirmations':[]}
 if status!='within':
  for c in data['rows']:
   if c['run'].startswith('confirmation-') and c['arm']=='candidate/dom' and all(c[k]==r[k] for k in keys):
    check['confirmations'].append({k:c[k] for k in ['run','n','change','interval']}|{'within':c['n']>=30 and c['interval'][1]<=limit})
  # Only primary uncertainty can be resolved by confirmation. A primary over-budget
  # median needs a new candidate, not a favorable rerun selected after the fact.
  if status=='confirmation_required' and check['confirmations'] and all(c['within'] for c in check['confirmations']):check['status']='confirmed_within'
 checks.append(check)
growth=[r|{'nodesWithin':r['nodesGrowth']<=budgets['retention']['growth10To100Nodes'],'listenersWithin':r['listenersGrowth']<=budgets['retention']['growth10To100Listeners']} for r in data['retention']]
heap=[]
for mode in ['global','scoped']:
 candidate=[r['heapGrowth'] for r in growth if r['arm']=='candidate/dom' and r['mode']==mode];parent=[r['heapGrowth'] for r in growth if r['arm']=='parent/eager' and r['mode']==mode]
 assert len(candidate)>=5 and len(parent)>=5,'Separate retention repetitions missing'
 delta=statistics.median(candidate)-statistics.median(parent);limit=budgets['retention']['additionalHeapGrowthVersusParentBytes'];heap.append({'mode':mode,'candidateMedian':statistics.median(candidate),'parentMedian':statistics.median(parent),'additionalMedian':delta,'limit':limit,'within':delta<=limit})
benefit=[]
for r in data['rows']:
 if r['arm']=='candidate/dom' and r['run']=='final-cold' and r['metric']=='startupNodes':
  byte=next(c for c in data['rows'] if c['run']==r['run'] and c['arm']==r['arm'] and c['metric']=='startupJSBytes' and all(c[k]==r[k] for k in keys[:-1]))
  benefit.append({k:r[k] for k in keys[:-1]}|{'nodeReductionPercent':-r['percent'],'byteReductionPercent':-byte['percent'],'within':-r['percent']>=budgets['minimumBenefit']['unusedConnectedNodeReductionPercent'] or -byte['percent']>=budgets['minimumBenefit']['orStartupJSReductionPercent']})
unresolved=[c for c in checks if c['status'] not in ['within','confirmed_within']]
passed=not unresolved and all(r['nodesWithin'] and r['listenersWithin'] for r in growth) and all(h['within'] for h in heap) and benefit and all(b['within'] for b in benefit)
result={'budgetsUnchanged':True,'checks':checks,'retention':growth,'heapBudget':heap,'benefit':benefit,'nonWithin':unresolved,'automatedGate':'pass' if passed else 'not_passed','manualGate':'See separate manual-review.json; automated results do not establish speech.'}
(base/'budget-check.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:result[k] for k in ['automatedGate','nonWithin','heapBudget']},indent=2));sys.exit(0 if passed else 1)
