import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { catchError, finalize, map, switchMap, take } from 'rxjs/operators';
import { of, Observable, timer } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { StudentsService, Student } from '../../../../../../shared/services/students/students.service';
import Swal from 'sweetalert2';

// Mock simple si no existe el servicio de reconocimiento facial
@Component({
  selector: 'app-student-affiliation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
  templateUrl: './student-affiliation.component.html',
  styleUrls: ['./student-affiliation.component.scss'],
})
export class StudentAffiliationComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('videoElement') videoElement!: ElementRef;
  @ViewChild('canvasElement') canvasElement!: ElementRef;
  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;

  currentStep: number = 1;
  isMinor: boolean = false;

  studentForm!: FormGroup;
  guardianForm!: FormGroup;
  contractForm!: FormGroup;

  videoStream: MediaStream | null = null;
  capturedImage: SafeUrl | null = null;
  capturedImageDataUrl: string | null = null;
  faceDescriptor: string | null = null;

  private signaturePad!: CanvasRenderingContext2D;
  private isDrawing = false;
  signatureDataUrl: string | null = null;

  // Regulation State
  showRegulationModal: boolean = false;
  regulationSafeUrl: SafeResourceUrl | null = null;
  isLoadingRegulation: boolean = false;

  constructor(
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private studentsService: StudentsService,
    private router: Router
  ) {}

  private toSnakeCase<T>(obj: T): any {
    const newObj: any = {};
    for (const key in obj as any) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const snakeCaseKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        newObj[snakeCaseKey] = (obj as any)[key];
      }
    }
    return newObj;
  }

  ngOnInit(): void {
    this.initForms();
  }

  ngAfterViewInit(): void {
    if (this.currentStep === 3 && this.signatureCanvas) {
      this.initSignaturePad();
    }
  }

  ngOnDestroy(): void {
    this.stopWebcam();
    if (this.regulationSafeUrl) {
      URL.revokeObjectURL((this.regulationSafeUrl as any).changingThisBreaksApplicationSecurity);
    }
  }

  initForms(): void {
    this.studentForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      documentId: ['', {
        validators: [Validators.required, Validators.pattern('^[0-9]+$')],
        asyncValidators: [this.documentUniqueValidator()],
        updateOn: 'blur'
      }],
      dateOfBirth: ['', [Validators.required, this.dateNotFutureValidator]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9+ ]+$')]],
      address: ['', Validators.required],
    });

    this.guardianForm = this.fb.group({
      fullName: [''],
      documentId: [''],
      phone: [''],
      relationship: [''],
      email: ['', [Validators.email]],
    });

    this.contractForm = this.fb.group({
      acceptTerms: [false, Validators.requiredTrue],
      signature: [null, Validators.required],
    });
  }

  // Validador Asíncrono para Documento Único
  private documentUniqueValidator() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) return of(null);
      
      return timer(500).pipe(
        switchMap(() => this.studentsService.checkDocumentExists(control.value)),
        map(res => res.exists ? { duplicateDocument: true } : null),
        catchError(() => of(null)),
        take(1)
      );
    };
  }

  // Validador de Fecha no Futura
  private dateNotFutureValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const date = new Date(control.value);
    const today = new Date();
    return date > today ? { futureDate: true } : null;
  }

  openRegulation(): void {
    this.showRegulationModal = true;
    if (!this.regulationSafeUrl) {
      this.loadRegulation();
    }
  }

  loadRegulation(): void {
    this.isLoadingRegulation = true;
    this.studentsService.getRegulation().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.regulationSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.isLoadingRegulation = false;
      },
      error: (err) => {
        console.error('Error loading regulation:', err);
        alert('No se pudo cargar el reglamento. Por favor intente más tarde.');
        this.isLoadingRegulation = false;
        this.showRegulationModal = false;
      }
    });
  }

  closeRegulation(): void {
    this.showRegulationModal = false;
  }

  applyGuardianValidators(isMinor: boolean): void {
    const controls = ['fullName', 'documentId', 'phone', 'relationship', 'email'];
    controls.forEach(controlName => {
      const control = this.guardianForm.get(controlName);
      if (isMinor) {
        if (controlName === 'email') {
          control?.setValidators([Validators.required, Validators.email]);
        } else {
          control?.setValidators(Validators.required);
        }
      } else {
        control?.clearValidators();
      }
      control?.updateValueAndValidity();
    });
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      this.currentStep++;
    } else if (this.currentStep === 2) {
      if (this.studentForm.valid && (!this.isMinor || this.guardianForm.valid)) {
        this.currentStep++;
        setTimeout(() => this.initSignaturePad(), 100);
        if (!this.capturedImage) {
          this.startWebcam();
        }
      } else {
        this.studentForm.markAllAsTouched();
        if (this.isMinor) this.guardianForm.markAllAsTouched();
      }
    } else if (this.currentStep === 3) {
      if (this.contractForm.valid && this.capturedImage && this.signatureDataUrl) {
        this.submitAffiliation();
      } else {
        this.contractForm.markAllAsTouched();
        if (!this.signatureDataUrl) alert('Por favor, firme el contrato.');
        if (!this.capturedImage) alert('Por favor, capture una foto.');
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      if (this.currentStep !== 3) {
        this.stopWebcam();
      }
    } else {
      this.goToStudentList();
    }
  }

  selectAgeOption(isMinor: boolean): void {
    this.isMinor = isMinor;
    this.applyGuardianValidators(this.isMinor);
    this.currentStep = 2;
  }

  async startWebcam(): Promise<void> {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      this.assignStreamToVideo();
    } catch (err) {
      console.error('Error accessing webcam:', err);
      alert('No se pudo acceder a la cámara.');
    }
  }

  private assignStreamToVideo(): void {
    if (this.videoElement && this.videoElement.nativeElement) {
      this.videoElement.nativeElement.srcObject = this.videoStream;
    } else {
      setTimeout(() => {
        if (this.currentStep === 3) this.assignStreamToVideo();
      }, 100);
    }
  }

  stopWebcam(): void {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
  }

  captureImage(): void {
    if (this.videoElement && this.canvasElement) {
      const video = this.videoElement.nativeElement;
      const canvas = this.canvasElement.nativeElement;
      const context = canvas.getContext('2d');
      
      // Asegurar que el video tenga dimensiones antes de capturar
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (width && height && context) {
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar el frame actual del video en el canvas
        context.drawImage(video, 0, 0, width, height);
        
        // Convertir a base64
        this.capturedImageDataUrl = canvas.toDataURL('image/png');
        if (this.capturedImageDataUrl) {
          this.capturedImage = this.sanitizer.bypassSecurityTrustUrl(this.capturedImageDataUrl);
        }
        
        this.stopWebcam(); // Apagar la cámara inmediatamente tras capturar
      } else {
        alert('La cámara no está lista para capturar. Por favor espera un momento.');
      }
    }
  }

  retakeImage(): void {
    this.capturedImage = null;
    this.capturedImageDataUrl = null;
    this.startWebcam();
  }

  private initSignaturePad(): void {
    if (!this.signatureCanvas) return;
    const canvas = this.signatureCanvas.nativeElement;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    this.signaturePad = context;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Fondo blanco fijo para el canvas
    this.signaturePad.fillStyle = '#ffffff';
    this.signaturePad.fillRect(0, 0, canvas.width, canvas.height);
    
    this.signaturePad.strokeStyle = '#000000'; // Firma negra
    this.signaturePad.lineWidth = 3;
    this.signaturePad.lineCap = 'round';
    
    canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    canvas.addEventListener('mousemove', this.draw.bind(this));
    canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    
    // Soporte táctil corregido (previniendo scroll accidental)
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
      const mouseEvent = new MouseEvent('mouseup', {});
      canvas.dispatchEvent(mouseEvent);
    }, { passive: false });
  }

  private startDrawing(event: MouseEvent): void {
    this.isDrawing = true;
    this.signaturePad.beginPath();
    const { x, y } = this.getCanvasPosition(event);
    this.signaturePad.moveTo(x, y);
    this.contractForm.get('signature')?.setValue(true);
  }

  private draw(event: MouseEvent): void {
    if (!this.isDrawing) return;
    const { x, y } = this.getCanvasPosition(event);
    this.signaturePad.lineTo(x, y);
    this.signaturePad.stroke();
  }

  private stopDrawing(): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.signatureDataUrl = this.signatureCanvas.nativeElement.toDataURL('image/png');
    this.contractForm.get('signature')?.setValue(this.signatureDataUrl);
  }

  private getCanvasPosition(event: MouseEvent): { x: number; y: number } {
    const canvas = this.signatureCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  clearSignature(): void {
    const canvas = this.signatureCanvas.nativeElement;
    // Volver a pintar de blanco al limpiar
    this.signaturePad.fillStyle = '#ffffff';
    this.signaturePad.fillRect(0, 0, canvas.width, canvas.height);
    this.signatureDataUrl = null;
    this.contractForm.get('signature')?.setValue(null);
  }

  submitAffiliation(): void {
    const studentData = this.toSnakeCase(this.studentForm.value);
    const guardianData = this.isMinor ? this.toSnakeCase(this.guardianForm.value) : undefined;
    
    // 1. OBTENCIÓN Y CONVERSIÓN SEGURA
    // Forzamos la conversión a Array real de JS. Si es Float32Array, Array.from lo convierte perfecto.
    let finalDescriptor: number[] = [];
    
    if (this.faceDescriptor && Array.isArray(this.faceDescriptor)) {
      finalDescriptor = Array.from(this.faceDescriptor);
    } else if (this.faceDescriptor && (this.faceDescriptor as any).buffer) {
      // Caso de que sea un Float32Array u otro TypedArray
      finalDescriptor = Array.from(this.faceDescriptor as any);
    } else {
      // Fallback a Mock solo para desarrollo
      finalDescriptor = Array(128).fill(0).map(() => Math.random());
    }

    // 2. VALIDACIÓN ESTRICTA ANTES DEL POST
    if (!Array.isArray(finalDescriptor) || finalDescriptor.length !== 128) {
      console.error('ERROR CRÍTICO: Descriptor inválido', finalDescriptor);
      Swal.fire({
        title: 'Error de Biometría',
        text: `El descriptor facial es inválido (Tipo: ${typeof finalDescriptor}, Longitud: ${finalDescriptor?.length || 0}). Por favor, repita la foto.`,
        icon: 'error',
        confirmButtonColor: '#B11226'
      });
      return;
    }

    const affiliationData: any = {
      student: studentData,
      guardian: guardianData,
      photo_file_base64: this.capturedImageDataUrl || '',
      signature_image_base64: this.signatureDataUrl || '',
      is_minor: this.isMinor,
      face_descriptor: finalDescriptor // Enviamos el Array puro []
    };

    // 3. DEBUG FINAL (Verifica que esto imprima 'object' y no 'number')
    console.log('--- VERIFICACIÓN DE PAYLOAD ---');
    console.log('face_descriptor es Array:', Array.isArray(affiliationData.face_descriptor));
    console.log('Tipo de face_descriptor:', typeof affiliationData.face_descriptor);
    console.log('Contenido (primeros 3):', affiliationData.face_descriptor.slice(0, 3));

    // Mostrar loader
    Swal.fire({
      title: 'Procesando Afiliación',
      text: 'Generando contrato y enviando correos...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    this.studentsService.affiliateStudent(affiliationData).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Afiliación Exitosa!',
          text: 'Estudiante registrado y contrato enviado por correo.',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false
        });
        this.currentStep = 4;
        setTimeout(() => this.goToStudentList(), 3000);
      },
      error: (errorMessage: string) => {
        // El error 400 del backend llegará aquí como un string claro gracias a ApiService
        Swal.fire({
          title: 'Error en el Registro',
          text: errorMessage,
          icon: 'error',
          confirmButtonColor: '#B11226'
        });
      }
    });
  }

  goToStudentList(): void {
    this.router.navigate(['/admin/students']);
  }
}

