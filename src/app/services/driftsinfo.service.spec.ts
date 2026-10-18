import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Driftsinfo, DriftsinfoCategories } from '../model/driftsinfo';
import { DriftsinfoService } from './driftsinfo.service';

describe('Driftsinformation matching the published administration app', () => {
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
        const filters: Array<(info: Driftsinfo) => boolean> = [];
        let sortField: string;
        let direction: string;
        const ref = {
          where: (field: string, _operator: string, value: boolean) => {
            filters.push(info => info[field] === value);
            return ref;
          },
          orderBy: (field: string, order: string) => {
            sortField = field;
            direction = order;
            return ref;
          },
        };
        query(ref);
        return { valueChanges: () => source.pipe(map(infos => infos
          .filter(info => filters.every(filter => filter(info)) && sortField in info)
          .sort((a, b) => (a[sortField].toMillis() - b[sortField].toMillis()) * (direction === 'desc' ? -1 : 1)))) };
      },
    };
    service = new DriftsinfoService(db as unknown as AngularFirestore);
  });

  it('keeps the two live current messages current despite expired or reversed dates', () => {
    source.next([meters, { ...hardness, id: 'hidden', vises: false }, hardness]);
    let groups: DriftsinfoCategories;
    const subscription = service.loadInfo().subscribe(value => groups = value);
    expect(groups.aktuelle.map(info => info.overskrift)).toEqual(['Vandets hårdhed', 'Elektroniske Vandmålere']);
    expect(groups.tidligere.map(info => info.id)).toEqual(['hidden']);
    subscription.unsubscribe();
  });

  it('uses only the stored boolean flag, including enabled future publications', () => {
    const future = { ...hardness, id: 'future', publiceres: timestamp('2030-01-01T10:00:00+01:00') };
    const missingFlag = { ...hardness, id: 'missing', vises: undefined };
    source.next([hardness, missingFlag, future]);
    const subscription = service.loadInfo().subscribe(groups => {
      expect(groups.aktuelle).toEqual([future, hardness]);
      expect(groups.tidligere).toEqual([]);
      expect(Object.keys(groups).sort()).toEqual(['aktuelle', 'tidligere']);
    });
    subscription.unsubscribe();
  });

  it('shares listeners and moves edited messages between the two tabs', () => {
    source.next([hardness]);
    let first: DriftsinfoCategories;
    let second: DriftsinfoCategories;
    const a = service.loadInfo().subscribe(value => first = value);
    const b = service.loadInfo().subscribe(value => second = value);
    expect(source.observers.length).toBe(2);
    const hidden = { ...hardness, vises: false };
    source.next([hidden]);
    expect(first.aktuelle).toEqual([]);
    expect(first.tidligere).toEqual([hidden]);
    expect(first).toBe(second);
    a.unsubscribe();
    b.unsubscribe();
    expect(source.observers.length).toBe(0);
  });
});
