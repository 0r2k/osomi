// Mientras una hoja gira, su texto se pinta en el canvas en la posición exacta que tiene en el HTML.
// Quieta, la página vuelve a ser HTML real: seleccionable, con enlaces y legible por lectores de pantalla.

export function rasterizeText(page: HTMLElement, g: CanvasRenderingContext2D, scale: number) {
  const origin = page.getBoundingClientRect();
  const range = document.createRange();
  const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
  const ascents = new Map<string, number>();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!el || el.closest('textarea, [data-raster="skip"]')) continue;
    const cs = getComputedStyle(el);
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    g.font = font;
    g.fillStyle = cs.color;
    g.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
    if (!ascents.has(font)) ascents.set(font, g.measureText('Hg').fontBoundingBoxAscent);
    const ascent = ascents.get(font)!;
    const upper = cs.textTransform === 'uppercase';
    const underline = cs.textDecorationLine.includes('underline');
    const text = node.textContent ?? '';
    for (const m of text.matchAll(/\S+/g)) {
      range.setStart(node, m.index!); range.setEnd(node, m.index! + m[0].length);
      const rect = range.getClientRects()[0];
      if (!rect) continue;
      const x = (rect.left - origin.left) / scale, y = (rect.top - origin.top) / scale;
      g.fillText(upper ? m[0].toUpperCase() : m[0], x, y + ascent);
      if (underline) g.fillRect(x, y + ascent + 3, rect.width / scale, .8);
    }
  }
  // Notas: el campo de texto se dibuja con su contenido actual.
  page.querySelectorAll('textarea').forEach(area => {
    const r = area.getBoundingClientRect(), cs = getComputedStyle(area);
    const x = (r.left - origin.left) / scale, y = (r.top - origin.top) / scale, w = r.width / scale, h = r.height / scale;
    g.fillStyle = cs.backgroundColor; g.fillRect(x, y, w, h);
    g.strokeStyle = cs.borderTopColor; g.lineWidth = 1; g.strokeRect(x + .5, y + .5, w - 1, h - 1);
    const pad = parseFloat(cs.paddingLeft), lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
    g.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    g.letterSpacing = '0px';
    const value = area.value || area.placeholder;
    g.fillStyle = area.value ? cs.color : 'rgba(80,70,60,.45)';
    let line = '', ly = y + pad + lineHeight * .8;
    const flush = () => { if (ly < y + h - 4) g.fillText(line, x + pad, ly); line = ''; ly += lineHeight; };
    for (const paragraph of value.split('\n')) {
      for (const word of paragraph.split(' ')) {
        const test = line ? `${line} ${word}` : word;
        if (g.measureText(test).width > w - pad * 2 && line) { flush(); line = word; } else line = test;
      }
      flush();
    }
  });
  // Filetes decorativos marcados en el HTML.
  page.querySelectorAll<HTMLElement>('[data-rule]').forEach(el => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    g.fillStyle = cs.borderTopColor;
    g.fillRect((r.left - origin.left) / scale, (r.top - origin.top) / scale, r.width / scale, 1);
  });
}
