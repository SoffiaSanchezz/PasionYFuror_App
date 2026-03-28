import { Animation, createAnimation } from '@ionic/angular';

/**
 * Animación personalizada para transiciones de navegación en Ionic.
 * Implementa un efecto de "Fade-Slide" (desvanecimiento con deslizamiento sutil)
 * que brinda una sensación más moderna y fluida que los valores por defecto.
 */
export const customNavAnimation = (baseEl: HTMLElement, opts?: any): Animation => {
    const DURATION = 400;

    const enteringAnimation = createAnimation()
        .addElement(opts.enteringEl)
        .duration(DURATION)
        .easing('cubic-bezier(0.36,0.66,0.04,1)')
        .fromTo('opacity', 0.01, 1)
        .fromTo('transform', 'translateY(20px)', 'translateY(0px)');

    const leavingAnimation = createAnimation()
        .addElement(opts.leavingEl)
        .duration(DURATION)
        .easing('cubic-bezier(0.36,0.66,0.04,1)')
        .fromTo('opacity', 1, 0)
        .fromTo('transform', 'scale(1)', 'scale(0.95)');

    return createAnimation()
        .addAnimation([enteringAnimation, leavingAnimation]);
};
