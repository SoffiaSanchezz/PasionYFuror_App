import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api/api.service';
import { HttpParams } from '@angular/common/http';

export interface SearchResult {
  students: { id: string; full_name: string; document_id: string; status: string }[];
  payments: { id: string; studentName: string; receiptId: string; planAcquired: string; amountPaid: number }[];
  activities: { id: string; title: string; description?: string; eventDate: string; eventTime: string }[];
}

const EMPTY: SearchResult = { students: [], payments: [], activities: [] };

@Injectable({ providedIn: 'root' })
export class SearchService {
  constructor(private readonly api: ApiService) {}

  /** Busca con debounce — pasa un Observable<string> del input */
  search(term: string): Observable<SearchResult> {
    if (!term || term.trim().length < 2) return of(EMPTY);
    const params = new HttpParams().set('q', term.trim());
    return this.api.get<SearchResult>('search', params).pipe(
      catchError(() => of(EMPTY))
    );
  }
}
