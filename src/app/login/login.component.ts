import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import * as firebaseui from 'firebaseui';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

@Component({
    selector: 'login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: false
})
export class LoginComponent implements OnInit, OnDestroy {
  ui: firebaseui.auth.AuthUI;
  private destroyed = false;

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.afAuth.app.then((app) => {
      if (this.destroyed) {
        return;
      }
      const uiConfig: firebaseui.auth.Config = {
        signInOptions: [firebase.auth.EmailAuthProvider.PROVIDER_ID],
        callbacks: {
          signInSuccessWithAuthResult: () => this.onLoginSuccessful(),
        },
      };
      this.ui = firebaseui.auth.AuthUI.getInstance() ?? new firebaseui.auth.AuthUI(app.auth());
      this.ui.start('#firebaseui-auth-container', uiConfig);
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.ui) {
      void this.ui.delete();
    }
  }

  onLoginSuccessful(): boolean {
    this.zone.run(() => this.router.navigateByUrl('/'));
    return false;
  }
}
