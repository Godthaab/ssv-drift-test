import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { combineLatest, from, Observable } from 'rxjs';
import { Driftsinfo, DriftsinfoCategories } from '../model/driftsinfo';
import { concatMap, map, shareReplay } from 'rxjs/operators';
import { convertSnaps } from './db-utils';
@Injectable({
  providedIn: 'root',
})
export class DriftsinfoService {
  private readonly infos$: Observable<DriftsinfoCategories>;

  constructor(private db: AngularFirestore) {
    // Match the published administration app: the stored flag alone selects
    // the tab, including legacy messages with old or reversed date ranges.
    const loadCategory = (visible: boolean) => this.db.collection<Driftsinfo>(
      'driftsinfo', ref => ref.where('vises', '==', visible).orderBy('publiceres', 'desc')
    ).valueChanges({ idField: 'id' });
    this.infos$ = combineLatest([loadCategory(true), loadCategory(false)]).pipe(
      map(([aktuelle, tidligere]) => ({ aktuelle, tidligere })),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  // tslint:disable-next-line:typedef
  sletinfo(infoId: string) {
    return from(this.db.doc(`driftsinfo/${infoId}`).delete());
  }

  opdaterInfo(infoId: string, changes: Partial<Driftsinfo>): Observable<any> {
    return from(this.db.doc(`driftsinfo/${infoId}`).update(changes));
  }

  loadInfo(): Observable<DriftsinfoCategories> {
    return this.infos$;
  }

  // tslint:disable-next-line:typedef
  createCourse(newCourse: Partial<Driftsinfo>, infoId?: string) {
    return this.db
      .collection('driftsinfo', (ref) => ref.orderBy('infoNr', 'desc').limit(1))
      .get()
      .pipe(
        concatMap((result) => {
          const driftsinfos = convertSnaps<Driftsinfo>(result);

          const sidsteInfoNr = driftsinfos[0]?.infoNr ?? 0;

          const driftsinfo = {
            ...newCourse,
            infoNr: sidsteInfoNr + 1,
          };

          let save$: Observable<any>;

          if (infoId) {
            save$ = from(this.db.doc(`driftsinfo/${infoId}`).set(driftsinfo));
          } else {
            save$ = from(this.db.collection('driftsinfo').add(driftsinfo));
          }

          return save$.pipe(
            map((res) => {
              return {
                id: infoId ?? res.id,
                ...driftsinfo,
              };
            })
          );
        })
      );
  }
}
