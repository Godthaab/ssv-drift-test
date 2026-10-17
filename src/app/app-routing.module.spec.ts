import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { BehaviorSubject } from 'rxjs';
import { AppModule } from './app.module';

// Route checks use simulated authentication; no real account or Firebase calls.
describe('Driftsinformation route access', () => {
  let user: BehaviorSubject<any>;
  let router: Router;

  beforeEach(() => {
    user = new BehaviorSubject(null);
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{ provide: AngularFireAuth, useValue: { user } }],
    });
    router = TestBed.inject(Router);
  });

  it('redirects visitors opening the create URL directly to login', async () => {
    await router.navigateByUrl('/opret-info');
    expect(router.url).toBe('/login');
  });

  it('redirects visitors opening the list to login', async () => {
    await router.navigateByUrl('/');
    expect(router.url).toBe('/login');
  });

  it('allows a signed-in user to open the create form', async () => {
    user.next({ uid: 'test-user' });
    await router.navigateByUrl('/opret-info');
    expect(router.url).toBe('/opret-info');
  });
});
