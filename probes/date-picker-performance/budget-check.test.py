"""Acceptance-regression tests: uncertainty must not hide an over-budget result."""
import unittest,tempfile,pathlib,json,os,subprocess,copy
ROOT=pathlib.Path(__file__).resolve().parents[2]
class Budgets(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.base=pathlib.Path(self.tmp.name)
  (self.base/'budgets.json').write_bytes((ROOT/'showcases/performance/baselines/scoped-registry-phase-6-v1/budgets.json').read_bytes())
  common=dict(run='final-cold',arm='candidate/dom',browser='chromium',profile='desktop',action='keyboard',mode='global',n=30)
  self.data={'rows':[dict(common,metric='firstFocusMs',change=10,interval=[8,12]),dict(common,metric='startupNodes',percent=-75),dict(common,metric='startupJSBytes',percent=8,change=4094,interval=[4094,4094])], 'retention':[dict(arm=arm,mode=mode,heapGrowth=100,nodesGrowth=0,listenersGrowth=0) for arm in ['parent/eager','candidate/dom'] for mode in ['global','scoped'] for _ in range(5)]}
 def tearDown(self):self.tmp.cleanup()
 def check(self,expected):
  (self.base/'analysis.json').write_text(json.dumps(self.data));result=subprocess.run(['python3',str(ROOT/'probes/date-picker-performance/check-budgets.py')],cwd=ROOT,env=dict(os.environ,PHASE6_BASE=str(self.base)),capture_output=True,text=True)
  self.assertEqual(result.returncode,0 if expected else 1,result.stderr);receipt=json.loads((self.base/'budget-check.json').read_text());self.assertEqual(receipt['automatedGate'],'pass' if expected else 'not_passed');return receipt
 def confirm(self,change=10,upper=12):self.data['rows'].append(dict(self.data['rows'][0],run='confirmation-desktop',change=change,interval=[8,upper]))
 def test_within(self):self.check(True)
 def test_uncertain_requires_confirmation(self):self.data['rows'][0]['interval']=[8,20];self.check(False)
 def test_confirmed_preserves_primary_uncertainty(self):
  self.data['rows'][0]['interval']=[8,20];self.confirm();receipt=self.check(True);self.assertEqual(receipt['checks'][0]['primaryStatus'],'confirmation_required');self.assertEqual(receipt['checks'][0]['status'],'confirmed_within')
 def test_over_budget_cannot_be_replaced_by_favorable_repeat(self):self.data['rows'][0].update(change=18,interval=[15,22]);self.confirm();self.check(False)
 def test_all_confirmations_must_pass(self):
  self.data['rows'][0]['interval']=[8,20];self.confirm();self.data['rows'].append(dict(self.data['rows'][0],run='confirmation-desktop-second'));self.check(False)
 def test_bytes_exceed(self):self.data['rows'][2].update(change=4097,interval=[4097,4097]);self.check(False)
 def test_retention_growth_exceeds(self):self.data['retention'][0]['nodesGrowth']=21;self.check(False)
 def test_no_useful_benefit(self):self.data['rows'][1]['percent']=-5;self.check(False)
if __name__=='__main__':unittest.main()
