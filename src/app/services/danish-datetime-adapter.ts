import { Inject, Injectable } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import {
  NgxMatNativeDateAdapter, NgxMatDateFormats, NGX_MAT_NATIVE_DATE_FORMATS,
} from '@angular-material-components/datetime-picker';

const DATE_INPUT = 'danish-date-time';

export const DANISH_DATETIME_FORMATS: NgxMatDateFormats = {
  parse: { dateInput: DATE_INPUT },
  display: { ...NGX_MAT_NATIVE_DATE_FORMATS.display, dateInput: DATE_INPUT },
};

@Injectable()
export class DanishDatetimeAdapter extends NgxMatNativeDateAdapter {
  constructor(@Inject(MAT_DATE_LOCALE) locale: string, platform: Platform) {
    super(locale, platform);
  }

  getFirstDayOfWeek(): number { return 1; }

  parse(value: any): Date | null {
    if (value instanceof Date) { return this.clone(value); }
    if (typeof value !== 'string') { return super.parse(value); }
    if (!value.trim()) { return null; }

    // Native Date.parse ignores the locale and can swap Danish days and months.
    const match = value.trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:[\s,]+(\d{1,2})[:.](\d{2})(?::(\d{2}))?)?$/);
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

  format(date: Date, displayFormat: any): string {
    if (displayFormat !== DATE_INPUT || !this.isValid(date)) {
      return super.format(date, displayFormat);
    }
    const twoDigits = (value: number) => String(value).padStart(2, '0');
    return `${twoDigits(date.getDate())}-${twoDigits(date.getMonth() + 1)}-${date.getFullYear()} ` +
      `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`;
  }
}
