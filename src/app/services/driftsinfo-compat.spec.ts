import { AngularFirestore } from '@angular/fire/compat/firestore';
import { of } from 'rxjs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Driftsinfo } from '../model/driftsinfo';
import { DriftsinfoService } from './driftsinfo.service';

// Exercise the real save methods, with all Firestore reads/writes stubbed.
describe('Saving posts for the currently published website', () => {
  const start = Date.parse('2026-10-19T13:00:00+02:00');
  const end = Date.parse('2026-10-19T14:00:00+02:00');
  const timed: Partial<Driftsinfo> = {
    overskrift: 'Test', beskrivelse: 'Test', berorte: 'Alle', visAltid: false,
    publiceres: firebase.firestore.Timestamp.fromMillis(start),
    aftages: firebase.firestore.Timestamp.fromMillis(end),
  };
  let service: DriftsinfoService;
  let set: jasmine.Spy;
  let add: jasmine.Spy;
  let update: jasmine.Spy;
  let now: number;

  beforeEach(() => {
    now = start;
    spyOn(Date, 'now').and.callFake(() => now);
    set = jasmine.createSpy('set').and.returnValue(Promise.resolve());
    add = jasmine.createSpy('add').and.returnValue(Promise.resolve({ id: 'generated' }));
    update = jasmine.createSpy('update').and.returnValue(Promise.resolve());
    const db = {
      collection: () => ({
        valueChanges: () => of([]),
        get: () => of({ docs: [{ id: 'last', data: () => ({ infoNr: 4 }) }] }),
        add,
      }),
      doc: () => ({ set, update }),
    };
    service = new DriftsinfoService(db as unknown as AngularFirestore);
  });

  it('includes the field used by the old live query when creating an active post', async () => {
    const result = await service.createCourse(timed, 'chosen-id').toPromise();
    const saved = set.calls.mostRecent().args[0];
    expect(saved.visAltid).toBeFalse();
    expect(saved.vises).toBeTrue();
    expect(saved.infoNr).toBe(5);
    expect(result.id).toBe('chosen-id');
    expect(timed.vises).toBeUndefined();
  });

  it('also projects visibility for generated IDs, including future and fixed posts', async () => {
    now = start - 1000;
    await service.createCourse(timed).toPromise();
    expect(add.calls.mostRecent().args[0].vises).toBeFalse();
    const result = await service.createCourse({ ...timed, visAltid: true, aftages: null }).toPromise();
    expect(add.calls.mostRecent().args[0].vises).toBeTrue();
    expect(result.id).toBe('generated');
  });

  it('refreshes the old live field on an explicit edit, including after expiry', async () => {
    now = end;
    await service.opdaterInfo('existing', { ...timed, vises: true }).toPromise();
    expect(update.calls.mostRecent().args[0].vises).toBeFalse();
    await service.opdaterInfo('existing', { ...timed, vises: false, visAltid: true }).toPromise();
    expect(update.calls.mostRecent().args[0].vises).toBeTrue();
  });
});
