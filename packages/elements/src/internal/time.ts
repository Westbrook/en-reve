/** Local wall-clock arithmetic. Never converts a user time into an instant. */
export type TimeSegment = 'hour' | 'minute' | 'second' | 'dayPeriod';
export interface TimeSegmentRange { type: TimeSegment; start: number; end: number }
export type TimePrecision = 'minute' | 'second';
export interface TimeOptions { precision: TimePrecision; step: number; min: string; max: string; wrap: boolean; required?: boolean }
export function timeSeconds(value: string): number | undefined {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return;
  const [, h, m, s = '0'] = match;
  if (+h > 23 || +m > 59 || +s > 59) return;
  return +h * 3600 + +m * 60 + +s;
}
export function timeString(seconds: number, precision: TimePrecision): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds % 3600 / 60))}${precision === 'second' ? ':' + pad(seconds % 60) : ''}`;
}
export function timeError(value: string, options: TimeOptions): string {
  const { precision, step, min, max, wrap, required } = options;
  if (!['minute', 'second'].includes(precision) || !Number.isInteger(step) || step < 1 || step > 86400 || (precision === 'minute' && step % 60 !== 0)) return 'Choose a valid precision and whole-second step (whole minutes for minute precision).';
  const lower = min ? timeSeconds(min) : undefined, upper = max ? timeSeconds(max) : undefined;
  if ((min && lower === undefined) || (max && upper === undefined)) return 'Time bounds must use HH:mm or HH:mm:ss.';
  if (precision === 'minute' && ((lower ?? 0) % 60 || (upper ?? 0) % 60)) return 'Minute precision requires whole-minute bounds.';
  if (lower !== undefined && upper !== undefined && lower > upper && !wrap) return 'Reversed time bounds require wrap.';
  if (!value) return required ? 'Enter a time.' : '';
  const seconds = timeSeconds(value);
  if (seconds === undefined || (precision === 'minute' && value.length !== 5)) return precision === 'second' ? 'Enter a time with hours, minutes and optional seconds.' : 'Enter a time with hours and minutes.';
  const outside = lower !== undefined && upper !== undefined && lower > upper
    ? seconds < lower && seconds > upper
    : (lower !== undefined && seconds < lower) || (upper !== undefined && seconds > upper);
  if (outside) return `Choose a time ${min && max ? `between ${min} and ${max}${wrap && lower! > upper! ? ' across midnight' : ''}` : min ? `at or after ${min}` : `at or before ${max}`}.`;
  // Stepping continues forward from min through midnight in an explicit wrap interval.
  const offset = (seconds - (lower ?? 0) + 86400) % 86400;
  if (offset % step) return `Use ${step}-second increments from ${min || '00:00'}.`;
  return '';
}

export function timePresentation(locale: string, hourCycle: string, precision: TimePrecision) {
  if (!locale || Intl.DateTimeFormat.supportedLocalesOf(locale).length === 0) throw new RangeError('Unsupported locale');
  if (!['auto','12','24'].includes(hourCycle)) throw new RangeError('Unsupported hour cycle');
  const resolved = new Intl.DateTimeFormat(locale, {hour:'numeric',timeZone:'UTC'}).resolvedOptions().hourCycle;
  const cycle = hourCycle === 'auto' ? (resolved === 'h11' || resolved === 'h12' ? '12' : '24') : hourCycle;
  const formatter = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', ...(precision === 'second' ? {second:'2-digit' as const} : {}), hourCycle:cycle === '12' ? 'h12' as const : 'h23' as const });
  const digits = new Intl.NumberFormat(locale, {useGrouping:false});
  const normalize = (text: string) => {
    let result = text.replace(/[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '').trim().toLocaleLowerCase(locale);
    for (let i=0;i<10;i++) result=result.split(digits.format(i)).join(String(i));
    return result.replace(/\s+/g,'');
  };
  const parts = (seconds: number) => formatter.formatToParts(new Date(Date.UTC(2000,0,1,0,0,seconds)));
  const periods = [parts(0).find(p=>p.type === 'dayPeriod')?.value, parts(43200).find(p=>p.type === 'dayPeriod')?.value];
  const separators = parts(13*3600+30*60).filter(p=>p.type === 'literal').map(p=>normalize(p.value)).filter(Boolean);
  const escape = (value:string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const numeral = new RegExp(`(?:[0-9]|${Array.from({length:10},(_,i)=>escape(digits.format(i))).join('|')})+`, 'gu');
  return {
    /** UTF-16 offsets match selectionStart/End, including localized digits and prefix day periods. */
    segments(text:string):TimeSegmentRange[] {
      const result:TimeSegmentRange[]=[];
      const types:TimeSegment[]=['hour','minute','second'];
      const matches=[...text.matchAll(new RegExp(numeral))];
      for(let i=0;i<Math.min(matches.length,precision === 'second'?3:2);i++)result.push({type:types[i],start:matches[i].index!,end:matches[i].index!+matches[i][0].length});
      for(const period of periods){if(!period)continue;const match=new RegExp(escape(period).replace(/\s+/g,'\\s*'),'iu').exec(text);if(match){result.push({type:'dayPeriod',start:match.index,end:match.index+match[0].length});break;}}
      return result.sort((a,b)=>a.start-b.start);
    },
    format(value: string): string { const seconds=timeSeconds(value);return seconds === undefined ? value : formatter.format(new Date(Date.UTC(2000,0,1,0,0,seconds))); },
    parse(text: string): string | undefined {
      if (!text.trim()) return '';
      let value=normalize(text), period: number | undefined;
      for(let i=0;i<periods.length;i++) {const marker=periods[i] && normalize(periods[i]!);if(marker && (value.startsWith(marker) || value.endsWith(marker))) {period=i;value=value.startsWith(marker)?value.slice(marker.length):value.slice(0,-marker.length);break;}}
      for(const separator of separators) if(separator !== ':')value=value.split(separator).join(':');
      const match=/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value);if(!match)return;
      let hour=+match[1];const minute=+match[2],second=+(match[3] || 0);
      if(minute>59 || second>59 || (precision === 'minute' && match[3] !== undefined))return;
      if(period !== undefined){if(hour<1 || hour>12)return;hour=hour%12+period*12;} else if(hour>23)return;
      return timeString(hour*3600+minute*60+second,precision);
    }
  };
}
