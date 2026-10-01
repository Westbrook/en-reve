/** Add a private native-event receipt while preserving the caller's chosen reporters. */
export function withNodeFacetReporter(command,{reporter,destination}) {
 if(command[1]!=='--test')throw new Error('Expected a direct native Node test command');
 const reporters=[],destinations=[],rest=[command[0],'--test'];
 for(let index=2;index<command.length;index++){
  const arg=command[index];
  if(arg==='--test-reporter'||arg==='--test-reporter-destination'){
   const value=command[++index];if(!value||value.startsWith('--'))throw new Error('Missing Node reporter option value');
   (arg==='--test-reporter'?reporters:destinations).push(value);
  }else if(arg.startsWith('--test-reporter='))reporters.push(arg.slice('--test-reporter='.length));
  else if(arg.startsWith('--test-reporter-destination='))destinations.push(arg.slice('--test-reporter-destination='.length));
  else rest.push(arg);
 }
 if(!reporters.length)reporters.push('tap');
 if(!destinations.length&&reporters.length===1)destinations.push('stdout');
 if(destinations.length!==reporters.length)throw new Error('Node reporter and destination counts must match');
 const options=reporters.flatMap((value,index)=>[`--test-reporter=${value}`,`--test-reporter-destination=${destinations[index]}`]);
 options.push(`--test-reporter=${reporter}`,`--test-reporter-destination=${destination}`);
 return [...rest.slice(0,2),...options,...rest.slice(2)];
}
