"""Apply isolated parent→candidate metadata changes without replacing unrelated edits."""
from pathlib import Path
import json,subprocess,hashlib,argparse
parser=argparse.ArgumentParser();parser.add_argument('--base-stage-file',default='artifacts/scoped-registry-phase-6/parent/stage.txt');parser.add_argument('--candidate-stage-file',default='artifacts/scoped-registry-phase-6/candidate/stage.txt');args=parser.parse_args()
root=Path.cwd();stage=Path((root/args.candidate_stage_file).read_text());base_stage=Path((root/args.base_stage_file).read_text());parent='2dc77b5773839f7afdd52ce0b4fc68a6af35d0f4';missing=object()
def merge(base,new,current,path=''):
 if new==base:return current
 if current==base or current==new:return new
 if all(isinstance(x,dict) for x in [base,new,current]):
  out=dict(current)
  for k in set(base)|set(new):
   b=base.get(k,missing);n=new.get(k,missing);c=current.get(k,missing)
   if n==b:continue
   result=merge(b,n,c,path+'/'+k)
   if result is missing:out.pop(k,None)
   else:out[k]=result
  return out
 if all(isinstance(x,list) for x in [base,new,current]):
  for key in ['path','name','tagName','id']:
   if all(all(isinstance(i,dict) and key in i for i in x) and len({i[key] for i in x})==len(x) for x in [base,new,current]):
    result=merge({i[key]:i for i in base},{i[key]:i for i in new},{i[key]:i for i in current},path)
    order=list(dict.fromkeys([i[key] for i in current]+[i[key] for i in new]));return [result[k] for k in order if k in result]
  if all(all(isinstance(i,str) for i in x) for x in [base,new,current]):return [i for i in current if i not in set(base)-set(new)]+[i for i in new if i not in base and i not in current]
 if '/members/' in path and path.endswith('/type/text'):
  print('Preserved existing inferred type:',path);return current
 raise ValueError('Concurrent metadata change at '+path)
names=['custom-elements.json','custom-elements.json.receipt.json','public-types.json','public-api.json'];out={}
for name in names:
 path='packages/elements/'+name;base=json.loads((base_stage/path).read_text());new=json.loads((stage/path).read_text());current=json.loads((root/path).read_text())
 base=json.loads(json.dumps(base).replace(str(base_stage),str(root)))
 new=json.loads(json.dumps(new).replace(str(stage),str(root)))
 # Analyzer inference can drift in unrelated components when a new source is added.
 # Only the date pilot's module/component deltas belong to this task.
 if name=='custom-elements.json':
  old={m['path']:m for m in base['modules']}
  new['modules']=[m if 'date-picker' in m['path'] else old.get(m['path'],m) for m in new['modules']]
 if name=='public-api.json':
  key='tagName' if 'tagName' in base['components'][0] else 'tag'
  old={m[key]:m for m in base['components']}
  new['components']=[m if m[key]=='en-date-picker' else old.get(m[key],m) for m in new['components']]
 # Derived aggregate digests are recalculated after preserving component entries.
 for key in ['manifestDigest','typeDigest']:
  if key in base:current[key]=base[key]
 out[name]=merge(base,new,current,name)
date=next(d for m in out['custom-elements.json']['modules'] if m['path']=='src/date-picker/element.ts' for d in m.get('declarations',[]) if d.get('name')=='EnDatePicker')
component=next(c for c in out['public-api.json']['components'] if c['tagName']=='en-date-picker')
component['members']=[m for m in date.get('members',[]) if m.get('privacy') not in ['private','protected']]
component['attributes']=date.get('attributes',[])
def digest(x):return 'sha256:'+hashlib.sha256(json.dumps(x,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
out['custom-elements.json.receipt.json']['manifestDigest']=digest(out['custom-elements.json']);out['public-api.json']['manifestDigest']=digest(out['custom-elements.json']);out['public-api.json']['typeDigest']=digest(out['public-types.json'])
for name,data in out.items():(root/'packages/elements'/name).write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
print('Merged date metadata, preserving unrelated entries.')
