"""Run one command in a fresh evidence directory with a monotonic wall clock."""
import argparse,datetime,json,os,pathlib,subprocess,time,shutil,hashlib,sys
p=argparse.ArgumentParser();p.add_argument('--out',required=True);p.add_argument('command',nargs=argparse.REMAINDER);a=p.parse_args();cmd=a.command[1:] if a.command[:1]==['--'] else a.command
out=pathlib.Path(a.out).resolve();out.mkdir(parents=True,exist_ok=False)
r=dict(command=cmd,cwd=os.getcwd(),startedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),executable=shutil.which(cmd[0]),environment={k:v for k,v in os.environ.items() if k.startswith(('EN_','PLAYWRIGHT_','TOKEN_','PROPERTY_','SCOPE_','EVIDENCE_','PHASE6_'))},sourceCommit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip())
r['recordingPython']={'executable':sys.executable,'version':sys.version}
identity=os.environ.get('EN_TEST_PIPELINE_IDENTITY')
if identity:
 r['identity']={'path':str(pathlib.Path(identity).resolve()),'sha256':hashlib.sha256(pathlib.Path(identity).read_bytes()).hexdigest()}
t=time.monotonic()
with open(out/'command.log','w') as log:
 child=subprocess.run(cmd,stdout=log,stderr=subprocess.STDOUT)
r.update(exitCode=child.returncode,wallSeconds=round(time.monotonic()-t,6),completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat());(out/'receipt.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r));raise SystemExit(child.returncode)
