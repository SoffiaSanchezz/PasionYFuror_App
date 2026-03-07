import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';

@NgModule({
    providers: [
        // Aquí se pueden agregar servicios globales o repositorios que se quieran compartir en toda la aplicación
    ],
    imports: [CommonModule, HttpClientModule],
})
export class ServiceProviderModule { }
