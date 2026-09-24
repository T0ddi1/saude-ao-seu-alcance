import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PerfilService } from '../../core/services/perfil.service';
import { AuthService } from '../../core/services/auth.service';
import { UploadService } from '../../core/services/upload.service';
import { ArticleSummaryApi } from '../../core/models/article-api.model';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonComponent],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  private perfilService = inject(PerfilService);
  private authService = inject(AuthService);
  private uploadService = inject(UploadService);
  private router = inject(Router);

  favoritos = signal<ArticleSummaryApi[]>([]);
  salvando = signal(false);
  salvo = signal(false);
  carregando = signal(true);
  enviandoFoto = signal(false);
  erroFoto = signal<string | null>(null);

  formulario = this.fb.group({
    nomeCompleto: [''],
    nomeSocial: [''],
    fotoUrl: [''],
    celular: [''],
    cep: [''],
    logradouro: [''],
    numero: [''],
    complemento: [''],
    bairro: [''],
    cidade: [''],
    estado: [''],
  });

  ngOnInit(): void {
    this.perfilService.obter().subscribe((perfil) => {
      this.formulario.patchValue(perfil);
      this.carregando.set(false);
    });
    this.perfilService.favoritos().subscribe((itens) => this.favoritos.set(itens));
  }

  selecionarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) return;

    this.enviandoFoto.set(true);
    this.erroFoto.set(null);

    this.uploadService.enviar(arquivo).subscribe({
      next: (url) => {
        this.formulario.patchValue({ fotoUrl: url });
        this.enviandoFoto.set(false);
      },
      error: () => {
        this.erroFoto.set('Não foi possível enviar a foto. Verifique o formato (JPG/PNG/GIF/WEBP) e o tamanho (até 5MB).');
        this.enviandoFoto.set(false);
      },
    });
    input.value = '';
  }

  salvar(): void {
    this.salvando.set(true);
    this.salvo.set(false);
    this.perfilService.atualizar(this.formulario.getRawValue() as never).subscribe({
      next: () => {
        this.salvando.set(false);
        this.salvo.set(true);
      },
      error: () => this.salvando.set(false),
    });
  }

  sair(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
