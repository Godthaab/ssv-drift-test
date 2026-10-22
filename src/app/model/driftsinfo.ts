import firebase from 'firebase/compat/app';
import Timestamp = firebase.firestore.Timestamp;
export interface Driftsinfo {
  id: string;
  infoNr: number;
  overskrift: string;
  beskrivelse: string;
  berorte: string;
  // Legacy compatibility: computed on saves for clients that still query it.
  vises?: boolean;
  visAltid?: boolean;
  publiceres: Timestamp;
  aftages: Timestamp | null;
  /*  promoStartAt: Timestamp; */
}

export interface DriftsinfoCategories {
  aktuelle: Driftsinfo[];
  planlagte: Driftsinfo[];
  tidligere: Driftsinfo[];
}
