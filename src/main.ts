import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { LayoutModule } from './app/layout/layout.modules';

platformBrowserDynamic().bootstrapModule(LayoutModule)
  .catch(err => console.log(err));
