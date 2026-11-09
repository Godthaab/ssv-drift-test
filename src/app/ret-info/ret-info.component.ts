import { Component, Inject, OnDestroy, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Driftsinfo } from '../model/driftsinfo';
import { bindDriftsinfoExpiry, driftsinfoDatesValidator } from '../services/driftsinfo-dates.validator';
import { Subscription } from 'rxjs';
import { isAlwaysVisible } from '../services/driftsinfo-status';
import { DriftsinfoService } from '../services/driftsinfo.service';
import * as moment from 'moment';
import { ThemePalette } from '@angular/material/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

@Component({
  selector: 'app-ret-info',
  templateUrl: './ret-info.component.html',
  styleUrls: ['./ret-info.component.css'],
})
export class RetInfoComponent implements OnDestroy {
  form: UntypedFormGroup;
  private readonly expirySubscription: Subscription;
  /* For indsættelse af Dato */
  @ViewChild('picker') picker: any;
  public pubLokaltid = `formGroup.get('publiceres').value?.toLocaleString()`;
  public aftagesLokaltid = `formGroup.get('aftages').value?.toLocaleString()`;

  public date: moment.Moment;
  public disabled = false;
  public showSpinners = true;
  public showSeconds = false;
  public touchUi = false;
  public enableMeridian = false;
  public minDate: moment.Moment;
  public maxDate: moment.Moment;
  public stepHour = 1;
  public stepMinute = 5;
  public stepSecond = 1;
  public color: ThemePalette = 'primary';
  driftsinfo: Driftsinfo;

  constructor(
    private dialogRef: MatDialogRef<RetInfoComponent>,
    private fb: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) driftsinfo: Driftsinfo,
    private driftsinfoService: DriftsinfoService
  ) {
    this.driftsinfo = driftsinfo;

    this.form = this.fb.group({
      overskrift: [driftsinfo.overskrift, Validators.required],
      beskrivelse: [driftsinfo.beskrivelse, Validators.required],
      berorte: [driftsinfo.berorte, Validators.required],
      publiceres: [driftsinfo.publiceres?.toDate() ?? null, Validators.required],
      aftages: [driftsinfo.aftages?.toDate() ?? null],
      visAltid: [isAlwaysVisible(driftsinfo)],
    }, { validators: driftsinfoDatesValidator });
    this.expirySubscription = bindDriftsinfoExpiry(this.form);
  }

  ngOnDestroy(): void {
    this.expirySubscription.unsubscribe();
  }

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const changes = {
      ...value,
      publiceres: firebase.firestore.Timestamp.fromDate(value.publiceres),
      aftages: value.aftages ? firebase.firestore.Timestamp.fromDate(value.aftages) : null,
    };

    this.driftsinfoService
      .opdaterInfo(this.driftsinfo.id, changes)
      // tslint:disable-next-line: deprecation
      .subscribe(() => {
        this.dialogRef.close(changes);
      });
  }
}
