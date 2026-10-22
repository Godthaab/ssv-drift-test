import { AngularFirestore } from '@angular/fire/compat/firestore';
import { fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Driftsinfo, DriftsinfoCategories } from '../model/driftsinfo';
import { DriftsinfoService } from './driftsinfo.service';

describe('Permanent and scheduled posts in the administration', () => {
  const timestamp = (date: string) => firebase.firestore.Timestamp.fromDate(new Date(date));
  const hardness: Driftsinfo = {
    id: 'hardness', infoNr: 2, overskrift: 'Vandets hårdhed', beskrivelse: 'Test', berorte: 'Alle',
    vises: true, publiceres: timestamp('2025-10-08T08:25:00+02:00'),
    aftages: timestamp('2024-09-24T09:17:00+02:00'),
  };
  const meters: Driftsinfo = {
    ...hardness, id: 'meters', infoNr: 1, overskrift: 'Elektroniske Vandmålere',
    publiceres: timestamp('2021-09-28T09:34:00+02:00'),
    aftages: timestamp('2021-09-28T09:40:00+02:00'),
  };
  let source: BehaviorSubject<Driftsinfo[]>;
  let service: DriftsinfoService;

  beforeEach(() => {
    source = new BehaviorSubject<Driftsinfo[]>([]);
    // Execute the configured queries against local records; no Firebase connection.
    const db = {
      collection: (_name: string, query: (ref: any) => any) => {
        let sortField: string;
        let direction: string;
        const ref = {
          orderBy: (field: string, order: string) => {
            sortField = field;
            direction = order;
            return ref;
          },
        };
        query(ref);
        return { valueChanges: () => source.pipe(map(infos => infos
          .filter(info => sortField in info)
          .sort((a, b) => (a[sortField].toMillis() - b[sortField].toMillis()) * (direction === 'desc' ? -1 : 1)))) };
      },
    };
    service = new DriftsinfoService(db as unknown as AngularFirestore);
  });

  it('keeps legacy posts current despite expired or reversed dates', fakeAsync(() => {
    source.next([meters, { ...hardness, id: 'hidden', vises: false }, hardness]);
    let groups: DriftsinfoCategories;
    const subscription = service.loadInfo().subscribe(value => groups = value);
    tick(0);
    expect(groups.aktuelle.map(info => info.overskrift)).toEqual(['Vandets hårdhed', 'Elektroniske Vandmålere']);
    expect(groups.tidligere.map(info => info.id)).toEqual(['hidden']);
    subscription.unsubscribe();
  }));

  it('loads new posts without vises while preserving unedited legacy posts', fakeAsync(() => {
    spyOn(Date, 'now').and.returnValue(Date.parse('2026-10-19T10:00:00+02:00'));
    const future = { ...hardness, id: 'future', publiceres: timestamp('2030-01-01T10:00:00+01:00') };
    const missingFlag = { ...hardness, id: 'new', vises: undefined, visAltid: false,
      publiceres: timestamp('2026-10-19T09:00:00+02:00'), aftages: timestamp('2026-10-19T12:00:00+02:00') };
    source.next([hardness, missingFlag, future]);
    let groups: DriftsinfoCategories;
    const subscription = service.loadInfo().subscribe(value => groups = value);
    tick(0);
    expect(groups.aktuelle).toEqual([future, missingFlag, hardness]);
    expect(groups.tidligere).toEqual([]);
    expect(groups.planlagte).toEqual([]);
    expect(hardness.visAltid).toBeUndefined();
    subscription.unsubscribe();
  }));

  it('shares listeners and moves edited messages between the tabs', fakeAsync(() => {
    source.next([hardness]);
    let first: DriftsinfoCategories;
    let second: DriftsinfoCategories;
    const a = service.loadInfo().subscribe(value => first = value);
    const b = service.loadInfo().subscribe(value => second = value);
    tick(0);
    expect(source.observers.length).toBe(1);
    const hidden = { ...hardness, vises: false };
    source.next([hidden]);
    expect(first.aktuelle).toEqual([]);
    expect(first.tidligere).toEqual([hidden]);
    expect(first).toBe(second);
    a.unsubscribe();
    b.unsubscribe();
    expect(source.observers.length).toBe(0);
  }));

  it('schedules an explicitly timed post and expires it while the overview is open', fakeAsync(() => {
    const start = timestamp('2026-10-18T10:00:00+02:00');
    const end = timestamp('2026-10-18T12:00:00+02:00');
    let now = start.toMillis() - 1000;
    spyOn(Date, 'now').and.callFake(() => now);
    const timed = { ...hardness, id: 'timed', vises: undefined, visAltid: false, publiceres: start, aftages: end };
    source.next([hardness, timed]);
    let groups: DriftsinfoCategories;
    const subscription = service.loadInfo().subscribe(value => groups = value);
    tick(0);
    expect(groups.aktuelle).toEqual([hardness]);
    expect(groups.planlagte).toEqual([timed]);
    now = start.toMillis();
    tick(1000);
    expect(groups.aktuelle).toEqual([timed, hardness]);
    now = end.toMillis();
    tick(1000);
    expect(groups.aktuelle).toEqual([hardness]);
    expect(groups.tidligere).toEqual([timed]);
    subscription.unsubscribe();
  }));
});
