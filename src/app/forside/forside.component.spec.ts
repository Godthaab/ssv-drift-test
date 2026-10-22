import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppModule } from '../app.module';
import { DriftsinfoService } from '../services/driftsinfo.service';
import { ForsideComponent } from './forside.component';

describe('Administration overview tabs', () => {
  it('shows only Aktuelle and Tidligere', async () => {
    await TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{ provide: DriftsinfoService, useValue: {
        loadInfo: () => of({ aktuelle: [], planlagte: [], tidligere: [] }),
      } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ForsideComponent);
    fixture.detectChanges();
    const tabs: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('[role="tab"]'));
    expect(tabs.map(tab => tab.textContent.trim())).toEqual(['Aktuelle', 'Tidligere']);
  });
});
