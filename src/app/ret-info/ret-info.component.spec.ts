import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { MAT_LEGACY_DIALOG_DATA, MatLegacyDialogRef } from '@angular/material/legacy-dialog';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AppModule } from '../app.module';
import { DriftsinfoService } from '../services/driftsinfo.service';
import { RetInfoComponent } from './ret-info.component';
import { OpretInfoComponent } from '../opret-info/opret-info.component';

// Tests use a stubbed service and never write to Firebase.
describe('Driftsinformation forms after the Angular/Firebase upgrade', () => {
  const published = new Date(2026, 9, 16, 14, 35);
  const removed = new Date(2026, 10, 1, 23, 5);
  const record = {
    id: 'test-info', infoNr: 1, overskrift: 'Test', beskrivelse: 'Testbesked',
    berorte: 'Alle', vises: true,
    publiceres: firebase.firestore.Timestamp.fromDate(published),
    aftages: firebase.firestore.Timestamp.fromDate(removed),
  };
  let service: jasmine.SpyObj<DriftsinfoService>;
  let dialog: jasmine.SpyObj<MatLegacyDialogRef<RetInfoComponent>>;

  beforeEach(async () => {
    service = jasmine.createSpyObj('DriftsinfoService', ['opdaterInfo', 'createCourse']);
    service.opdaterInfo.and.returnValue(of(undefined));
    service.createCourse.and.returnValue(of(record));
    dialog = jasmine.createSpyObj('MatDialogRef', ['close']);
    await TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        { provide: DriftsinfoService, useValue: service },
        { provide: MatLegacyDialogRef, useValue: dialog },
        { provide: MAT_LEGACY_DIALOG_DATA, useValue: record },
        { provide: AngularFirestore, useValue: { createId: () => 'test-new' } },
      ],
    }).compileComponents();
  });

  it('renders stored Firestore dates in the actual date picker without invalidating the form', () => {
    const fixture = TestBed.createComponent(RetInfoComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.value.publiceres).toEqual(published);
    expect(fixture.componentInstance.form.value.aftages).toEqual(removed);
    expect(fixture.componentInstance.form.valid).toBeTrue();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('[formControlName="publiceres"]');
    expect(input.value).not.toBe('');
    expect(input.value).toBe('16-10-2026 14:35');
  });

  it('preserves the instant and Firestore Timestamp type when saving an edited date', () => {
    const fixture = TestBed.createComponent(RetInfoComponent);
    fixture.detectChanges();
    const changed = new Date(2026, 9, 30, 22, 45);
    fixture.componentInstance.form.patchValue({ publiceres: changed });
    fixture.componentInstance.save();
    const [id, data] = service.opdaterInfo.calls.mostRecent().args;
    expect(id).toBe('test-info');
    expect(data.publiceres instanceof firebase.firestore.Timestamp).toBeTrue();
    expect(data.publiceres.toDate()).toEqual(changed);
    expect(data.aftages.toDate()).toEqual(removed);
    expect(dialog.close).toHaveBeenCalledWith(data);
  });

  it('accepts a manually entered Danish date and rejects an impossible one in the real input', () => {
    const fixture = TestBed.createComponent(RetInfoComponent);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('[formControlName="publiceres"]');
    input.value = '04-10-2026 14:35';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.form.value.publiceres).toEqual(new Date(2026, 9, 4, 14, 35));
    expect(fixture.componentInstance.form.valid).toBeTrue();
    input.value = '31-02-2026 10:00';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.form.valid).toBeFalse();
    expect(service.opdaterInfo).not.toHaveBeenCalled();
  });

  it('does not submit an invalid edit', () => {
    const fixture = TestBed.createComponent(RetInfoComponent);
    fixture.componentInstance.form.patchValue({ overskrift: '' });
    fixture.componentInstance.save();
    expect(service.opdaterInfo).not.toHaveBeenCalled();
  });

  it('rejects an end time equal to or before publication, in both forms', () => {
    const edit = TestBed.createComponent(RetInfoComponent).componentInstance;
    edit.form.patchValue({ aftages: published });
    expect(edit.form.hasError('dateRange')).toBeTrue();
    edit.save();
    expect(service.opdaterInfo).not.toHaveBeenCalled();
    const create = TestBed.createComponent(OpretInfoComponent).componentInstance;
    create.form.setValue({
      overskrift: 'Test', beskrivelse: 'Testbesked', berorte: 'Alle', vises: true,
      publiceres: removed, aftages: published,
    });
    expect(create.form.hasError('dateRange')).toBeTrue();
    create.onOpretInfo();
    expect(service.createCourse).not.toHaveBeenCalled();
  });

  it('allows creating a manually hidden message with valid dates', () => {
    const create = TestBed.createComponent(OpretInfoComponent).componentInstance;
    create.form.setValue({
      overskrift: 'Test', beskrivelse: 'Testbesked', berorte: 'Alle', vises: false,
      publiceres: published, aftages: removed,
    });
    expect(create.form.valid).toBeTrue();
  });

  it('allows manually hiding and re-enabling a legacy message without changing its reversed dates', () => {
    const legacy = { ...record, publiceres: record.aftages, aftages: record.publiceres };
    TestBed.overrideProvider(MAT_LEGACY_DIALOG_DATA, { useValue: legacy });
    const fixture = TestBed.createComponent(RetInfoComponent);
    fixture.detectChanges();
    const edit = fixture.componentInstance;
    for (const visible of [false, true]) {
      edit.form.patchValue({ vises: visible });
      expect(edit.form.valid).toBeTrue();
      edit.save();
      const [id, data] = service.opdaterInfo.calls.mostRecent().args;
      expect(id).toBe(legacy.id);
      expect(data.vises).toBe(visible);
      expect(data.publiceres.toDate()).toEqual(removed);
      expect(data.aftages.toDate()).toEqual(published);
    }
  });

  it('requires a valid range when the dates of a legacy message are changed', () => {
    const legacy = { ...record, publiceres: record.aftages, aftages: record.publiceres };
    TestBed.overrideProvider(MAT_LEGACY_DIALOG_DATA, { useValue: legacy });
    const edit = TestBed.createComponent(RetInfoComponent).componentInstance;
    edit.form.patchValue({ aftages: new Date(2026, 9, 17, 14, 35) });
    expect(edit.form.hasError('dateRange')).toBeTrue();
    edit.save();
    expect(service.opdaterInfo).not.toHaveBeenCalled();
    edit.form.patchValue({ aftages: new Date(2026, 10, 2, 14, 35) });
    expect(edit.form.valid).toBeTrue();
  });

  it('creates the same Firestore data shape expected by the public website', () => {
    spyOn(window, 'alert');
    spyOn(TestBed.inject(Router), 'navigateByUrl').and.returnValue(Promise.resolve(true));
    const fixture = TestBed.createComponent(OpretInfoComponent);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      overskrift: 'Test', beskrivelse: 'Testbesked', berorte: 'Alle', vises: true,
      publiceres: published, aftages: removed,
    });
    fixture.componentInstance.onOpretInfo();
    const [data, id] = service.createCourse.calls.mostRecent().args;
    expect(id).toBe('test-new');
    expect(data.vises).toBeTrue();
    expect(data.publiceres.toDate()).toEqual(published);
    expect(data.aftages.toDate()).toEqual(removed);
  });
});
