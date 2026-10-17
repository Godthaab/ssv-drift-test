// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  useEmulators: false,
  firebase: {
    apiKey: 'AIzaSyCGa5rQ8hpEsrEJSzAVAwJNRzXFnFCPj6s',
    authDomain: 'petec-login.firebaseapp.com',
    databaseURL: 'https://petec-login.firebaseio.com',
    projectId: 'petec-login',
    storageBucket: 'petec-login.appspot.com',
    messagingSenderId: '911817108528',
    appId: '1:911817108528:web:d66d8aca786324e9e791f5',
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
import 'zone.js/dist/zone-error';  // Included with Angular CLI.
