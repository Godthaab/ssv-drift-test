import { DriftsinfoService } from './../services/driftsinfo.service';
import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Driftsinfo } from '../model/driftsinfo';
import { MatLegacyDialog as MatDialog, MatLegacyDialogConfig as MatDialogConfig } from '@angular/material/legacy-dialog';
import { Router } from '@angular/router';
import { RetInfoComponent } from '../ret-info/ret-info.component';
import 'firebase/compat/firestore';
/* Anvendt datoformat: */
/* 'dd-MM-YYYY h:mm:ss a' */
/* I denne app bruges danske standdard: date:'dd-MM-YYYY h:mm' */

@Component({
  selector: 'app-driftsinfo-list',
  templateUrl: './driftsinfo-list.component.html',
  styleUrls: ['./driftsinfo-list.component.css'],
})
export class DriftsinfoListComponent implements OnInit {
  @Input()
  driftsinfos: Driftsinfo[];

  @Output()
  infoRettet = new EventEmitter();

  @Output()
  infoSlettet = new EventEmitter<Driftsinfo>();

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private driftsinfoService: DriftsinfoService
  ) {}

  // tslint:disable-next-line:typedef
  ngOnInit() {}

  // tslint:disable-next-line:typedef
  RetInfoComponent(driftsinfo: Driftsinfo) {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '640px';
    dialogConfig.maxWidth = 'calc(100vw - 32px)';

    dialogConfig.data = driftsinfo;

    this.dialog
      .open(RetInfoComponent, dialogConfig)
      .afterClosed()
      // tslint:disable-next-line: deprecation
      .subscribe((val) => {
        if (val) {
          this.infoRettet.emit();
        }
      });
  }

  // tslint:disable-next-line:typedef
  vedSletInfo(driftsinfo: Driftsinfo) {
    this.driftsinfoService
      .sletinfo(driftsinfo.id)
      .pipe(
        tap(() => {
          console.log('Informationen er slettet', driftsinfo);
          alert('Informationen er slettet!');
          this.infoSlettet.emit(driftsinfo);
        }),
        catchError((err) => {
          console.log(err);
          alert('Informationen kunne ikke slettes!');
          return throwError(err);
        })
      )
      // tslint:disable-next-line: deprecation
      .subscribe();
  }
  // tslint:disable-next-line:typedef
  getDagsdato() {
    const now = new Date();
    /*   now.setHours(0, 0, 0, 0); // +5 hours for Eastern Time */
    const timestamp = now;
    console.log(
      'now : ' + now + ' timestamp: ' + timestamp + '| date: dd-MM-YYYY h:mm'
    );
  }
}
