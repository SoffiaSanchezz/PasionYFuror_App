import { CommonModule } from '@angular/common';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

// Routing - Asumiendo que el routing sigue en la carpeta padre
import { AuthFeatureRoutingModule } from './auth-feature-routing.module';

// Core - Subimos un nivel para encontrar core y data
import { AuthRepository } from '../core/repositories/auth.repository';
import { AuthImplementationRepository } from '../data/repositories/auth-implementation.repository';
import { AuthInteractor } from '../core/interactor/auth.interactor';

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        FormsModule,
        IonicModule,
        TranslateModule,
        AuthFeatureRoutingModule,
    ],
    providers: [
        AuthInteractor,
        { provide: AuthRepository, useClass: AuthImplementationRepository }
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AuthFeatureModule { }
