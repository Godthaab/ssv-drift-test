import { fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Driftsinfo } from '../model/driftsinfo';
import { categorizeDriftsinfos, DriftsinfoCategories, getDriftsinfoStatus, watchDriftsinfo } from './driftsinfo-status';
import { DriftsinfoService } from './driftsinfo.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';

describe('Scheduled driftsinformation (no real Firebase connection)', () => {
  // Explicit Danish summer-time offset: comparisons must use instants, not formatted strings.
  const start = Date.parse('2026-10-16T09:00:00+02:00');
  const end = Date.parse('2026-10-16T12:00:00+02:00');
  const record: Driftsinfo = {
    id: 'test', infoNr: 1, overskrift: 'Ledningsbrud', beskrivelse: 'Test',
    berorte: 'Alle', vises: true,
    publiceres: firebase.firestore.Timestamp.fromMillis(start),
    aftages: firebase.firestore.Timestamp.fromMillis(end),
  };

  it('publishes at the start and takes down at the end, including exact boundaries', () => {
    expect(getDriftsinfoStatus(record, start - 1)).toBe('planlagte');
    expect(getDriftsinfoStatus(record, start)).toBe('aktuelle');
    expect(getDriftsinfoStatus(record, end - 1)).toBe('aktuelle');
    expect(getDriftsinfoStatus(record, end)).toBe('tidligere');
  });

  it('keeps manually hidden messages hidden, even inside the publication period', () => {
    expect(getDriftsinfoStatus({ ...record, vises: false }, start)).toBe('tidligere');
    expect(getDriftsinfoStatus({ ...record, vises: false }, start - 1)).toBe('tidligere');
  });

  it('automatically archives old enabled messages without changing the stored flag', () => {
    const groups = categorizeDriftsinfos([record], end + 1000);
    expect(groups.aktuelle).toEqual([]);
    expect(groups.tidligere).toEqual([record]);
    expect(record.vises).toBeTrue();
  });

  it('does not publish missing, invalid or reversed date ranges', () => {
    expect(getDriftsinfoStatus({ ...record, aftages: null }, start)).toBe('tidligere');
    expect(getDriftsinfoStatus({ ...record, publiceres: null }, start)).toBe('tidligere');
    expect(getDriftsinfoStatus({ ...record, aftages: record.publiceres }, start)).toBe('tidligere');
    expect(getDriftsinfoStatus({ ...record, publiceres: record.aftages, aftages: record.publiceres }, start)).toBe('tidligere');
  });

  it('retains every message in one category and sorts newest publication first', () => {
    const newer = { ...record, id: 'newer', publiceres: firebase.firestore.Timestamp.fromMillis(start + 1000) };
    const hidden = { ...record, id: 'hidden', vises: false };
    const groups = categorizeDriftsinfos([record, hidden, newer], start + 2000);
    expect(groups.aktuelle).toEqual([newer, record]);
    expect(groups.planlagte).toEqual([]);
    expect(groups.tidligere).toEqual([hidden]);
  });

  it('moves messages as time passes with the page open, without any database event', fakeAsync(() => {
    let now = start - 1000;
    spyOn(Date, 'now').and.callFake(() => now);
    const source = new BehaviorSubject([record]);
    let groups: DriftsinfoCategories;
    let emissions = 0;
    const subscription = watchDriftsinfo(source).subscribe(value => { groups = value; emissions++; });
    tick(0);
    expect(groups.planlagte).toEqual([record]);
    now = start;
    tick(1000);
    expect(groups.aktuelle).toEqual([record]);
    tick(1000);
    expect(emissions).toBe(2); // No redraw when neither status nor data changed.
    now = end;
    tick(1000);
    expect(groups.tidligere).toEqual([record]);
    subscription.unsubscribe();
  }));

  it('shares one live listener and updates both tabs after an edit from another session', fakeAsync(() => {
    spyOn(Date, 'now').and.returnValue(start);
    const source = new BehaviorSubject([record]);
    const collection = jasmine.createSpy('collection').and.returnValue({ valueChanges: () => source });
    const service = new DriftsinfoService({ collection } as unknown as AngularFirestore);
    let first: DriftsinfoCategories;
    let second: DriftsinfoCategories;
    const a = service.loadInfo().subscribe(value => first = value);
    const b = service.loadInfo().subscribe(value => second = value);
    tick(0);
    expect(first.aktuelle).toEqual([record]);
    const hidden = { ...record, vises: false };
    source.next([hidden]);
    expect(first.tidligere).toEqual([hidden]);
    expect(first).toBe(second);
    expect(collection).toHaveBeenCalledTimes(1);
    a.unsubscribe();
    b.unsubscribe();
    expect(source.observers.length).toBe(0);
  }));
});
