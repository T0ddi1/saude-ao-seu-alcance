import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipeService, MinhaConta } from '../../core/services/equipe.service';
import { SwalService } from '../../core/services/swal.service';
import { AvisoComentariosEmailComponent } from '../../shared/components/aviso-comentarios-email/aviso-comentarios-email.component';

@Component({
  selector: 'app-minha-conta-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, AvisoComentariosEmailComponent],
  templateUrl: './minha-conta-admin.component.html',
  styleUrl: './minha-conta-admin.component.scss',
})
export class MinhaContaAdminComponent implements OnInit {
  private equipe = inject(EquipeService);
  private swal = inject(SwalService);

  conta: MinhaConta | null = null;

  senhaAtual = '';
  novaSenha = '';
  confirmarSenha = '';
  salvandoSenha = false;
  mostrarSenhas = false;

  ngOnInit(): void {
    this.equipe.minhaConta().subscribe((c) => (this.conta = c));
  }

  get senhaFraca(): boolean {
    return this.novaSenha.length > 0 && this.novaSenha.length < 8;
  }

  get senhasDiferentes(): boolean {
    return this.confirmarSenha.length > 0 && this.novaSenha !== this.confirmarSenha;
  }

  get podeAlterar(): boolean {
    return !!this.senhaAtual && this.novaSenha.length >= 8 && this.novaSenha === this.confirmarSenha && !this.salvandoSenha;
  }

  alterarSenha(): void {
    if (!this.podeAlterar) return;
    this.salvandoSenha = true;
    this.equipe.alterarSenha({ senhaAtual: this.senhaAtual, novaSenha: this.novaSenha }).subscribe({
      next: () => {
        this.salvandoSenha = false;
        this.senhaAtual = this.novaSenha = this.confirmarSenha = '';
        this.swal.alerta('Sua senha foi alterada. Use a nova senha no próximo login.', 'Senha alterada');
      },
      error: (e) => {
        this.salvandoSenha = false;
        this.swal.erro(typeof e?.error === 'string' && e.error.length < 250 ? e.error : 'Não foi possível alterar a senha.');
      },
    });
  }
}
