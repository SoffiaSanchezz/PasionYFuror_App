import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss']
})
export class SearchInputComponent {
  @Input() placeholder: string = 'Buscar...';
  @Input() value: string = '';
  @Output() onSearch = new EventEmitter<string>();

  onInputChange(): void {
    this.onSearch.emit(this.value);
  }

  clearSearch(): void {
    this.value = '';
    this.onSearch.emit(this.value);
  }
}
