import { combineLatest, Observable, timer } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { Driftsinfo } from '../model/driftsinfo';

export type DriftsinfoStatus = 'aktuelle' | 'planlagte' | 'tidligere';

export interface DriftsinfoCategories {
  aktuelle: Driftsinfo[];
  planlagte: Driftsinfo[];
  tidligere: Driftsinfo[];
}

// Firestore stores absolute instants. Date also supports local form values.
function milliseconds(value: Date | { toMillis(): number } | null | undefined): number {
  if (value instanceof Date) {
    return value.getTime();
  }
  return value && typeof value.toMillis === 'function' ? value.toMillis() : NaN;
}

export function getDriftsinfoStatus(info: Driftsinfo, now: number): DriftsinfoStatus {
  const start = milliseconds(info.publiceres);
  const end = milliseconds(info.aftages);

  // Missing or invalid dates must never make a message visible indefinitely.
  if (info.vises !== true || !Number.isFinite(start) || !Number.isFinite(end) || end <= start || now >= end) {
    return 'tidligere';
  }
  return now < start ? 'planlagte' : 'aktuelle';
}

export function categorizeDriftsinfos(infos: Driftsinfo[], now: number): DriftsinfoCategories {
  const result: DriftsinfoCategories = { aktuelle: [], planlagte: [], tidligere: [] };
  const sorted = [...infos].sort((a, b) =>
    (milliseconds(b.publiceres) || 0) - (milliseconds(a.publiceres) || 0)
  );
  sorted.forEach(info => result[getDriftsinfoStatus(info, now)].push(info));
  return result;
}

export function watchDriftsinfo(infos$: Observable<Driftsinfo[]>): Observable<DriftsinfoCategories> {
  // Recheck time even if Firestore has not changed; no database writes are needed.
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
