import { ContentBlock, ContentSegment } from '../models/content.model';

export function parseContentHtml(html: string): ContentBlock[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocos: ContentBlock[] = [];

  doc.body.childNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const texto = (el.textContent ?? '').trim();

    switch (el.tagName) {
      case 'H1':
      case 'H2':
      case 'H3':
        if (texto) blocos.push({ type: 'display', text: texto });
        break;
      case 'BLOCKQUOTE':
        if (texto) blocos.push({ type: 'quote', text: texto });
        break;
      case 'UL':
      case 'OL': {
        const itens = Array.from(el.querySelectorAll('li'))
          .map((li) => (li.textContent ?? '').trim())
          .filter((item) => item.length > 0);
        if (itens.length) blocos.push({ type: 'list', items: itens });
        break;
      }
      case 'IMG':
        blocos.push({ type: 'image', src: el.getAttribute('src') ?? '', alt: el.getAttribute('alt') ?? '' });
        break;
      case 'FIGURE': {
        const img = el.querySelector('img');
        if (img) {
          const caption = el.querySelector('figcaption')?.textContent?.trim();
          blocos.push({
            type: 'image',
            src: img.getAttribute('src') ?? '',
            alt: img.getAttribute('alt') ?? '',
            ...(caption ? { caption } : {}),
          });
        }
        break;
      }
      case 'P': {
        if (el.classList.contains('download')) {
          const link = el.querySelector('a');
          if (link) {
            blocos.push({
              type: 'download',
              label: (link.textContent ?? '').trim(),
              fileLabel: el.getAttribute('data-file-label') ?? '',
              href: link.getAttribute('href') ?? '',
            });
          }
          break;
        }

        const imagensNoParagrafo = Array.from(el.querySelectorAll('img'));
        if (imagensNoParagrafo.length && !texto) {
          imagensNoParagrafo.forEach((img) => {
            blocos.push({ type: 'image', src: img.getAttribute('src') ?? '', alt: img.getAttribute('alt') ?? '' });
          });
          break;
        }

        const ehLead = el.classList.contains('lead');
        const soNegrito = !ehLead && el.children.length === 1 && (el.children[0].tagName === 'STRONG' || el.children[0].tagName === 'B');

        if (ehLead && texto) {
          blocos.push({ type: 'lead', segments: extrairSegmentos(el) });
        } else if (soNegrito && texto) {
          blocos.push({ type: 'lead', segments: [{ text: texto, strong: true }] });
        } else if (texto) {
          blocos.push({ type: 'paragraph', text: texto });
        }
        break;
      }
      default:
        if (texto) blocos.push({ type: 'paragraph', text: texto });
        break;
    }
  });

  return blocos;
}

function extrairSegmentos(el: HTMLElement): ContentSegment[] {
  const segmentos: ContentSegment[] = [];

  el.childNodes.forEach((filho) => {
    if (filho.nodeType === Node.TEXT_NODE) {
      const texto = filho.textContent ?? '';
      if (texto) segmentos.push({ text: texto });
    } else if (filho.nodeType === Node.ELEMENT_NODE) {
      const elFilho = filho as HTMLElement;
      const texto = elFilho.textContent ?? '';
      if (texto) segmentos.push({ text: texto, strong: elFilho.tagName === 'STRONG' || elFilho.tagName === 'B' });
    }
  });

  return segmentos;
}
