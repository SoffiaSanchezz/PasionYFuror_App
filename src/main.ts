import { bootstrapApplication } from '@angular/platform-browser';
import { LayoutComponent } from './app/layout/layout.component';
import { appConfig } from './app/app.config';

bootstrapApplication(LayoutComponent, appConfig)
  .catch(err => console.error(err));
