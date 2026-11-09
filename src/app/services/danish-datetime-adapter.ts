import { Inject, Injectable, Optional } from '@angular/core';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MtxDatetimeFormats, MTX_NATIVE_DATETIME_FORMATS, NativeDatetimeAdapter } from '@ng-matero/extensions/core';

const DATE_INPUT = 'danish-date-time';

export const DANISH_DATETIME_FORMATS: MtxDatetimeFormats = {
  parse: { dateInput: DATE_INPUT, datetimeInput: DATE_INPUT },
  display: {
    ...MTX_NATIVE_DATETIME_FORMATS.display,
    dateInput: DATE_INPUT,
    datetimeInput: DATE_INPUT,
  },
};

@Injectable()
export class DanishDatetimeAdapter extends NativeDatetimeAdapter {
  constructor(@Optional() @Inject(MAT_DATE_LOCALE) locale: string | null = 'da-DK') {
    super();
    this.setLocale(locale || 'da-DK');
  }

  override getFirstDayOfWeek(): number { return 1; }

  override parse(value: any, _parseFormat?: any): Date | null {
    if (value instanceof Date) { return this.clone(value); }
    if (typeof value !== 'string') { return super.parse(value, _parseFormat); }
    if (!value.trim()) { return null; }

    // Native Date.parse ignores the locale and can swap Danish days and months.
    const match = value.trim().match(/^([0-9]{1,2})[-/.]([0-9]{1,2})[-/.]([0-9]{4})(?:[\s,]+([0-9]{1,2})[:.]([0-9]{2})(?::([0-9]{2}))?)?$/);
    if (!match) { return this.invalid(); }
    const [, day, month, year, hour = '0', minute = '0', second = '0'] = match;
    const date = new Date(0);
    date.setFullYear(+year, +month - 1, +day);
    date.setHours(+hour, +minute, +second, 0);
    const valid = date.getFullYear() === +year && date.getMonth() === +month - 1 &&
      date.getDate() === +day && date.getHours() === +hour &&
      date.getMinutes() === +minute && date.getSeconds() === +second;
    return valid ? date : this.invalid();
  }

  override format(date: Date, displayFormat: any): string {
    if (displayFormat !== DATE_INPUT || !this.isValid(date)) {
      return super.format(date, displayFormat);
    }
    const twoDigits = (value: number) => String(value).padStart(2, '0');
    return `${twoDigits(date.getDate())}-${twoDigits(date.getMonth() + 1)}-${date.getFullYear()} ` +
      `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`;
  }
}
