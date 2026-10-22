import { AbstractControl, UntypedFormGroup, ValidationErrors } from '@angular/forms';
import { Subscription } from 'rxjs';

export function bindDriftsinfoExpiry(form: UntypedFormGroup): Subscription {
  const update = (always: boolean) => {
    const expiry = form.get('aftages');
    // Disabled controls cannot retain irrelevant date-picker validation errors.
    if (always) {
      expiry.disable({ emitEvent: false });
    } else {
      expiry.enable({ emitEvent: false });
    }
  };
  update(form.get('visAltid').value);
  return form.get('visAltid').valueChanges.subscribe(update);
}

export function driftsinfoDatesValidator(control: AbstractControl): ValidationErrors | null {
  const { publiceres, aftages, visAltid } = control.value;
  if (visAltid === true) {
    return null; // Permanent posts need a sort date, but no expiry date.
  }
  if (!aftages) {
    return { endRequired: true };
  }
  if (!publiceres) {
    return null; // The publication field's required validator handles this.
  }
  return publiceres instanceof Date && aftages instanceof Date &&
    Number.isFinite(publiceres.getTime()) && Number.isFinite(aftages.getTime()) &&
    aftages.getTime() > publiceres.getTime() ? null : { dateRange: true };
}
