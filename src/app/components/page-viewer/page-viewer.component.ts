import { Component, EventEmitter, inject, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { DocumentPage } from '../../models/document.model';
import { AnnotationModalComponent } from '../annotation-modal/annotation-modal.component';
import { AnnotationComponent } from '../annotation/annotation.component';
import { Dialog } from '@angular/cdk/dialog';
import { Annotation } from '../../models/annotation.model';

@Component({
  standalone: true,
  selector: 'app-page-viewer',
  templateUrl: './page-viewer.component.html',
  styleUrls: ['./page-viewer.component.scss'],
  imports: [AnnotationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageViewerComponent {
  @Input() page!: DocumentPage;
  @Input() zoom: number = 1;
  @Input() annotations: Annotation[] = [];
  @Output() addAnnotation = new EventEmitter<Omit<Annotation, 'id'>>();
  @Output() updateAnnotation = new EventEmitter<{ id: string, updates: Partial<Annotation> }>();
  @Output() deleteAnnotation = new EventEmitter<string>();

  private dialog = inject(Dialog);

  onPageClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    const rect = target.getBoundingClientRect();
    const x = (event.clientX - rect.left) / this.zoom;
    const y = (event.clientY - rect.top) / this.zoom;

    this.dialog.open<Omit<Annotation, 'id'>>(AnnotationModalComponent, {
      data: { position: { x, y }, pageNumber: this.page.number }
    }).closed.subscribe(result => {
      if (result) {
        this.onAnnotationSave(result);
      }
    });
  }

  onAnnotationSave(annotationData: Omit<Annotation, 'id'>): void {
    this.addAnnotation.emit(annotationData);
  }

  onDeleteAnnotation(id: string): void {
    this.deleteAnnotation.emit(id);
  }

  onUpdateAnnotation(update: { id: string, updates: Partial<Annotation> }): void {
    this.updateAnnotation.emit(update);
  }
}
