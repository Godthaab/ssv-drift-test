import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {LoginComponent} from './login/login.component';
import {AngularFireAuthGuard, hasCustomClaim, redirectUnauthorizedTo} from '@angular/fire/compat/auth-guard';
import { ForsideComponent } from './forside/forside.component';
import { OpretInfoComponent } from './opret-info/opret-info.component';
const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);

const adminOnly = () => hasCustomClaim('admin');

const routes: Routes = [
  {
    path: '',
    component: ForsideComponent,
    canActivate: [AngularFireAuthGuard],
    data: {
      authGuardPipe: redirectUnauthorizedToLogin,
    },
  },

  {
    path: 'opret-info',
    component: OpretInfoComponent,
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  { path: 'forside', redirectTo: '', pathMatch: 'full' },
  {
    path: '**',
    redirectTo: '/',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
