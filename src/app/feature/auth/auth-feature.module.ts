import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

// Routing
import { AuthFeatureRoutingModule } from './auth-feature-routing.module';

// Pages
import { LoginPage } from './presentation/pages/login/login.page';

// Core

@NgModule({
    declarations: [LoginPage],
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        FormsModule,
        TranslateModule,
        AuthFeatureRoutingModule,
    ],
    providers: [],
})
export class AuthFeatureModule { }
