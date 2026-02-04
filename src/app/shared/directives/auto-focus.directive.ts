import { Directive, ElementRef, afterNextRender } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true,
})
export class AutoFocusDirective {
  constructor(private el: ElementRef) {
    afterNextRender(() => {
      this.el.nativeElement.focus();
    });
  }
}
