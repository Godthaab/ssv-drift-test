import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false,
})
export class LoginComponent {
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  busy = false;
  errorMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly afAuth: AngularFireAuth,
    private readonly router: Router,
  ) {}

  async onLogin(): Promise<void> {
    if (this.form.invalid || this.busy) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy = true;
    this.errorMessage = '';
    const { email, password } = this.form.getRawValue();
    try {
      await this.afAuth.signInWithEmailAndPassword(email!, password!);
      await this.router.navigateByUrl('/');
    } catch (error: any) {
      this.errorMessage = error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password'
        ? 'E-mail eller adgangskode er forkert.'
        : 'Login mislykkedes. Prøv igen.';
    } finally {
      this.busy = false;
    }
  }
}
