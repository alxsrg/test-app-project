import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  NgZone,
  OnChanges,
  Output,
  signal,
  SimpleChanges
} from '@angular/core';
import { Annotation } from '../../models/annotation.model';
import { animationFrameScheduler, asapScheduler, fromEvent } from 'rxjs';
import { auditTime, map, switchMap, takeUntil } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export const RAF_SCHEDULER = typeof requestAnimationFrame !== 'undefined' ? animationFrameScheduler : asapScheduler;

@Component({
  standalone: true,
  selector: 'app-annotation',
  templateUrl: './annotation.component.html',
  styleUrls: ['./annotation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnnotationComponent implements AfterViewInit, OnChanges {
  @Input() annotation!: Annotation;
  @Input() zoom: number = 1;
  @Output() delete = new EventEmitter<string>();
  @Output() update = new EventEmitter<{ id: string, updates: Partial<Annotation> }>();

  currentPosition = signal({ x: 0, y: 0 });

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _elementRef = inject(ElementRef<HTMLElement>);
  private readonly _ngZone = inject(NgZone);
  private readonly _documentRef = inject(DOCUMENT);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['annotation']) {
      this.currentPosition.set({ x: this.annotation.x, y: this.annotation.y });
    }
  }

  ngAfterViewInit(): void {
    this.setupDragStreams();
  }

  private setupDragStreams(): void {
    this._ngZone.runOutsideAngular(() => {
      const mousedown$ = fromEvent<MouseEvent>(this._elementRef.nativeElement, 'mousedown');
      const mousemove$ = fromEvent<MouseEvent>(this._documentRef, 'mousemove');
      const mouseup$ = fromEvent<MouseEvent>(this._documentRef, 'mouseup');

      mousedown$
        .pipe(
          switchMap((startEvent) => {
            const startX = startEvent.clientX;
            const startY = startEvent.clientY;
            const originalX = this.annotation.x;
            const originalY = this.annotation.y;

            startEvent.preventDefault();
            startEvent.stopPropagation();

            return mousemove$.pipe(
              auditTime(0, RAF_SCHEDULER),
              map((moveEvent) => {
                const deltaX = (moveEvent.clientX - startX) / this.zoom;
                const deltaY = (moveEvent.clientY - startY) / this.zoom;
                return { x: originalX + deltaX, y: originalY + deltaY };
              }),
              takeUntil(mouseup$)
            );
          }),
          takeUntilDestroyed(this._destroyRef)
        )
        .subscribe((pos) => {
          this._ngZone.run(() => {
            this.currentPosition.set(pos);
          });
        });

      mouseup$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe(() => {
        const pos = this.currentPosition();
        this.update.emit({ id: this.annotation.id, updates: { x: pos.x, y: pos.y } });
      });
    });
  }

  onDelete(): void {
    this.delete.emit(this.annotation.id);
  }
}
