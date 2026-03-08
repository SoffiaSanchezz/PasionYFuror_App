import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { IonicModule } from '@ionic/angular';
import { StudentsService, Student } from '../../../../../../shared/services/students/students.service';

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
  }

  initForms(): void {
    this.studentForm = this.fb.group({
      fullName: ['', Validators.required],
      documentId: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
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
      
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      if (context) {
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);
        
        this.capturedImageDataUrl = canvas.toDataURL('image/png');
        if (this.capturedImageDataUrl) {
          this.capturedImage = this.sanitizer.bypassSecurityTrustUrl(this.capturedImageDataUrl);
        }
        
        this.stopWebcam();
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
    this.signaturePad.strokeStyle = '#000000';
    this.signaturePad.lineWidth = 2;
    
    canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    canvas.addEventListener('mousemove', this.draw.bind(this));
    canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    
    // Soporte táctil
    canvas.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
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
    this.signaturePad.clearRect(0, 0, canvas.width, canvas.height);
    this.signatureDataUrl = null;
    this.contractForm.get('signature')?.setValue(null);
  }

  submitAffiliation(): void {
    const studentData = this.toSnakeCase(this.studentForm.value);
    const guardianData = this.isMinor ? this.toSnakeCase(this.guardianForm.value) : undefined;
    
    const affiliationData: any = {
      student: studentData,
      guardian: guardianData,
      photo_file_base64: this.capturedImageDataUrl || '',
      signature_image_base64: this.signatureDataUrl || '',
      is_minor: this.isMinor,
      face_descriptor: this.faceDescriptor
    };

    this.studentsService.affiliateStudent(affiliationData).subscribe({
      next: () => {
        this.currentStep = 4;
        setTimeout(() => this.goToStudentList(), 3000);
      },
      error: (error: any) => {
        console.error('Error:', error);
        alert('Error al realizar la afiliación.');
      }
    });
  }

  goToStudentList(): void {
    this.router.navigate(['/admin/students']);
  }
}

