import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';
import { AuthInteractor } from '@auth-core/interactor/auth.interactor';
import { AuthRepository } from '@auth-core/repositories/auth.repository';
import { AuthImplementationRepository } from '../../../data/repositories/auth-implementation.repository';
import { LoginRequestEntity } from '@auth-core/entities/login-information.entity';
import { SessionProviderService } from '@shared/services/session/session-provider.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    LottieComponent
  ],
  providers: [
    AuthInteractor,
    { provide: AuthRepository, useClass: AuthImplementationRepository }
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string | null = null;
  isLoading: boolean = false;
  showPassword = false;

  lottieOptions: AnimationOptions = {
    path: '/assets/animations/Dancingfire.json',
    loop: true,
    autoplay: true,
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authInteractor: AuthInteractor,
    private sessionProvider: SessionProviderService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    console.log('Login attempt started. Initial isLoading state:', this.isLoading);
    this.errorMessage = null;

    if (this.loginForm.valid) {
      this.isLoading = true;
      console.log('Form is valid. isLoading set to true before API call.');

      const { email, password } = this.loginForm.value;
      const loginRequest: LoginRequestEntity = {
        identifier: email,
        password: password
      };

      this.authInteractor.authenticateUser(loginRequest)
        .pipe(
          finalize(() => {
            this.isLoading = false;
            console.log(
              'Finalize executed. isLoading set to false. Current errorMessage:',
              this.errorMessage
            );
            this.cdr.detectChanges();
          })
        )
        .subscribe({
          next: (response) => {
            console.log('Login successful! Response:', response);
            
            // Store token
            this.sessionProvider.setInformationToken(response.token);
            
            // Store user info in the format the service expects
            const userInfo = {
                id: response.user_id,
                nombre: response.nombre,
                apellido: response.apellido,
                rol: response.rol,
                fullName: `${response.nombre} ${response.apellido}`.trim()
            };
            this.sessionProvider.setUserInfo(userInfo);

            let redirectPath: string;
            const userRole = response.rol.toLowerCase();

            switch (userRole) {
              case 'admin':
                redirectPath = '/admin';
                break;
              case 'usuario':
              case 'estudiante':
                redirectPath = '/dashboard';
                break;
              default:
                redirectPath = '/';
                break;
            }

            this.router.navigate([redirectPath], { replaceUrl: true })
              .then(success => {
                console.log(`Navigation to ${redirectPath} successful:`, success);
              })
              .catch(error => {
                console.error(`Navigation to ${redirectPath} failed:`, error);
                this.errorMessage = `Error al navegar a ${redirectPath}. Por favor, inténtalo de nuevo.`;
              });
          },
          error: (err) => {
            console.error('Login failed with error:', err);

            if (err.status === 401) {
              this.errorMessage = 'Contraseña incorrecta. Por favor, verifica tus credenciales.';
            } else if (err.status === 404) {
              this.errorMessage = 'Usuario no encontrado. Por favor, verifica tu correo electrónico.';
            } else if (err.status === 400) {
              this.errorMessage =
                err.error?.error || 'Solicitud inválida. Verifica los datos enviados.';
            } else if (err.status === 500) {
              this.errorMessage =
                'Error interno del servidor. Inténtalo de nuevo más tarde.';
            } else {
              this.errorMessage =
                'Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.';
            }

            console.log('Error handler finished. errorMessage is now:', this.errorMessage);
            this.cdr.detectChanges();
          }
        });
    } else {
      console.log('Form is invalid.');
      this.errorMessage = 'Por favor, completa el formulario correctamente.';
      this.loginForm.markAllAsTouched();
    }
  }
}
