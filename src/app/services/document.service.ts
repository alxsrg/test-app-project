import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { Document, DocumentWithAnnotations } from '../models/document.model';
import { Annotation } from '../models/annotation.model';

@Injectable()
export class DocumentService {
  private annotations: Annotation[] = [];

  getDocument(_id: string): Observable<Document> {
    const mockDocument: Document = {
      name: 'test doc',
      pages: [
        { number: 1, imageUrl: 'pages/1.png' },
        { number: 2, imageUrl: 'pages/2.png' },
        { number: 3, imageUrl: 'pages/3.png' },
        { number: 4, imageUrl: 'pages/4.png' },
        { number: 5, imageUrl: 'pages/5.png' }
      ]
    };

    return of(mockDocument).pipe(delay(300));
  }

  getAnnotations(): Observable<Annotation[]> {
    return of([...this.annotations]);
  }

  addAnnotation(annotation: Omit<Annotation, 'id'>): Observable<Annotation> {
    const newAnnotation: Annotation = {
      ...annotation,
      id: crypto.randomUUID(),
      width: annotation.width,
      height: annotation.height
    };

    this.annotations.push(newAnnotation);

    return of(newAnnotation);
  }

  updateAnnotation(id: string, updates: Partial<Annotation>): Observable<Annotation> {
    const index = this.annotations.findIndex(a => a.id === id);

    if (index === -1) {
      return throwError(() => new Error(`Annotation with id ${ id } not found`));
    }

    this.annotations[index] = { ...this.annotations[index], ...updates };

    return of(this.annotations[index]);
  }

  deleteAnnotation(id: string): Observable<boolean> {
    const initialLength = this.annotations.length;
    this.annotations = this.annotations.filter(a => a.id !== id);

    if (this.annotations.length === initialLength) {
      return throwError(() => new Error(`Annotation with id ${ id } not found`));
    }

    return of(true);
  }

  saveDocument(document: Document): Observable<DocumentWithAnnotations> {
    const documentWithAnnotations: DocumentWithAnnotations = {
      document,
      annotations: this.annotations
    };

    console.log('Saving document with annotations:', documentWithAnnotations);

    return of(documentWithAnnotations);
  }
}
