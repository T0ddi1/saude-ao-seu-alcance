import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EquipeService, PapelEquipe, UsuarioAdmin } from '../../core/services/equipe.service';
import { SwalService } from '../../core/services/swal.service';

const PAPEIS: { valor: PapelEquipe; nome: string; descricao: string }[] = [
  { valor: 'Admin', nome: 'Administrador', descricao: 'Pode tudo: conteúdo, configurações, usuários e o log de atividades.' },
  { valor: 'Editor', nome: 'Editor', descricao: 'Cuida do conteúdo (artigos, Home, menu...). Não vê usuários nem o log.' },
];

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios-admin.component.html',
  styleUrl: './usuarios-admin.component.scss',
})
export class UsuariosAdminComponent implements OnInit {
  private equipe = inject(EquipeService);
  private fb = inject(FormBuilder);
  private swal = inject(SwalService);

  readonly papeis = PAPEIS;

  usuarios: UsuarioAdmin[] = [];
  carregando = true;
  erro: string | null = null;

  modalAberto = false;
  editando: UsuarioAdmin | null = null;
  salvando = false;
  enviandoId: string | null = null;

  form = this.fb.nonNullable.group({
    nomeCompleto: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    papel: ['Admin' as PapelEquipe],
    ativo: [true],
  });

  ngOnInit(): void {
    this.carregar();
  }

  /** Só fecha quando o clique é no fundo escuro. Não pode ser uma expressão `a && b` no template: o Angular trata `false` como preventDefault e os campos do popup perdem o foco. */
  aoPressionarFundo(evento: MouseEvent): void {
    if (evento.target === evento.currentTarget) this.fechar();
  }

  @HostListener('document:keydown.escape')
  aoApertarEsc(): void {
    if (this.modalAberto) this.fechar();
  }

  private carregar(): void {
    this.carregando = true;
    this.equipe.listarUsuarios().subscribe({
      next: (u) => {
        this.usuarios = u;
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar os usuários.';
        this.carregando = false;
      },
    });
  }

  nomePapel(papel: string): string {
    return PAPEIS.find((p) => p.valor === papel)?.nome ?? papel;
  }

  inicial(usuario: UsuarioAdmin): string {
    return (usuario.nomeCompleto || usuario.email).charAt(0).toUpperCase();
  }

  abrirNovo(): void {
    this.editando = null;
    this.form.reset({ nomeCompleto: '', email: '', papel: 'Admin', ativo: true });
    this.form.controls.email.enable();
    this.modalAberto = true;
  }

  abrirEdicao(usuario: UsuarioAdmin): void {
    this.editando = usuario;
    this.form.reset({ nomeCompleto: usuario.nomeCompleto, email: usuario.email, papel: usuario.papel, ativo: usuario.ativo });
    this.form.controls.email.disable(); // o e-mail é o login: não muda por aqui
    this.modalAberto = true;
  }

  fechar(): void {
    this.modalAberto = false;
  }

  async salvar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.salvando = true;

    if (!this.editando) {
      this.equipe.criarUsuario({ nomeCompleto: v.nomeCompleto.trim(), email: v.email.trim(), papel: v.papel }).subscribe({
        next: async (resposta) => {
          this.salvando = false;
          this.modalAberto = false;
          this.carregar();
          if (resposta.emailEnviado) {
            await this.swal.alerta(
              `Mandamos um e-mail para ${resposta.usuario.email} com o link para a pessoa definir a própria senha.`,
              'Usuário criado',
            );
          } else {
            await this.swal.alerta(
              'O usuário foi criado, mas não conseguimos enviar o e-mail agora. Use o botão "Enviar link de senha" na lista para tentar de novo.',
              'Usuário criado — e-mail não enviado',
            );
          }
        },
        error: (e) => this.falhar(e),
      });
      return;
    }

    this.equipe.atualizarUsuario(this.editando.id, { nomeCompleto: v.nomeCompleto.trim(), papel: v.papel, ativo: v.ativo }).subscribe({
      next: () => {
        this.salvando = false;
        this.modalAberto = false;
        this.carregar();
      },
      error: (e) => this.falhar(e),
    });
  }

  private falhar(e: { error?: unknown }): void {
    this.salvando = false;
    this.swal.erro(typeof e?.error === 'string' && e.error.length < 250 ? e.error : 'Não foi possível salvar.');
  }

  async enviarRedefinicao(usuario: UsuarioAdmin, evento: Event): Promise<void> {
    evento.stopPropagation();
    const ok = await this.swal.confirmarAcao(
      `Vamos enviar para ${usuario.email} um e-mail com um link para a pessoa escolher uma nova senha. A senha atual continua valendo até ela usar o link.`,
      'Enviar link de senha?',
      'Enviar e-mail',
    );
    if (!ok) return;

    this.enviandoId = usuario.id;
    this.equipe.enviarRedefinicao(usuario.id).subscribe({
      next: () => {
        this.enviandoId = null;
        this.swal.alerta(`E-mail enviado para ${usuario.email}.`, 'Pronto');
      },
      error: (e) => {
        this.enviandoId = null;
        this.swal.erro(typeof e?.error === 'string' && e.error.length < 250 ? e.error : 'Não foi possível enviar o e-mail.');
      },
    });
  }
}
