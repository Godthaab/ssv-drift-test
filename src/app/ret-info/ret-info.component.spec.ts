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
    berorte: 'Alle', vises: true, visAltid: false,
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
      overskrift: 'Test', beskrivelse: 'Testbesked', berorte: 'Alle', visAltid: false,
      publiceres: removed, aftages: published,
    });
    expect(create.form.hasError('dateRange')).toBeTrue();
    create.onOpretInfo();
    expect(service.createCourse).not.toHaveBeenCalled();
  });

  it('offers only the permanent-post switch when creating a post', () => {
    const create = TestBed.createComponent(OpretInfoComponent).componentInstance;
    create.form.setValue({
      overskrift: 'Test', beskrivelse: 'Testbesked', berorte: 'Alle', visAltid: false,
      publiceres: published, aftages: removed,
    });
    expect(create.form.valid).toBeTrue();
    expect(create.form.get('vises')).toBeNull();
  });

  it('edits a legacy fixed post without exposing or saving the obsolete visibility switch', () => {
    const legacy = { ...record, visAltid: undefined, publiceres: record.aftages, aftages: record.publiceres };
    TestBed.overrideProvider(MAT_LEGACY_DIALOG_DATA, { useValue: legacy });
    const fixture = TestBed.createComponent(RetInfoComponent);
    fixture.detectChanges();
    const edit = fixture.componentInstance;
    expect(edit.form.get('vises')).toBeNull();
    expect(fixture.nativeElement.querySelector('[formControlName="vises"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[formControlName="visAltid"]')).not.toBeNull();
    edit.form.patchValue({ beskrivelse: 'Ændret tekst' });
    expect(edit.form.valid).toBeTrue();
    edit.save();
    const [id, data] = service.opdaterInfo.calls.mostRecent().args;
    expect(id).toBe(legacy.id);
    expect('vises' in data).toBeFalse();
    expect(data.visAltid).toBeTrue();
    expect(data.publiceres.toDate()).toEqual(removed);
    expect(data.aftages.toDate()).toEqual(published);
  });

  it('opens a legacy archived post with the permanent-post choice off', () => {
    TestBed.overrideProvider(MAT_LEGACY_DIALOG_DATA, {
      useValue: { ...record, visAltid: undefined, vises: false },
    });
    const edit = TestBed.createComponent(RetInfoComponent).componentInstance;
    expect(edit.form.value.visAltid).toBeFalse();
    expect(edit.form.get('vises')).toBeNull();
    edit.save();
    const [, data] = service.opdaterInfo.calls.mostRecent().args;
    expect(data.visAltid).toBeFalse();
    expect('vises' in data).toBeFalse();
  });

  it('requires a valid range when a legacy message is switched to scheduling', () => {
    const legacy = { ...record, visAltid: undefined, publiceres: record.aftages, aftages: record.publiceres };
    TestBed.overrideProvider(MAT_LEGACY_DIALOG_DATA, { useValue: legacy });
    const edit = TestBed.createComponent(RetInfoComponent).componentInstance;
    edit.form.patchValue({ visAltid: false, aftages: new Date(2026, 9, 17, 14, 35) });
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
      overskrift: 'Test', beskrivelse: 'Testbesked', berorte: 'Alle', visAltid: false,
      publiceres: published, aftages: removed,
    });
    fixture.componentInstance.onOpretInfo();
    const [data, id] = service.createCourse.calls.mostRecent().args;
    expect(id).toBe('test-new');
    expect('vises' in data).toBeFalse();
    expect(data.visAltid).toBeFalse();
    expect(data.publiceres.toDate()).toEqual(published);
    expect(data.aftages.toDate()).toEqual(removed);
  });

  it('creates a permanent post without an expiry date and stores the new field', () => {
    spyOn(window, 'alert');
    spyOn(TestBed.inject(Router), 'navigateByUrl').and.returnValue(Promise.resolve(true));
    const fixture = TestBed.createComponent(OpretInfoComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.value.visAltid).toBeFalse();
    fixture.componentInstance.form.setValue({
      overskrift: 'Fast information', beskrivelse: 'Test', berorte: 'Alle',
      visAltid: true, publiceres: published, aftages: null,
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.form.valid).toBeTrue();
    expect(fixture.nativeElement.querySelector('[formControlName="aftages"]')).toBeNull();
    fixture.componentInstance.onOpretInfo();
    const [data] = service.createCourse.calls.mostRecent().args;
    expect(data.visAltid).toBeTrue();
    expect(data.aftages).toBeNull();
    expect(data.publiceres.toDate()).toEqual(published);
  });

  it('requires an expiry date after a permanent post is changed to scheduling', () => {
    TestBed.overrideProvider(MAT_LEGACY_DIALOG_DATA, { useValue: { ...record, visAltid: true, aftages: null } });
    const fixture = TestBed.createComponent(RetInfoComponent);
    fixture.detectChanges();
    const edit = fixture.componentInstance;
    expect(edit.form.valid).toBeTrue();
    edit.form.patchValue({ visAltid: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[formControlName="aftages"]')).not.toBeNull();
    expect(edit.form.hasError('endRequired')).toBeTrue();
    edit.save();
    expect(service.opdaterInfo).not.toHaveBeenCalled();
    edit.form.patchValue({ aftages: removed });
    edit.save();
    const [, data] = service.opdaterInfo.calls.mostRecent().args;
    expect(data.visAltid).toBeFalse();
    expect(data.aftages.toDate()).toEqual(removed);
  });

  it('can save edits to a permanent post with no expiry date', () => {
    TestBed.overrideProvider(MAT_LEGACY_DIALOG_DATA, { useValue: { ...record, visAltid: true, aftages: null } });
    const edit = TestBed.createComponent(RetInfoComponent).componentInstance;
    edit.form.patchValue({ beskrivelse: 'Ændret tekst' });
    edit.save();
    const [, data] = service.opdaterInfo.calls.mostRecent().args;
    expect('vises' in data).toBeFalse();
    expect(data.visAltid).toBeTrue();
    expect(data.aftages).toBeNull();
  });

  it('clears date picker expiry errors when changing a timed post into a permanent post', () => {
    const fixture = TestBed.createComponent(RetInfoComponent);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('[formControlName="aftages"]');
    input.value = '31-02-2026 10:00';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.form.invalid).toBeTrue();
    fixture.componentInstance.form.patchValue({ visAltid: true });
    fixture.detectChanges();
    expect(fixture.componentInstance.form.valid).toBeTrue();
    fixture.componentInstance.save();
    const [, data] = service.opdaterInfo.calls.mostRecent().args;
    expect(data.visAltid).toBeTrue();
    expect(data.aftages).toBeNull();
  });
});
