type MetinKataloğu = Record<string, Record<string, unknown>>;

let katalog: MetinKataloğu = {};

export async function metinleriYükle(): Promise<void> {
  const yanıt = await fetch(import.meta.env.BASE_URL + 'metinler.json', {cache: 'no-cache'});
  if (!yanıt.ok) throw new Error(`metinler.json: ${yanıt.status}`);
  const veri: unknown = await yanıt.json();
  if (!veri || typeof veri !== 'object' || Array.isArray(veri)) throw new Error('metinler.json');
  katalog = veri as MetinKataloğu;
}

function değer(bölüm: string, anahtar: string): string {
  const grup = katalog[bölüm];
  const yazı = grup && Object.hasOwn(grup, anahtar) ? grup[anahtar] : undefined;
  return typeof yazı === 'string' ? yazı : '';
}

export function metin(bölüm: string, anahtar: string, ...yerTutucular: unknown[]): string {
  return değer(bölüm, anahtar).replace(/\{([1-9]\d*)\}/g, (eşleşme, sıra) =>
    Number(sıra) <= yerTutucular.length ? String(yerTutucular[Number(sıra) - 1]) : eşleşme);
}

export function arşivMetni(id: number, alan: string, kaynakMetin: string): string {
  const özelMetin = katalog.arşiv?.[`${id}.${alan}`];
  return typeof özelMetin === 'string' ? özelMetin : kaynakMetin;
}

export function htmlKaçır(yazı: string): string {
  return yazı.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function htmlMetin(bölüm: string, anahtar: string, ...yerTutucular: unknown[]): string {
  const güvenli = değer(bölüm, anahtar)
    .replace(/&(?!(?:amp|lt|gt|quot|apos|nbsp|#\d+|#x[\da-f]+);)/gi, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  // Template arguments come from the original markup and keep their existing escaping.
  return güvenli.replace(/\{([1-9]\d*)\}/g, (eşleşme, sıra) =>
    Number(sıra) <= yerTutucular.length ? String(yerTutucular[Number(sıra) - 1]) : eşleşme);
}
