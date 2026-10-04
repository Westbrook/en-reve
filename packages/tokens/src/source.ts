import type { DimensionValue, ThemeDensity, ThemeMode, TokenDefinition, TokenDocument, TokenType } from './types.js';
import { colorFromHex } from './color.js';
import { tokenDocument } from './graph.js';
import { deepFreeze } from './value.js';
import { componentSizes, sizeScales, typeScales, sizingRoles } from './sizing.js';

export const compilerVersion = '0.1.0';
export const spacingSteps = Object.freeze({'0':0,'0-5':0.5,'1':1,'1-5':1.5,'2':2,'2-5':2.5,'3':3,'4':4,'5':5,'6':6,'8':8,'12':12,'16':16});
export const rhythmChoices = Object.freeze([0.125,0.1875,0.25,0.3125,0.375,0.5]);
export const densityNames = Object.freeze(['compact','comfortable','spacious'] as const);
/** Proposed visual values from plans/visual-language.md, pending browser review. */
export const palettes = deepFreeze({
  light: {canvas:'#F7F8FA',surface:'#FFFFFF','surface-subtle':'#EEF1F5','surface-raised':'#FFFFFF',text:'#1B1F24','text-muted':'#566171',line:'#D6DCE4',boundary:'#7B8798',action:'#2457D6','on-action':'#FFFFFF',selected:'#E7EEFF',focus:'#2457D6','danger-text':'#B42318','warning-text':'#8A4B05','success-text':'#146C43'},
  dark: {canvas:'#14171B',surface:'#1C2127','surface-subtle':'#252C34','surface-raised':'#252C34',text:'#F3F5F7','text-muted':'#B7C0CC',line:'#3C4857',boundary:'#78869A',action:'#AAC1FF','on-action':'#101B39',selected:'#233657',focus:'#AAC1FF','danger-text':'#FFB4AB','warning-text':'#FFD094','success-text':'#8FDCB1'}
});
export function createSourceTokens(mode: ThemeMode = 'light', density: ThemeDensity = 'comfortable'): TokenDocument {
  const flat: Record<string,TokenDefinition> = {};
  function add(id: string, type: TokenType, value: unknown, description: string, extension?: Record<string,unknown>) {
    flat[id] = {$type:type,$value:value,$description:description, ...(extension ? {$extensions:{'en-reve':extension}} : {})};
  }
  const dimension = (id: string, value: number, unit: DimensionValue['unit'] = 'rem', description = id) => add(id,'dimension',{value,unit},description);
  for (const [role,hex] of Object.entries(palettes[mode])) {
    add(`palette.${role}`,'color',colorFromHex(hex),`Proposed ${mode} ${role} color.`);
    add(`color.${role}`,'color',`{palette.${role}}`,`Semantic ${role} role.`);
  }
  add('palette.accent','color',colorFromHex(palettes[mode].action),'Shared accent seed for independent brand and default action colors.');
  add('palette.action','color','{palette.accent}','Action seed; defaults to the shared accent and can be overridden independently.');
  add('color.brand','color','{palette.accent}','Brand identity color; independent of action-specific overrides.');
  add('color.action-text','color','{color.action}','Action text on neutral surfaces, independent of filled action backgrounds.');
  add('color.link','color','{color.action-text}','Link text color; may be customized independently of other action text.');
  add('palette.emphasis','color',colorFromHex(mode === 'light' ? '#000000' : '#FFFFFF'),'Endpoint for action emphasis.');
  add('palette.foreground-light','color',colorFromHex('#FFFFFF'),'Light foreground candidate for filled brand and action surfaces.');
  add('palette.foreground-dark','color',colorFromHex('#101B39'),'Dark foreground candidate for filled brand and action surfaces.');
  add('color.on-brand','color',mode === 'light' ? '{palette.foreground-light}' : '{palette.foreground-dark}','Foreground on the effective brand background; independently derived by brand/v1.');
  for (const role of ['action-hover','action-pressed','accent-subtle','accent-border']) add(`color.${role}`,'color','{palette.action}',`Coordinated ${role} color; derived by accent/v1.`);
  add('color.scrim','color',{...colorFromHex('#000000'),alpha:0.45},'Modal background scrim.');
  dimension('rhythm.base',0.25,'rem','Base layout rhythm.');
  for (const [step,factor] of Object.entries(spacingSteps)) dimension(`space.${step}`,0.25*factor,'rem',`${factor} times the base rhythm.`);
  const densitySteps = {
    compact: {'label-control':'1-5',fields:'4',rows:'2',sections:'6','control-inline':'2',panel:'4',actions:'1'},
    comfortable: {'label-control':'2',fields:'6',rows:'3',sections:'8','control-inline':'3',panel:'6',actions:'1-5'},
    spacious: {'label-control':'3',fields:'8',rows:'4',sections:'12','control-inline':'4',panel:'8',actions:'2'},
  } as const;
  const roles: Record<string,string> = {'icon-label':'2','control-description':'1-5',...densitySteps[density]};
  for (const [role,step] of Object.entries(roles)) add(`space.${role}`,'dimension',`{space.${step}}`,`${role} spacing in ${density} density.`);
  for (const [role,step] of Object.entries({'control-block':'1-5','badge-inline':'2','badge-block':'0-5'})) add(`space.${role}`,'dimension',`{space.${step}}`,`${role} component geometry, separate from group gaps.`);
  dimension('size.control-min',{compact:2,comfortable:2.5,spacious:3}[density],'rem','Density baseline for control block size; content and target requirements may grow it.');
  dimension('size.target-min',24,'px','Interactive target floor independent of visual size. Rendered target context still requires review.');
  dimension('size.swatch',4,'rem','Color-preview block size, independent of control density.');
  add('size.splitter','dimension','{size.target-min}','Splitter handle baseline; visual size variants retain a separate target floor.');
  for (const [name,value] of Object.entries({'target-touch':2.75,icon:1.125,'icon-small':1,avatar:2.5,spinner:1.25,progress:0.5,'skeleton-line':1})) dimension(`size.${name}`,value);
  dimension('size.spinner-stroke',2,'px');
  dimension('size.icon-stroke',1.5,'px');
  dimension('size.switch-inline',2.5); dimension('size.switch-block',1.5); dimension('size.switch-thumb',1);
  dimension('size.choice-mark-inline',6,'px'); dimension('size.choice-mark-block',10,'px'); dimension('size.choice-dot',8,'px');
  dimension('size.range-track',4,'px');
  dimension('size.range-length',12,'rem','Default vertical range length; independent of density and control size so adjustment precision is retained.');
  dimension('space.switch-inset',0.1875);
  for (const [name,value] of Object.entries({control:0.5,container:1,dialog:1.25})) dimension(`radius.${name}`,value);
  dimension('radius.choice',2,'px','Checkbox corner geometry; radio uses a circular boundary.');
  dimension('radius.pill',9999,'px');
  dimension('border.width',1,'px');
  dimension('border.invalid-width',2,'px','Invalid text-field border width; its difference from the base border is taken from control padding.');
  dimension('focus.width',2,'px'); dimension('focus.offset',2,'px');
  for (const axis of ['block','inline']) add(`focus.scroll-margin-${axis}`,'dimension','{space.4}',`Preferred ${axis}-axis clearance when scrolling a focused control into view; independent of application scroll padding.`);
  dimension('focus.inset-offset',-2,'px','Inset contour offset; derives from the focus width and remains independently pinnable.');
  dimension('focus.halo-width',0,'px','Supplementary outer focus halo; zero preserves the plain contour baseline.');
  add('color.focus-halo','color','{color.focus}','Supplementary focus halo color; the opaque contour remains independently visible.');
  dimension('focus.accent-width',0,'px','Optional field bottom accent; zero preserves existing field paint.');
  dimension('size.choice-mark-stroke',2,'px','Checked and mixed checkbox mark stroke; independent of focus geometry.');
  dimension('size.tab-indicator',2,'px','Tab state indicator thickness; independent of focus geometry.');
  dimension('size.quote-border',2,'px','Decorative quotation border; independent of focus geometry.');
  const fonts: Record<string,readonly [number,number,number]> = {body:[1,1.5,400],ui:[1,1.5,400],data:[0.875,1.5,400],metadata:[0.8125,1.5,400],'heading-small':[1.125,1.4,600],'heading-medium':[1.5,1.3,600],'heading-large':[2,1.2,600]};
  for (const [role,[size,height,weight]] of Object.entries(fonts)) {
    add(`font.${role}.family`,'fontFamily',['system-ui','sans-serif'],`${role} font stack.`);
    dimension(`font.${role}.size`,size);
    add(`font.${role}.line-height`,'number',height,`${role} unitless line height.`);
    add(`font.${role}.weight`,'fontWeight',weight,`${role} font weight.`);
  }
  // Comparable controls share UI metrics by default; each semantic role stays pinnable.
  for (const [role,weight] of [['input',400],['label-strong',600]] as const) {
    for (const [property,type] of [['family','fontFamily'],['size','dimension'],['line-height','number']] as const) {
      add(`font.${role}.${property}`,type,`{font.ui.${property}}`,`${role} ${property} follows the UI role unless independently customized.`);
    }
    add(`font.${role}.weight`,'fontWeight',weight,`${role} weight remains independent of the shared UI metrics.`);
  }
  for (const role of [...Object.keys(fonts),'input','label-strong']) {
    add(`font.${role}.tracking`,'dimension',['input','label-strong'].includes(role) ? '{font.ui.tracking}' : {value:0,unit:'px'},'Role tracking; independent of size scaling.');
    add(`font.${role}.style`,'fontStyle',['input','label-strong'].includes(role) ? '{font.ui.style}' : 'normal','Role font style; assets and synthetic-style policy belong to the application.');
  }
  add('font.code.family','fontFamily',['ui-monospace','monospace'],'Monospaced code stack.');
  for (const [role,value] of Object.entries({immediate:0,fast:120,regular:180,slow:240,spin:800})) add(`duration.${role}`,'duration',{value,unit:'ms'},`${role} duration; reduced motion has a behavioral alternative.`);
  add('ease.standard','cubicBezier',[0.2,0,0,1],'Standard deceleration.');
  for (const phase of ['enter','exit']) {
    add(`duration.${phase}`,'duration','{duration.immediate}',`Optional native surface ${phase} paint duration; never delays state, focus or modality.`);
    add(`ease.${phase}`,'cubicBezier','{ease.standard}',`Native surface ${phase} easing; reduced motion removes the effect.`);
  }
  dimension('motion.surface-offset',0,'px','Shared dialog and drawer travel; drawer attachment sets direction and anchored surfaces retain stable coordinates.');
  add('motion.surface-scale','number',1,'Optional centered modal scale; drawers remain unscaled and anchored surfaces retain stable coordinates.');
  for (const phase of ['enter','exit']) {
    add(`duration.focus-${phase}`,'duration','{duration.immediate}',`Optional halo and field-accent ${phase} duration. Never delays the primary focus contour.`);
    add(`ease.focus-${phase}`,'cubicBezier','{ease.standard}',`Optional halo and field-accent ${phase} easing. Reduced motion removes this transition.`);
  }
  for (const [role,y,blur] of [['overlay',4,16],['dialog',12,40]] as const) add(`shadow.${role}`,'shadow',{color:{...colorFromHex('#000000'),alpha:0.18},offsetX:{value:0,unit:'px'},offsetY:{value:y,unit:'px'},blur:{value:blur,unit:'px'},spread:{value:0,unit:'px'}},`${role} elevation; preserve a boundary in forced colors.`);
  add('layout.prose-max','number',66,'Maximum prose measure in character widths.',{cssUnit:'ch'});
  dimension('layout.form-max',28); dimension('layout.article-max',48); dimension('layout.panel-preferred',20);
  dimension('layout.dialog-collapse',48,'rem','Default dialog collapse breakpoint, consumed by generated media query CSS.');
  for (const size of componentSizes) {
    add(`size.scale-${size}`,'number',sizeScales[size],`${size} geometry scale; independent of density and target floors.`);
    add(`size.type-scale-${size}`,'number',typeScales[size],`${size} typography scale; density never changes this scale.`);
    for (const [role,base] of Object.entries(sizingRoles)) add(`${role}-${size}`,'dimension',`{${base}}`,`${size} ${role} derived from ${base}; individually pinnable.`);
  }
  for (const [id,reference] of Object.entries({'button.background':'color.action','button.color':'color.on-action','input.background':'color.surface','input.color':'color.text','card.background':'color.surface'})) add(`component.${id}`,'color',`{${reference}}`,'Optional component override; otherwise consumes the semantic fallback.');
  add('component.button.radius','dimension','{radius.control}','Optional action corner radius; otherwise follows the shared control radius.');
  add('calendar.hover-opacity','number',0.10,'Calendar hover tint over the date fill; zero opts out when a theme supplies its own distinct state colors.');
  add('calendar.pressed-opacity','number',0.16,'Calendar pressed tint over the date fill; selected and today indicators remain visible.');
  // Toast paint is independent of the page surface, including inverted notifications.
  for (const [role,reference] of Object.entries({background:'color.surface',color:'color.text','border-color':'color.line','icon-color':'color.action-text'})) add(`component.toast.${role}`,'color',`{${reference}}`,'Optional toast paint; unpinned values retain contextual defaults.');
  for (const variant of ['info','success','warning','danger']) {
    for (const [role,reference] of Object.entries({background:'color.surface',color:'color.text','border-color':'color.line','icon-color':variant==='info'?'color.action-text':`color.${variant}-text`})) add(`component.toast.${variant}-${role}`,'color',`{${reference}}`,'Optional semantic toast paint; falls back to general toast paint.');
  }
  for(const [role,ref] of Object.entries({background:'color.surface-subtle',color:'color.text','border-color':'color.line','hover-background':'color.selected','pressed-background':'color.accent-subtle'})) add(`component.editor-token.${role}`,'color',`{${ref}}`,'Optional editor token paint; unpinned styling follows semantic theme colors.');
  for(const [role,ref] of Object.entries({radius:'radius.control','inline-padding':'space.1-5','block-padding':'space.0-5',gap:'space.1'})) add(`component.editor-token.${role}`,'dimension',`{${ref}}`,'Optional editor token geometry; interactive target floors still apply.');
  for (const [role,ref] of Object.entries({'track-size':'space.6',radius:'radius.control','checker-size':'space.2'})) add(`component.color-slider.${role}`,'dimension',`{${ref}}`,'Color channel slider geometry; native interaction target minimum remains enforced.');
  add('component.color-slider.thumb-size','dimension',{value:1.75,unit:'rem'},'Color channel handle diameter.');
  add('component.color-slider.checker-light','color',colorFromHex('#ffffff'),'Light transparency checker tile.');
  add('component.color-slider.checker-dark','color',colorFromHex('#b8b8b8'),'Dark transparency checker tile.');
  add('component.color-picker.inline-size','dimension',{value:20,unit:'rem'},'Preferred inline color picker width, capped by available space.');
  add('component.color-picker.gap','dimension','{space.3}','Space between color picker controls.');
  add('component.color-picker.preview-size','dimension','{space.12}','Square color preview size.');
  add('component.color-picker.preview-radius','dimension','{radius.control}','Color preview corner radius.');
  add('component.editor-token.min-size','dimension','{space.8}','Minimum inline token size; interactive accessibility floors still apply.');
  add('component.toast.radius','dimension','{radius.container}','Toast corner radius.');
  add('component.toast.padding','dimension','{space.panel}','Toast interior spacing.');
  add('component.toast.shadow','shadow','{shadow.overlay}','Toast elevation.');
  add('component.toast-region.gap','dimension','{space.3}','Notification spacing.');
  add('component.toast-region.width','dimension',{value:24,unit:'rem'},'Fixed notification region width, capped by the viewport.');
  add('component.rating.star-radius','dimension','{radius.control}','Optional rating star-target corner radius; square targets allow pill radii to form circles. Does not style the No rating option.');
  add('component.menu.min-inline-size','dimension','{layout.panel-preferred}','Optional ordinary-menu content minimum, capped by its maximum and measured viewport. Replacement submenus keep their parent width.');
  add('component.menu.max-inline-size','dimension','{layout.form-max}','Optional ordinary-menu maximum fallback below an explicit legacy overlay maximum. Replacement submenus keep their parent-width contract.');
  add('component.pagination.gap','dimension','{space.actions}','Optional gap between pagination actions; otherwise follows shared action spacing.');
  add('component.pagination.page-min-inline-size','dimension','{size.control-min}','Optional minimum numbered-page width; content and interaction-target floors still apply.');
  add('component.pagination.status-gap','dimension','{space.1}','Optional spacing between pagination actions and their status.');
  add('component.choice.label-color','color','{color.text}','Optional checkbox, radio and switch label text color; state hooks fall back to this color. Descriptions, errors and forced colors retain their own styles.');
  add('component.choice.label-hover-color','color','{color.text}','Optional enabled choice label hover color; otherwise follows the choice label color.');
  add('component.choice.label-focus-color','color','{color.text}','Optional choice label color while the native control is focus-visible; ordinary focus retains its existing state.');
  add('component.choice.label-pressed-color','color','{color.text}','Optional enabled choice label held color; otherwise follows the choice label color.');
  add('component.choice.label-disabled-color','color','{color.text}','Optional disabled choice label color; otherwise follows the choice label color. Disabled paint takes precedence over interaction states.');
  add('component.radio.selected-color','color','{color.action}','Optional checked radio rim and dot color; otherwise follows the action fill. Disabled and forced-color states retain their own styles.');
  add('component.button.inline-padding','dimension','{space.control-inline}','Optional text-button inline padding; otherwise follows the selected control size.');
  add('component.input.inline-padding','dimension','{space.control-inline}','Optional text-editor and select inline padding; otherwise follows the selected control size.');
  // THEME-05: promote connected, stable hooks without activating optional defaults.
  for (const [id, type, reference] of [
    ['control.radius', 'dimension', 'radius.control'],
    ['control.inline-padding', 'dimension', 'space.control-inline'],
    ['control.min-size', 'dimension', 'size.control-min'],
    ['control.background', 'color', 'color.surface'],
    ['control.color', 'color', 'color.text'],
    ['control.border-color', 'color', 'color.boundary'],
    ['button.border-color', 'color', 'color.action'],
    ['surface.radius', 'dimension', 'radius.container'],
    ['surface.padding', 'dimension', 'space.panel'],
    ['surface.background', 'color', 'color.surface'],
    ['surface.color', 'color', 'color.text'],
    ['surface.border-color', 'color', 'color.line'],
  ] as const) add(`component.${id}`, type, `{${reference}}`,
    'Optional shared/family override. This authoring default is not the rendered fallback; unpinned full themes retain contextual styles.');
  add('component.segmented-control.frame-inset','dimension','{space.1}','Padding inside the segmented border. Only segmented-control geometry includes this inset; ordinary controls retain their own target floors.');
  // Optional option-list roles: unpinned aliases leave each stylesheet context fallback intact.
  add('component.option-list.background','color','{color.surface-raised}','Optional option-list background. Falls back to legacy overlay hooks and the local popup context.');
  add('component.option-list.color','color','{color.text}','Optional option-list color. Falls back to legacy overlay hooks and the local popup context.');
  add('component.option-list.border-color','color','{color.boundary}','Optional option-list border-color. Falls back to legacy overlay hooks and the local popup context.');
  add('component.option.rest-background','color','{color.surface}','Optional option rest-background. A specific state pin refines the existing all-state hooks; unpinned styling keeps its context default.');
  add('component.option.rest-color','color','{color.text}','Optional option rest-color. A specific state pin refines the existing all-state hooks; unpinned styling keeps its context default.');
  add('component.option.hover-background','color','{color.surface-subtle}','Optional option hover-background. A specific state pin refines the existing all-state hooks; unpinned styling keeps its context default.');
  add('component.option.hover-color','color','{color.text}','Optional option hover-color. A specific state pin refines the existing all-state hooks; unpinned styling keeps its context default.');
  add('component.option.active-background','color','{color.surface-subtle}','Optional option active-background. A specific state pin refines the existing all-state hooks; unpinned styling keeps its context default.');
  add('component.option.active-color','color','{color.text}','Optional option active-color. A specific state pin refines the existing all-state hooks; unpinned styling keeps its context default.');
  add('component.option.pressed-background','color','{color.selected}','Optional option pressed-background. A specific state pin refines the existing all-state hooks; unpinned styling keeps its context default.');
  add('component.option.pressed-color','color','{color.text}','Optional option pressed-color. A specific state pin refines the existing all-state hooks; unpinned styling keeps its context default.');
  add('component.option.selected-background','color','{color.selected}','Optional option selected-background. A specific state pin refines the existing all-state hooks; unpinned styling keeps its context default.');
  add('component.option.selected-color','color','{color.text}','Optional option selected-color. A specific state pin refines the existing all-state hooks; unpinned styling keeps its context default.');
  add('component.option.disabled-background','color','{color.surface-subtle}','Optional option disabled-background. A specific state pin refines the existing all-state hooks; unpinned styling keeps its context default.');
  add('component.option.disabled-color','color','{color.text-muted}','Optional option disabled-color. A specific state pin refines the existing all-state hooks; unpinned styling keeps its context default.');
  add('component.option-list.radius','dimension','{radius.container}','Optional option-list radius. Falls back to legacy overlay hooks and the local popup context.');
  add('component.option-list.padding','dimension','{space.1}','Optional option-list padding. Falls back to legacy overlay hooks and the local popup context.');
  add('component.option-list.gap','dimension','{space.0}','Optional option-list gap. Falls back to legacy overlay hooks and the local popup context.');
  add('component.option-list.max-block-size','dimension','{layout.panel-preferred}','Optional option-list max-block-size. Falls back to legacy overlay hooks and the local popup context.');
  add('component.option.radius','dimension','{radius.control}','Optional option radius. A specific state pin refines the existing all-state hooks; unpinned styling keeps its context default.');
  add('component.option.inline-padding','dimension','{space.control-inline}','Optional option inline-padding. A specific state pin refines the existing all-state hooks; unpinned styling keeps its context default.');
  add('component.option.block-padding','dimension','{space.control-block}','Optional option block-padding. A specific state pin refines the existing all-state hooks; unpinned styling keeps its context default.');
  add('component.option.font-weight','fontWeight','{font.ui.weight}','Optional option font-weight. A specific state pin refines the existing all-state hooks; unpinned styling keeps its context default.');
  add('component.option.selected-font-weight','fontWeight','{font.label-strong.weight}','Optional option selected-font-weight. A specific state pin refines the existing all-state hooks; unpinned styling keeps its context default.');
  add('component.option-list.shadow','shadow','{shadow.overlay}','Optional option-list shadow. Falls back to legacy overlay hooks and the local popup context.');
  for (const family of ['button','input','option','overlay']) {
    for (const [role,type,reference] of [
      ['width','dimension','focus.width'], ['color','color','color.focus'],
      ['offset','dimension',family === 'option' ? 'focus.inset-offset' : 'focus.offset'],
      ['halo-width','dimension','focus.halo-width'], ['halo-color','color','color.focus-halo'],
    ] as const) add(`component.${family}.focus-${role}`,type,`{${reference}}`,
      `Optional ${family} focus ${role}. Unpinned CSS preserves the contextual fallback; the solid contour remains immediate.`);
  }
  add('component.input.focus-accent-width','dimension','{focus.accent-width}','Optional field-frame bottom accent width; supplementary to immediate native focus.');
  add('component.input.focus-accent-color','color','{color.focus}','Optional field-frame bottom accent color; independent of the primary contour.');
  for (const family of ['presence','activity']) {
    for (const [role,reference] of Object.entries({background:'color.surface','border-color':'color.line'})) add(`component.${family}.${role}`,'color',`{${reference}}`,'Optional collaboration surface paint; unpinned values inherit the current semantic theme.');
    add(`component.${family}.radius`,'dimension','{radius.container}','Optional collaboration surface corners.');
    add(`component.${family}.padding`,'dimension',family==='presence'?'{space.2}':'{space.4}','Optional collaboration surface padding.');
    add(`component.${family}.gap`,'dimension',family==='presence'?'{space.2}':'{space.3}','Optional collaboration spacing.');
  }
  add('component.presence.hover-background','color','{color.surface-subtle}','Optional linked identity hover fill.');
  add('component.presence.hover-border-color','color','{color.link}','Optional linked identity hover boundary.');
  add('component.presence.online-color','color','{color.success-text}','Optional available status paint; visible text remains required.');
  add('component.presence.busy-color','color','{color.danger-text}','Optional busy status paint; visible text remains required.');
  add('component.presence-group.gap','dimension','{space.2}','Optional wrapping collaborator spacing.');
  add('component.carousel.gap','dimension','{space.3}','Optional carousel slide/control gap.');
  add('component.carousel.radius','dimension','{radius.container}','Optional slide and viewport corners.');
  add('component.carousel.background','color','{color.surface}','Optional slide surface.');
  add('component.carousel.border-color','color','{color.line}','Optional slide boundary.');
  add('component.carousel.slides-per-view','number',1,'Optional positive integer visible-slide count; unpinned uses the element property.');
  // Release authoring refinements remain optional: unpinned full themes emit initial.
  for (const state of ['rest','hover','pressed']) {
    add(`component.button.${state}-background`,'color',`{color.action${state === 'rest' ? '' : '-'+state}}`,'Optional all-variant state paint. Scope variant recipes to avoid flattening contextual variants.');
    add(`component.button.${state}-color`,'color','{color.on-action}','Optional all-variant state ink.');
  }
  for (const [id,ref] of Object.entries({'input.radius':'radius.control','input.border-width':'border.width','input.invalid-border-width':'border.invalid-width','choice.size':'size.icon','switch.inline-size':'size.switch-inline','switch.block-size':'size.switch-block','switch.thumb-size':'size.switch-thumb'})) add(`component.${id}`,'dimension',`{${ref}}`,'Optional family geometry; protected targets still apply.');
  for (const [id,ref] of Object.entries({'input.border-color':'color.boundary','input.hover-border-color':'color.action-text','input.invalid-border-color':'color.danger-text','navigation.hover-background':'color.surface-subtle','navigation.hover-color':'color.text','navigation.current-background':'color.selected','navigation.current-color':'color.text','navigation.pressed-background':'color.accent-subtle','navigation.current-indicator-color':'color.action','tab.hover-background':'color.surface-subtle','tab.hover-color':'color.text','tab.selected-background':'color.selected','tab.selected-color':'color.text','tab.pressed-background':'color.accent-subtle','tab.indicator-color':'color.action'})) add(`component.${id}`,'color',`{${ref}}`,'Optional contextual state paint; legacy shared hooks remain fallbacks.');
  dimension('size.navigation-indicator',0,'px','Optional inset current-page marker; zero leaves existing navigation anatomy.');
  add('component.navigation.current-indicator-width','dimension','{size.navigation-indicator}','Optional navigation indicator width.');
  const emptyShadow = {color:{...colorFromHex('#000000'),alpha:0},offsetX:{value:0,unit:'px'},offsetY:{value:0,unit:'px'},blur:{value:0,unit:'px'},spread:{value:0,unit:'px'}};
  add('shadow.none','shadow',emptyShadow,'No decorative elevation.');
  for (const role of ['surface','card','button']) add(`component.${role}.shadow`,'shadow','{shadow.none}','Optional decorative elevation, independent of the focus halo.');
  add('component.button.pressed-shadow','shadow','{shadow.none}','Optional held button elevation; primary focus remains immediate.');
  add('motion.press-scale','number',1,'Whole-button held scale.');
  add('component.button.pressed-scale','number','{motion.press-scale}','Whole-button press scale, clamped to .9–1; layout allocation stays unchanged.');
  dimension('motion.press-offset',0,'px','Opt-in whole-button vertical movement, clamped to ±2px.');
  add('component.button.pressed-offset','dimension','{motion.press-offset}','Optional whole-button held translation.');
  add('component.button.popup-pressed-scale','number','{component.button.pressed-scale}','Popup-trigger held scale; inherits ordinary button motion unless refined.');
  add('component.button.popup-pressed-offset','dimension','{component.button.pressed-offset}','Popup-trigger held translation; themes may opt popup triggers out with zero.');
  for (const phase of ['press','release']) {
    add(`duration.${phase}`,'duration',{value:80,unit:'ms'},'Button press timing.');
    add(`component.button.${phase}-duration`,'duration',`{duration.${phase}}`,'Optional button press timing, clamped to 200ms; reduced motion removes movement.');
  }
  for (const family of ['popup','dialog','toast']) for (const phase of ['enter','exit']) {
    add(`component.${family}.${phase}-duration`,'duration',`{duration.${phase}}`,'Family visual timing only; never delays state, focus or dismissal.');
    add(`component.${family}.${phase}-ease`,'cubicBezier',`{ease.${phase}}`,'Family visual easing; reduced motion remains immediate.');
  }
  add('component.segmented.pressed-scale','number','{motion.press-scale}','Optional segmented held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.segmented.pressed-offset','dimension','{motion.press-offset}','Optional segmented held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.segmented.press-duration','duration','{duration.press}','Optional segmented held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.segmented.release-duration','duration','{duration.release}','Optional segmented held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.segmented.pressed-shadow','shadow','{shadow.none}','Optional segmented held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.segmented.pressed-background','color','{color.accent-subtle}','Optional segmented held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.segmented.pressed-color','color','{color.text}','Optional segmented held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.segmented.pressed-border-color','color','{color.boundary}','Optional segmented held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.accordion.pressed-scale','number','{motion.press-scale}','Optional accordion held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.accordion.pressed-offset','dimension','{motion.press-offset}','Optional accordion held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.accordion.press-duration','duration','{duration.press}','Optional accordion held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.accordion.release-duration','duration','{duration.release}','Optional accordion held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.accordion.pressed-shadow','shadow','{shadow.none}','Optional accordion held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.accordion.pressed-background','color','{color.accent-subtle}','Optional accordion held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.accordion.pressed-color','color','{color.text}','Optional accordion held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.tab.pressed-scale','number','{motion.press-scale}','Optional tab held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.tab.pressed-offset','dimension','{motion.press-offset}','Optional tab held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.tab.press-duration','duration','{duration.press}','Optional tab held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.tab.release-duration','duration','{duration.release}','Optional tab held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.tab.pressed-shadow','shadow','{shadow.none}','Optional tab held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.tab.pressed-color','color','{color.text}','Optional tab held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.rating.pressed-scale','number','{motion.press-scale}','Optional rating held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.rating.pressed-offset','dimension','{motion.press-offset}','Optional rating held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.rating.press-duration','duration','{duration.press}','Optional rating held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.rating.release-duration','duration','{duration.release}','Optional rating held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.rating.pressed-shadow','shadow','{shadow.none}','Optional rating held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.rating.pressed-background','color','{color.accent-subtle}','Optional rating held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.rating.pressed-color','color','{color.text}','Optional rating held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.combobox-trigger.pressed-scale','number','{motion.press-scale}','Optional combobox-trigger held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.combobox-trigger.pressed-offset','dimension','{motion.press-offset}','Optional combobox-trigger held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.combobox-trigger.press-duration','duration','{duration.press}','Optional combobox-trigger held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.combobox-trigger.release-duration','duration','{duration.release}','Optional combobox-trigger held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.combobox-trigger.pressed-shadow','shadow','{shadow.none}','Optional combobox-trigger held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.combobox-trigger.pressed-background','color','{color.accent-subtle}','Optional combobox-trigger held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.combobox-trigger.pressed-color','color','{color.text}','Optional combobox-trigger held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.navigation.pressed-scale','number','{motion.press-scale}','Optional navigation held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.navigation.pressed-offset','dimension','{motion.press-offset}','Optional navigation held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.navigation.press-duration','duration','{duration.press}','Optional navigation held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.navigation.release-duration','duration','{duration.release}','Optional navigation held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.navigation.pressed-shadow','shadow','{shadow.none}','Optional navigation held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.navigation.pressed-color','color','{color.text}','Optional navigation held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.editor-token.pressed-scale','number','{motion.press-scale}','Optional editor-token held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.editor-token.pressed-offset','dimension','{motion.press-offset}','Optional editor-token held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.editor-token.press-duration','duration','{duration.press}','Optional editor-token held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.editor-token.release-duration','duration','{duration.release}','Optional editor-token held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.editor-token.pressed-shadow','shadow','{shadow.none}','Optional editor-token held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.editor-token.pressed-color','color','{color.text}','Optional editor-token held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.editor-token.pressed-border-color','color','{color.boundary}','Optional editor-token held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.option.pressed-scale','number','{motion.press-scale}','Optional option held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.option.pressed-offset','dimension','{motion.press-offset}','Optional option held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.option.press-duration','duration','{duration.press}','Optional option held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.option.release-duration','duration','{duration.release}','Optional option held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.option.pressed-shadow','shadow','{shadow.none}','Optional option held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.calendar.pressed-scale','number','{motion.press-scale}','Optional calendar held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.calendar.pressed-offset','dimension','{motion.press-offset}','Optional calendar held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.calendar.press-duration','duration','{duration.press}','Optional calendar held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.calendar.release-duration','duration','{duration.release}','Optional calendar held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.calendar.pressed-shadow','shadow','{shadow.none}','Optional calendar held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.checkbox.pressed-scale','number','{motion.press-scale}','Optional checkbox held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.checkbox.pressed-offset','dimension','{motion.press-offset}','Optional checkbox held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.checkbox.press-duration','duration','{duration.press}','Optional checkbox held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.checkbox.release-duration','duration','{duration.release}','Optional checkbox held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.checkbox.pressed-shadow','shadow','{shadow.none}','Optional checkbox held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.checkbox.pressed-border-color','color','{color.boundary}','Optional checkbox held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.radio.pressed-scale','number','{motion.press-scale}','Optional radio held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.radio.pressed-offset','dimension','{motion.press-offset}','Optional radio held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.radio.press-duration','duration','{duration.press}','Optional radio held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.radio.release-duration','duration','{duration.release}','Optional radio held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.radio.pressed-shadow','shadow','{shadow.none}','Optional radio held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.radio.pressed-border-color','color','{color.boundary}','Optional radio held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.switch.pressed-scale','number','{motion.press-scale}','Optional switch held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.switch.pressed-offset','dimension','{motion.press-offset}','Optional switch held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.switch.press-duration','duration','{duration.press}','Optional switch held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.switch.release-duration','duration','{duration.release}','Optional switch held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.switch.pressed-shadow','shadow','{shadow.none}','Optional switch held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.switch.pressed-border-color','color','{color.boundary}','Optional switch held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.select.pressed-scale','number','{motion.press-scale}','Optional select held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.select.pressed-offset','dimension','{motion.press-offset}','Optional select held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.select.press-duration','duration','{duration.press}','Optional select held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.select.release-duration','duration','{duration.release}','Optional select held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.select.pressed-shadow','shadow','{shadow.none}','Optional select held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.select.pressed-background','color','{color.accent-subtle}','Optional select held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.select.pressed-color','color','{color.text}','Optional select held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.number-step.pressed-scale','number','{motion.press-scale}','Optional number-step held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.number-step.pressed-offset','dimension','{motion.press-offset}','Optional number-step held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.number-step.press-duration','duration','{duration.press}','Optional number-step held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.number-step.release-duration','duration','{duration.release}','Optional number-step held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.number-step.pressed-shadow','shadow','{shadow.none}','Optional number-step held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.number-step.pressed-background','color','{color.accent-subtle}','Optional number-step held-state refinement; geometry is bounded and reduced motion wins.');
  add('component.switch.thumb-pressed-size','dimension','{size.switch-thumb}','Optional held thumb geometry; track and pointer coordinates remain stable.');
  add('component.slider-thumb.pressed-scale','number','{motion.press-scale}','Optional held thumb geometry; track and pointer coordinates remain stable.');
  add('component.slider-thumb.press-duration','duration','{duration.press}','Optional held thumb geometry; track and pointer coordinates remain stable.');
  add('component.slider-thumb.release-duration','duration','{duration.release}','Optional held thumb geometry; track and pointer coordinates remain stable.');
  add('component.color-plane-thumb.pressed-scale','number','{motion.press-scale}','Optional held thumb geometry; track and pointer coordinates remain stable.');
  add('component.color-plane-thumb.press-duration','duration','{duration.press}','Optional held thumb geometry; track and pointer coordinates remain stable.');
  add('component.color-plane-thumb.release-duration','duration','{duration.release}','Optional held thumb geometry; track and pointer coordinates remain stable.');
  return tokenDocument(flat);
}
export const sourceTokens = deepFreeze(createSourceTokens());
