import {
  Component, signal, ViewChild, ElementRef,
  OnDestroy, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

type AttendanceState = 'requesting-camera' | 'idle' | 'scanning' | 'success' | 'error';

interface MatchedStudent {
  id: string;
  full_name: string;
  confidence: number;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class AttendanceComponent implements AfterViewInit, OnDestroy {

  @ViewChild('videoEl', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  state = signal<AttendanceState>('requesting-camera');
  errorMessage = signal<string>('');
  matchedStudent = signal<MatchedStudent | null>(null);

  private stream: MediaStream | null = null;

  constructor(
    private readonly router: Router,
    private readonly http: HttpClient
  ) {}

  async ngAfterViewInit(): Promise<void> {
    await this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  private async startCamera(): Promise<void> {
    this.state.set('requesting-camera');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }
      });
      const video = this.videoRef.nativeElement;
      video.srcObject = this.stream;
      await video.play();
      this.state.set('idle');
    } catch (e: any) {
      const denied = e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError';
      const notFound = e?.name === 'NotFoundError';
      this.errorMessage.set(
        denied   ? 'Permiso de cámara denegado. Habilítalo en la configuración del navegador.' :
        notFound ? 'No se encontró ninguna cámara en este dispositivo.' :
                   'No se pudo acceder a la cámara. Verifica que no esté en uso.'
      );
      this.state.set('error');
    }
  }

  private stopCamera(): void {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }

  private captureFrame(): string {
    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.85);
  }

  async register(): Promise<void> {
    if (this.state() !== 'idle') return;
    this.state.set('scanning');
    this.matchedStudent.set(null);

    try {
      const imageBase64 = this.captureFrame();

      this.http.post<{ student: any; confidence: number }>(
        `${environment.apiUrl}/face/identify`,
        { image: imageBase64 }
      ).subscribe({
        next: ({ student, confidence }) => {
          const now = new Date().toISOString();
          this.http.post(
            `${environment.apiUrl}/attendance`,
            {
              studentId: student.id,
              classScheduleId: 1, // TODO: selección dinámica de horario
              arrivalTime: now,
              status: 'presente'
            }
          ).subscribe({
            next: () => {
              this.matchedStudent.set({ id: student.id, full_name: student.full_name, confidence });
              this.state.set('success');
              this.stopCamera();
            },
            error: (err) => {
              const msg = err?.error?.error ?? '';
              if (msg.includes('Ya existe')) {
                this.matchedStudent.set({ id: student.id, full_name: student.full_name, confidence });
                this.errorMessage.set('Ya registraste asistencia hoy.');
                this.state.set('success');
                this.stopCamera();
              } else {
                this.errorMessage.set('Rostro reconocido pero no se pudo registrar la asistencia.');
                this.state.set('error');
              }
            }
          });
        },
        error: (err) => {
          const msg = err?.error?.error ?? 'Rostro no reconocido en el sistema.';
          this.errorMessage.set(msg);
          this.state.set('error');
        }
      });

    } catch (e) {
      this.errorMessage.set('Ocurrió un error durante el escaneo.');
      this.state.set('error');
    }
  }

  async retry(): Promise<void> {
    this.errorMessage.set('');
    this.matchedStudent.set(null);
    await this.startCamera();
  }

  async nextStudent(): Promise<void> {
    this.errorMessage.set('');
    this.matchedStudent.set(null);
    await this.startCamera();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
