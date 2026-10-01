import assert from 'node:assert/strict';
import test from 'node:test';
import { calendarAdapter } from '../../../dist/internal/calendar-adapter.js';

const iso = value => ({ year: Number(value.slice(0, 4)), month: Number(value.slice(5, 7)), day: Number(value.slice(8, 10)) });

test('Gregorian and modern Buddhist fields round-trip without local time or formatted-string parsing', () => {
  for (const id of ['gregory', 'buddhist']) {
    const adapter = calendarAdapter(id, 'th-TH');
    const fixtures = ['1941-01-01', '2000-02-29', '2024-02-29', '2025-12-31', '2100-02-28', '9999-12-31'];
    if (id === 'gregory') fixtures.push('0001-01-01', '0099-12-31', '1900-02-28');
    for (const value of fixtures) {
      const date = iso(value), fields = adapter.toFields(date);
      assert.equal(fields.year, date.year + (id === 'buddhist' ? 543 : 0));
      assert.equal(fields.era, id === 'buddhist' ? 'be' : 'ce');
      assert.deepEqual(adapter.fromFields(fields), date);
    }
  }
});

test('calendar arithmetic constrains month ends and preserves Gregorian leap and century rules', () => {
  const adapter = calendarAdapter('buddhist');
  assert.deepEqual(adapter.addMonths(iso('2024-01-31'), 1), iso('2024-02-29'));
  assert.deepEqual(adapter.addMonths(iso('2024-02-29'), 12), iso('2025-02-28'));
  assert.deepEqual(adapter.addMonths(iso('2099-02-28'), 12), iso('2100-02-28'));
  assert.deepEqual(adapter.addDays(iso('2000-02-28'), 1), iso('2000-02-29'));
  assert.deepEqual(adapter.addDays(iso('2100-02-28'), 1), iso('2100-03-01'));
  assert.equal(adapter.daysInMonth(adapter.toFields(iso('2024-02-01'))), 29);
});

test('private adapter rejects invalid fields and dates outside its declared interval', () => {
  const adapter = calendarAdapter('buddhist');
  const fields = adapter.toFields(iso('2024-02-29'));
  for (const change of [{ year: 2483 }, { year: 2567.1 }, { monthCode: 'M13' }, { monthCode: 'M2' }, { era: 'ce' }, { calendar: 'gregory' }, { day: 30 }]) {
    assert.throws(() => adapter.fromFields({ ...fields, ...change }), RangeError);
  }
  assert.throws(() => adapter.toFields(iso('1940-12-31')), RangeError);
  assert.throws(() => adapter.addMonths(iso('1941-01-31'), -1), RangeError);
  assert.throws(() => adapter.addDays(iso('1941-01-01'), -1), RangeError);
  assert.throws(() => adapter.addDays(iso('9999-12-31'), 1), RangeError);
  assert.throws(() => adapter.addMonths(iso('9999-12-31'), 1), RangeError);
  assert.equal(adapter.dayIdentity(iso('2024-03-01')) - adapter.dayIdentity(iso('2024-02-28')), 2);
  assert.throws(() => calendarAdapter('hebrew'), RangeError);
});

test('six-week grids exclude unsupported days, retain ISO identity and respect reversed bounds', () => {
  const adapter = calendarAdapter('buddhist');
  const days = adapter.grid(iso('1941-01-01'), { firstDayOfWeek: 0 });
  assert.equal(days.length, 42);
  assert.ok(days.filter(day => day.date).every(day => day.value >= '1941-01-01'));
  assert.equal(days.filter(day => day.inMonth).length, 31);
  const reversed = adapter.grid(iso('2024-02-01'), { min: '2024-02-20', max: '2024-02-10' });
  assert.ok(reversed.every(day => day.disabled));
});

test('Intl capability is checked explicitly, with Thai era and numeral fixtures', () => {
  const thai = calendarAdapter('buddhist', 'th-TH');
  assert.equal(thai.format(iso('2024-02-29'), { year: 'numeric' }).includes('2567'), true);
  const numerals = calendarAdapter('buddhist', 'th-TH-u-nu-thai');
  assert.match(numerals.format(iso('2024-02-29'), { year: 'numeric', era: 'short' }), /๒๕๖๗/);
  const original = Intl.DateTimeFormat.prototype.resolvedOptions;
  try {
    Intl.DateTimeFormat.prototype.resolvedOptions = function () { return { ...original.call(this), calendar: 'gregory' }; };
    assert.throws(() => calendarAdapter('buddhist'), /unavailable/);
  } finally { Intl.DateTimeFormat.prototype.resolvedOptions = original; }
});
