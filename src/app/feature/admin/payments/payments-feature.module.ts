import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PaymentsRoutingModule } from './payments-routing.module';
import { PaymentsListPageComponent } from './presentation/pages/payments-list-page/payments-list-page.component';
import { SidebarComponent } from '@shared/components/menus/sidebar/sidebar.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    PaymentsRoutingModule
  ]
})
export class PaymentsFeatureModule { }
