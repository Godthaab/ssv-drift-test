import { combineLatest, Observable, timer } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { Driftsinfo, DriftsinfoCategories } from '../model/driftsinfo';

type DriftsinfoStatus = keyof DriftsinfoCategories;

function milliseconds(value: Date | { toMillis(): number } | null | undefined): number {
  if (value instanceof Date) {
    return value.getTime();
  }
  return value && typeof value.toMillis === 'function' ? value.toMillis() : NaN;
}

export function isAlwaysVisible(info: Driftsinfo): boolean {
  return info.visAltid === true || (info.visAltid == null && info.vises === true);
}

export function getDriftsinfoStatus(info: Driftsinfo, now: number): DriftsinfoStatus {
  // Preserve old documents until their next edit; new documents use dates and
  // visAltid only. An obsolete vises value must never override the new choice.
  if (info.visAltid == null && typeof info.vises === 'boolean') {
    return info.vises ? 'aktuelle' : 'tidligere';
  }
  if (isAlwaysVisible(info)) {
    return 'aktuelle';
  }
  const start = milliseconds(info.publiceres);
  const end = milliseconds(info.aftages);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || now >= end) {
    return 'tidligere';
  }
  return now < start ? 'planlagte' : 'aktuelle';
}

export function withLegacyVisibility(info: Partial<Driftsinfo>, now = Date.now()): Partial<Driftsinfo> {
  if (typeof info.visAltid !== 'boolean') {
    return info;
  }
  // Text-only partial edits must not guess at a date range they do not contain.
  if (!info.visAltid && (!('publiceres' in info) || !('aftages' in info))) {
    return info;
  }
  // The currently published website still queries vises. Project the current
  // status on explicit saves only; the clock never writes to the live database.
  return { ...info, vises: getDriftsinfoStatus(info as Driftsinfo, now) === 'aktuelle' };
}

export function categorizeDriftsinfos(infos: Driftsinfo[], now: number): DriftsinfoCategories {
  const groups: DriftsinfoCategories = { aktuelle: [], planlagte: [], tidligere: [] };
  // Permanent posts share the date order with all other posts; they are not pinned.
  const sorted = [...infos].sort((a, b) =>
    (milliseconds(b.publiceres) || 0) - (milliseconds(a.publiceres) || 0)
  );
  sorted.forEach(info => groups[getDriftsinfoStatus(info, now)].push(info));
  return groups;
}

export function watchDriftsinfo(infos$: Observable<Driftsinfo[]>): Observable<DriftsinfoCategories> {
  // An open page must take down expired posts without another Firestore event.
  return combineLatest([infos$, timer(0, 1000)]).pipe(
    map(([infos]) => categorizeDriftsinfos(infos, Date.now())),
    distinctUntilChanged((previous, current) =>
      (['aktuelle', 'planlagte', 'tidligere'] as DriftsinfoStatus[]).every(status =>
        previous[status].length === current[status].length &&
        previous[status].every((info, index) => info === current[status][index])
      )
    )
  );
}
