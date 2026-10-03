// Browser-safe contract shared by capture planning and evidence import.
export function validateActions(actions) {
 if (!Array.isArray(actions)) throw new Error('State actions must be an array.');
 for (const action of actions) {
  if (!action || !['click','focus','hover','fill','press','select','files','drag'].includes(action.kind) || typeof action.selector !== 'string' || !action.selector.trim()) throw new Error('Unsupported declarative state action.');
  if (['fill','press','select'].includes(action.kind) && typeof action.value !== 'string') throw new Error('State action requires a string value.');
  if (action.whenViewport !== undefined) {
   const bounds=action.whenViewport;
   if (!bounds || typeof bounds !== 'object' || Array.isArray(bounds) || !Object.keys(bounds).length || Object.entries(bounds).some(([key,value])=>!['minWidth','maxWidth'].includes(key)||!Number.isInteger(value)||value<1) || (bounds.minWidth!==undefined&&bounds.maxWidth!==undefined&&bounds.minWidth>bounds.maxWidth)) throw new Error('Viewport conditions require valid minimum/maximum CSS pixel widths.');
  }
  if (action.modifiers !== undefined && (action.kind !== 'click' || !Array.isArray(action.modifiers) || action.modifiers.some(key => !['Alt','Control','Meta','Shift'].includes(key)) || new Set(action.modifiers).size !== action.modifiers.length)) throw new Error('Invalid click modifiers.');
  if (action.kind === 'files') {
   if (!Array.isArray(action.files)) throw new Error('File selection requires explicit fixture files.');
   for (const file of action.files) {
    if (!file || typeof file.name !== 'string' || !file.name.trim() || /[/\\\0]/.test(file.name) || ['.','..'].includes(file.name) || typeof file.mimeType !== 'string' || /[\r\n\0]/.test(file.mimeType) || typeof file.base64 !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(file.base64)) throw new Error('File fixtures need a basename, MIME type and base64 bytes; filesystem paths are not accepted.');
   }
  }
  if (action.kind === 'drag') {
   if (!['release','escape','hold'].includes(action.end ?? 'release')) throw new Error('Unknown drag completion.');
   if (action.target !== undefined && (typeof action.target !== 'string' || !action.target.trim())) throw new Error('Invalid drag target.');
   for (const point of [action.from,action.to]) if (!point || !['x','y'].every(axis => typeof point[axis] === 'number' && Number.isFinite(point[axis]) && point[axis] >= 0 && point[axis] <= 1)) throw new Error('Drag coordinates must be normalized fractions within each target.');
   if (action.steps !== undefined && (!Number.isInteger(action.steps) || action.steps < 1 || action.steps > 100)) throw new Error('Drag steps must be between1 and100.');
  }
 }
}

export function actionApplies(action,viewport) {
 const bounds=action.whenViewport;
 if (!bounds) return true;
 if (!viewport || !Number.isInteger(viewport.width) || viewport.width<1) throw new Error('Conditional actions require an explicit authored viewport.');
 return (bounds.minWidth===undefined||viewport.width>=bounds.minWidth)&&(bounds.maxWidth===undefined||viewport.width<=bounds.maxWidth);
}
