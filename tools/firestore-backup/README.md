# Lokal Firestore-backup

Dette værktøj laver en lokal JSON-backup af Firestore-samlingen `driftsinfo` i Firebase-projektet `petec-login`.

## Første opsætning på Mac

1. Installer Google Cloud CLI, hvis den ikke allerede er installeret: <https://cloud.google.com/sdk/docs/install>
2. Åbn Terminal i projektmappen `ssv-drift` og kør:

   ```sh
   gcloud auth application-default login
   ```

   Log ind med den Google-konto, der har adgang til projektets Firestore. Der gemmes ikke en service account-nøgle i projektet.

3. Installér værktøjets afhængighed én gang:

   ```sh
   npm --prefix tools/firestore-backup install
   ```

## Lav en backup

Kør fra projektmappen:

```sh
npm run backup --prefix tools/firestore-backup
```

En JSON-fil med tidsstempel i dansk lokal tid oprettes i `tools/firestore-backup/backups/`. Mappen er føjet til `.gitignore`, så backupfilerne ikke følger med, når projektet lægges i Git eller udgives.

## Gendan fra en JSON-backup

```sh
npm run restore --prefix tools/firestore-backup -- backups/FILNAVN.json
```

Værktøjet viser projekt og antal dokumenter og kræver, at du skriver `IMPORT petec-login`, før det skriver noget. Dokumenter med samme ID bliver erstattet. Dokumenter, som ikke findes i backupfilen, bliver ikke slettet. Kontrollér derfor backupens dato og indhold før en import.

Backupen indeholder kun dokumenterne i `driftsinfo` (ikke brugerlogin, Firebase-regler eller andre projektindstillinger). Datoer gemmes som ISO-tidspunkter og konverteres tilbage til Firestore-timestamps ved import.
