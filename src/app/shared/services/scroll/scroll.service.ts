import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

export type ScrollDirection = 'up' | 'down';

/**
 * ScrollService — detecta la dirección del scroll en CUALQUIER contenedor
 * de la aplicación usando event capture (capture: true).
 *
 * Funciona con:
 *  - window / document
 *  - ion-content (Ionic)
 *  - div/main con overflow-y: auto/scroll
 *  - cualquier contenedor scrolleable
 */
@Injectable({ providedIn: 'root' })
export class ScrollService implements OnDestroy {
  private readonly direction$ = new Subject<ScrollDirection>();
  readonly scroll$ = this.direction$.asObservable();

  private lastY = 0;
  private readonly THRESHOLD = 8;
  private readonly MIN_OFFSET = 40;

  // Listener con capture:true para interceptar scroll de cualquier elemento
  private readonly handler = (e: Event): void => {
    const target = e.target as Element | null;
    if (!target) return;

    // Obtener posición de scroll del elemento que scrolleó
    const st = (target as any).scrollTop
      ?? (target === document.documentElement || target === document.body
          ? window.pageYOffset
          : 0);

    if (Math.abs(st - this.lastY) <= this.THRESHOLD) return;

    const dir: ScrollDirection = (st > this.lastY && st > this.MIN_OFFSET) ? 'down' : 'up';
    this.lastY = st <= 0 ? 0 : st;
    this.direction$.next(dir);
  };

  constructor() {
    // capture:true → recibe el evento ANTES de que llegue al target
    // passive:true → no bloquea el scroll (performance)
    document.addEventListener('scroll', this.handler, { capture: true, passive: true });

    // También escucha ionScroll de Ionic (ion-content)
    document.addEventListener('ionScroll', (e: Event) => {
      const st = (e as CustomEvent).detail?.scrollTop ?? 0;
      if (Math.abs(st - this.lastY) <= this.THRESHOLD) return;
      const dir: ScrollDirection = (st > this.lastY && st > this.MIN_OFFSET) ? 'down' : 'up';
      this.lastY = st <= 0 ? 0 : st;
      this.direction$.next(dir);
    }, { passive: true });
  }

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.handler, { capture: true } as any);
    this.direction$.complete();
  }
}
