import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Document } from '../../models/document.model';
import { DocumentService } from '../../services/document.service';
import { PageViewerComponent } from '../page-viewer/page-viewer.component';
import { Annotation } from '../../models/annotation.model';

@Component({
  standalone: true,
  selector: 'app-document-viewer',
  templateUrl: './document-viewer.component.html',
  styleUrls: ['./document-viewer.component.scss'],
  imports: [PageViewerComponent],
  providers: [DocumentService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentViewerComponent implements OnInit {
  document = signal<Document | null>(null);
  annotations = signal<Annotation[]>([]);
  zoom = signal(1);

  readonly zoomPercentage = computed(() => (this.zoom() * 100).toFixed(0));
  readonly hasDocument = computed(() => this.document() !== null);

  private readonly MIN_ZOOM = 0.25;
  private readonly MAX_ZOOM = 4;
  private readonly ZOOM_STEP = 0.25;

  private route = inject(ActivatedRoute);
  private documentService = inject(DocumentService);

  ngOnInit(): void {
    this.loadDocument();
    this.loadAnnotations();
  }

  private loadDocument(): void {
    const documentId = this.route.snapshot.paramMap.get('id') ?? '1';
    this.documentService.getDocument(documentId).subscribe({
      next: (document) => this.document.set(document),
      error: (error) => console.error('Error loading document:', error)
    });
  }

  private loadAnnotations(): void {
    this.documentService.getAnnotations().subscribe({
      next: (annotations) => this.annotations.set(annotations),
      error: (error) => console.error('Error loading annotations:', error)
    });
  }

  zoomIn(): void {
    const currentZoom = this.zoom();
    if (currentZoom < this.MAX_ZOOM) {
      const newZoom = Math.min(this.MAX_ZOOM, currentZoom + this.ZOOM_STEP);
      this.zoom.set(newZoom);
    }
  }

  zoomOut(): void {
    const currentZoom = this.zoom();
    if (currentZoom > this.MIN_ZOOM) {
      const newZoom = Math.max(this.MIN_ZOOM, currentZoom - this.ZOOM_STEP);
      this.zoom.set(newZoom);
    }
  }

  resetZoom(): void {
    this.zoom.set(1);
  }

  addAnnotation(annotationData: Omit<Annotation, 'id'>): void {
    this.documentService.addAnnotation(annotationData).subscribe({
      next: () => {
        this.loadAnnotations();
      },
      error: (error) => console.error('Error adding annotation:', error)
    });
  }

  onUpdateAnnotation(update: { id: string, updates: Partial<Annotation> }): void {
    this.documentService.updateAnnotation(update.id, update.updates).subscribe({
      next: () => {
        this.loadAnnotations();
      },
      error: (error) => console.error('Error updating annotation:', error)
    });
  }

  onDeleteAnnotation(id: string): void {
    this.documentService.deleteAnnotation(id).subscribe({
      next: (success) => {
        if (success) {
          this.loadAnnotations();
        }
      },
      error: (error) => console.error('Error deleting annotation:', error)
    });
  }

  saveDocument(): void {
    const currentDocument = this.document();

    if (currentDocument) {
      this.documentService.saveDocument(currentDocument).subscribe({
        next: (savedDocument) => {
          console.log('Document saved successfully:', savedDocument);
        },
        error: (error) => console.error('Error saving document:', error)
      });
    }
  }
}
