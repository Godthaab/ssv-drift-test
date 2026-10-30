import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { catchError, concatMap, last, map, take, tap } from 'rxjs/operators';
import { from, Observable, Subscription, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import firebase from 'firebase/compat/app';
import Timestamp = firebase.firestore.Timestamp;
import { DriftsinfoService } from '../services/driftsinfo.service';
import { Driftsinfo } from '../model/driftsinfo';
import { bindDriftsinfoExpiry, driftsinfoDatesValidator } from '../services/driftsinfo-dates.validator';
import * as moment from 'moment';
import { ThemePalette } from '@angular/material/core';

@Component({
  selector: 'app-opret-info',
  templateUrl: './opret-info.component.html',
  styleUrls: ['./opret-info.component.css'],
})
export class OpretInfoComponent implements OnInit, OnDestroy {
  infoId: string;
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

  form = this.fb.group({
    overskrift: ['', Validators.required],
    beskrivelse: ['', Validators.required],
    berorte: ['', Validators.required],
    visAltid: [false],
    publiceres: [null, Validators.required],
    aftages: [null],
  }, { validators: driftsinfoDatesValidator });

  constructor(
    private fb: UntypedFormBuilder,
    private driftsinfoService: DriftsinfoService,
    private afs: AngularFirestore,
    private router: Router
  ) {
    this.expirySubscription = bindDriftsinfoExpiry(this.form);
  }

  ngOnDestroy(): void {
    this.expirySubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.infoId = this.afs.createId();
  }

  // tslint:disable-next-line:typedef
  onOpretInfo() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const val = this.form.getRawValue();

    const nyInfo: Partial<Driftsinfo> = {
      overskrift: val.overskrift,
      beskrivelse: val.beskrivelse,
      publiceres: val.publiceres,
      aftages: val.aftages,
      berorte: val.berorte,
      visAltid: val.visAltid,
    };

    nyInfo.publiceres = Timestamp.fromDate(val.publiceres);
    nyInfo.aftages = val.aftages ? Timestamp.fromDate(val.aftages) : null;
    console.log('nyInfo.aftages: ', nyInfo.aftages);
    this.driftsinfoService
      .createCourse(nyInfo, this.infoId)
      .pipe(
        tap((driftsinfo) => {
          console.log('oprettet en ny information: ', driftsinfo);
          alert('Ny information oprettet!');
          this.router.navigateByUrl('/');
        }),
        catchError((err) => {
          console.log(err);
          alert('Denne information kunne ikke oprettes!');
          return throwError(err);
        })
      )
      // tslint:disable-next-line: deprecation
      .subscribe();
  }
  close(): void {
    this.router.navigateByUrl('/');
  }
}
