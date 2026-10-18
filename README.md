# Stillinge Strands Vandværk – driftsinformationer

Kundens administrationsapp til oprettelse og redigering af driftsmeddelelser.
Appen hedder `ssv-drift` og bruger samme Firebase-projekt (`petec-login`) og
Firestore-samling (`driftsinfo`) som den offentlige hjemmeside `ssv-280225`.

## Versioner

Angular/Material 15.2.6, Angular CLI 15.2.5, TypeScript 4.8.4,
AngularFire 7.5.0 og Firebase 9.18.0. De fælles versioner svarer til
`ssv-280225`. FirebaseUI er opdateret til 6.0.2, og datovælgeren til den
Angular 15-kompatible version 9.0.0 for Material legacy-komponenter.

Angular 15 understøtter Node 14.20, 16.13 og 18.10 eller nyere inden for
henholdsvis 14, 16 og 18. Disse gamle Node-versioner og Angular 15 kræver en
senere samlet modernisering; her er målet versionslighed med hjemmesiden.

## Kør lokalt

```bash
npm ci
npm start
```

Åbn http://localhost:4201/login og log ind med en eksisterende Firebase-bruger.
Begge miljøfiler peger på den eksisterende Firebase-database. Ændringer i
meddelelserne lokalt påvirker derfor også den offentlige hjemmeside.

## Visning af driftsmeddelelser

Administrationsappen følger den udgivne app på `drift.stillinge-strands-vandv.dk`:

- **Aktuelle:** feltet `vises` er `true`.
- **Tidligere:** feltet `vises` er `false`.

Begge lister sorteres efter `publiceres`, nyeste først, med samme Firestore-
forespørgsler som den udgivne app. Datoerne flytter ikke meddelelser mellem
fanerne. Gamle meddelelser, hvor »Vises på web« stadig er slået til, vises derfor
under Aktuelle, også selvom aftagningsdatoen er passeret eller ligger før
publiceringen. Visningen ændrer ikke dokumenter i databasen.

Gamle meddelelser kan redigeres og skjules manuelt med deres oprindelige
datoer, også hvis datoerne ligger i forkert rækkefølge. Ved oprettelse eller
ændring af datoerne kræves en aftagningsdato efter publiceringsdatoen.

Listerne følger Firestore-ændringer, så ændringer fra andre sessioner også
vises. Meddelelseskortene viser dato, overskrift, beskrivelse, berørte samt
redigerings- og sletteikoner som i den udgivne app.

## Udseende efter Angular 15-opgraderingen

Den udgivne administrationsapp på `https://drift.stillinge-strands-vandv.dk`
er den visuelle reference: blå værktøjslinje, lys baggrund, Roboto og runde
ikonknapper til oprettelse, redigering og sletning. Typografi og komponenter
bruger Materials legacy-udgaver for at bevare det oprindelige udseende.
I Angular Material 15 kræver det `mat.all-legacy-component-typographies()`
udover `legacy-core`.

Roboto og Material Icons ligger i `src/assets/fonts`, i de samme versioner som
den udgivne app. De indlæses lokalt, så skrift og ikoner også virker i editorens
browser uden adgang til Google Fonts. Licenser og kildeadresser følger filerne.

Datofelter viser og accepterer `dd-MM-yyyy HH:mm` i lokal tid, med danske månedsnavne og
mandag som ugens første dag. Manuel indtastning kontrolleres, så dag og måned
ikke byttes om, og ugyldige datoer afvises.

Se ændringerne på **http://localhost:4201/**. Adressen
`https://drift.stillinge-strands-vandv.dk` viser den senest udgivne version og
ændres først ved en særskilt udgivelse.

Hvis editoren viser TypeScript 6-fejl: åbn en `.ts`-fil, vælg
`TypeScript: Select TypeScript Version` og derefter `Use Workspace Version` (4.8.4).

## Kontrol og build

```bash
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Produktionsfiler ligger i `dist/ssv-drift`. `src/assets/CNAME` bevarer adressen
`drift.stillinge-strands-vandv.dk` ved senere udgivelse til GitHub Pages.
Der udgives ikke automatisk ved build.

## Udgivelse til den eksisterende administrationsside

Kildekoden gemmes på `origin master` i `Godthaab/ssv-drift`. Den aktive
GitHub Pages-side på `drift.stillinge-strands-vandv.dk` ligger fortsat på
`gh-pages` i `Godthaab/ssv-drift-13Okt` (lokal remote: `backup`).
Bevar denne hosting og domæneopsætning ved udgivelse:

```bash
npm run build
npx --no-install angular-cli-ghpages --dir=dist/ssv-drift --repo=https://github.com/Godthaab/ssv-drift-13Okt.git --cname=drift.stillinge-strands-vandv.dk
```

Brug det kontrollerede produktionsbuild, og kontrollér efterfølgende login
og visning på den offentlige adresse. Der skal ikke oprettes en ny Pages-side
eller flyttes et domæne for at udgive fra dette kildeprojekt.

Firestore bruger fortsat de publicerede regler i Firebase Console. Appens
routebeskyttelse erstatter ikke databasens adgangsregler. Offentlig læsning og
skriveadgang for kundens godkendte brugere skal konfigureres i Firebase, når
brugernes identiteter/rettigheder er gennemgået.
