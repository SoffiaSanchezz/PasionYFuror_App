import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

export type ScrollDirection = 'up' | 'down';

/**
 * ScrollService — detecta dirección de scroll de forma confiable.
 *
 * Arquitectura:
 *  - Un único contenedor activo se registra a la vez (el que está visible).
 *  - Las páginas llaman a register() al entrar y unregister() al salir.
 *  - Si ninguna página registra un contenedor, escucha window como fallback.
 *  - El estado se resetea completamente al cambiar de contenedor.
 */
@Injectable({ providedIn: 'root' })
export class ScrollService implements OnDestroy {

  private readonly _dir$ = new BehaviorSubject<ScrollDirection>('up');
  readonly scroll$ = this._dir$.asObservable().pipe(distinctUntilChanged());

  private lastY = 0;
  private ticking = false;
  private activeContainer: HTMLElement | null = null;

  // Thresholds
  private readonly THRESHOLD = 10;   // px mínimos de delta para emitir
  private readonly MIN_OFFSET = 50;  // px mínimos de scroll para ocultar

  // Listener del contenedor activo
  private containerListener: ((e: Event) => void) | null = null;

  // Listener de window (fallback cuando no hay contenedor registrado)
  private readonly windowListener = (): void => {
    if (this.activeContainer) return; // hay contenedor registrado, ignorar window
    this._scheduleEmit(window.scrollY ?? window.pageYOffset ?? 0);
  };

  constructor(private ngZone: NgZone) {
    // Fallback: escucha window para páginas sin ion-content
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.windowListener, { passive: true });
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.windowListener);
    this._detachContainer();
    this._dir$.complete();
  }

  /**
   * Registra el contenedor de scroll activo (llamar en ionViewWillEnter / ngOnInit).
   * Acepta HTMLElement (div, main) o IonContent nativo.
   */
  register(container: HTMLElement): void {
    if (this.activeContainer === container) return;
    this._detachContainer();
    this.activeContainer = container;
    this.lastY = 0;
    this._dir$.next('up');

    this.containerListener = (): void => {
      this._scheduleEmit(container.scrollTop);
    };

    this.ngZone.runOutsideAngular(() => {
      container.addEventListener('scroll', this.containerListener!, { passive: true });
    });
  }

  /**
   * Registra un ion-content de Ionic escuchando su evento ionScroll.
   * Usar cuando el contenedor es <ion-content>.
   */
  registerIonContent(el: HTMLElement): void {
    if (this.activeContainer === el) return;
    this._detachContainer();
    this.activeContainer = el;
    this.lastY = 0;
    this._dir$.next('up');

    this.containerListener = (e: Event): void => {
      const st: number = (e as CustomEvent).detail?.scrollTop ?? 0;
      this._scheduleEmit(st);
    };

    this.ngZone.runOutsideAngular(() => {
      el.addEventListener('ionScroll', this.containerListener!, { passive: true });
    });
  }

  /**
   * Desregistra el contenedor activo (llamar en ionViewWillLeave / ngOnDestroy).
   */
  unregister(container: HTMLElement): void {
    if (this.activeContainer !== container) return;
    this._detachContainer();
    this.lastY = 0;
    this._dir$.next('up');
  }

  /**
   * Resetea el estado — el nav vuelve a aparecer.
   * Llamar al navegar entre rutas.
   */
  reset(): void {
    this.lastY = 0;
    this._dir$.next('up');
  }

  // ── Privados ──────────────────────────────────────────────────────────

  private _detachContainer(): void {
    if (this.activeContainer && this.containerListener) {
      this.activeContainer.removeEventListener('scroll', this.containerListener);
      this.activeContainer.removeEventListener('ionScroll', this.containerListener);
    }
    this.activeContainer = null;
    this.containerListener = null;
  }

  private _scheduleEmit(scrollTop: number): void {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      this.ticking = false;
      this._emit(scrollTop);
    });
  }

  private _emit(st: number): void {
    const delta = st - this.lastY;

    if (Math.abs(delta) < this.THRESHOLD) return;

    const dir: ScrollDirection = delta > 0 && st > this.MIN_OFFSET ? 'down' : 'up';

    this.lastY = st < 0 ? 0 : st;

    // Volver al zone de Angular solo si el valor cambia
    if (this._dir$.value !== dir) {
      this.ngZone.run(() => this._dir$.next(dir));
    }
  }
}
