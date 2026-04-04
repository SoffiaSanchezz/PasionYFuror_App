import {
  Component, signal, ViewChild, ElementRef,
  OnDestroy, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import * as faceapi from 'face-api.js';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

type AttendanceState = 'loading-models' | 'requesting-camera' | 'idle' | 'scanning' | 'success' | 'error';

interface MatchedStudent {
  id: string;
  full_name: string;
}

const MATCH_THRESHOLD = 0.55;
const MODELS_PATH = 'assets/models';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class AttendanceComponent implements AfterViewInit, OnDestroy {

  // static: true — disponible desde ngAfterViewInit aunque el elemento esté oculto con CSS
  @ViewChild('videoEl', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  state = signal<AttendanceState>('loading-models');
  errorMessage = signal<string>('');
  matchedStudent = signal<MatchedStudent | null>(null);

  private stream: MediaStream | null = null;
  private modelsLoaded = false;

  constructor(
    private readonly router: Router,
    private readonly http: HttpClient
  ) {}

  async ngAfterViewInit(): Promise<void> {
    console.log('[Attendance] Iniciando carga de modelos...');
    await this.loadModels();
    await this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  private async loadModels(): Promise<void> {
    this.state.set('loading-models');
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_PATH),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_PATH),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_PATH),
      ]);
      this.modelsLoaded = true;
      console.log('[Attendance] Modelos cargados correctamente');
    } catch (e) {
      console.error('[Attendance] Error cargando modelos:', e);
      this.errorMessage.set('No se pudieron cargar los modelos de reconocimiento.');
      this.state.set('error');
    }
  }

  private async startCamera(): Promise<void> {
    if (!this.modelsLoaded) return;
    this.state.set('requesting-camera');
    console.log('[Attendance] Solicitando permiso de cámara...');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }
      });
      console.log('[Attendance] Permiso concedido, asignando stream al video...');
      const video = this.videoRef.nativeElement;
      video.srcObject = this.stream;
      await video.play();
      console.log('[Attendance] Video reproduciéndose correctamente');
      this.state.set('idle');
    } catch (e: any) {
      console.error('[Attendance] Error de cámara:', e?.name, e?.message);
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

  async register(): Promise<void> {
    if (this.state() !== 'idle') return;
    this.state.set('scanning');
    this.matchedStudent.set(null);

    try {
      const video = this.videoRef.nativeElement;
      console.log('[Attendance] Detectando rostro...');
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        console.warn('[Attendance] No se detectó ningún rostro');
        this.errorMessage.set('No se detectó ningún rostro. Asegúrate de estar frente a la cámara.');
        this.state.set('error');
        return;
      }

      console.log('[Attendance] Rostro detectado, comparando con base de datos...');
      const canvas = this.canvasRef.nativeElement;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')!.drawImage(video, 0, 0);

      const capturedDescriptor = detection.descriptor;
      const match = await this.findMatch(capturedDescriptor);

      if (match) {
        console.log('[Attendance] Estudiante reconocido:', match.full_name);
        this.matchedStudent.set(match);
        this.state.set('success');
        this.stopCamera();
      } else {
        console.warn('[Attendance] Rostro no reconocido en el sistema');
        this.errorMessage.set('Rostro no reconocido en el sistema.');
        this.state.set('error');
      }

    } catch (e) {
      console.error('[Attendance] Error en reconocimiento:', e);
      this.errorMessage.set('Ocurrió un error durante el escaneo.');
      this.state.set('error');
    }
  }

  private async findMatch(capturedDescriptor: Float32Array): Promise<MatchedStudent | null> {
    return new Promise((resolve) => {
      this.http.get<any[]>(`${environment.apiUrl}/students`).subscribe({
        next: (students) => {
          let bestMatch: MatchedStudent | null = null;
          let bestDistance = Infinity;

          for (const student of students) {
            if (!student.face_descriptor) continue;
            try {
              const stored: number[] = typeof student.face_descriptor === 'string'
                ? JSON.parse(student.face_descriptor)
                : student.face_descriptor;
              const storedDescriptor = new Float32Array(stored);
              const distance = faceapi.euclideanDistance(capturedDescriptor, storedDescriptor);
              if (distance < bestDistance) {
                bestDistance = distance;
                bestMatch = { id: student.id, full_name: student.full_name };
              }
            } catch { /* descriptor inválido */ }
          }

          console.log(`[Attendance] Mejor distancia: ${bestDistance.toFixed(4)} (umbral: ${MATCH_THRESHOLD})`);
          resolve(bestDistance <= MATCH_THRESHOLD ? bestMatch : null);
        },
        error: (e) => {
          console.error('[Attendance] Error al obtener estudiantes:', e);
          resolve(null);
        }
      });
    });
  }

  async retry(): Promise<void> {
    this.errorMessage.set('');
    this.matchedStudent.set(null);
    await this.startCamera();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
