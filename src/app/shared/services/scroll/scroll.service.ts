import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

export type ScrollDirection = 'up' | 'down';

/**
 * ScrollService — detecta la dirección del scroll en CUALQUIER contenedor.
 *
 * Estrategia:
 *  1. capture:true en 'scroll' → captura scroll de window, div, main, etc.
 *  2. 'ionScroll' → captura scroll de ion-content (Ionic)
 *  3. Para window/document, usa window.pageYOffset (no scrollTop del target)
 */
@Injectable({ providedIn: 'root' })
export class ScrollService implements OnDestroy {
  private readonly _dir$ = new Subject<ScrollDirection>();
  readonly scroll$ = this._dir$.asObservable();

  private lastY = 0;
  private readonly THRESHOLD = 8;
  private readonly MIN_OFFSET = 40;

  private readonly scrollHandler = (e: Event): void => {
    const target = e.target as Element | Document | null;
    if (!target) return;

    let st: number;

    if (target === document || target === document.documentElement || target === document.body) {
      st = window.pageYOffset || document.documentElement.scrollTop || 0;
    } else {
      st = (target as HTMLElement).scrollTop ?? 0;
    }

    this._emit(st);
  };

  private readonly ionScrollHandler = (e: Event): void => {
    const st: number = (e as CustomEvent).detail?.scrollTop ?? 0;
    this._emit(st);
  };

  constructor() {
    document.addEventListener('scroll', this.scrollHandler, { capture: true, passive: true });
    document.addEventListener('ionScroll', this.ionScrollHandler, { passive: true });
  }

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.scrollHandler, { capture: true } as any);
    document.removeEventListener('ionScroll', this.ionScrollHandler);
    this._dir$.complete();
  }

  /** Resetea la posición — llamar al cambiar de ruta para que el nav vuelva a aparecer */
  reset(): void {
    this.lastY = 0;
    this._dir$.next('up');
  }

  private _emit(st: number): void {
    if (Math.abs(st - this.lastY) <= this.THRESHOLD) return;
    const dir: ScrollDirection = (st > this.lastY && st > this.MIN_OFFSET) ? 'down' : 'up';
    this.lastY = st <= 0 ? 0 : st;
    this._dir$.next(dir);
  }
}
