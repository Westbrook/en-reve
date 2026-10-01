import assert from 'node:assert/strict';
import { verifyCandidateFocus } from './verify-focus.mjs';
import { positionFramedTarget, captureVisibleFramed } from './capture.mjs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, basename, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { candidateIds } from './catalogue.mjs';

// Run from the checkout after building. Inputs are real exported candidate files;
// this verifier never injects candidate CSS or reaches into the app workspace.
const argument = name => {const index=process.argv.indexOf(name);return index<0?undefined:process.argv[index+1];};
const repo=resolve(process.env.EN_CANDIDATE_REPO ?? process.cwd());
const directory=resolve(argument('--candidates') ?? process.env.EN_CANDIDATES ?? resolve(repo,'artifacts/theme-candidates/paired-appearances'));
const output=resolve(argument('--output') ?? process.env.EN_CANDIDATE_OUTPUT ?? resolve(repo,'node_modules/.cache/en-paired-candidates'));
const origin=new URL(process.env.EN_CANDIDATE_ORIGIN ?? 'http://127.0.0.1:4391').origin;
assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(origin).hostname),'This runner is for the local built server.');
const {chromium,firefox,webkit,expect}=await import(pathToFileURL(resolve(repo,'node_modules/@playwright/test/index.mjs')).href);
const hash=bytes=>`sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const manifest=JSON.parse(await readFile(resolve(directory,'manifest.json'),'utf8'));
assert.deepEqual(manifest.candidates.map(candidate=>candidate.id),candidateIds,'Expect all canonical inspired and original theme pairs.');
const candidates=await Promise.all(manifest.candidates.map(async candidate=>{
  const file=resolve(directory,candidate.file);
  assert.ok(file.startsWith(directory+sep),'Candidate file must stay in its artifact directory.');
  const bytes=await readFile(file); const bundle=JSON.parse(bytes);
  assert.equal(hash(bytes),candidate.fileHash,`${candidate.id} file hash`);
  assert.equal(bundle.schema,'en-reve/local-theme-review');assert.equal(bundle.schemaVersion,2);
  assert.equal(bundle.draft.schema,'en-reve/theme-review-pair');assert.equal(bundle.draft.schemaVersion,1);
  assert.equal(bundle.build.fingerprint,manifest.buildFingerprint);
  assert.ok(bundle.draft.pairSourceHash?.startsWith('sha256:'));
  for(const mode of ['light','dark']) assert.equal(bundle.draft.branches[mode].candidate.theme.mode,mode);
  return {...candidate,file,bundle,pairSourceHash:bundle.draft.pairSourceHash};
}));
await mkdir(output,{recursive:true});
const receipt={createdAt:new Date().toISOString(),buildFingerprint:manifest.buildFingerprint,inputDirectory:directory,
  scope:`${candidateIds.length} real paired file imports × two explicit editing appearances × three installed engines. Built hydrated specimen CSS, native icon geometry/loading/name/identity, pair receipts, toolbar/menu/command-palette use journeys, and targeted computed solid-paint contrast. No whole-system WCAG, pixel-equivalence, manual AT, OS-keyboard, or current-minus-one claim.`,
  contrastMethod:'Browser canvas converts computed CSS colors to sRGB bytes; source-over alpha is resolved against explicit flattened ancestors through slots/shadow hosts. Gradients, opacity groups, filters and blends are marked unmeasured. Ratios describe declared paint, not antialiased glyph pixels.',cases:[],engines:[]};
const save=()=>writeFile(resolve(output,'verification.json'),JSON.stringify(receipt,null,2)+'\n');
const near=(a,b)=>assert.ok(Math.abs(a-b)<=.15,`${a} differs from ${b}`);
const geometry=locator=>locator.evaluate(node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node);return {width:r.width,height:r.height,paddingInline:s.paddingInlineStart,paddingBlock:s.paddingBlockStart,radius:s.borderRadius,outlineWidth:s.outlineWidth,outlineStyle:s.outlineStyle,outlineColor:s.outlineColor};});

// Self-contained for locator.evaluate; ancestors follow the flattened rendering
// path rather than assuming body or a particular theme token is the background.
function renderedContrast(node,{outline=false}={}) {
  const doc=node.ownerDocument, win=doc.defaultView;
  const canvas=doc.createElement('canvas');canvas.width=canvas.height=1;
  const context=canvas.getContext('2d',{willReadFrequently:true,colorSpace:'srgb'});
  const rgba=css=>{context.clearRect(0,0,1,1);context.fillStyle=css;context.fillRect(0,0,1,1);return [...context.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v);};
  const over=(front,back)=>{const a=front[3]+back[3]*(1-front[3]);return a===0?[0,0,0,0]:[0,1,2].map(i=>(front[i]*front[3]+back[i]*back[3]*(1-front[3]))/a).concat(a);};
  const parent=el=>el.assignedSlot ?? el.parentElement ?? (el.getRootNode() instanceof win.ShadowRoot ? el.getRootNode().host : null);
  const describe=el=>`${el.localName}${el.id?'#'+el.id:''}${el.getAttribute('part')?'[part~="'+el.getAttribute('part')+'"]':''}${el.getAttribute('data-specimen')?'[data-specimen="'+el.getAttribute('data-specimen')+'"]':''}`;
  const path=[],unsupported=[];
  let cursor=node;
  while(cursor){
    const s=win.getComputedStyle(cursor),r=cursor.getBoundingClientRect();
    if(s.backgroundImage!=='none')unsupported.push(`${describe(cursor)} background image ${s.backgroundImage}`);
    if(Number(s.opacity)!==1)unsupported.push(`${describe(cursor)} opacity ${s.opacity}`);
    if(s.filter!=='none'||s.mixBlendMode!=='normal')unsupported.push(`${describe(cursor)} filter/blend`);
    if(s.visibility!=='visible'||s.display==='none')unsupported.push(`${describe(cursor)} is not visible`);
    // display:contents/slot has no painted box even if a background is declared.
    const paints=s.display!=='contents'&&r.width>0&&r.height>0;
    path.push({element:describe(cursor),color:s.backgroundColor,rgba:paints?rgba(s.backgroundColor):[0,0,0,0],paints,rect:{x:r.x,y:r.y,width:r.width,height:r.height}});
    cursor=parent(cursor);
  }
  let background=[0,0,0,0];
  for(const layer of [...path].reverse())background=over(layer.rgba,background);
  if(background[3]<.999)unsupported.push('No fully opaque document/ancestor background; canvas color was not assumed.');
  const s=win.getComputedStyle(node),frontCSS=outline?s.outlineColor:s.color,front=rgba(frontCSS),composite=over(front,background);
  const luminance=color=>[0,1,2].map(i=>{const x=color[i]/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  const a=luminance(composite),b=luminance(background),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  const fontSize=parseFloat(s.fontSize),fontWeight=parseFloat(s.fontWeight),threshold=outline?3:(fontSize>=24||(fontSize>=18.6667&&fontWeight>=700)?3:4.5);
  if(outline&&(s.outlineStyle==='none'||parseFloat(s.outlineWidth)<=0))unsupported.push('The candidate row has no painted outline.');
  if(outline&&parseFloat(s.outlineOffset)>-parseFloat(s.outlineWidth))unsupported.push('Outline is not wholly inset; the row background alone is not its full adjacent paint.');
  return {text:node.textContent?.trim().slice(0,120),kind:outline?'inset-active-outline':'text',foregroundCSS:frontCSS,foregroundRGBA:front,
    backgroundRGBA:background,compositedForegroundRGBA:composite,ratio,threshold,fontSize,fontWeight,
    ...(outline?{outlineWidth:s.outlineWidth,outlineOffset:s.outlineOffset,outlineStyle:s.outlineStyle}:{}),
    paintPath:path,unsupported,status:unsupported.length?'unmeasured':ratio+1e-9>=threshold?'passed':'below-threshold'};
}
const sampleContrast=async(locator,label,options)=>{await locator.scrollIntoViewIfNeeded();await expect(locator).toBeVisible();return {label,...await locator.evaluate(renderedContrast,options)};};

// Runs inside the existing imported-candidate loop. No injected theme or new
// fixture DOM: all interactions address the real command-surfaces specimen.
async function verifyCommandFamily({page,iframe,frame,item}) {
  const specimen=frame.locator('[data-specimen="command-surfaces"]');
  const toolbar=specimen.locator('#specimen-toolbar');
  const portrait=toolbar.getByRole('button',{name:'Portrait',exact:true});
  const landscape=toolbar.getByRole('button',{name:'Landscape',exact:true});
  const result=specimen.locator('[data-command-result]');
  const preview=specimen.locator('[data-command-preview]');
  const commandReceipt={toolbar:{},menu:{},palette:{}};
  item.commands=commandReceipt;
  await positionFramedTarget(page,iframe,portrait);
  await portrait.click();
  await expect(result).toHaveText('Preview layout: Portrait.');
  await expect(preview).toHaveAttribute('data-layout','portrait');
  const portraitGeometry=await geometry(preview);
  await portrait.focus();
  await portrait.press('ArrowRight');
  await expect(landscape).toBeFocused();
  await landscape.press('Enter');
  await expect(result).toHaveText('Preview layout: Landscape.');
  await expect(preview).toHaveAttribute('data-layout','landscape');
  const landscapeGeometry=await geometry(preview);
  assert.notEqual(portraitGeometry.width/portraitGeometry.height,landscapeGeometry.width/landscapeGeometry.height,'The command changes actual preview geometry.');
  commandReceipt.toolbar={portrait:portraitGeometry,landscape:landscapeGeometry,focusedAction:await geometry(landscape),keyboardInvoked:true};
  assert.notEqual(commandReceipt.toolbar.focusedAction.outlineStyle,'none');
  assert.ok(parseFloat(commandReceipt.toolbar.focusedAction.outlineWidth)>0);
  await page.mouse.move(1,1);
  item.contrast.push(await sampleContrast(landscape,'Toolbar action text'));
  if(item.engine==='chromium')item.screenshots.push(await captureVisibleFramed(page,iframe,toolbar,resolve(output,`${item.engine}-${item.candidate}-${item.appearance}-toolbar.png`),{padding:8}));

  const menuHost=specimen.locator('#specimen-menu');
  const menuTrigger=specimen.locator('#specimen-menu-trigger').getByRole('button',{name:'More layout actions',exact:true});
  const menuSurface=menuHost.getByRole('menu');
  const menuPortrait=menuHost.getByRole('menuitem',{name:'Portrait',exact:true});
  const menuLandscape=menuHost.getByRole('menuitem',{name:'Landscape',exact:true});
  const menuDisabled=menuHost.getByRole('menuitem',{name:'Publish study',exact:true});
  await positionFramedTarget(page,iframe,menuTrigger);
  await menuTrigger.click();
  await expect(menuSurface).toBeVisible();
  await expect(menuHost.getByRole('menuitem')).toHaveCount(3);
  await expect(menuDisabled).toBeDisabled();
  // A real pointer attempt on an aria-disabled item must neither execute nor
  // dismiss; force only bypasses Playwright's enabled precondition for this check.
  await menuDisabled.click({force:true});
  await expect(result).toHaveText('Preview layout: Landscape.');
  await expect(menuSurface).toBeVisible();
  await menuPortrait.focus();
  await menuPortrait.press('ArrowDown');
  await expect(menuLandscape).toBeFocused();
  item.contrast.push(await sampleContrast(menuLandscape,'Keyboard-focused menu action text'));
  item.contrast.push(await sampleContrast(menuLandscape,'Keyboard-focused menu inset outline',{outline:true}));
  await menuPortrait.hover();
  item.contrast.push(await sampleContrast(menuPortrait,'Hovered menu action text'));
  commandReceipt.menu={surface:await geometry(menuSurface),row:await geometry(menuLandscape),disabledInvocationPrevented:true,keyboardMoved:true};
  if(item.engine==='chromium')item.screenshots.push(await captureVisibleFramed(page,iframe,menuSurface,resolve(output,`${item.engine}-${item.candidate}-${item.appearance}-menu.png`)));
  await menuPortrait.hover();
  await page.mouse.down();
  try {item.contrast.push(await sampleContrast(menuPortrait,'Pressed menu action text'));}
  finally {await page.mouse.up();}
  await expect(menuSurface).toBeHidden();
  await expect(result).toHaveText('Preview layout: Portrait.');
  await expect(preview).toHaveAttribute('data-layout','portrait');

  const paletteHost=specimen.locator('#specimen-command-palette');
  const paletteTrigger=specimen.locator('#specimen-command-trigger').getByRole('button',{name:'Search layout commands',exact:true});
  const dialog=paletteHost.getByRole('dialog',{name:'Study commands',exact:true});
  const query=paletteHost.getByRole('combobox',{name:'Find a layout command',exact:true});
  const status=paletteHost.locator('[part~="status"]');
  await positionFramedTarget(page,iframe,paletteTrigger);
  await paletteTrigger.click();
  await expect(dialog).toBeVisible();
  await expect(query).toBeFocused();
  await query.fill('no-such-layout-command');
  await expect(paletteHost.getByRole('option')).toHaveCount(0);
  await expect(status).toHaveText('No matching layout commands.');
  item.contrast.push(await sampleContrast(status,'Command palette empty status'));
  await query.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(paletteTrigger).toBeFocused();
  await expect(result).toHaveText('Preview layout: Portrait.');
  await paletteTrigger.click();
  await expect(dialog).toBeVisible();
  await query.fill('Landscape');
  const active=paletteHost.locator('[part~="option"][data-active]');
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAccessibleName('Landscape');
  assert.equal(await query.getAttribute('aria-activedescendant'),await active.getAttribute('id'),'Query identifies the actual active result.');
  item.contrast.push(await sampleContrast(query,'Command palette query text'));
  item.contrast.push(await sampleContrast(active,'Active command result text'));
  item.contrast.push(await sampleContrast(active,'Active command result inset outline',{outline:true}));
  commandReceipt.palette={dialog:await geometry(dialog),query:await geometry(query),activeResult:await geometry(active),emptyStateObserved:true,escapeRestoredFocus:true};
  for(const row of [commandReceipt.menu.row,commandReceipt.palette.activeResult]) {
    assert.ok(row.width>=24 && row.height>=24,'Command rows retain a 24px target floor.');
  }
  if(item.engine==='chromium')item.screenshots.push(await captureVisibleFramed(page,iframe,dialog,resolve(output,`${item.engine}-${item.candidate}-${item.appearance}-command-palette.png`)));
  await query.press('Enter');
  await expect(dialog).toBeHidden();
  await expect(result).toHaveText('Preview layout: Landscape.');
  await expect(preview).toHaveAttribute('data-layout','landscape');
  commandReceipt.palette.invoked='study.landscape';
  item.commands=commandReceipt;
}

for(const [engine,driver] of Object.entries({chromium,firefox,webkit})) {
  let browser;
  const engineReceipt={engine,status:'failed',errors:[]};
  try {
    const executablePath=process.env[`EN_CANDIDATE_${engine.toUpperCase()}_EXECUTABLE`];
    browser=await driver.launch(executablePath?{executablePath}:{});engineReceipt.browser=browser.version();
    const page=await browser.newPage({viewport:{width:1600,height:1100},reducedMotion:'reduce',colorScheme:'light',acceptDownloads:true});
    page.on('pageerror',error=>engineReceipt.errors.push(error.message));
    await page.addInitScript(()=>window.addEventListener('message',event=>{
      const frame=document.querySelector('iframe[title="Candidate preview"]');
      if(event.origin===location.origin&&event.source===frame?.contentWindow&&event.data?.type==='en-theme-preview-ready')window.candidateReceipt=event.data;
    }));
    await page.goto(origin+'/theme-review?progress-report');
    await expect(page.getByRole('button',{name:'Export candidate',exact:true})).toBeEnabled();
    const servedBuild=await(await page.request.get(origin+'/review-build.json')).json();assert.equal(servedBuild.fingerprint,manifest.buildFingerprint);
    await page.getByRole('button',{name:'Load previews',exact:true}).click();
    const iframe=page.locator('iframe[title="Candidate preview"]');
    const frame=page.frameLocator('iframe[title="Candidate preview"]'),baseline=page.frameLocator('iframe[title="Baseline preview"]');
    await expect(frame.locator('en-sticker-app')).not.toHaveAttribute('data-ssr');
    await expect(baseline.locator('en-sticker-app')).not.toHaveAttribute('data-ssr');
    const baselineByMode=new Map();
    for(const candidate of candidates) for(const mode of ['light','dark']) {
      const item={engine,browser:browser.version(),candidate:candidate.id,appearance:mode,file:basename(candidate.file),fileHash:candidate.fileHash,pairSourceHash:candidate.pairSourceHash,status:'failed',contrast:[],screenshots:[]};
      try {
        await page.evaluate(()=>{window.candidateReceipt=undefined;});
        await page.getByLabel('Reopen candidate',{exact:true}).setInputFiles(candidate.file);
        await expect(page.getByRole('textbox',{name:'Candidate title',exact:true})).toHaveValue(candidate.bundle.draft.title);
        await page.getByRole('combobox',{name:'Preview appearance',exact:true}).selectOption('editing');
        await page.getByRole('combobox',{name:'Editing appearance',exact:true}).selectOption(mode);
        await expect.poll(()=>page.evaluate(()=>{const r=window.candidateReceipt;return r?{sourceHash:r.sourceHash,buildFingerprint:r.buildFingerprint,appearance:r.appearance,effectiveMode:r.effectiveMode,pageId:r.pageId}:null;}),{timeout:30000})
          .toEqual({sourceHash:candidate.pairSourceHash,buildFingerprint:manifest.buildFingerprint,appearance:mode,effectiveMode:mode,pageId:'sheet'});
        item.previewReceipt=await page.evaluate(()=>window.candidateReceipt);
        assert.ok(item.previewReceipt.caseIds.includes('button-scale'));assert.ok(item.previewReceipt.caseIds.includes('combobox'));assert.ok(item.previewReceipt.caseIds.includes('command-surfaces'));
        await expect(frame.locator('html')).toHaveAttribute('data-en-appearance',mode);
        await expect(frame.locator('html')).toHaveCSS('color-scheme',mode);
        await expect(baseline.locator('html')).toHaveAttribute('data-en-appearance',mode);
        const baselineGeometry=await geometry(baseline.locator('[data-specimen="button-scale"] en-button[icon-only]').getByRole('button',{name:'Add collaborator',exact:true}));
        const baselineKey=`${mode}:${candidate.bundle.draft.branches[mode].candidate.theme.density}`;
        if(baselineByMode.has(baselineKey))assert.deepEqual(baselineGeometry,baselineByMode.get(baselineKey));else baselineByMode.set(baselineKey,baselineGeometry);

        const scale=frame.locator('[data-specimen="button-scale"]'),host=scale.locator('en-button[icon-only]');
        const icon=host.getByRole('button',{name:'Add collaborator',exact:true});
        await icon.scrollIntoViewIfNeeded();await expect(icon).toHaveAccessibleName('Add collaborator');
        const box=await geometry(icon),text=await geometry(scale.getByRole('button',{name:'Medium',exact:true}));
        const field=await geometry(frame.locator('[data-specimen="structured-values"]').getByRole('combobox',{name:'Export format',exact:true}));
        near(box.width,box.height);near(box.height,text.height);assert.ok(box.width>=24);
        const identity=await icon.elementHandle();await icon.focus();await expect(icon).toBeFocused();
        await host.evaluate(async element=>{element.loading=true;await element.updateComplete;});
        await expect(icon).toBeDisabled();await expect(icon).toHaveAccessibleName('Add collaborator');
        const busy=await geometry(icon);near(box.width,busy.width);near(box.height,busy.height);
        await host.evaluate(async element=>{element.loading=false;await element.updateComplete;});
        assert.equal(await icon.evaluate((element,initial)=>element===initial,identity),true);await identity.dispose();
        item.geometry={icon:box,text,field,busy,nativeIdentityPreserved:true,accessibleName:'Add collaborator',baseline:baselineGeometry};
        await page.mouse.move(1,1);

        const probes=[
          ['Link',scale.locator('en-link').getByRole('link',{name:'Explore form controls',exact:true})],
          ['Ghost button',frame.locator('[data-specimen="buttons"]').getByRole('button',{name:'Cancel',exact:true})],
          ['Selected segmented label',frame.locator('[data-specimen="family-geometry"] en-segmented-control').first().locator('[part~="option"][data-selected] [part~="option-label"]')],
          ['Selected tab',frame.locator('[data-specimen="tabs"] en-tab[aria-selected="true"]').locator('[part~="base"]')],
          ['Accent badge',frame.locator('[data-specimen="identity"] en-badge[variant="accent"]').locator('[part~="label"]')],
          ['Danger badge',frame.locator('[data-specimen="identity"] en-badge[variant="danger"]').locator('[part~="label"]')],
          ['Field error',frame.locator('[data-specimen="text-fields"] en-text-field[label="Contact email"]').locator('[part~="error"]')],
        ];
        for(const [label,locator] of probes)item.contrast.push(await sampleContrast(locator,label));
        const combo=frame.locator('[data-specimen="combobox"] en-combobox'),input=combo.getByRole('combobox',{name:'Project',exact:true});
        await positionFramedTarget(page,iframe,input);await input.focus();await input.press('ArrowDown');
        await expect(input).toHaveAttribute('aria-expanded','true');await expect(input).toHaveAttribute('aria-activedescendant',/.+/);
        const active=combo.locator('[part~="option-active"]');await expect(active).toHaveCount(1);await expect(active).toBeVisible();
        // The outline is wholly inset by the shipped recipe, so its actual row
        // paint is the relevant adjacent color; the popup path is retained too.
        item.contrast.push(await sampleContrast(active.locator('[part~="option-label"]'),'Keyboard-active option text'));
        item.contrast.push(await sampleContrast(active,'Keyboard-active option inset outline',{outline:true}));
        if(mode==='dark'&&/spectrum|fluent/.test(candidate.id)) {
          const popupFile=`${engine}-${candidate.id}-dark-active-options.png`;
          await input.press('Escape');await positionFramedTarget(page,iframe,input);await input.press('ArrowDown');
          await expect(input).toHaveAttribute('aria-expanded','true');
          item.screenshots.push(await captureVisibleFramed(page,iframe,combo.locator('[part~="popup"]'),resolve(output,popupFile)));
        }
        await input.press('Escape');await expect(input).toHaveAttribute('aria-expanded','false');
        if(mode==='dark'&&/spectrum|fluent/.test(candidate.id))for(const [label,target] of [
          ['icon-action',host],
          ['error-field',frame.locator('[data-specimen="text-fields"] en-text-field[label="Contact email"]')],
          ['selected-tab',frame.locator('[data-specimen="tabs"] en-tab[aria-selected="true"]')],
          ['badges',frame.locator('[data-specimen="identity"] en-badge[variant="danger"]')],
        ]){
          const file=`${engine}-${candidate.id}-dark-${label}.png`;
          await positionFramedTarget(page,iframe,target);
          item.screenshots.push(await captureVisibleFramed(page,iframe,target,resolve(output,file)));
        }
        await verifyCommandFamily({page,iframe,frame,item});
      await verifyCandidateFocus({page,iframe,frame,item,expect,resolvedTokens:candidate.bundle.resolvedTokens[mode]});
      if(engine==='chromium') {
        const focusedField=frame.locator('[data-specimen="text-fields"] en-text-field[label="Contact email"]');
        const focusedFrame=focusedField.locator('[part~="focus-frame"]');
        await positionFramedTarget(page,iframe,focusedFrame);
        await focusedField.locator('[part~="control"]').focus();
        item.screenshots.push(await captureVisibleFramed(page,iframe,focusedFrame,resolve(output,`${engine}-${candidate.id}-${mode}-focus.png`),{padding:10}));
      }
        const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export candidate',exact:true}).click();
        const download=await pending;assert.equal(await download.failure(),null);
        const exported=JSON.parse(await readFile(await download.path(),'utf8'));
        assert.equal(exported.schemaVersion,2);assert.equal(exported.activeAppearance,mode);
        assert.deepEqual(exported.draft,candidate.bundle.draft);
        assert.ok(exported.coverage.rendered.some(r=>r.sourceHash===candidate.pairSourceHash&&r.effectiveMode===mode&&r.buildFingerprint===manifest.buildFingerprint));
        item.reexport={sameValidatedDraft:true,activeAppearance:mode,pairSourceHash:exported.draft.pairSourceHash};
        item.status=item.contrast.every(result=>result.status==='passed')?'passed':'contrast-review-needed';
        console.log(`${engine} ${candidate.id} ${mode}: ${item.status}; icon ${box.width} × ${box.height}; ${item.contrast.map(c=>`${c.label} ${c.ratio.toFixed(3)}`).join(', ')}`);
      }catch(error){item.error=error?.stack??String(error);}
      receipt.cases.push(item);await save();
    }
    assert.deepEqual(engineReceipt.errors,[]);
    engineReceipt.status='passed';
  }catch(error){engineReceipt.error=error?.stack??String(error);}
  finally{await browser?.close();receipt.engines.push(engineReceipt);await save();}
}
receipt.completedAt=new Date().toISOString();receipt.passed=receipt.cases.length===candidates.length*2*3&&receipt.cases.every(item=>item.status==='passed')&&receipt.engines.every(engine=>engine.status==='passed');
await save();console.log(JSON.stringify({report:resolve(output,'verification.json'),passed:receipt.passed,cases:receipt.cases.length,needsReview:receipt.cases.filter(item=>item.status!=='passed').map(({engine,candidate,appearance,status,error})=>({engine,candidate,appearance,status,error}))},null,2));
if(!receipt.passed)process.exitCode=1;
