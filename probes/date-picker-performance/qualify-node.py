import os
from pathlib import Path
import subprocess
stage=Path(Path((os.environ.get('PHASE6_BASE','artifacts/scoped-registry-phase-6')+'/candidate/stage.txt')).read_text())
commands=[['node','--test','packages/elements/src/date-picker/tests/deferred.test.mjs','tooling/metadata/definition-graph.test.ts','packages/elements/src/calendar/tests/calendar-ssr.test.mjs','packages/elements/src/calendar/tests/calendar-adapter.test.mjs','packages/elements/src/calendar/tests/date-range.test.mjs'],['npm','test','-w','@en-reve/ssr'],['npm','run','check:api'],['npm','run','check:types']]
with open((os.environ.get('PHASE6_BASE','artifacts/scoped-registry-phase-6')+'/release-node-tests.log'),'w') as log:
 for command in commands:subprocess.run(command,cwd=stage,stdout=log,stderr=subprocess.STDOUT,check=True)
print('All candidate node and metadata checks passed.')
