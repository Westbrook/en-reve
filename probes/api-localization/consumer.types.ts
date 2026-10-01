import type {EditorMessages, ColorMessages, ColorPickerMessages, EnDatePicker, EnColorPicker, EnColorPlane, EnColorWheel, EnValidationSummary, EnTokenEditor, EnRichTextEditor, EnEditorToolbar} from '@en-reve/elements';
import type {EditorMessages as ExtensionMessages} from '@en-reve/elements/editor-extensions.js';
import type {ColorPickerMessages as PickerMessages} from '@en-reve/elements/color-picker.js';
declare const token:EnTokenEditor, rich:EnRichTextEditor, toolbar:EnEditorToolbar;
declare const date:EnDatePicker, picker:EnColorPicker, plane:EnColorPlane, wheel:EnColorWheel, summary:EnValidationSummary;
const messages={suggestions:{loading:'Cargando…'},commands:{bold:'Negrita'},link:{applyLabel:'Aplicar'}} satisfies EditorMessages;
const shared:ExtensionMessages=messages;
token.messages=shared;rich.messages=shared;toolbar.messages=shared;
const colors:ColorMessages={invalidColor:'Color no admitido.',channels:{hue:'Matiz inválido.'}};
const pickerMessages:ColorPickerMessages={...colors,hexGuidance:'HEX válido.'};
const publicPickerMessages:PickerMessages=pickerMessages;
picker.messages=publicPickerMessages;plane.messages=colors;wheel.messages={invalidColor:'Color no admitido.'};
picker.validationText=plane.validationText=wheel.validationText='Valor inválido.';
date.clearLabel='Borrar selección';summary.description='Corrige los errores.';
// @ts-expect-error Misspelled command names are rejected.
toolbar.messages={commands:{bald:'Wrong'}};
// @ts-expect-error Numeric messages must be strings.
plane.messages={channels:{hue:360}};
// @ts-expect-error Preserve suffix naming.
date.labelClear='Wrong';
