import { Component, Input, Output, EventEmitter, ContentChildren, QueryList, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'badge' | 'avatar-text' | 'status';
  sortable?: boolean;
}

export interface TableAction {
  name: string;
  icon: string;
  color: string;
  tooltip: string;
  hidden?: (row: any) => boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() actions: TableAction[] = [];
  @Input() isLoading: boolean = false;
  @Input() emptyMessage: string = 'No se encontraron registros';

  @Output() actionClicked = new EventEmitter<{ action: string, row: any }>();
  @Output() rowClicked = new EventEmitter<any>();

  onAction(actionName: string, row: any, event: Event): void {
    event.stopPropagation();
    this.actionClicked.emit({ action: actionName, row });
  }

  onRowClick(row: any): void {
    this.rowClicked.emit(row);
  }
}
