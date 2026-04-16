import {
  Component, signal, ViewChild, ElementRef,
  OnDestroy, AfterViewInit, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ApiService } from '@shared/services/api/api.service';
import { environment } from '@environments/environment';

type AttendanceState =
  | 'requesting-camera'
  | 'idle'
  | 'scanning'
  | 'pick-schedule'   // múltiples clases en curso → el usuario elige
  | 'success'
  | 'error';

interface Schedule {
  id: string;
  name: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  day: string;
}

interface ScheduleInfo {
  current_day: string;
  current_time: string;
  in_progress: Schedule[];
  upcoming_today: Schedule[];
}

interface MatchedStudent {
  id: string;
  full_name: string;
  confidence: number;
}

interface IdentifyScheduleResponse {
  student: any;
  confidence: number;
  message: string;
  schedule: ScheduleInfo;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class AttendanceComponent implements AfterViewInit, OnDestroy {

  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasRef!: ElementRef<HTMLCanvasElement>;

  state = signal<AttendanceState>('requesting-camera');
  errorMessage = signal<string>('');
  matchedStudent = signal<MatchedStudent | null>(null);
  scheduleInfo = signal<ScheduleInfo | null>(null);
  registeredSchedule = signal<Schedule | null>(null);
  backendMessage = signal<string>('');

  // Guardamos el estudiante temporalmente mientras elige clase
  private pendingStudent: any = null;
  private pendingConfidence = 0;

  private stream: MediaStream | null = null;

  constructor(
    private readonly router: Router,
    private readonly api: ApiService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngAfterViewInit(): Promise<void> {
    await this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  private async startCamera(): Promise<void> {
    this.state.set('requesting-camera');
    this.cdr.detectChanges(); // forzar render del *ngIf antes de acceder al DOM

    // Esperar un tick para que Angular renderice el <video> dentro del *ngIf
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }
      });
      const video = this.videoRef.nativeElement;
      video.srcObject = this.stream;
      await video.play();
      this.state.set('idle');
    } catch (e: any) {
      console.error('[Camera] Error name:', e?.name, '| message:', e?.message, '| full:', e);
      const denied = e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError';
      const notFound = e?.name === 'NotFoundError';
      this.errorMessage.set(
        denied   ? 'Permiso de cámara denegado. Habilítalo en la configuración del navegador.' :
        notFound ? 'No se encontró ninguna cámara en este dispositivo.' :
                   `No se pudo acceder a la cámara. (${e?.name}: ${e?.message})`
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
    this.scheduleInfo.set(null);
    this.registeredSchedule.set(null);
    this.errorMessage.set('');

    const imageBase64 = this.captureFrame();

    this.api.post<IdentifyScheduleResponse>(
      `face/identify-schedule`,
      { image: imageBase64 }
    ).subscribe({
      next: (res) => {
        const { student, confidence, message, schedule } = res;
        this.scheduleInfo.set(schedule);
        this.backendMessage.set(message);

        if (schedule.in_progress.length === 1) {
          // Una sola clase en curso → registrar automáticamente
          this.recordAttendance(student, confidence, schedule.in_progress[0]);
        } else if (schedule.in_progress.length > 1) {
          // Varias clases en curso → el usuario elige
          this.pendingStudent = student;
          this.pendingConfidence = confidence;
          this.matchedStudent.set({ id: student.id, full_name: student.full_name, confidence });
          this.stopCamera();
          this.state.set('pick-schedule');
        } else {
          // Sin clases en curso — mostrar próximas pero no registrar asistencia
          this.matchedStudent.set({ id: student.id, full_name: student.full_name, confidence });
          this.errorMessage.set(
            schedule.upcoming_today.length > 0
              ? `No hay clase en curso ahora. Próxima: ${schedule.upcoming_today[0].name} a las ${schedule.upcoming_today[0].startTime}.`
              : 'No tienes clases programadas para hoy.'
          );
          this.stopCamera();
          this.state.set('error');
        }
      },
      error: (err) => {
        const msg = err?.message ?? err?.error?.error ?? 'Rostro no reconocido en el sistema.';
        this.errorMessage.set(msg);
        this.state.set('error');
      }
    });
  }

  /** Llamado cuando el usuario elige una clase de la lista */
  pickSchedule(schedule: Schedule): void {
    if (!this.pendingStudent) return;
    this.recordAttendance(this.pendingStudent, this.pendingConfidence, schedule);
  }

  private recordAttendance(student: any, confidence: number, schedule: Schedule): void {
    const now = new Date().toISOString();
    this.api.post(
      `attendance`,
      {
        studentId: student.id,
        classScheduleId: schedule.id,
        arrivalTime: now,
        status: 'presente'
      }
    ).subscribe({
      next: () => {
        this.matchedStudent.set({ id: student.id, full_name: student.full_name, confidence });
        this.registeredSchedule.set(schedule);
        this.state.set('success');
        this.stopCamera();
      },
      error: (err) => {
        const msg = err?.message ?? err?.error?.error ?? '';
        console.error('[Attendance] recordAttendance error:', JSON.stringify(err), 'msg:', msg);
        if (msg.includes('Ya existe')) {
          this.matchedStudent.set({ id: student.id, full_name: student.full_name, confidence });
          this.registeredSchedule.set(schedule);
          this.errorMessage.set('Ya registraste asistencia para esta clase hoy.');
          this.state.set('success');
          this.stopCamera();
        } else {
          this.errorMessage.set('Rostro reconocido pero no se pudo registrar la asistencia.');
          this.state.set('error');
        }
      }
    });
  }

  async retry(): Promise<void> {
    this.errorMessage.set('');
    this.matchedStudent.set(null);
    this.scheduleInfo.set(null);
    this.registeredSchedule.set(null);
    this.pendingStudent = null;
    await this.startCamera();
  }

  async nextStudent(): Promise<void> {
    this.errorMessage.set('');
    this.matchedStudent.set(null);
    this.scheduleInfo.set(null);
    this.registeredSchedule.set(null);
    this.pendingStudent = null;
    await this.startCamera();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
