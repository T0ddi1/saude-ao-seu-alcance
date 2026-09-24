import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ComentarioAdmin } from '../../core/models/admin.model';

@Component({
  selector: 'app-comentarios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comentarios-admin.component.html',
  styleUrl: './comentarios-admin.component.scss',
})
export class ComentariosAdminComponent implements OnInit {
  private api = inject(AdminApiService);

  status: 'pendente' | 'aprovado' | 'todos' = 'pendente';
  comentarios: ComentarioAdmin[] = [];
  carregando = false;
  respondendoId: number | null = null;
  textoResposta = '';

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.api.listarComQuery<ComentarioAdmin>('comentarios', `status=${this.status}`).subscribe((itens) => {
      this.comentarios = itens;
      this.carregando = false;
    });
  }

  mudarStatus(status: 'pendente' | 'aprovado' | 'todos'): void {
    this.status = status;
    this.carregar();
  }

  aprovar(id: number): void {
    this.api.acao('comentarios', id, 'aprovar').subscribe(() => this.carregar());
  }

  rejeitar(id: number): void {
    this.api.acao('comentarios', id, 'rejeitar').subscribe(() => this.carregar());
  }

  abrirResposta(id: number): void {
    this.respondendoId = this.respondendoId === id ? null : id;
    this.textoResposta = '';
  }

  enviarResposta(id: number): void {
    if (!this.textoResposta.trim()) return;

    this.api.acaoComBody('comentarios', id, 'responder', { texto: this.textoResposta }).subscribe(() => {
      this.respondendoId = null;
      this.textoResposta = '';
      this.carregar();
    });
  }
}
