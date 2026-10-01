import os
from pathlib import Path
import shutil,subprocess,json
root=Path.cwd();stage=Path((root/(os.environ.get('PHASE6_BASE','artifacts/scoped-registry-phase-6')+'/candidate/stage.txt')).read_text());consumer=stage/'consumer';shutil.copy2(root/'probes/date-picker-performance/consumer-types.ts',consumer/'types.ts')
(consumer/'tsconfig.types.json').write_text(json.dumps({'compilerOptions':{'target':'ES2022','module':'ESNext','moduleResolution':'Bundler','lib':['ES2022','DOM','DOM.Iterable'],'strict':True,'skipLibCheck':True,'noEmit':True},'files':['types.ts']}))
with (root/(os.environ.get('PHASE6_BASE','artifacts/scoped-registry-phase-6')+'/consumer-types.log')).open('w') as log:subprocess.run(['node',str(root/'node_modules/typescript/bin/tsc'),'-p','tsconfig.types.json'],cwd=consumer,stdout=log,stderr=subprocess.STDOUT,check=True)
print('Packed eager/shell public API consumer types passed.')
