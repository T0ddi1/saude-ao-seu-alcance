import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

const CONFIRM_BUTTON_COLOR = '#5c26e4';
const CANCEL_BUTTON_COLOR = '#8a8a8a';

@Injectable({ providedIn: 'root' })
export class SwalService {
  async confirmar(mensagem: string, titulo = 'Tem certeza?'): Promise<boolean> {
    const resultado = await Swal.fire({
      title: titulo,
      text: mensagem,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: CONFIRM_BUTTON_COLOR,
      cancelButtonColor: CANCEL_BUTTON_COLOR,
      reverseButtons: true,
    });
    return resultado.isConfirmed;
  }

  async confirmarExclusao(mensagem: string): Promise<boolean> {
    const resultado = await Swal.fire({
      title: 'Excluir?',
      text: mensagem,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#c0392b',
      cancelButtonColor: CANCEL_BUTTON_COLOR,
      reverseButtons: true,
    });
    return resultado.isConfirmed;
  }

  async alerta(mensagem: string, titulo = 'Aviso'): Promise<void> {
    await Swal.fire({
      title: titulo,
      text: mensagem,
      icon: 'warning',
      confirmButtonText: 'Entendi',
      confirmButtonColor: CONFIRM_BUTTON_COLOR,
    });
  }

  async erro(mensagem: string, titulo = 'Ops'): Promise<void> {
    await Swal.fire({
      title: titulo,
      text: mensagem,
      icon: 'error',
      confirmButtonText: 'Entendi',
      confirmButtonColor: CONFIRM_BUTTON_COLOR,
    });
  }

  /**
   * Avisa que há alterações não salvas ao tentar sair da tela.
   * Retorna true se a pessoa confirmou que quer sair mesmo assim (descartando),
   * ou false se ela preferiu continuar editando.
   */
  async confirmarSaidaComAlteracoes(): Promise<boolean> {
    const resultado = await Swal.fire({
      title: 'Você tem alterações não salvas',
      text: 'Lembre-se de salvar as alterações ou descartá-las antes de sair.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sair sem salvar',
      cancelButtonText: 'Continuar editando',
      confirmButtonColor: '#c0392b',
      cancelButtonColor: CONFIRM_BUTTON_COLOR,
      reverseButtons: true,
    });
    return resultado.isConfirmed;
  }
}
