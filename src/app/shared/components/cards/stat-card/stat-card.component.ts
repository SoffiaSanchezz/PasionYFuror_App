import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss']
})
export class StatCardComponent {
  @Input() label: string = '';
  @Input() value: string | number = '';
  @Input() icon: string = 'bi-people-fill';
  @Input() colorClass: string = 'students'; // students, classes, revenue, attendance
  @Input() change: string = '';
  @Input() changeType: 'positive' | 'negative' | 'neutral' = 'neutral';

  get changeIcon(): string {
    switch (this.changeType) {
      case 'positive': return 'bi-arrow-up';
      case 'negative': return 'bi-arrow-down';
      default: return 'bi-dash';
    }
  }
}
