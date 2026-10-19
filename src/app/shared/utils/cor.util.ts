/** Utilitários de cor usados pelo seletor "Cor da marca" dos espaços patrocinados. */

const HEX = /^#[0-9a-fA-F]{6}$/;

export function ehCorValida(valor: string | null | undefined): valor is string {
  return !!valor && HEX.test(valor);
}

function rgbParaHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Branco ou quase-preto, o que tiver mais contraste sobre a cor de fundo informada. */
export function corDoTextoSobre(fundo: string | null | undefined): string {
  if (!ehCorValida(fundo)) return '#FFFFFF';
  const l = luminancia(fundo);
  const contrasteComBranco = 1.05 / (l + 0.05);
  const contrasteComPreto = (l + 0.05) / 0.05;
  return contrasteComBranco >= contrasteComPreto ? '#FFFFFF' : '#1E1E1E';
}

/**
 * Descobre a cor predominante de uma imagem (ignora transparência, branco, preto e cinza quando há cores de verdade).
 * Devolve null se a imagem não puder ser lida (ex.: servidor sem permissão CORS).
 */
export function extrairCorDominante(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const imagem = new Image();
    imagem.crossOrigin = 'anonymous';
    imagem.onerror = () => resolve(null);
    imagem.onload = () => {
      try {
        const lado = 64;
        const canvas = document.createElement('canvas');
        canvas.width = lado;
        canvas.height = lado;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.drawImage(imagem, 0, 0, lado, lado);
        const { data } = ctx.getImageData(0, 0, lado, lado); // lança erro se o canvas estiver "contaminado" por CORS

        type Balde = { peso: number; r: number; g: number; b: number; n: number; colorido: boolean };
        const baldes = new Map<number, Balde>();
        for (let i = 0; i < data.length; i += 4) {
          const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
          if (a < 200) continue; // transparente
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturacao = max === 0 ? 0 : (max - min) / max;
          const quaseBranco = max > 235 && saturacao < 0.12;
          if (quaseBranco) continue;
          const colorido = saturacao > 0.25 && max > 40;
          const chave = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
          const balde = baldes.get(chave) ?? { peso: 0, r: 0, g: 0, b: 0, n: 0, colorido };
          balde.peso += colorido ? 1 + saturacao : 0.35;
          balde.r += r;
          balde.g += g;
          balde.b += b;
          balde.n += 1;
          baldes.set(chave, balde);
        }

        const todos = [...baldes.values()];
        if (!todos.length) return resolve(null);
        const coloridos = todos.filter((x) => x.colorido);
        const candidatos = coloridos.length ? coloridos : todos;
        const melhor = candidatos.reduce((a, b) => (b.peso > a.peso ? b : a));
        resolve(rgbParaHex(melhor.r / melhor.n, melhor.g / melhor.n, melhor.b / melhor.n));
      } catch {
        resolve(null);
      }
    };
    // A mesma imagem já foi baixada pela tela SEM pedir permissão CORS (e o navegador guarda essa resposta sem o cabeçalho).
    // Um parâmetro extra força um novo download com permissão, que é o que o canvas precisa pra ler os pixels.
    imagem.src = url + (url.includes('?') ? '&' : '?') + 'leitura=cor';
  });
}

/** O "conta-gotas" do navegador (Chrome/Edge): deixa a pessoa clicar em qualquer ponto da tela pra pegar a cor. */
export function contaGotasDisponivel(): boolean {
  return typeof (window as unknown as { EyeDropper?: unknown }).EyeDropper === 'function';
}

export async function usarContaGotas(): Promise<string | null> {
  try {
    const Construtor = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
    const resultado = await new Construtor().open();
    return resultado.sRGBHex.toUpperCase();
  } catch {
    return null; // a pessoa cancelou (Esc)
  }
}
