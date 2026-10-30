#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');
const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const { applicationDefault, initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp, GeoPoint, DocumentReference } = require('firebase-admin/firestore');

const PROJECT_ID = 'petec-login';
const COLLECTION = 'driftsinfo';
const BACKUP_DIR = path.join(__dirname, 'backups');
const FORMAT = 'ssv-drift-firestore-json';
const FORMAT_VERSION = 1;

function toJsonValue(value) {
  if (value instanceof Timestamp) {
    return { __firestoreType: 'timestamp', value: value.toDate().toISOString() };
  }
  if (value instanceof Date) {
    return { __firestoreType: 'timestamp', value: value.toISOString() };
  }
  if (value instanceof GeoPoint) {
    return { __firestoreType: 'geopoint', latitude: value.latitude, longitude: value.longitude };
  }
  if (value instanceof DocumentReference) {
    return { __firestoreType: 'documentReference', path: value.path };
  }
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toJsonValue(item)]));
  }
  return value;
}

function fromJsonValue(value, db) {
  if (Array.isArray(value)) return value.map((item) => fromJsonValue(item, db));
  if (value && typeof value === 'object') {
    if (value.__firestoreType === 'timestamp') return Timestamp.fromDate(new Date(value.value));
    if (value.__firestoreType === 'geopoint') return new GeoPoint(value.latitude, value.longitude);
    if (value.__firestoreType === 'documentReference') return db.doc(value.path);
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, fromJsonValue(item, db)]));
  }
  return value;
}

function getDb() {
  const app = initializeApp({ projectId: PROJECT_ID, credential: applicationDefault() });
  return getFirestore(app);
}

function timeStampForFilename(date = new Date()) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Copenhagen',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  return parts.replace(/[-: ]/g, '');
}

async function exportBackup() {
  const db = getDb();
  const snapshot = await db.collection(COLLECTION).get();
  const backup = {
    format: FORMAT,
    formatVersion: FORMAT_VERSION,
    projectId: PROJECT_ID,
    collection: COLLECTION,
    exportedAt: new Date().toISOString(),
    documentCount: snapshot.size,
    documents: snapshot.docs.map((doc) => ({ id: doc.id, data: toJsonValue(doc.data()) })),
  };

  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const file = path.join(BACKUP_DIR, `${COLLECTION}-${timeStampForFilename()}.json`);
  await fs.writeFile(file, `${JSON.stringify(backup, null, 2)}\n`, { flag: 'wx' });
  console.log(`Backup færdig: ${file}`);
  console.log(`${snapshot.size} dokument(er) eksporteret fra ${PROJECT_ID}/${COLLECTION}.`);
}

async function importBackup(fileArg) {
  if (!fileArg) throw new Error('Angiv JSON-backupfilen, der skal importeres.');
  const file = path.resolve(fileArg);
  const backup = JSON.parse(await fs.readFile(file, 'utf8'));
  if (backup.format !== FORMAT || backup.formatVersion !== FORMAT_VERSION) {
    throw new Error('Filen er ikke en understøttet ssv-drift-backup.');
  }
  if (backup.projectId !== PROJECT_ID || backup.collection !== COLLECTION) {
    throw new Error(`Backupen tilhører ikke ${PROJECT_ID}/${COLLECTION}; import afbrudt.`);
  }
  if (!Array.isArray(backup.documents) || backup.documentCount !== backup.documents.length) {
    throw new Error('Backupfilens dokumentliste eller antal passer ikke; import afbrudt.');
  }

  console.log(`Klar til at skrive ${backup.documents.length} dokument(er) til ${PROJECT_ID}/${COLLECTION}.`);
  console.log('Dokumenter med samme ID bliver erstattet. Dokumenter, der ikke findes i filen, bliver ikke slettet.');
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const confirmation = await rl.question(`Skriv IMPORT ${PROJECT_ID} for at fortsætte: `);
  rl.close();
  if (confirmation !== `IMPORT ${PROJECT_ID}`) {
    console.log('Import annulleret; databasen blev ikke ændret.');
    return;
  }

  const db = getDb();
  for (let offset = 0; offset < backup.documents.length; offset += 400) {
    const batch = db.batch();
    const portion = backup.documents.slice(offset, offset + 400);
    for (const document of portion) {
      if (!document || typeof document.id !== 'string' || !document.id || !document.data || typeof document.data !== 'object') {
        throw new Error('Backup indeholder et dokument uden gyldigt ID eller data.');
      }
      batch.set(db.collection(COLLECTION).doc(document.id), fromJsonValue(document.data, db));
    }
    await batch.commit();
  }
  console.log(`Import færdig: ${backup.documents.length} dokument(er) skrevet.`);
}

async function main() {
  const [command, file] = process.argv.slice(2);
  if (command === 'export') return exportBackup();
  if (command === 'import') return importBackup(file);
  console.log('Brug:');
  console.log('  npm run backup');
  console.log('  npm run restore -- backups/filnavn.json');
}

main().catch((error) => {
  console.error(`Fejl: ${error.message}`);
  process.exitCode = 1;
});
