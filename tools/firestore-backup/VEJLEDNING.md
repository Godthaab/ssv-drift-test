# Vejledning: Lav en lokal backup af driftsinformationerne

Denne vejledning bruges, når du vil gemme en ny backup før ændringer i projektet.

## Lav en ny backup

1. Åbn **Terminal** på din Mac.
2. Gå til projektmappen. Hvis Terminal allerede står i `ssv-drift`, kan du gå videre til trin 3. Ellers skriv:

   ```sh
   cd /Users/bo/Developer/Angular/ssv-drift
   ```

3. Kør backupkommandoen:

   ```sh
   npm run backup --prefix tools/firestore-backup
   ```

4. Vent på beskeden `Backup færdig`. Den viser filens placering og hvor mange dokumenter der blev gemt.

## Find backupfilen

Backupfilen gemmes her:

```text
ssv-drift/tools/firestore-backup/backups/
```

Hver kørsel opretter en ny JSON-fil med dato og klokkeslæt i dansk lokal tid, for eksempel:

```text
driftsinfo-20261030094747.json
```

Behold gerne flere backupfiler. Mappen er udelukket fra Git, så filerne ikke følger med, når projektet udgives.

## Første opsætning og login

Google Cloud CLI og Firebase-login er allerede sat op på denne Mac. Hvis værktøjet senere beder om login, eller du bruger en anden Mac, skal du installere [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) og køre:

```sh
gcloud auth application-default login
```

Log ind med en Google-konto, der har adgang til Firebase-projektet. Backupværktøjet skal også være installeret. Hvis kommandoen til backup melder, at `firebase-admin` mangler, kør én gang:

```sh
npm --prefix tools/firestore-backup install
```

## Vigtigt om filen

- Backupen indeholder driftsinformationerne fra Firestore-samlingen `driftsinfo`.
- Det er en kopi til opbevaring og mulig gendannelse; backupkommandoen ændrer ikke Firebase-data.
- Gendannelse skriver data til Firebase og kræver en særskilt bekræftelse. Brug den kun, når du bevidst vil gendanne en backup.
- Gem en ekstra kopi et sikkert sted, hvis du også vil være beskyttet, hvis computeren eller projektmappen går tabt.
