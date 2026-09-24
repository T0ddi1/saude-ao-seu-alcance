import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  forwardRef,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import Quill from 'quill';
import { UploadService } from '../../../core/services/upload.service';
import { SwalService } from '../../../core/services/swal.service';

@Component({
  selector: 'app-quill-editor',
  standalone: true,
  template: `<div #editorHost class="quill-host"></div>`,
  styleUrl: './quill-editor.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QuillEditorComponent),
      multi: true,
    },
  ],
})
export class QuillEditorComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
  @ViewChild('editorHost', { static: true }) editorHost!: ElementRef<HTMLDivElement>;

  private uploadService = inject(UploadService);
  private swal = inject(SwalService);

  private quill: Quill | null = null;
  private valorPendente = '';
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private disabled = false;

  ngAfterViewInit(): void {
    this.quill = new Quill(this.editorHost.nativeElement, {
      theme: 'snow',
      placeholder: 'Escreva o conteúdo do artigo...',
      modules: {
        toolbar: {
          container: [
            [{ header: [2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'link', 'image'],
            ['clean'],
          ],
          handlers: {
            image: () => this.inserirImagem(),
          },
        },
      },
    });

    if (this.valorPendente) {
      this.quill.clipboard.dangerouslyPasteHTML(this.valorPendente);
    }

    this.quill.on('text-change', () => {
      const html = this.editorHost.nativeElement.querySelector('.ql-editor')?.innerHTML ?? '';
      this.onChange(html === '<p><br></p>' ? '' : html);
    });

    this.quill.on('selection-change', (range) => {
      if (!range) this.onTouched();
    });

    if (this.disabled) this.quill.disable();
  }

  ngOnDestroy(): void {
    this.quill = null;
  }

  private inserirImagem(): void {

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/gif,image/webp';
    input.style.display = 'none';

    const remover = () => input.remove();

    input.onchange = () => {
      const arquivo = input.files?.[0];
      if (!arquivo || !this.quill) {
        remover();
        return;
      }

      const range = this.quill.getSelection(true);
      this.uploadService.enviar(arquivo).subscribe({
        next: (url) => {
          this.quill!.insertEmbed(range?.index ?? 0, 'image', url, 'user');
          this.quill!.setSelection((range?.index ?? 0) + 1, 0, 'user');
          remover();
        },
        error: () => {
          this.swal.erro('Não foi possível enviar a imagem. Verifique o formato e o tamanho (até 5MB).');
          remover();
        },
      });
    };

    document.body.appendChild(input);
    input.click();
  }

  writeValue(value: string): void {
    this.valorPendente = value ?? '';
    if (this.quill) {
      const atual = this.editorHost.nativeElement.querySelector('.ql-editor')?.innerHTML ?? '';
      if (atual !== this.valorPendente) {
        this.quill.setContents([]);
        if (this.valorPendente) this.quill.clipboard.dangerouslyPasteHTML(this.valorPendente);
      }
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.quill) {
      isDisabled ? this.quill.disable() : this.quill.enable();
    }
  }
}
