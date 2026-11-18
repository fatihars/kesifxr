<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/36e8de09-2c86-45ef-853b-c6b941b29bd9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## WebXR metinlerini düzenleme

Tabelalar, açılış ekranı, Keşfet menüsü, oyunlar ve diğer arayüz metinleri [public/metinler.json](public/metinler.json) içinde bölüm bölüm yer alır. Dosyada mevcut metni aratın, iki noktanın sağındaki tırnaklı değeri düzenleyin ve sayfayı yenileyin. Sol taraftaki anahtarları koruyun. Bir cümledeki `{1}`, `{2}` gibi işaretler oyuncu adı, puan veya eser bilgisiyle doldurulur. Bir satır sonu için `\n`, çift tırnak için `\"` kullanın.

Yayında yalnızca metin değiştiyse güncel dosyayı sitenin mevcut `metinler.json` dosyasının üzerine koyun. Yeni derlemelerde dosya otomatik olarak `dist/metinler.json` konumuna kopyalanır.

Müze eserleri ve Siyer dersleri Mirasium arşivinden gelir. Belirli bir eserin WebXR’da görünen metnini değiştirmek için dosyanın sonundaki `arşiv` bölümüne eser kimliğini kullanarak yeni bir satır ekleyin. Aşağıdaki 12345 örnek kimliktir.

```json
"arşiv": {
  "12345.başlık": "Yeni başlık",
  "12345.açıklama": "Yeni açıklama",
  "12345.anlatım": "Müze eserinin çocuklara yönelik anlatımı",
  "12345.ipucu": "Hazine avı için yeni ipucu"
}
```

Eser künyesinde kullanılan alanlar için `12345.etiket.sanatci` ve `12345.değer.sanatci` biçimi kullanılabilir. Görsellere veya videolara gömülü yazılar ilgili medya dosyasının parçasıdır.
