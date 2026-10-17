import firebase from 'firebase/compat/app';
import Timestamp = firebase.firestore.Timestamp;
export interface Driftsinfo {
  id: string;
  infoNr: number;
  overskrift: string;
  beskrivelse: string;
  berorte: string;
  vises: boolean;
  publiceres: Timestamp;
  aftages: Timestamp;
  /*  promoStartAt: Timestamp; */
}
