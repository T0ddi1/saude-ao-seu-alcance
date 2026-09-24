import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { SwalService } from '../services/swal.service';

export interface ComponenteComAlteracoes {
  temAlteracoesNaoSalvas(): boolean;
}

export const alteracoesNaoSalvasGuard: CanDeactivateFn<ComponenteComAlteracoes> = async (componente) => {
  if (!componente.temAlteracoesNaoSalvas()) return true;

  const swal = inject(SwalService);
  return swal.confirmarSaidaComAlteracoes();
};
