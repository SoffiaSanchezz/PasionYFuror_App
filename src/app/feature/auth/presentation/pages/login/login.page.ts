import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { LoginUseCase } from '@auth-core/usecases/login.usecase';
import { UserEntity } from '@auth-core/entities/user.entity';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule
  ]
})
export class LoginPage implements OnInit {

  constructor(private loginUseCase: LoginUseCase) { }

  ngOnInit() {}

  onLogin() {
    const credentials = { email: 'test@example.com', password: 'password123' };
    
    this.loginUseCase.execute(credentials).subscribe({
      next: (user: UserEntity) => {
        console.log('Usuario autenticado:', user);
      },
      error: (err: any) => {
        console.error('Error en login:', err);
      }
    });
  }

}
