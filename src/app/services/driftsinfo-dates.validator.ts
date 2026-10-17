import { AbstractControl, ValidationErrors } from '@angular/forms';

export function driftsinfoDatesValidator(control: AbstractControl): ValidationErrors | null {
  const { publiceres, aftages } = control.value;
  if (!publiceres || !aftages) {
    return null; // Required validators handle missing values.
  }
  return publiceres instanceof Date && aftages instanceof Date &&
    Number.isFinite(publiceres.getTime()) && Number.isFinite(aftages.getTime()) &&
    aftages.getTime() > publiceres.getTime() ? null : { dateRange: true };
}
