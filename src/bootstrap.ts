import {metin, metinleriYükle} from './metinler.ts';

async function başlat(): Promise<void> {
  await metinleriYükle();
  document.title = metin('sayfa', 'başlık');
  document.querySelector('meta[name="description"]')?.setAttribute('content', metin('sayfa', 'açıklama'));
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', metin('sayfa', 'açıklama'));
  await import('./index.ts');
}

void başlat().catch((hata: unknown) => {
  console.error(hata);
  const kök = document.querySelector('#root');
  if (kök) kök.textContent = 'Müze metinleri yüklenemedi. Sayfayı yenileyip tekrar deneyebilirsin.';
});
