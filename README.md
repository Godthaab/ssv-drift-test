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

## Tidsstyrede driftsmeddelelser

Fanerne beregnes ud fra `vises`, `publiceres` og `aftages`:

- **Aktuelle:** »Vises på web« er slået til, og `publiceres <= nu < aftages`.
- **Planlagte:** »Vises på web« er slået til, men publiceringstidspunktet er ikke nået.
- **Tidligere:** perioden er udløbet, »Vises på web« er slået fra, eller datoerne mangler/er ugyldige.

Gamle meddelelser med passeret slutdato placeres automatisk under Tidligere,
også selvom `vises` stadig er `true`. Der skal ikke rettes manuelt i hver
meddelelse, og visningen ændrer eller sletter ikke dokumenter i Firebase.
Slår man »Vises på web« fra, skjules meddelelsen straks fra Aktuelle/Planlagte.

Listerne følger Firestore-ændringer og kontrollerer tiden hvert sekund, så
en åben side også skifter ved publicering/aftagning. Formularerne kræver,
at aftagning ligger efter publicering. Tidsstempler sammenlignes som absolutte
tidspunkter; indtastning og visning bruger browserens lokale tidszone.

Samme tidsstyring findes i det tilhørende projekt `ssv-280225`. Begge apps
skal bygges og udgives med rettelsen, før den virker i de offentlige udgaver.
Build eller lokal udvikling udgiver ikke ændringerne.

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

Firestore bruger fortsat de publicerede regler i Firebase Console. Appens
routebeskyttelse erstatter ikke databasens adgangsregler. Offentlig læsning og
skriveadgang for kundens godkendte brugere skal konfigureres i Firebase, når
brugernes identiteter/rettigheder er gennemgået.
