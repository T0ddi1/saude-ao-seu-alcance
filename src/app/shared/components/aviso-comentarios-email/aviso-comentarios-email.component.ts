import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipeService, MinhaConta } from '../../../core/services/equipe.service';
import { SwalService } from '../../../core/services/swal.service';

/** Cartão "onde recebo o aviso de comentários esperando aprovação" — usado na Moderação e em Minha conta. */
@Component({
  selector: 'app-aviso-comentarios-email',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './aviso-comentarios-email.component.html',
  styleUrl: './aviso-comentarios-email.component.scss',
})
export class AvisoComentariosEmailComponent implements OnInit {
  private equipe = inject(EquipeService);
  private swal = inject(SwalService);

  conta: MinhaConta | null = null;
  erro = false;
  salvando = false;
  salvoAgora = false;

  avisar = true;
  email = '';

  ngOnInit(): void {
    this.equipe.minhaConta().subscribe({
      next: (c) => this.aplicar(c),
      error: () => (this.erro = true),
    });
  }

  private aplicar(c: MinhaConta): void {
    this.conta = c;
    this.avisar = c.avisarComentariosPendentes;
    this.email = c.emailAvisoComentarios;
  }

  get alterado(): boolean {
    return !!this.conta && (this.avisar !== this.conta.avisarComentariosPendentes || this.email.trim() !== this.conta.emailAvisoComentarios);
  }

  usarEmailDaConta(): void {
    if (this.conta) this.email = this.conta.email;
  }

  get usandoEmailDaConta(): boolean {
    return !!this.conta && this.email.trim().toLowerCase() === this.conta.email.toLowerCase();
  }

  salvar(): void {
    if (!this.conta) return;
    this.salvando = true;
    this.equipe.salvarNotificacoes({ emailAvisoComentarios: this.email.trim() || null, avisarComentariosPendentes: this.avisar }).subscribe({
      next: (c) => {
        this.salvando = false;
        this.aplicar(c);
        this.salvoAgora = true;
        setTimeout(() => (this.salvoAgora = false), 3500);
      },
      error: (e) => {
        this.salvando = false;
        this.swal.erro(typeof e?.error === 'string' && e.error.length < 200 ? e.error : 'Não foi possível salvar.');
      },
    });
  }
}
