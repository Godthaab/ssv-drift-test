import { fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Driftsinfo, DriftsinfoCategories } from '../model/driftsinfo';
import { categorizeDriftsinfos, getDriftsinfoStatus, watchDriftsinfo, withLegacyVisibility } from './driftsinfo-status';

describe('Permanent posts and publication windows', () => {
  const start = Date.parse('2026-10-18T09:00:00+02:00');
  const end = Date.parse('2026-10-18T12:00:00+02:00');
  const timed: Driftsinfo = {
    id: 'timed', infoNr: 1, overskrift: 'Ledningsbrud', beskrivelse: 'Test', berorte: 'Alle',
    visAltid: false,
    publiceres: firebase.firestore.Timestamp.fromMillis(start),
    aftages: firebase.firestore.Timestamp.fromMillis(end),
  };

  it('publishes at the inclusive start and expires at the exclusive end', () => {
    expect(getDriftsinfoStatus(timed, start - 1)).toBe('planlagte');
    expect(getDriftsinfoStatus(timed, start)).toBe('aktuelle');
    expect(getDriftsinfoStatus(timed, end - 1)).toBe('aktuelle');
    expect(getDriftsinfoStatus(timed, end)).toBe('tidligere');
  });

  it('keeps permanent posts current regardless of future dates or absent/reversed expiry', () => {
    const permanent = { ...timed, visAltid: true };
    expect(getDriftsinfoStatus(permanent, start - 1000)).toBe('aktuelle');
    expect(getDriftsinfoStatus(permanent, end + 1000)).toBe('aktuelle');
    expect(getDriftsinfoStatus({ ...permanent, aftages: null }, end)).toBe('aktuelle');
    expect(getDriftsinfoStatus({ ...permanent, publiceres: timed.aftages, aftages: timed.publiceres }, end)).toBe('aktuelle');
  });

  it('ignores the obsolete vises field for posts using the new choice', () => {
    for (const vises of [true, false, undefined]) {
      expect(getDriftsinfoStatus({ ...timed, vises }, start)).toBe('aktuelle');
      expect(getDriftsinfoStatus({ ...timed, vises }, end)).toBe('tidligere');
      expect(getDriftsinfoStatus({ ...timed, vises, visAltid: true }, end)).toBe('aktuelle');
    }
  });

  it('preserves legacy manual visibility without writing a new flag into the record', () => {
    const legacy = { ...timed, visAltid: undefined, vises: true };
    expect(getDriftsinfoStatus(legacy, end + 1000)).toBe('aktuelle');
    expect(getDriftsinfoStatus({ ...legacy, vises: false }, start)).toBe('tidligere');
    expect(legacy.visAltid).toBeUndefined();
  });

  it('uses the date window when neither old nor new visibility fields exist', () => {
    const unmarked = { ...timed, visAltid: undefined };
    expect(getDriftsinfoStatus(unmarked, start)).toBe('aktuelle');
    expect(getDriftsinfoStatus(unmarked, end)).toBe('tidligere');
  });

  it('supplies the old website with the correct visibility at save time', () => {
    expect(withLegacyVisibility(timed, start - 1).vises).toBeFalse();
    expect(withLegacyVisibility(timed, start).vises).toBeTrue();
    expect(withLegacyVisibility(timed, end).vises).toBeFalse();
    expect(withLegacyVisibility({ ...timed, visAltid: true, vises: false }, end).vises).toBeTrue();
    expect(timed.vises).toBeUndefined();
  });

  it('preserves legacy edits and partial edits without guessing missing dates', () => {
    const legacy = { vises: false, beskrivelse: 'Ændret tekst' };
    expect(withLegacyVisibility(legacy, start)).toEqual(legacy);
    const partial = { visAltid: false, beskrivelse: 'Ændret tekst' };
    expect(withLegacyVisibility(partial, start)).toEqual(partial);
  });

  it('never publishes a timed post with an invalid or missing date range', () => {
    expect(getDriftsinfoStatus({ ...timed, aftages: null }, start)).toBe('tidligere');
    expect(getDriftsinfoStatus({ ...timed, publiceres: null }, start)).toBe('tidligere');
    expect(getDriftsinfoStatus({ ...timed, aftages: timed.publiceres }, start)).toBe('tidligere');
    expect(getDriftsinfoStatus({ ...timed, publiceres: timed.aftages, aftages: timed.publiceres }, end)).toBe('tidligere');
  });

  it('sorts permanent and timed posts together by date and never mutates the source order', () => {
    const fixed = { ...timed, id: 'fixed', visAltid: true,
      publiceres: firebase.firestore.Timestamp.fromMillis(start - 1000) };
    const records = [fixed, timed];
    expect(categorizeDriftsinfos(records, start).aktuelle).toEqual([timed, fixed]);
    expect(records).toEqual([fixed, timed]);
  });

  it('updates at both boundaries, ignores unchanged ticks, and reacts to an edit immediately', fakeAsync(() => {
    let now = start - 1000;
    spyOn(Date, 'now').and.callFake(() => now);
    const source = new BehaviorSubject([timed]);
    let groups: DriftsinfoCategories;
    let emissions = 0;
    const subscription = watchDriftsinfo(source).subscribe(value => { groups = value; emissions++; });
    tick(0);
    expect(groups.planlagte).toEqual([timed]);
    now = start;
    tick(1000);
    expect(groups.aktuelle).toEqual([timed]);
    tick(1000);
    expect(emissions).toBe(2);
    now = end;
    tick(1000);
    expect(groups.tidligere).toEqual([timed]);
    const fixed = { ...timed, visAltid: true };
    source.next([fixed]);
    expect(groups.aktuelle).toEqual([fixed]);
    subscription.unsubscribe();
  }));
});
