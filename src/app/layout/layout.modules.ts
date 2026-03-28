import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule, provideHttpClient, withFetch, HTTP_INTERCEPTORS, withInterceptorsFromDi } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TRANSLATE_HTTP_LOADER_CONFIG, TranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideLottieOptions } from 'ngx-lottie';
import player from 'lottie-web';

import { LayoutComponent } from './layout.component';
import { LayoutRoutingModule } from './layout-routing.module';

//Import animations
import { customNavAnimation } from '../shared/animations/nav-animation';

//Import modules
import { ServiceProviderModule } from '../core/service-provider/service-provider.module';

//Import i18n
import { I18nService } from '@core/i18n/i18n.service';
import { ApiService } from '@shared/services/api/api.service';
import { AuthInterceptor } from '../core/interceptors/auth.interceptor';

// Factory function for TranslateHttpLoader
export function createTranslateLoader() {
    return new TranslateHttpLoader();
}

// Player factory for ngx-lottie
export function playerFactory() {
    return player;
}

@NgModule({
    declarations: [LayoutComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        RouterModule,
        HttpClientModule,
        IonicModule.forRoot({
            navAnimation: customNavAnimation,
            mode: 'md' // Forzamos modo Material Design para consistencia, o puedes quitarlo
        }),
        LayoutRoutingModule,
        ServiceProviderModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: createTranslateLoader,
            },
        }),
    ],
    providers: [
        ApiService,
        I18nService,
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        provideHttpClient(withFetch(), withInterceptorsFromDi()),
        provideLottieOptions({
            player: playerFactory,
        }),
        {
            provide: TRANSLATE_HTTP_LOADER_CONFIG,
            useValue: { prefix: './assets/i18n/', suffix: '.json' },
        },
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    bootstrap: [LayoutComponent],
})
export class LayoutModule { }
