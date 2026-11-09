// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  useEmulators: false,
  firebase: {
    apiKey: 'AIzaSyCaAJr1uXHgAWYSh4fNN-6BhcLmuv53k-A',
    authDomain: 'ssv-staging-20261109.firebaseapp.com',
    projectId: 'ssv-staging-20261109',
    messagingSenderId: '677001076989',
    appId: '1:677001076989:web:61a069062e3789509d5e94',
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
