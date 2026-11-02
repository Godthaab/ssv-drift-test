# Stillinge Strands Vandværk – driftsinformationer

Kundens administrationsapp til oprettelse og redigering af driftsmeddelelser.
Appen hedder `ssv-drift` og bruger samme Firebase-projekt (`petec-login`) og
Firestore-samling (`driftsinfo`) som den offentlige hjemmeside `ssv`.

## Versioner

Angular/Material 15.2.6, Angular CLI 15.2.5, TypeScript 4.8.4,
AngularFire 7.5.0 og Firebase 9.18.0. De fælles versioner svarer til
`ssv`. FirebaseUI er opdateret til 6.0.2, og datovælgeren til den
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

## Faste og tidsstyrede driftsmeddelelser

Der er kun ét valg for synlighed i oprettelse og redigering:

- **Vis altid under Aktuelt** (`visAltid: true`): posten bliver under Aktuelle,
  uanset datoerne. Publiceringsdatoen bruges til sortering; slutdato er valgfri.
- **Uden markering** (`visAltid: false`): posten vises, når
  `publiceres <= nu < aftages`. Der kræves en slutdato efter publiceringen.
  Ved slutdatoen flytter visningen automatisk posten til Tidligere.

»Vises på web« er fjernet fra formularerne. Ved oprettelse og gemning beregnes
`vises` automatisk ud fra postens aktuelle status, så den eksisterende offentlige
kode stadig kan finde den. Den nye kode bruger `visAltid` og datoerne; et gammelt
`vises`-felt kan ikke overstyre et eksplicit `visAltid`-valg.

Databasen er LIVE, også ved lokal udvikling. Den endnu ikke opdaterede offentlige
version viser den status, der blev beregnet ved seneste gemning. Den får først
automatisk publicering/aftagning efter de nye datoer, når dens kode også er
udgivet. Et lokalt urtick opdaterer kun visningen og skriver ikke til databasen.
Allerede oprettede testposter uden `vises` får kompatibilitetsfeltet ved næste
almindelige gemning; der udføres ikke automatisk ændringer i dem.

Eksisterende dokumenter uden `visAltid` bevarer deres gamle placering, indtil
de bliver redigeret: `vises: true` betyder Aktuelle, og `vises: false` betyder
Tidligere. Formularen åbner med »Vis altid under Aktuelt« slået til for de
førstnævnte og fra for de sidstnævnte. Efter gemning gælder det nye valg og
datoerne. Der foretages ingen automatisk migration eller databaseændring ved
blot at åbne appen. Dokumenter uden nogen af felterne følger datoerne.

Nye poster starter med »Vis altid under Aktuelt« slået fra. Alle aktuelle
poster sorteres efter `publiceres`, nyeste først. Faste og tidsstyrede poster
blandes i samme datoorden; faste poster fastgøres ikke øverst.

Der vises kun fanerne **Aktuelle** og **Tidligere**. Kommende tidsstyrede poster
vises først ved publiceringstidspunktet; der er ingen fane til planlagte poster.
**Tidligere** indeholder udløbne poster og tidsstyrede poster med ugyldige
datoer samt gamle, urørte poster med `vises: false`.
Listerne følger Firestore-ændringer og kontrollerer tiden hvert sekund, så en
åben side også skifter ved publicering og aftagning. Tidsstempler sammenlignes
som absolutte tidspunkter; datoindtastning og visning bruger lokal tid.

Samme regler findes i `ssv`. Begge apps skal udgives med ændringen,
før den forenklede styring fungerer på den offentlige hjemmeside. Visningen
skriver ikke til databasen; aftagning ændrer ikke selve dokumentet.

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

## Udgivelse til administrationssiden

Kildekoden gemmes på `origin master` i `Godthaab/ssv-drift`. Den hidtidige
live-side ligger på `gh-pages` i backup-repositoriet `Godthaab/ssv-drift-13Okt`.
Den nye build skal udgives til `gh-pages` i `Godthaab/ssv-drift`:

```bash
npm run build
npx --no-install angular-cli-ghpages --dir=dist/ssv-drift --repo=https://github.com/Godthaab/ssv-drift.git --cname=drift.stillinge-strands-vandv.dk
```

Ved domæneflytningen skal den gamle Pages-indstilling fjernes fra
`ssv-drift-13Okt`, og den nye Pages-side skal bruge `gh-pages` i `ssv-drift`.
Kontrollér derefter login og visning på den offentlige adresse.

Firestore bruger fortsat de publicerede regler i Firebase Console. Appens
routebeskyttelse erstatter ikke databasens adgangsregler. Offentlig læsning og
skriveadgang for kundens godkendte brugere skal konfigureres i Firebase, når
brugernes identiteter/rettigheder er gennemgået.
