import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ArticleComment } from '../../../../core/models/article.model';
import { TotemService } from '../../../../core/services/totem.service';
import { AuthService } from '../../../../core/services/auth.service';

export interface ComentarioEnviarEvento {
  texto: string;
  comentarioPaiId: number | null;
  aoConcluir: (sucesso: boolean) => void;
}

@Component({
  selector: 'app-comment-section',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonComponent],
  templateUrl: './comment-section.component.html',
  styleUrl: './comment-section.component.scss',
})
export class CommentSectionComponent {
  @Input({ required: true }) comments!: ArticleComment[];

  @Output() enviarComentario = new EventEmitter<ComentarioEnviarEvento>();
  @Output() curtirComentario = new EventEmitter<number>();

  constructor(public totem: TotemService, public authService: AuthService) {}

  message = '';
  respondendoId: number | null = null;
  respostaTexto = '';
  posted = signal(false);
  enviando = signal(false);

  get estaLogado(): boolean {
    return this.authService.estaLogado;
  }

  onSubmit(): void {
    if (!this.estaLogado || !this.message.trim() || this.enviando()) return;

    this.enviando.set(true);
    this.enviarComentario.emit({
      texto: this.message.trim(),
      comentarioPaiId: null,
      aoConcluir: (sucesso) => {
        this.enviando.set(false);
        if (sucesso) {
          this.message = '';
          this.posted.set(true);
        }
      },
    });
  }

  abrirResposta(comentarioId: number): void {
    this.respondendoId = this.respondendoId === comentarioId ? null : comentarioId;
    this.respostaTexto = '';
  }

  enviarResposta(comentarioPaiId: number): void {
    if (!this.respostaTexto.trim() || this.enviando()) return;

    this.enviando.set(true);
    this.enviarComentario.emit({
      texto: this.respostaTexto.trim(),
      comentarioPaiId,
      aoConcluir: (sucesso) => {
        this.enviando.set(false);
        if (sucesso) {
          this.respostaTexto = '';
          this.respondendoId = null;
        }
      },
    });
  }

  curtir(comentarioId: number): void {
    if (!this.estaLogado) return;
    this.curtirComentario.emit(comentarioId);
  }
}
