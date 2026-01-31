import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})
export class CardComponent {
  title = input<string>('');
  subtitle = input<string>('');
  padding = input<boolean>(true);
  hoverable = input<boolean>(false);

  cardClasses(): string {
    const base = 'card-root';
    const hover = this.hoverable() ? 'card-hoverable' : '';
    return `${base} ${hover}`.trim();
  }

  contentClasses(): string {
    return this.padding() ? 'content-padded' : 'content-unpadded';
  }
}
