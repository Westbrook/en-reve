import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import {
  addDays, addMonths, clampDate, compareDates, dateInRange, dateOnStep, daysInMonth,
  formatDate, localizedDate, monthGrid, monthInRange, parseDate, weekdayLabels,
} from '../dist/interactions/calendar.js';

const date = (value) => {
  const result = parseDate(value);
  assert.ok(result, `Test date ${value} must parse`);
  return result;
};

test('ISO parsing rejects normalized dates and supports the complete agreed year range', () => {
  for (const value of ['0001-01-01', '0099-12-31', '2000-02-29', '2024-02-29', '9999-12-31']) {
    assert.equal(formatDate(date(value)), value);
  }
  for (const value of ['', '0000-01-01', '10000-01-01', '2025-02-29', '1900-02-29', '2024-04-31',
    '2024-00-01', '2024-13-01', '2024-01-00', '2024-1-01', '2024-01-1', '2024-01-01T00:00:00Z', ' 2024-01-01']) {
    assert.equal(parseDate(value), undefined, value);
  }
  assert.equal(daysInMonth(2000, 2), 29);
  assert.equal(daysInMonth(1900, 2), 28);
  assert.equal(daysInMonth(2024, 4), 30);
  assert.throws(() => formatDate({ year: 2024, month: 2, day: 30 }), RangeError);
  assert.throws(() => daysInMonth(2024, 0), RangeError);
});

test('day arithmetic crosses leap days, centuries, and year limits without 1900 coercion', () => {
  assert.equal(formatDate(addDays(date('0099-12-31'), 1)), '0100-01-01');
  assert.equal(formatDate(addDays(date('2024-02-28'), 1)), '2024-02-29');
  assert.equal(formatDate(addDays(date('1900-02-28'), 1)), '1900-03-01');
  assert.equal(formatDate(addDays(date('2000-03-01'), -1)), '2000-02-29');
  assert.equal(formatDate(addDays(date('0001-01-01'), -1)), '0001-01-01');
  assert.equal(formatDate(addDays(date('9999-12-31'), 1)), '9999-12-31');
  assert.equal(formatDate(addDays(date('2024-01-01'), Number.MAX_SAFE_INTEGER)), '9999-12-31');
  for (const delta of [NaN, Infinity, 0.5]) assert.throws(() => addDays(date('2024-01-01'), delta), RangeError);
  assert.equal(compareDates(date('0099-01-01'), date('0100-01-01')), -1);
});

test('month navigation clamps the day while preserving the supplied date object', () => {
  const initial = Object.freeze(date('2024-01-31'));
  assert.equal(formatDate(addMonths(initial, 1)), '2024-02-29');
  assert.equal(formatDate(addMonths(date('2025-01-31'), 1)), '2025-02-28');
  assert.equal(formatDate(addMonths(date('2024-01-31'), -1)), '2023-12-31');
  assert.equal(formatDate(addMonths(date('2024-02-29'), 12)), '2025-02-28');
  assert.equal(formatDate(addMonths(date('0001-01-31'), -1)), '0001-01-31');
  assert.equal(formatDate(initial), '2024-01-31');
});

test('42-cell grids maintain weekday columns and unambiguous adjacent-month values', () => {
  const sunday = monthGrid(date('2024-09-15'));
  assert.equal(sunday.length, 42);
  assert.equal(sunday[0].value, '2024-09-01');
  assert.equal(sunday.at(-1).value, '2024-10-12');
  assert.equal(sunday.filter((cell) => cell.inMonth).length, 30);
  const monday = monthGrid(date('2024-09-15'), { firstDayOfWeek: 1 });
  assert.equal(monday[0].value, '2024-08-26');
  assert.equal(monday[6].value, '2024-09-01');
  for (let i = 1; i < monday.length; i++) {
    assert.equal(formatDate(addDays(monday[i - 1].date, 1)), monday[i].value);
  }
  assert.equal(new Set(monday.map((cell) => cell.value)).size, 42);
  for (const firstDayOfWeek of [-1, 7, 0.5]) assert.throws(() => monthGrid(date('2024-01-01'), { firstDayOfWeek }), RangeError);
});

test('unsupported grid dates remain disabled blanks rather than duplicate boundary dates', () => {
  const first = monthGrid(date('0001-01-01'));
  assert.deepEqual(first[0], { date: undefined, value: '', inMonth: false, disabled: true });
  assert.equal(first[1].value, '0001-01-01');
  const last = monthGrid(date('9999-12-01'));
  assert.equal(last.length, 42);
  assert.equal(last.filter((cell) => cell.value === '9999-12-31').length, 1);
  assert.ok(last.at(-1).disabled);
  assert.equal(last.at(-1).date, undefined);
});

test('inclusive bounds constrain days and month navigation; malformed bounds are ignored', () => {
  const min = '2024-02-10';
  const max = '2024-03-05';
  assert.ok(dateInRange(date(min), min, max));
  assert.ok(dateInRange(date(max), min, max));
  assert.equal(dateInRange(date('2024-02-09'), min, max), false);
  assert.ok(monthInRange(date('2024-02-01'), min, max));
  assert.ok(monthInRange(date('2024-03-31'), min, max));
  assert.equal(monthInRange(date('2024-01-31'), min, max), false);
  assert.equal(monthInRange(date('2024-04-01'), min, max), false);
  assert.equal(formatDate(clampDate(date('2024-01-01'), min, max)), min);
  assert.equal(formatDate(clampDate(date('2024-04-01'), min, max)), max);
  assert.equal(clampDate(date('2024-02-20'), max, min), undefined);
  assert.equal(monthInRange(date('2024-02-20'), max, min), false);
  assert.ok(dateInRange(date('2024-02-09'), 'not-a-date', '2024-02-30'));
  const grid = monthGrid(date('2024-02-01'), { min, max });
  assert.equal(grid.find((cell) => cell.value === '2024-02-09').disabled, true);
  assert.equal(grid.find((cell) => cell.value === min).disabled, false);
  assert.ok(monthGrid(date('2024-02-01'), { min: max, max: min }).every((cell) => cell.disabled));
});

test('date steps use whole-day distance, explicit bases, and tolerant fractional multiples', () => {
  assert.ok(dateOnStep(date('1970-01-01'), 2));
  assert.equal(dateOnStep(date('1970-01-02'), 2), false);
  assert.ok(dateOnStep(date('1970-01-03'), 2));
  assert.ok(dateOnStep(date('1969-12-30'), 2));
  assert.equal(dateOnStep(date('1969-12-31'), 2), false);
  assert.ok(dateOnStep(date('2024-03-01'), 2, '2024-02-28'));
  assert.equal(dateOnStep(date('2024-02-29'), 2, '2024-02-28'), false);
  for (const step of [0.3, 1.5]) {
    assert.ok(dateOnStep(date('1970-01-04'), step));
    assert.ok(dateOnStep(date('1969-12-29'), step));
    assert.equal(dateOnStep(date('1970-01-02'), step), false);
  }
  assert.ok(dateOnStep(date('1970-01-02'), 0.1));
  assert.ok(dateOnStep(date('1970-01-02'), 0.5));
  assert.ok(dateOnStep(date('1970-01-06'), 2.5));
  assert.equal(dateOnStep(date('1970-01-04'), 2.5), false);
  for (const step of [NaN, Infinity, -1, 0]) assert.ok(dateOnStep(date('1970-01-02'), step));
  assert.equal(dateOnStep(date('1970-01-02'), 2, 'invalid-base'), false);
});

test('localization uses Gregorian date semantics even for other locale calendar extensions', () => {
  assert.equal(localizedDate(date('2024-02-29'), 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 'February 29, 2024');
  assert.equal(localizedDate(date('2024-02-29'), 'en-US-u-ca-buddhist', { year: 'numeric' }), '2024');
  assert.deepEqual(weekdayLabels('en-US', 1).map((day) => day.long), ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
  assert.equal(weekdayLabels('fr-FR', 0)[0].long, 'dimanche');
});

test('calendar results are identical across DST and date-line process time zones', () => {
  const moduleUrl = new URL('../dist/interactions/calendar.js', import.meta.url).href;
  const script = `import {addDays,formatDate,localizedDate,monthGrid,parseDate} from ${JSON.stringify(moduleUrl)};
    console.log(JSON.stringify(['2024-03-10','2024-11-03','2011-12-30','0099-12-31'].map(value=>{
      const date=parseDate(value);return [formatDate(addDays(date,1)),localizedDate(date,'en-US'),monthGrid(date).map(cell=>cell.value)];
    })));`;
  const results = ['UTC', 'America/New_York', 'Pacific/Apia', 'Asia/Tokyo'].map((TZ) =>
    execFileSync(process.execPath, ['--input-type=module', '-e', script], { env: { ...process.env, TZ }, encoding: 'utf8' }));
  for (const result of results) assert.equal(result, results[0]);
});
