import {readVisualBundle,encodeVisualBundle,evidenceReference,MAX_VISUAL_BUNDLE_BYTES} from '../../../../tooling/visual-review/reader.mjs';
import {visualEvidenceTemplate,type VisualEvidence} from './visual-evidence-view.js';
import { acceptValueChange } from '../change-consumption.js';
import { LitElement, html, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { repeat } from 'lit/directives/repeat.js';
import { hydrate } from '@lit-labs/ssr-client';
import { Signal } from 'signal-polyfill';
import { SignalController } from '@en-reve/primitives/interactions/signal-controller.js';
import { skipLinkTemplate } from '@en-reve/primitives/templates/navigation.js';
import { affectedTokens, createReviewDraft } from '@en-reve/tokens';
import type { ThemeReviewDraft, ThemeMode, ThemeDensity } from '@en-reve/tokens';
import {candidateImpact,loadCandidateImpact,type ImpactManifest} from './impact.js';
import {impactTemplate} from './impact-view.js';
import { managedTokenEditorTemplate } from './editor.js';
import { createReviewWorkspace, type PreviewAppearance, type PreviewPreference, type ReviewWorkspace } from './workspace.js';
import { createCandidateFileIntake } from './candidate-file-intake.js';
import { attachDocumentTheme, type DocumentTheme } from './document-theme.js';
import { exportReviewBundle, loadReviewBuild, reopenReviewBundle, reviewPages } from './bundle.js';
import type { PreviewReceipt, ReviewBuild } from './bundle.js';

const modes = [{value:'light',label:'Light'},{value:'dark',label:'Dark'}];
const previewAppearances = [{value:'auto',label:'Auto (system)'},{value:'editing',label:'Follow editing appearance'},{value:'light',label:'Light'},{value:'dark',label:'Dark'}];
const densities = [{value:'compact',label:'Compact'},{value:'comfortable',label:'Comfortable'},{value:'spacious',label:'Spacious'}];
const directions = [{value:'ltr',label:'Left to right'},{value:'rtl',label:'Right to left'}];
const coordinated = [{id:'palette.accent',label:'Accent seed'},{id:'rhythm.base',label:'Layout rhythm'},{id:'size.scale-medium',label:'Control size'},{id:'radius.control',label:'Control corners'}];

type SavedDraft = { workspace: ReviewWorkspace; title: string; rationale: string;visualReference?:ReturnType<typeof evidenceReference> };
type PendingPreview = {
	id: string; variant: 'baseline'|'candidate'; pageId: string; document: Document;
	sourceHash: string; buildFingerprint: string; direction: 'ltr'|'rtl'; appearance: PreviewAppearance; effectiveMode: ThemeMode; ready: boolean;
};

/** Per-page draft state; editing never changes authoritative token source. */
export class ThemeReviewApp extends LitElement {
	private workspace = createReviewWorkspace();
	private get draft() { return this.workspace.draft; }
	private systemMode: ThemeMode = 'light';
	private revision = new Signal.State(0);
	private observer = new SignalController(this, () => this.revision.get());
	private selected = 'palette.accent';
	private relatedPinJump?: string;
	private relatedPinsCache?: {theme:ThemeReviewDraft['theme'];selected:string;active:Set<string>;related:Set<string>;pins:string[]};
	private search = '';
	private candidateTitle = 'Untitled theme';
	private rationale = '';
	private direction: 'ltr'|'rtl' = 'ltr';
	private page = 'sheet';
	private view = 'edit';
	private pageAppearance = 'default';
	private documentTheme?: DocumentTheme;
	private previewsOpen = false;
	private message = 'Local draft. Export a file to keep your work.';
	private error = '';
	private editorError = '';
	private build?: ReviewBuild;
	private buildError = '';
	private impact?: ImpactManifest;
	private impactError = '';
	private selectedCase?: string;
	private impactCache?: {workspace:ReviewWorkspace; theme:ReviewWorkspace['presentation']; manifest:ImpactManifest; value:ReturnType<typeof candidateImpact>};
	private metadataGeneration = 0;
	private editorResetRevision = 0;
	private pendingRequests = new Map<Window,PendingPreview>();
	private listeningDocuments = new Map<Window,Document>();
	private candidatePreview?: PendingPreview;
	private baselineWorkspace?: ReviewWorkspace;
	private baselineContext?: string;
	private baselineJSON?: string;
	private previewJSON?: { presentation: ReviewWorkspace['presentation']; json: string };
	private prepared?: { theme: ThemeReviewDraft['theme']; base: ThemeReviewDraft['base']; title: string; rationale: string; candidate: ReturnType<ThemeReviewDraft['prepare']> };
	private sequence = 0;
	private receipts: Record<string,PreviewReceipt> = {};
	private importedPrevious?: SavedDraft;
	private importedBoundary?: string;
	private candidateDragActive = false;
	private intake = createCandidateFileIntake({
		context: () => this.build,
		isCurrent: build => this.isConnected && this.build === build,
		parse: (contents, build) => reopenReviewBundle(contents, build),
		accept: opened => this.acceptReopened(opened),
		reject: error => {
			this.error = error instanceof Error ? error.message : 'This candidate could not be opened.';
			this.message = 'Reopen failed. Your current draft is unchanged.'; this.touch();
		},
		dragging: active => { this.candidateDragActive = active; this.touch(); },
	});
	private importedRedo?: SavedDraft;
	private lifecycle?: AbortController;
	private flagged = false;
 private visualEvidence?:VisualEvidence;
 private visualReference?:ReturnType<typeof evidenceReference>;
 private visualURLs=new Map<string,string>();
 private visualGeneration=0;
 private visualError='';
 private visualMessage='';
 private visualBusy=false;
 private releaseVisualURLs(){for(const url of this.visualURLs.values())URL.revokeObjectURL(url);this.visualURLs.clear();}
 private async prepareVisualURLs(evidence:VisualEvidence){
  const urls=new Map<string,string>();
  try{for(const artifact of evidence.report.artifacts){const bytes=evidence.files.get(artifact.path);if(artifact.mediaType!=='image/png'||!bytes)continue;const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));urls.set(artifact.path,url);const image=new Image();image.src=url;await image.decode();}return urls;}
  catch{for(const url of urls.values())URL.revokeObjectURL(url);throw new Error('An evidence image could not be decoded. The previous evidence is unchanged.');}
 }
 private async importVisual(event:Event){
  const input=event.currentTarget as HTMLInputElement,files=Array.from(input.files??[]);input.value='';if(!files.length||!this.build)return;
  const generation=++this.visualGeneration,build=this.build,workspace=this.workspace,presentation=workspace.presentation;
  const current=()=>this.isConnected&&generation===this.visualGeneration&&build===this.build&&workspace===this.workspace&&presentation===workspace.presentation;
  this.visualBusy=true;this.visualError='';this.touch();
  try{
   if(files.length!==1||files[0]!.size>MAX_VISUAL_BUNDLE_BYTES)throw new Error('Choose one visual evidence JSON file of 128 MB or smaller.');
   const evidence=await readVisualBundle(await files[0]!.text(),build);
   // Token replay remains authoritative; the visual reader never executes imported CSS.
   reopenReviewBundle(JSON.stringify(evidence.candidate),build);reopenReviewBundle(JSON.stringify(evidence.baseline),build);
   if(!current())return;
   const urls=await this.prepareVisualURLs(evidence);
   if(!current()){for(const url of urls.values())URL.revokeObjectURL(url);return;}
   this.releaseVisualURLs();this.visualURLs=urls;this.visualEvidence=evidence;
   this.visualReference=evidenceReference(evidence);this.visualMessage='Visual evidence loaded. Reported outcomes are separate from human review.';
  }catch(error){if(current())this.visualError='Import rejected; the draft and any previously loaded evidence are unchanged. '+(error instanceof Error?error.message:'Visual evidence could not be opened.');}
  finally{if(generation===this.visualGeneration){this.visualBusy=false;this.touch();}}
 }
 private downloadVisual(){
  if(!this.visualEvidence)return;
  const text=encodeVisualBundle(this.visualEvidence.report,this.visualEvidence.files),url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
  const link=this.ownerDocument.createElement('a');link.href=url;link.download='visual-evidence-'+this.visualEvidence.report.integrity.slice(7,23)+'.json';this.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }
 private openVisualCandidate(){if(this.visualEvidence&&this.build){this.acceptReopened(reopenReviewBundle(JSON.stringify(this.visualEvidence.candidate),this.build));this.visualReference=evidenceReference(this.visualEvidence);this.touch();}}
 private unloadVisual(){this.visualGeneration++;this.releaseVisualURLs();this.visualEvidence=undefined;this.visualBusy=false;this.visualError='';this.visualMessage='Evidence unloaded. Its reference is retained with this draft.';this.touch();}


	get previewCSS() { return ''; }
	protected createRenderRoot() {
		if (this.hasAttribute('data-ssr')) { hydrate(this.render(),this,{host:this}); this.removeAttribute('data-ssr'); }
		return this;
	}
	connectedCallback() { super.connectedCallback(); if (this.hasUpdated) this.connect(); }
	disconnectedCallback() { this.visualGeneration++;this.visualBusy=false;this.releaseVisualURLs(); this.documentTheme?.disconnect(); this.documentTheme = undefined; this.intake.invalidate(); this.intake.clearDrag(); this.lifecycle?.abort(); this.pendingRequests.clear(); this.listeningDocuments.clear(); this.candidatePreview = undefined; super.disconnectedCallback(); }
	protected firstUpdated() { this.connect(); }
	protected updated() {
		if (this.pageAppearance === 'candidate') this.documentTheme?.apply(this.workspace.presentation, {direction:this.direction,appearance:this.workspace.previewAppearance});
		else this.documentTheme?.reset();
	}
	private connect() {
        if(this.visualEvidence)for(const artifact of this.visualEvidence.report.artifacts){const bytes=this.visualEvidence.files.get(artifact.path);if(artifact.mediaType==='image/png'&&bytes&&!this.visualURLs.has(artifact.path))this.visualURLs.set(artifact.path,URL.createObjectURL(new Blob([bytes],{type:'image/png'})));}
		this.documentTheme ??= attachDocumentTheme({root:this});
		this.lifecycle?.abort();
		this.lifecycle = new AbortController();
		const lifecycle = this.lifecycle;
    this.impact=undefined;this.impactError='';
		const preference = window.matchMedia('(prefers-color-scheme: dark)');
		this.systemMode = preference.matches ? 'dark' : 'light';
		preference.addEventListener('change', () => {
			this.systemMode = preference.matches ? 'dark' : 'light';
			if (this.workspace.pair && this.workspace.previewAppearance === 'auto') { this.touch(); this.syncPreviews(); }
		}, {signal:lifecycle.signal});
		this.flagged = new URLSearchParams(location.search).has('progress-report');
		window.addEventListener('message', event => this.receivePreview(event), {signal:this.lifecycle.signal});
		void loadReviewBuild().then(build => { if (!this.isConnected || lifecycle.signal.aborted) return; this.build = build; this.touch(); this.syncPreviews();
      void loadCandidateImpact(build,lifecycle.signal).then(manifest=>{
        if (!this.isConnected || lifecycle.signal.aborted || this.build !== build) return;
        this.impact=manifest;this.impactError='';this.touch();
      }).catch(error=>{
        if (!this.isConnected || lifecycle.signal.aborted) return;
        this.impact=undefined;this.impactError=error instanceof Error ? error.message : 'Source impact is unavailable.';this.touch();
      }); }).catch(() => {
			if (!this.isConnected || lifecycle.signal.aborted) return;
			if (import.meta.env.DEV) this.buildError = 'Development preview. Export and reopen are available in the built review page.';
			else this.buildError = 'Review assets could not be loaded. Reload this page to enable export and reopen.';
			this.touch();
		});
		this.touch();
	}
	private touch() { this.revision.set(this.revision.get()+1); }
	private change(action:()=>unknown, message:string, {resetInputs = false}: {resetInputs?:boolean} = {}) {
		try {
			action(); this.intake.invalidate(); this.error = ''; this.editorError = ''; this.message = message;
			this.importedRedo = undefined;
			if (resetInputs) this.editorResetRevision++;
			this.touch(); this.syncPreviews();
		} catch(error) { this.editorError = error instanceof Error ? error.message : 'This value could not be applied.'; this.touch(); }
	}
	private saveDraft(): SavedDraft { return {workspace:this.workspace,title:this.candidateTitle,rationale:this.rationale,visualReference:this.visualReference}; }
	private restoreSaved(saved:SavedDraft) {
		this.visualReference=saved.visualReference;this.workspace = saved.workspace; this.candidateTitle = saved.title; this.rationale = saved.rationale;
		this.metadataGeneration++; this.editorResetRevision++; this.intake.invalidate();
		this.error=''; this.editorError=''; this.touch(); this.syncPreviews();
	}
	private undo() {
		if (this.importedPrevious && this.workspace.identity === this.importedBoundary) {
			this.importedRedo = this.saveDraft(); const previous = this.importedPrevious; this.importedPrevious=undefined;
			this.message='Draft before reopening restored.'; this.restoreSaved(previous);
		} else if (this.workspace.canUndo) this.change(()=>this.workspace.undo(),'Previous edit restored.',{resetInputs:true});
	}
	private redo() {
		if (this.importedRedo) {
			this.importedPrevious=this.saveDraft(); const next=this.importedRedo; this.importedRedo=undefined;
			this.importedBoundary=next.workspace.identity; this.message='Reopened draft restored.'; this.restoreSaved(next);
		} else this.change(()=>this.workspace.redo(),'Edit reapplied.',{resetInputs:true});
	}
	private selectToken(id:string) { this.relatedPinJump = undefined; this.selected = id; this.editorError = ''; this.touch(); }
	private href(path:string) { return path + (this.flagged ? (path.includes('?') ? '&' : '?')+'progress-report' : ''); }
	private async exportCandidate() {
		if (!this.build) return;
		const titleField = this.querySelector('en-text-field[name="candidate-title"]') as HTMLElement & {value:string;reportValidity():boolean};
		if (!titleField.reportValidity()) { this.error = 'Add a title before exporting.'; this.touch(); return; }
		try {
			const json = exportReviewBundle(this.draft,this.build,{title:this.candidateTitle,rationale:this.rationale},this.receipts,{pair:this.workspace.pair,impact:this.impactSelection(),visualEvidence:this.visualReference});
			const candidate = this.preparedCandidate();
			const url = URL.createObjectURL(new Blob([json],{type:'application/json'}));
			const link = this.ownerDocument.createElement('a'); link.href = url; link.download = this.workspace.pair ? `theme-pair-${this.workspace.identity.slice(7,31)}.json` : `${candidate.id}.json`;
			this.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),10_000);
			this.error = ''; this.message = 'Candidate prepared and download requested. Keep the JSON file to reopen this exact draft.'; this.touch();
		} catch(error) { this.error = error instanceof Error ? error.message : 'Export failed. Your draft is unchanged.'; this.touch(); }
	}
	private acceptReopened(opened: ReturnType<typeof reopenReviewBundle>) {
		const workspace = createReviewWorkspace(opened.draft, opened.pair);
		this.importedPrevious = this.saveDraft(); this.importedRedo = undefined; this.workspace = workspace; this.importedBoundary = this.workspace.identity;
		this.visualReference=opened.visualEvidence;this.candidateTitle = opened.title; this.rationale = opened.rationale; this.metadataGeneration += 1;
		this.editorResetRevision++;
		this.pendingRequests.clear(); this.candidatePreview = undefined;
		this.receipts = {}; this.error = ''; this.editorError = ''; this.message = 'Candidate reopened. Undo returns to your previous draft.';
		this.touch(); this.syncPreviews();
	}
	private editingDraft(event: Event) {
		const source = event.composedPath()[0];
		// Metadata and managed inputs include unfinished/invalid native drafts.
		// Searching for a token or operating a preview is not an edit to this draft.
		if (source instanceof Element && source.closest('.review-metadata, .theme-token-editor')) this.intake.invalidate();
	}
	private frameContext(frame:HTMLIFrameElement) {
		try {
			const target = frame.contentWindow;
			const document = frame.contentDocument;
			if (!target || !document || target.location.origin !== location.origin) return;
			const path = target.location.pathname;
			const canonical = (value:string) => value.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';
			const page = reviewPages.find(page=>canonical(page.path) === canonical(path));
			if (page) return {target,document,pageId:page.value,path};
		} catch { /* A frame may be navigating or have left this origin. */ }
	}
	private effectiveMode(appearance: PreviewAppearance): ThemeMode { return appearance === 'auto' ? this.systemMode : appearance; }
	private receiptKey(pageId: string, effectiveMode: ThemeMode) { return this.workspace.pair ? `${pageId}:${effectiveMode}` : pageId; }
	private selectEditingAppearance(mode: ThemeMode) {
		if (!this.workspace.pair) { this.change(()=>this.workspace.setAppearance(mode),'Candidate appearance updated.',{resetInputs:true}); return; }
		if (!this.workspace.setAppearance(mode)) return;
		this.intake.invalidate(); this.editorError = ''; this.editorResetRevision++;
		this.message = `Editing ${mode === 'light' ? 'Light' : 'Dark'} rules. The other appearance is unchanged.`;
		this.touch(); this.syncPreviews();
	}
	private selectPreviewAppearance(preference: PreviewPreference) {
		if (!this.workspace.setPreviewPreference(preference)) return;
		this.touch(); this.syncPreviews();
	}
	private previewDraftJSON(variant:'baseline'|'candidate') {
		let workspace = this.workspace;
		if (variant === 'baseline') {
			const context = this.workspace.pair ? `pair:${this.draft.theme.density}` : `single:${this.draft.theme.mode}:${this.draft.theme.density}`;
			if (!this.baselineWorkspace || this.baselineContext !== context) {
				const density = this.draft.theme.density;
				this.baselineWorkspace = this.workspace.pair
					? createReviewWorkspace(undefined,{name:'review-baseline',light:createReviewDraft({mode:'light',density}),dark:createReviewDraft({mode:'dark',density})})
					: createReviewWorkspace(createReviewDraft({mode:this.draft.theme.mode,density}));
				this.baselineContext = context; this.baselineJSON = undefined;
			}
			workspace = this.baselineWorkspace;
		}
		const presentation = workspace.presentation;
		let json: string;
		if (variant === 'baseline') json = this.baselineJSON ??= workspace.exportJSON({title:'Live preview'});
		else {
			if (this.previewJSON?.presentation !== presentation) this.previewJSON = {presentation,json:workspace.exportJSON({title:'Live preview'})};
			json = this.previewJSON.json;
		}
		const appearance = this.workspace.previewAppearance;
		return {presentation,json,appearance,effectiveMode:this.effectiveMode(appearance)};
	}
	private preparedCandidate() {
		const {theme,base} = this.draft;
		const title = this.candidateTitle.trim() || 'Untitled theme';
		if (this.prepared?.theme !== theme || this.prepared.base !== base || this.prepared.title !== title || this.prepared.rationale !== this.rationale) {
			this.prepared = {theme,base,title,rationale:this.rationale,candidate:this.draft.prepare({title,rationale:this.rationale})};
		}
		return this.prepared.candidate;
	}
	private impactSelection() {
    if (!this.impact) return undefined;
    const theme=this.workspace.presentation;
    if(this.impactCache?.workspace!==this.workspace || this.impactCache.theme!==theme || this.impactCache.manifest!==this.impact)
      this.impactCache={workspace:this.workspace,theme,manifest:this.impact,value:candidateImpact(this.impact,this.workspace)};
    return this.impactCache.value;
  }
  private reviewImpactCase(id:string) {
    const page=id.startsWith('workflow:') ? id.slice(9) : 'sheet';
    if(!reviewPages.some(item=>item.value===page) || (page==='sheet' && !this.build?.caseIds.includes(id))) return;
    // Fragment changes retain the same document and do not repeat its listening
    // handshake. Preserve that binding while revoking older request receipts.
    this.pendingRequests.clear();
    if(this.page!==page)this.listeningDocuments.clear();
    this.candidatePreview=undefined;
    this.page=page;this.selectedCase=page==='sheet'?id:undefined;this.previewsOpen=true;this.view='preview';this.touch();
    void this.updateComplete.then(()=>{if(this.isConnected)this.syncPreviews();});
  }
  private selectPreviewPage(page:string) {
		if ((this.page === page && !this.selectedCase) || !reviewPages.some(item=>item.value === page)) return;
    this.selectedCase=undefined;
		// WindowProxy survives navigation; old replies must lose their authority
		// before Lit changes either iframe's src.
		this.pendingRequests.clear(); this.listeningDocuments.clear(); this.candidatePreview = undefined;
		this.page = page; this.touch();
	}
	private syncPreviews(onlyFrame?:HTMLIFrameElement) {
		if (!this.previewsOpen) return;
		const fingerprint = this.build?.fingerprint ?? (import.meta.env.DEV ? 'development' : undefined);
		if (!fingerprint) return;
		for (const frame of this.querySelectorAll<HTMLIFrameElement>('iframe[data-variant]')) {
			if (onlyFrame && onlyFrame !== frame) continue;
			const context = this.frameContext(frame);
			if (!context || this.listeningDocuments.get(context.target) !== context.document) continue;
			const {target,document,pageId} = context;
			const variant = frame.dataset.variant;
			if (variant !== 'baseline' && variant !== 'candidate') continue;
			const {presentation,json,appearance,effectiveMode} = this.previewDraftJSON(variant);
			const pending = this.pendingRequests.get(target);
			if (pending?.document === document && pending.pageId === pageId && pending.sourceHash === presentation.sourceHash && pending.buildFingerprint === fingerprint && pending.direction === this.direction && pending.appearance === appearance && pending.effectiveMode === effectiveMode) continue;
			const id = `preview-${++this.sequence}`;
			this.pendingRequests.set(target,{id,variant,pageId,document,sourceHash:presentation.sourceHash,buildFingerprint:fingerprint,direction:this.direction,appearance,effectiveMode,ready:false});
			if (variant === 'candidate') this.candidatePreview = undefined;
			target.postMessage({type:'en-theme-preview',requestId:id,draftJSON:json,direction:this.direction,appearance,buildFingerprint:fingerprint},location.origin);
		}
	}
	private receivePreview(event:MessageEvent) {
		if (event.origin !== location.origin || !event.source || !event.data || typeof event.data !== 'object' || Array.isArray(event.data)) return;
		const frame = [...this.querySelectorAll<HTMLIFrameElement>('iframe[data-variant]')].find(frame=>frame.contentWindow === event.source);
		if (!frame) return;
		const context = this.frameContext(frame);
		if (!context || event.data.pageId !== context.pageId || event.data.actualPath !== context.path) return;
		if (event.data.type === 'en-theme-preview-listening') {
			this.listeningDocuments.set(context.target,context.document);
			this.syncPreviews(frame); return;
		}
		const pending = this.pendingRequests.get(event.source as Window);
		if (!pending || pending.ready || pending.id !== event.data.requestId || pending.document !== context.document || pending.pageId !== context.pageId) return;
		if (event.data.type === 'en-theme-preview-ready') {
			if (event.data.sourceHash !== pending.sourceHash || event.data.buildFingerprint !== pending.buildFingerprint || event.data.direction !== pending.direction || event.data.appearance !== pending.appearance || event.data.effectiveMode !== pending.effectiveMode
				|| !Array.isArray(event.data.caseIds) || !event.data.caseIds.every((id:unknown)=>typeof id === 'string')) return;
			const allowed = this.build?.pages.find(page=>page.id === pending.pageId)?.caseIds;
			if (allowed && event.data.caseIds.some((id:string)=>!allowed.includes(id))) return;
			const receipt = {...(this.workspace.pair ? {page:pending.pageId,appearance:pending.appearance,effectiveMode:pending.effectiveMode} : {}),sourceHash:pending.sourceHash,buildFingerprint:pending.buildFingerprint,direction:pending.direction,caseIds:[...new Set<string>(event.data.caseIds)]};
			pending.ready = true;
			if (pending.variant === 'candidate') { this.receipts[this.receiptKey(pending.pageId,pending.effectiveMode)] = receipt; this.candidatePreview = pending; this.touch(); }
		} else if (event.data.type === 'en-theme-preview-error') { this.pendingRequests.delete(context.target); this.error = String(event.data.message); this.touch(); }
	}
	private tokenOptions() {
		const query = this.search.trim().toLowerCase();
		const matching = Object.values(this.draft.theme.tokens).filter(token => !query || `${token.id} ${token.description}`.toLowerCase().includes(query));
		if (!matching.some(token=>token.id===this.selected)) matching.unshift(this.draft.theme.tokens[this.selected]);
		return matching.map(token=>({value:token.id,label:token.id}));
	}
	private relatedPinsTemplate() {
		const theme = this.draft.theme;
		if (this.relatedPinsCache?.theme !== theme || this.relatedPinsCache.selected !== this.selected) {
			this.relatedPinsCache = {
				theme, selected:this.selected, pins:Object.keys(theme.pins).sort(),
				active:new Set(affectedTokens(theme, [this.selected])),
				related:new Set(affectedTokens(theme, [this.selected], {potential:true})
					.filter(id => id !== this.selected && Object.hasOwn(theme.pins, id))),
			};
		}
		const {active, related, pins} = this.relatedPinsCache;
		return html`<details class="review-details" data-related-pins aria-live="off">
			<summary>Related pins (${related.size})</summary>
			<p>Potential consumers of <code>${this.selected}</code>, including paths interrupted by pins. References may still follow this token; fixed values do not. Restore changes only the chosen token.</p>
			${related.size === 0 ? html`<p>No related pins.</p>` : nothing}
			<ul>${repeat(pins.filter(id => related.has(id) || (id === this.selected && id === this.relatedPinJump)), id => id, id => {
				const reference = theme.tokens[id].dependencies[0];
				const selected = id === this.selected && id === this.relatedPinJump;
				// Retain the activated row while navigating so focus stays on its button.
				return html`<li>
					<en-button size="small" variant="ghost" @click=${()=>{this.selectToken(id);this.relatedPinJump=id;}}>Inspect ${id}</en-button>
					<code>${theme.tokens[id].cssValue}</code>
					${selected ? html`<span>Currently selected.</span>` : active.has(id)
						? html`<span>Reference to <code>${reference}</code>; still follows <code>${this.selected}</code>.</span>`
						: reference ? html`<span>Reference to <code>${reference}</code>; does not currently follow <code>${this.selected}</code>.</span>`
						: html`<span>Fixed value; does not currently follow <code>${this.selected}</code>.</span>`}
				</li>`;
			})}</ul>
		</details>`;
	}

	render() {
		const theme = this.draft.theme;
		const token = theme.tokens[this.selected];
		const candidate = this.preparedCandidate();
		const page = reviewPages.find(page=>page.value===this.page)!;
		const impact=this.impactSelection();
    const previewPath=page.path+'?theme-preview'+(this.selectedCase ? '#specimen-'+encodeURIComponent(this.selectedCase) : '');
		const currentReceipt = this.candidatePreview ? this.receipts[this.receiptKey(this.candidatePreview.pageId,this.candidatePreview.effectiveMode)] : undefined;
		const previewReady = this.candidatePreview && this.candidatePreview.document === this.querySelector<HTMLIFrameElement>('iframe[data-variant="candidate"]')?.contentDocument && this.candidatePreview?.ready && currentReceipt?.sourceHash === this.workspace.identity && currentReceipt?.buildFingerprint === this.build?.fingerprint && this.candidatePreview.direction === this.direction && this.candidatePreview.appearance === this.workspace.previewAppearance && this.candidatePreview.effectiveMode === this.effectiveMode(this.workspace.previewAppearance);
		return html`
			${skipLinkTemplate({href:'#theme-review',label:'Skip to Theme Review'})}
			<header class="site-header">
				<a class="wordmark" href=${this.href('/')} aria-label="en-reve sticker sheet"><span class="mark" aria-hidden="true">en</span><span>en-reve</span></a>
				<div class="header-context"><span>Design system</span><en-badge class="version">0.1.0 · design review</en-badge></div>
				<nav class="header-context" aria-label="Documentation pages"><a href=${this.href('/')}>Sticker sheet</a><a href=${this.href('/showcase')}>Showcase</a><a href=${this.href('/workflows')}>Workflows</a><a href=${this.href('/theme-review')} aria-current="page">Theme Review</a><a href=${this.href('/api-reference')}>API reference</a></nav>
			</header>
			<main id="theme-review" tabindex="-1">
				<div class="page-heading"><div><h1>Theme Review</h1><p class="lede">Shape the system, try the result, and prepare a candidate for your team.</p></div><en-badge>Local draft</en-badge></div>
				<div class="review-toolbar">
					<en-button variant="ghost" ?disabled=${!this.workspace.canUndo && !this.importedPrevious} @click=${()=>this.undo()}>Undo</en-button>
					<en-button variant="ghost" ?disabled=${!this.workspace.canRedo && !this.importedRedo} @click=${()=>this.redo()}>Redo</en-button>
					<en-button variant="ghost" @click=${()=>this.change(()=>this.workspace.reset(),this.workspace.pair ? 'Both appearances reset to their base rules and initial shared density.' : 'Draft reset to its original base.',{resetInputs:true})}>${this.workspace.pair ? 'Reset both appearances' : 'Reset draft'}</en-button>
					<en-button ?disabled=${!this.build} @click=${()=>this.exportCandidate()}>Export candidate</en-button>
					<div class="review-file-drop" role="group" aria-label="Reopen a candidate" aria-describedby="review-file-help"
						aria-disabled=${String(!this.build)} ?data-drag-active=${this.candidateDragActive}
						@dragenter=${this.intake.dragenter} @dragover=${this.intake.dragover} @dragleave=${this.intake.dragleave}
						@drop=${this.intake.drop} @dragend=${this.intake.dragend}>
						<label class="review-file">Reopen candidate<input type="file" accept=".json,application/json" ?disabled=${!this.build} @change=${this.intake.change}></label>
						<p class="review-help" id="review-file-help">Drop one theme review JSON file here, or choose a file. Maximum 8 MB; use this documentation build.</p>
					</div>
				</div>
				<div class="review-page-theme">
					<en-segmented-control class="review-page-appearance" label="Page appearance" .value=${this.pageAppearance}
						.items=${[{value:'default',label:'Default'},{value:'candidate',label:'Candidate'}]}
						@en-change=${(event:CustomEvent<{proposed:string}>)=>{acceptValueChange<string>(event,value=>{this.pageAppearance=value;this.touch();return this.pageAppearance;});}}></en-segmented-control>
					<p class="review-help">Choose Candidate to apply this draft to the whole Theme Review page. It follows your edits, preview appearance and reading direction. Default restores the page appearance and keeps your draft.</p>
				</div>
				<p role="status" aria-live="polite" aria-atomic="true" class="review-status">${this.message}</p>
				${this.error ? html`<en-alert variant="danger" role="alert">${this.error}</en-alert>` : nothing}
				${this.buildError ? html`<p>${this.buildError}</p>` : nothing}
				<en-segmented-control class="review-view-switch" label="Workspace view" .value=${this.view} .items=${[{value:'edit',label:'Edit'},{value:'preview',label:'Preview'}]} @en-change=${(e:CustomEvent<{proposed:string}>)=>{acceptValueChange<string>(e,value=>{this.view=value;this.touch();return this.view;});}}></en-segmented-control>
				<div class="review-workspace" data-view=${this.view}>
					<section class="review-editor" aria-labelledby="edit-title" @en-input=${this.editingDraft} @en-change=${this.editingDraft}>
						<h2 id="edit-title">Edit the rules</h2>
						${keyed(this.metadataGeneration,html`<div class="review-metadata"><en-text-field name="candidate-title" label="Candidate title" required .defaultValue=${this.candidateTitle} .value=${this.candidateTitle} @en-change=${(e:CustomEvent<{proposed:string}>)=>{acceptValueChange<string>(e,value=>{this.candidateTitle=value;this.touch();return this.candidateTitle;});}}></en-text-field><en-textarea label="Reason for change" .value=${this.rationale} @en-change=${(e:CustomEvent<{proposed:string}>)=>{acceptValueChange<string>(e,value=>{this.rationale=value;this.touch();return this.rationale;});}}></en-textarea></div>`)}
						<div class="review-context"><en-select label=${this.workspace.pair ? "Editing appearance" : "Candidate appearance"} .items=${modes} .value=${theme.mode} @en-change=${(e:CustomEvent<{proposed:ThemeMode}>)=>{acceptValueChange<ThemeMode>(e,mode=>{this.selectEditingAppearance(mode);return this.draft.theme.mode;});}}></en-select><en-select label="Candidate density" .items=${densities} .value=${theme.density} @en-change=${(e:CustomEvent<{proposed:ThemeDensity}>)=>{acceptValueChange<ThemeDensity>(e,density=>{this.change(()=>this.workspace.setDensity(density),this.workspace.pair ? 'Density updated for both appearances.' : 'Candidate density updated.',{resetInputs:true});return this.draft.theme.density;});}}></en-select></div>
						<p class="review-help" aria-live="off">${this.workspace.pair ? 'Light and Dark have separate rules and pins. Apply pin and Restore change only the editing appearance. Apply pin before switching appearances; unapplied input values are cleared when you switch. Density changes both appearances. Reset both appearances restores their base rules and the density when this pair was opened. Undo reverses the last edit, including density changes and reset.' : 'Appearance and density changes retain your pins. Choosing another appearance does not supply a paired light/dark set for pinned values.'}</p>
						<div class="review-shortcuts">${coordinated.filter(item=>theme.tokens[item.id]).map(item=>html`<en-button size="small" variant="ghost" @click=${()=>{this.search='';this.selectToken(item.id);}}>${item.label}</en-button>`)}</div>
						<en-search-input label="Find a token" .value=${this.search} @en-change=${(e:CustomEvent<{proposed:string}>)=>{acceptValueChange<string>(e,value=>{this.search=value;this.touch();return this.search;});}}></en-search-input>
						<en-select label="Token" .value=${this.selected} .items=${this.tokenOptions()} @en-change=${(e:CustomEvent<{proposed:string}>)=>{acceptValueChange<string>(e,value=>{this.selectToken(value);return this.selected;});}}></en-select>
						<p class="review-help">${Object.keys(theme.tokens).length} tokens available. <code>${token.cssName}</code></p>
						${managedTokenEditorTemplate({token,descriptor:this.draft.editor(token.id),pin:theme.pins[token.id],canRestore:this.draft.canRestore(token.id),error:this.editorError,resetRevision:this.editorResetRevision,onApply:(value:unknown)=>this.change(()=>this.workspace.edit(draft=>draft.setToken(token.id,value)),`${token.id} pinned. Related values updated.`),onRestore:()=>this.change(()=>this.workspace.edit(draft=>draft.restoreToken(token.id)),`${token.id} restored to its default rule.`,{resetInputs:true}),idPrefix:'theme-token'})}
						${this.relatedPinsTemplate()}
					</section>
					<section class="review-preview" aria-labelledby="preview-title">
						<h2 id="preview-title">Try the candidate</h2>
						${this.workspace.pair ? html`<en-select label="Preview appearance" .items=${previewAppearances} .value=${this.workspace.previewPreference} @en-change=${(event:CustomEvent<{proposed:PreviewPreference}>)=>{acceptValueChange<PreviewPreference>(event,value=>{this.selectPreviewAppearance(value);return this.workspace.previewPreference;});}}></en-select><p class="review-help">The preview starts in Auto and follows this device’s preference. Choose Follow editing appearance, Light or Dark to override it. ${this.workspace.previewAppearance === 'auto' ? html`<span data-review-auto-mode>Auto currently uses ${this.effectiveMode('auto') === 'light' ? 'Light' : 'Dark'}.</span>` : nothing} The value table and diagnostics below describe ${this.workspace.editingAppearance === 'light' ? 'Light' : 'Dark'} rules.</p>` : nothing}
						<p>${this.workspace.pair ? `${this.workspace.editingAppearance === 'light' ? 'Light' : 'Dark'}: ` : ''}${candidate.changedTokens.length} changed values · ${Object.keys(theme.pins).length} active pins</p>
						<div class="review-context"><en-select label="Preview page" .value=${this.page} .items=${reviewPages} @en-change=${(e:CustomEvent<{proposed:string}>)=>{acceptValueChange<string>(e,value=>{this.selectPreviewPage(value);return this.page;});}}></en-select><en-select label="Preview reading direction" .value=${this.direction} .items=${directions} @en-change=${(e:CustomEvent<{proposed:'ltr'|'rtl'}>)=>{acceptValueChange<'ltr'|'rtl'>(e,direction=>{this.direction=direction;this.touch();this.syncPreviews();return this.direction;});}}></en-select></div>
						<p class="review-help">The baseline uses unchanged library rules for the same appearance and density. Each preview keeps its own theme and interactions, independently of Page appearance.</p>
						${!this.previewsOpen ? html`<en-button @click=${async()=>{this.previewsOpen=true;this.touch();await this.updateComplete;this.syncPreviews();}}>Load previews</en-button><p class="review-help">Loads both complete pages when you need them.</p>` : html`
							<p class="review-preview-status">${previewReady ? `${currentReceipt.caseIds.length} candidate cases rendered. Interaction and visual checks remain to be reviewed.` : 'Loading candidate preview…'}</p>
							<div class="review-frames"><section><h3>Baseline</h3><iframe title="Baseline preview" data-variant="baseline" src=${previewPath} @load=${(event:Event)=>this.syncPreviews(event.currentTarget as HTMLIFrameElement)}></iframe></section><section><h3>Candidate</h3><iframe title="Candidate preview" data-variant="candidate" src=${previewPath} @load=${(event:Event)=>this.syncPreviews(event.currentTarget as HTMLIFrameElement)}></iframe></section></div>
						`}
						${impactTemplate({selection:impact,manifest:this.impact,error:this.impactError,openCase:id=>this.reviewImpactCase(id),href:path=>this.href(path)})}
						<details class="review-details"><summary>Changed values (${candidate.changedTokens.length})</summary><div class="review-table" tabindex="0" aria-label="Changed token values"><table><thead><tr><th>Token</th><th>Baseline</th><th>Candidate</th><th>Rule</th></tr></thead><tbody>${candidate.changedTokens.map(id=>html`<tr><th scope="row">${id}</th><td>${this.draft.base.tokens[id]?.cssValue ?? '—'}</td><td>${theme.tokens[id]?.cssValue ?? '—'}</td><td>${theme.tokens[id]?.provenance}</td></tr>`)}</tbody></table></div></details>
						<details class="review-details"><summary>Diagnostics and review scope</summary><p>Every shipped specimen is available in the full sticker sheet. Potential source impact helps focus review without pruning any required cases. Unknown dependencies expand the selection; unavailable evidence does not mean no impact. A rendered case is not a passed interaction or accessibility test.</p>${theme.diagnostics.length ? html`<ul>${theme.diagnostics.map(d=>html`<li>${d.message}</li>`)}</ul>` : html`<p>No token diagnostics reported. Review contrast, focus, text growth and workflows in context.</p>`}<p>Exports contain source options, compiled CSS, resolved tokens, dependency data, build identity and recorded preview coverage. Reopen using this same documentation build. The JSON does not include an offline copy of the site.</p><p>This is a local candidate. Official library changes require library review; consuming teams review their own customizations. Export does not submit or adopt a change.</p>${this.build ? html`<p>Build <code>${this.build.fingerprint}</code></p>` : nothing}<p>Candidate <code>${this.workspace.pair ? this.workspace.identity : candidate.id}</code></p></details>
					</section>
				</div>
                ${visualEvidenceTemplate({evidence:this.visualEvidence,reference:this.visualReference,sourceHash:this.workspace.identity,urls:this.visualURLs,error:this.visualError,message:this.visualMessage,busy:this.visualBusy,enabled:!!this.build,open:event=>void this.importVisual(event),download:()=>this.downloadVisual(),openCandidate:()=>this.openVisualCandidate(),clear:()=>this.unloadVisual()})}
			</main>
			<footer class="site-footer"><span>en-reve · A working design system</span><a href="#theme-review">Back to top ↑</a></footer>
			${this.flagged ? html`<a class="progress-return" href="http://127.0.0.1:4177">Progress Report</a>` : nothing}
		`;
	}
}
