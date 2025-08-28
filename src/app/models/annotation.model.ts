export interface Annotation {
  id: string;
  type: 'text' | 'image';
  content: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  pageNumber: number;
  file?: File;
}
