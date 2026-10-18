import { Platform } from '@angular/cdk/platform';
import { DanishDatetimeAdapter, DANISH_DATETIME_FORMATS } from './danish-datetime-adapter';

describe('Danish date and time input', () => {
  const adapter = new DanishDatetimeAdapter('da-DK', new Platform('browser'));

  it('shows and parses the same local time with day before month', () => {
    const date = new Date(2026, 9, 4, 14, 35);
    const text = adapter.format(date, DANISH_DATETIME_FORMATS.display.dateInput);
    expect(text).toBe('04-10-2026 14:35');
    expect(adapter.parse(text)).toEqual(date);
    expect(adapter.parse('4.10.2026 14:35')).toEqual(date);
  });

  it('rejects impossible dates and times instead of silently overflowing', () => {
    for (const text of ['31-02-2026 10:00', '17-10-2026 24:00', '17-10-2026 12:60']) {
      expect(adapter.isValid(adapter.parse(text))).toBeFalse();
    }
    expect(adapter.parse('29-02-2024 08:00')).toEqual(new Date(2024, 1, 29, 8));
    expect(adapter.parse('')).toBeNull();
  });

  it('uses Danish month names and a week starting on Monday', () => {
    expect(adapter.getMonthNames('long')[9]).toBe('oktober');
    expect(adapter.getFirstDayOfWeek()).toBe(1);
  });
});
