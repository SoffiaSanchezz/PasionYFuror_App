import {
  Directive, ElementRef, OnInit, OnDestroy, AfterViewInit
} from '@angular/core';
import { ScrollService } from '@shared/services/scroll/scroll.service';

/**
 * ScrollTrackDirective — registra automáticamente el contenedor de scroll
 * en el ScrollService cuando la vista entra en pantalla.
 *
 * Uso en ion-content:
 *   <ion-content appScrollTrack scrollEvents="true">
 *
 * Uso en div/main con overflow:
 *   <div class="page-wrapper" appScrollTrack>
 */
@Directive({
  selector: '[appScrollTrack]',
  standalone: true,
})
export class ScrollTrackDirective implements AfterViewInit, OnDestroy {

  private el: HTMLElement;

  constructor(
    private readonly ref: ElementRef<HTMLElement>,
    private readonly scrollService: ScrollService
  ) {
    this.el = this.ref.nativeElement;
  }

  ngAfterViewInit(): void {
    const tag = this.el.tagName?.toLowerCase();

    if (tag === 'ion-content') {
      // ion-content emite ionScroll, no scroll nativo
      this.scrollService.registerIonContent(this.el);
    } else {
      this.scrollService.register(this.el);
    }
  }

  ngOnDestroy(): void {
    this.scrollService.unregister(this.el);
  }
}
