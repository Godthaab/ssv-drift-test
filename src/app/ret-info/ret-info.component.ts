import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Driftsinfo } from '../model/driftsinfo';
import { driftsinfoDatesValidator } from '../services/driftsinfo-dates.validator';
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
export class RetInfoComponent {
  form: UntypedFormGroup;
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
    const originalStart = driftsinfo.publiceres?.toDate().getTime();
    const originalEnd = driftsinfo.aftages?.toDate().getTime();

    this.form = this.fb.group({
      overskrift: [driftsinfo.overskrift, Validators.required],
      beskrivelse: [driftsinfo.beskrivelse, Validators.required],
      berorte: [driftsinfo.berorte, Validators.required],
      publiceres: [driftsinfo.publiceres?.toDate() ?? null, Validators.required],
      aftages: [driftsinfo.aftages?.toDate() ?? null, Validators.required],
      vises: [driftsinfo.vises],
    }, { validators: form => {
      const { publiceres, aftages } = form.value;
      // Preserve legacy date ranges when only visibility or text is edited.
      const datesUnchanged = publiceres instanceof Date && aftages instanceof Date &&
        publiceres.getTime() === originalStart && aftages.getTime() === originalEnd;
      return datesUnchanged ? null : driftsinfoDatesValidator(form);
    } });
  }

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const changes = {
      ...this.form.value,
      publiceres: firebase.firestore.Timestamp.fromDate(this.form.value.publiceres),
      aftages: firebase.firestore.Timestamp.fromDate(this.form.value.aftages),
    };

    this.driftsinfoService
      .opdaterInfo(this.driftsinfo.id, changes)
      // tslint:disable-next-line: deprecation
      .subscribe(() => {
        this.dialogRef.close(changes);
      });
  }
}
