import { html, css } from 'lit';
import { live } from 'lit/directives/live.js';
import { EnElement } from './internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { controlStyles, formStyles } from '@en-reve/styles/controls.js';
import { dispatchChange, dispatchAction } from '@en-reve/primitives/interactions/events.js';
export type QuestionnaireAnswer = string | readonly string[];
export type QuestionnaireAnswers = Readonly<Record<string, QuestionnaireAnswer>>;
function copyAnswers(value:QuestionnaireAnswers):Record<string,QuestionnaireAnswer>{return Object.fromEntries(Object.entries(value).map(([key,answer])=>[key,Array.isArray(answer)?Object.freeze([...answer]):answer]));}
export interface Question {
    readonly id: string;
    readonly label: string;
    readonly description?: string;
    readonly required?: boolean;
    readonly optional?: boolean;
    readonly multiple?: boolean;
    readonly options?: readonly {
        value: string;
        label: string;
    }[];
    readonly validate?: (answer: QuestionnaireAnswer) => string;
}
/** Retained local answers and validated step navigation. Persistence and submission
 * belong to the application; submit is intent, never an automatic network request.
 * @tagname en-questionnaire
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<Record<string,QuestionnaireAnswer>>} en-change - Tentative answer map, reason answer.
 * @fires {CustomEvent<import('@en-reve/primitives/interactions/events.js').ActionDetail<string, {from:string;to:string|null;answers:Record<string,QuestionnaireAnswer>}>>} en-action - Cancelable next/previous/skip/submit intent with step ids and answers.
 */
export class EnQuestionnaire extends EnElement<{'en-change': import('@en-reve/primitives/interactions/events.js').ChangeEvent<Record<string,QuestionnaireAnswer>>;'en-action': CustomEvent<import('@en-reve/primitives/interactions/events.js').ActionDetail<string,{from:string;to:string|null;answers:Record<string,QuestionnaireAnswer>}>>}> {
    static override properties = { questions: { attribute: false }, value: { attribute: false, noAccessor: true }, step: { noAccessor: true }, label: {}, disabled: { type: Boolean } };
    static override styles = [foundationStyles, blockHostStyles, controlStyles, formStyles, css `.actions{display:flex;gap:var(--en-space-2);flex-wrap:wrap;margin-block-start:var(--en-space-4);} progress{inline-size:100%;accent-color:var(--en-color-action);} .en-field{margin-block:var(--en-space-3);}`];
    declare questions: readonly Question[];
    declare label: string;
    declare disabled: boolean;
    private answers: Record<string, QuestionnaireAnswer> = {};
    private revision = 0;
    private current = '';
    private error = '';
    constructor() { super(); this.questions = []; this.label = 'Questionnaire'; this.disabled = false; }
    get value() { return copyAnswers(this.answers); }
    set value(value: Readonly<Record<string, QuestionnaireAnswer>>) { const previous = this.answers; this.answers = copyAnswers(value); this.revision++; this.requestUpdate('value', previous); }
    get step() { return this.current || this.questions[0]?.id || ''; }
    set step(value: string) { const previous = this.current; this.current = value; this.revision++; this.error = ''; this.requestUpdate('step', previous); }
    private answer(value: QuestionnaireAnswer) { if (this.disabled)
        return; const question = this.questions.find(q => q.id === this.step); if (!question)
        return; const previous = this.value, proposed = { ...previous, [question.id]: value }; const stage = (v: Record<string, QuestionnaireAnswer>) => { this.answers = copyAnswers(v); this.requestUpdate(); }; dispatchChange(this, { previous, proposed, reason: 'answer', getRevision: () => this.revision, stage, rollback: stage, canCommit: () => this.isConnected && !this.disabled && this.questions.includes(question) }); }
    private textAnswer(id:string):string{const value=this.answers[id];return typeof value==='string'?value:'';}
    private selectedAnswers(id:string):readonly string[]{const value=this.answers[id];return Array.isArray(value)?value:[];}
    private validate(question:Question){const value=this.answers[question.id]??(question.multiple?[]:'');const values=typeof value==='string'?(value.trim()?[value]:[]):value;if(question.required&&!values.length)return 'Answer this question to continue.';if(question.options&&values.some(v=>!question.options!.some(o=>o.value===v)))return 'Choose an available answer.';if(!values.length&&question.optional)return '';return question.validate?.(value)??'';}
    protected override updated(){for(const input of this.renderRoot.querySelectorAll<HTMLInputElement>('input[data-answer]'))input.checked=this.selectedAnswers(this.step).includes(input.value);}
    navigate(action: 'next' | 'previous' | 'skip' | 'submit') {
        if (this.disabled)
            return false;
        const index = this.questions.findIndex(q => q.id === this.step), question = this.questions[index];
        if (!question)
            return false;
        if (action === 'skip' && !question.optional)
            return false;
        if (action !== 'previous' && action !== 'skip') {
            this.error = this.validate(question);
            if (action === 'submit' && !this.error) {
                const invalid = this.questions.find(q => this.validate(q));
                if (invalid) {
                    this.current = invalid.id;
                    this.error = this.validate(invalid);
                }
            }
            if (this.error) {
                this.requestUpdate();
                void this.updateComplete.then(() => this.renderRoot.querySelector<HTMLElement>('#answer')?.focus());
                return false;
            }
        }
        const to = this.questions[index + (action === 'previous' ? -1 : 1)];
        if (action !== 'submit' && !to)
            return false;
        const revision = this.revision;
        if (!dispatchAction(this, { action, data: { from: question.id, to: to?.id ?? null, answers: this.value } }, { cancelable: true }) || revision !== this.revision || this.disabled)
            return false;
        if (to) {
            this.current = to.id;
            this.error = '';
            this.requestUpdate();
            void this.updateComplete.then(() => this.renderRoot.querySelector<HTMLElement>('#question')?.focus());
        }
        return true;
    }
    protected override render() { const index = this.questions.findIndex(q => q.id === this.step), question = this.questions[index]; if (!question)
        return html `<p>${this.questions.length ? 'The current question is unavailable.' : 'No questions.'}</p>`; return html `<section aria-label=${this.label}><label>${index + 1} of ${this.questions.length}<progress max=${this.questions.length} value=${index + 1}></progress></label><h3 id="question" tabindex="-1">${question.multiple ? question.label : html`<label for="answer">${question.label}</label>`}</h3><p id="description">${question.description ?? ''}</p><div class="en-field">${question.multiple && question.options ? html`<fieldset id="answer" tabindex="-1" aria-label=${question.label} aria-describedby="description error" ?disabled=${this.disabled}>${question.options.map(option=>html`<label class="en-choice"><input type="checkbox" class="en-checkbox" data-answer value=${option.value} ?checked=${this.selectedAnswers(question.id).includes(option.value)} @change=${(event:Event)=>{const selected=this.selectedAnswers(question.id);this.answer(selected.includes(option.value)?selected.filter(v=>v!==option.value):[...selected,option.value]);(event.target as HTMLInputElement).checked=this.selectedAnswers(question.id).includes(option.value);}}>${option.label}</label>`)}</fieldset>` : question.options ? html `<select id="answer" class="en-select" aria-label=${question.label} aria-describedby="description error" aria-invalid=${String(!!this.error)} ?required=${question.required} ?disabled=${this.disabled} .value=${live(this.textAnswer(question.id))} @change=${(e: Event) => { this.answer((e.target as HTMLSelectElement).value); (e.target as HTMLSelectElement).value = this.textAnswer(question.id); }}><option value="">Choose an answer</option>${question.options.map(o => html `<option value=${o.value} ?selected=${o.value === this.answers[question.id]}>${o.label}</option>`)}</select>` : html `<input id="answer" class="en-input" aria-label=${question.label} aria-describedby="description error" aria-invalid=${String(!!this.error)} ?required=${question.required} ?disabled=${this.disabled} .value=${live(this.textAnswer(question.id))} @input=${(e: Event) => { this.answer((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = this.textAnswer(question.id); }}>`}<p id="error" class="en-error" role="status">${this.error}</p></div><div class="actions"><button class="en-button" data-variant="secondary" type="button" ?disabled=${this.disabled || index === 0} @click=${() => this.navigate('previous')}>Previous</button>${question.optional && index < this.questions.length - 1 ? html `<button class="en-button" data-variant="ghost" type="button" ?disabled=${this.disabled} @click=${() => this.navigate('skip')}>Skip</button>` : null}<button class="en-button" type="button" ?disabled=${this.disabled} @click=${() => this.navigate(index === this.questions.length - 1 ? 'submit' : 'next')}>${index === this.questions.length - 1 ? 'Complete' : 'Next'}</button></div></section>`; }
}
declare global {
    interface HTMLElementTagNameMap {
        'en-questionnaire': EnQuestionnaire;
    }
}
