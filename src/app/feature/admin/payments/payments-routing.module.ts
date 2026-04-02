import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentsListPageComponent } from './presentation/pages/payments-list-page/payments-list-page.component';
import { PaymentFormComponent } from './presentation/pages/payment-form/payment-form.component';

const routes: Routes = [
  {
    path: '',
    component: PaymentsListPageComponent
  },
  {
    path: 'new',
    component: PaymentFormComponent
  },
  {
    path: 'edit/:id',
    component: PaymentFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentsRoutingModule { }
