import { Annotation } from './annotation.model';

export interface DocumentPage {
  number: number;
  imageUrl: string;
}

export interface Document {
  name: string;
  pages: DocumentPage[];
}

export interface DocumentWithAnnotations {
  document: Document;
  annotations: Annotation[];
}
