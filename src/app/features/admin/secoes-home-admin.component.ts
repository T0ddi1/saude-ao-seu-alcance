import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ConfiguracaoSecaoHomeAdmin } from '../../core/models/admin.model';
import { SecaoHomeConfigComponent, SECOES_COM_TELA_PROPRIA } from './secao-home-config/secao-home-config.component';

@Component({
  selector: 'app-secoes-home-admin',
  standalone: true,
  imports: [CommonModule, SecaoHomeConfigComponent],
  templateUrl: './secoes-home-admin.component.html',
  styleUrl: './secoes-home-admin.component.scss',
})
export class SecoesHomeAdminComponent implements OnInit {
  private api = inject(AdminApiService);

  secoesSemTelaPropria: string[] = [];
  carregando = false;

  ngOnInit(): void {
    this.carregando = true;
    this.api.listar<ConfiguracaoSecaoHomeAdmin>('secoes-home').subscribe((secoes) => {
      this.secoesSemTelaPropria = secoes.map((s) => s.secao).filter((secao) => !SECOES_COM_TELA_PROPRIA.includes(secao));
      this.carregando = false;
    });
  }
}
