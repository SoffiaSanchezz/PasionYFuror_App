import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TRANSLATE_HTTP_LOADER_CONFIG, TranslateHttpLoader } from '@ngx-translate/http-loader';

import { LayoutComponent } from './layout.component';
import { LayoutRoutingModule } from './layout-routing.module';

//Import modules
import { ServiceProviderModule } from '../core/service-provider/service-provider.module';

//Import i18n
import { I18nService } from '@core/i18n/i18n.service';
import { ApiService } from '@shared/services/api/api.service';

// Factory function for TranslateHttpLoader
export function createTranslateLoader() {
    return new TranslateHttpLoader();
}

@NgModule({
    declarations: [LayoutComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        RouterModule,
        HttpClientModule,
        IonicModule.forRoot(),
        LayoutRoutingModule,
        ServiceProviderModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: createTranslateLoader,
            },
            defaultLanguage: 'es',
        }),
    ],
    providers: [
        ApiService,
        I18nService,
        provideHttpClient(withFetch()),
        {
            provide: TRANSLATE_HTTP_LOADER_CONFIG,
            useValue: { prefix: './assets/i18n/', suffix: '.json' },
        },
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    bootstrap: [LayoutComponent],
})
export class LayoutModule { }
