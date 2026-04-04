import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';
import { AuthInteractor } from '@auth-core/interactor/auth.interactor';
import { AuthRepository } from '@auth-core/repositories/auth.repository';
import { AuthImplementationRepository } from '../../../data/repositories/auth-implementation.repository';
import { LoginRequestEntity } from '@auth-core/entities/login-information.entity';
import { SessionProviderService } from '@shared/services/session/session-provider.service';
import { IonicModule } from '@ionic/angular';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    LottieComponent,
    IonicModule
  ],
  providers: [
    AuthInteractor,
    { provide: AuthRepository, useClass: AuthImplementationRepository }
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // Mejora rendimiento
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string | null = null;
  isLoading: boolean = false;
  showPassword = false;

  readonly lottieOptions: AnimationOptions = {
    path: '/assets/animations/Dancingfire.json',
    loop: true,
    autoplay: true,
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly authInteractor: AuthInteractor,
    private readonly sessionProvider: SessionProviderService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  // Getters para facilitar el acceso en el template
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  goHome(): void {
    this.router.navigate(['/']);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage = 'Por favor, completa el formulario correctamente.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const { email, password } = this.loginForm.value;
    const loginRequest: LoginRequestEntity = {
      identifier: email,
      password: password
    };

    this.authInteractor.authenticateUser(loginRequest)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => this.handleLoginSuccess(response),
        error: (err) => this.handleLoginError(err)
      });
  }

  private handleLoginSuccess(response: any): void {
    // Guardar token y datos de usuario
    this.sessionProvider.setInformationToken(response.token);
    
    const userInfo = {
      id: response.user_id,
      nombre: response.nombre,
      apellido: response.apellido,
      rol: response.rol,
      fullName: `${response.nombre} ${response.apellido}`.trim()
    };
    this.sessionProvider.setUserInfo(userInfo);

    // Determinar ruta de redirección
    const role = response.rol.toLowerCase();
    const redirectPath = (role === 'admin') ? '/admin' : '/dashboard';

    this.router.navigate([redirectPath], { replaceUrl: true });
  }

  private handleLoginError(err: any): void {
    const errorMap: Record<number, string> = {
      401: 'Credenciales incorrectas.',
      404: 'Usuario no encontrado.',
      500: 'Error interno del servidor.',
      400: err.error?.error || 'Datos inválidos.'
    };

    this.errorMessage = errorMap[err.status] || 'Error inesperado. Inténtalo más tarde.';
    this.cdr.detectChanges();
  }
}
