import { Component, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormControl, NonNullableFormBuilder, FormGroup, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  calculateImageDimensions,
  convertFileToBase64,
  getImageNaturalDimensions,
  getImageNaturalDimensionsFromUrl
} from '../../utils/image.utils';
import { Annotation } from '../../models/annotation.model';

@Component({
  standalone: true,
  selector: 'app-annotation-modal',
  templateUrl: './annotation-modal.component.html',
  styleUrls: ['./annotation-modal.component.scss'],
  imports: [ReactiveFormsModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnnotationModalComponent {
  form: FormGroup<{
    annotationType: FormControl<'text' | 'image' | 'upload'>;
    annotationContent: FormControl<string>;
    imageUrl: FormControl<string>;
  }>;

  selectedFile: File | null = null;

  data: { position: { x: number; y: number }, pageNumber: number } = inject(DIALOG_DATA);

  private _dialogRef = inject(DialogRef<Omit<Annotation, 'id'> | null>);
  private _formBuilder = inject(NonNullableFormBuilder);
  private _cdr = inject(ChangeDetectorRef);

  constructor() {
    this.form = this._formBuilder.group({
      annotationType: this._formBuilder.control<'text' | 'image' | 'upload'>('text', { validators: [Validators.required] }),
      annotationContent: this._formBuilder.control('', { validators: [Validators.required, Validators.maxLength(500)] }),
      imageUrl: this._formBuilder.control('')
    });

    this.form.controls.annotationType.valueChanges.subscribe(() => {
      this.form.controls.annotationContent.reset('');
      this.form.controls.imageUrl.reset('');
      this.selectedFile = null;
    });
  }

  get annotationType() {
    return this.form.controls.annotationType.value;
  }

  get annotationContent() {
    return this.form.controls.annotationContent.value;
  }

  get imageUrl() {
    return this.form.controls.imageUrl.value;
  }

  async getAnnotationData(): Promise<Omit<Annotation, 'id'>> {
    const { position, pageNumber } = this.data;
    const imageUrl = this.imageUrl.trim();

    let naturalDimensions: { width: number; height: number };
    let imageDimensions: { width: number; height: number };

    switch (this.annotationType) {
      case 'text':
        return {
          type: 'text',
          content: this.annotationContent.trim(),
          x: position.x,
          y: position.y,
          pageNumber
        };
      case 'image':
        naturalDimensions = await getImageNaturalDimensionsFromUrl(imageUrl, { width: 128, height: 128 });
        imageDimensions = calculateImageDimensions(naturalDimensions.width, naturalDimensions.height);

        return {
          type: 'image',
          content: imageUrl,
          x: position.x,
          y: position.y,
          pageNumber,
          width: imageDimensions.width,
          height: imageDimensions.height
        };
      case 'upload':
        naturalDimensions = await getImageNaturalDimensions(this.imageUrl);
        imageDimensions = calculateImageDimensions(naturalDimensions.width, naturalDimensions.height);

        return {
          type: 'image',
          content: imageUrl,
          x: position.x,
          y: position.y,
          pageNumber: pageNumber,
          width: imageDimensions?.width,
          height: imageDimensions?.height
        };
    }
  }

  onCancel(): void {
    this._dialogRef.close();
  }

  async onSave(): Promise<void> {
    this._dialogRef.close(await this.getAnnotationData());
  }

  async onFileSelected(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.selectedFile = target.files[0];

      const base64String = await convertFileToBase64(this.selectedFile);

      this.form.controls.imageUrl.setValue(base64String);
      this._cdr.markForCheck();
    }
  }

  get isValid(): boolean {
    switch (this.annotationType) {
      case 'text':
        return this.form.controls.annotationContent.valid && this.annotationContent.trim().length > 0;
      case 'image':
      case 'upload':
        return this.form.controls.imageUrl.valid && this.imageUrl.trim().length > 0;
    }
  }
}
