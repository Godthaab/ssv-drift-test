import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import {AngularFireAuthModule } from '@angular/fire/compat/auth';
import {AngularFirestoreModule } from '@angular/fire/compat/firestore';
import {environment} from '../environments/environment';
import {AngularFireModule} from '@angular/fire/compat';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import {MatSidenavModule} from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import {MatToolbarModule} from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {ReactiveFormsModule} from '@angular/forms';
import {LoginComponent} from './login/login.component';
import {AppRoutingModule} from './app-routing.module';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {MAT_DATE_LOCALE} from '@angular/material/core';
import { ForsideComponent } from './forside/forside.component';
import { ConfirmDeleteDialogComponent, DriftsinfoListComponent } from './driftsinfo-list/driftsinfo-list.component';
import { RetInfoComponent } from './ret-info/ret-info.component';
import { OpretInfoComponent } from './opret-info/opret-info.component';
import { MtxDatetimepickerModule } from '@ng-matero/extensions/datetimepicker';
import { DatetimeAdapter, MTX_DATETIME_FORMATS, MtxNativeDatetimeModule } from '@ng-matero/extensions/core';
import { DanishDatetimeAdapter, DANISH_DATETIME_FORMATS } from './services/danish-datetime-adapter';

@NgModule({ declarations: [
        AppComponent,
        LoginComponent,
        ForsideComponent,
        DriftsinfoListComponent,
        ConfirmDeleteDialogComponent,
        RetInfoComponent,
        OpretInfoComponent,
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        BrowserAnimationsModule,
        MatMenuModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatTabsModule,
        MatSidenavModule,
        MatSlideToggleModule,
        MatListModule,
        MatToolbarModule,
        MatInputModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        MatDialogModule,
        MatSelectModule,
        MatDatepickerModule,
        ReactiveFormsModule,
        AppRoutingModule,
        AngularFireModule.initializeApp(environment.firebase),
        AngularFirestoreModule,
        AngularFireAuthModule,
        MtxDatetimepickerModule,
        MtxNativeDatetimeModule], providers: [
        { provide: MAT_DATE_LOCALE, useValue: 'da-DK' },
        { provide: DatetimeAdapter, useClass: DanishDatetimeAdapter },
        { provide: MTX_DATETIME_FORMATS, useValue: DANISH_DATETIME_FORMATS },
        provideHttpClient(withInterceptorsFromDi()),
    ] })
export class AppModule {}
