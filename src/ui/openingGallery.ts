import {htmlKaçır, htmlMetin, metin} from "../metinler.ts";
const SCENES = [
  {file: 'sergi', title: metin("openingGallery", "iki_katli_sergi"), group: metin("openingGallery", "muze"), tone: 'blue', description: metin("openingGallery", "galerilerde_mirasium_arsivinden_secilen_50_eseri_yakindan"), alt: metin("openingGallery", "eserlerle_dolu_iki_katli_sergi_salonuna_merdivenlerden")},
  {file: 'bahce', title: metin("openingGallery", "muze_bahcesi"), group: metin("openingGallery", "oyun_ve_kesif"), tone: 'green', description: metin("openingGallery", "bahcedeki_oyunlara_atolyelere_ve_tezgahlara_ugra"), alt: metin("openingGallery", "gece_aydinlatilan_muze_girisi_ve_ondeki_seksek")},
  {file: 'konser', title: metin("openingGallery", "acik_hava_konseri"), group: metin("openingGallery", "sahne"), tone: 'orange', description: metin("openingGallery", "telefon_isiklariyla_sahneye_eslik_et_istek_sarkini"), alt: metin("openingGallery", "gun_batiminda_muzisyenler_ve_telefonlarini_kaldiran_konser")},
  {file: 'rasathane', title: metin("openingGallery", "takiyuddin_in_rasathanesi"), group: metin("openingGallery", "bilim"), tone: 'blue', description: metin("openingGallery", "rasat_aletlerini_incele_ve_kuyruklu_yildizin_iki"), alt: metin("openingGallery", "iki_kuleli_rasathane_girisi_ve_avludaki_halkali")},
  {file: 'karagoz', title: metin("openingGallery", "karagoz_ve_hacivat"), group: metin("openingGallery", "sahne"), tone: 'purple', description: metin("openingGallery", "minderine_otur_ve_golge_oyununun_perdesine_bak"), alt: metin("openingGallery", "aydinlik_golge_oyunu_perdesini_izleyen_cocuklar")},
  {file: 'hoca', title: metin("openingGallery", "nasreddin_hoca"), group: metin("openingGallery", "hikaye"), tone: 'orange', description: metin("openingGallery", "dere_kiyisinda_maya_calma_fikrasini_dinle"), alt: metin("openingGallery", "dere_kiyisinda_elindeki_kasikla_maya_calan_nasreddin")},
  {file: 'sema', title: metin("openingGallery", "sema_sahnesi"), group: metin("openingGallery", "sahne"), tone: 'purple', description: metin("openingGallery", "ney_dinletisine_ve_sema_gosterisine_ugra"), alt: metin("openingGallery", "ahsap_sahnede_semazenler_ve_muzisyenler")},
  {file: 'cami', title: metin("openingGallery", "cami_avlusu"), group: metin("openingGallery", "mekan"), tone: 'green', description: metin("openingGallery", "avludan_gecip_caminin_icini_ve_ders_bolumunu"), alt: metin("openingGallery", "gece_isiklariyla_aydinlanan_cift_minareli_cami")},
  {file: 'siyer', title: metin("openingGallery", "siyer_i_nebi_dersi"), group: metin("openingGallery", "muze"), tone: 'blue', description: metin("openingGallery", "mirasium_minyaturlerini_caminin_ders_bolumunde_aciklamalariyla_incele"), alt: metin("openingGallery", "cami_icinde_imam_ve_minderlere_oturmus_cocuklarin")},
] as const;

const HERO_SCENES = [0, 2, 3];
const imageUrl = (file: string) => `${import.meta.env.BASE_URL}gallery/${file}.jpg`;

export function openingGalleryMarkup(): string {
  return `
    <section class="opening-gallery" id="opening-gallery" aria-labelledby="opening-gallery-title">
      <header class="opening-gallery-heading">
        <div><h2 id="opening-gallery-title">${htmlMetin("openingGallery", "muzenin_icinden")}</h2><p>${htmlMetin("openingGallery", "oyun_icinden_gercek_karelere_goz_at")}</p></div>
        <a class="opening-link" href="#opening-title">${htmlMetin("openingGallery", "karakterini_sec")}</a>
      </header>
      <div class="opening-gallery-grid">
        ${SCENES.map((scene, index) => `
          <button type="button" class="opening-gallery-card tone-${scene.tone}" data-scene="${index}" aria-haspopup="dialog" aria-label="${htmlMetin("openingGallery", "1_gorselini_buyut", htmlKaçır(scene.title))}">
            <img src="${imageUrl(scene.file)}" alt="" decoding="async" loading="lazy">
            <span class="opening-card-category">${htmlKaçır(scene.group)}</span>
            <span class="opening-card-copy"><strong>${htmlKaçır(scene.title)}</strong><span>${htmlKaçır(scene.description)}</span></span>
            <span class="opening-card-open" aria-hidden="true">↗</span>
          </button>`).join('')}
      </div>
    </section>
    <dialog class="opening-lightbox" aria-labelledby="opening-photo-title">
      <div class="opening-lightbox-top">
        <h2 id="opening-photo-title"></h2>
        <button type="button" data-close>${htmlMetin("openingGallery", "kapat")}</button>
      </div>
      <img alt="">
      <div class="opening-lightbox-bottom">
        <button type="button" data-prev aria-label="${htmlMetin("openingGallery", "onceki_gorsel")}">←</button>
        <p aria-live="polite"></p>
        <button type="button" data-next aria-label="${htmlMetin("openingGallery", "sonraki_gorsel")}">→</button>
      </div>
    </dialog>`;
}

export function openingHeroPhotoMarkup(): string {
  const scene = SCENES[HERO_SCENES[0]];
  return `
    <section class="opening-featured" aria-label="${htmlMetin("openingGallery", "one_cikan_muze_kareleri")}">
      <button type="button" class="opening-featured-photo" aria-haspopup="dialog" aria-label="${htmlMetin("openingGallery", "1_gorselini_buyut", htmlKaçır(scene.title))}">
        <img src="${imageUrl(scene.file)}" alt="${htmlKaçır(scene.alt)}" fetchpriority="high" decoding="async" width="1430" height="565">
        <span class="opening-featured-caption"><small>${htmlMetin("openingGallery", "oyun_icinden")}</small><strong>${htmlKaçır(scene.title)}</strong></span>
        <span class="opening-featured-expand" aria-hidden="true">↗</span>
      </button>
      <div class="opening-featured-tabs" aria-label="${htmlMetin("openingGallery", "one_cikan_kareyi_sec")}">
        ${HERO_SCENES.map((index, position) => `<button type="button" data-featured="${index}" aria-pressed="${position === 0}">${SCENES[index].title}</button>`).join('')}
      </div>
    </section>`;
}

export function bindOpeningGallery(root: HTMLElement): void {
  const featured = root.querySelector<HTMLButtonElement>('.opening-featured-photo')!;
  const featuredPhoto = featured.querySelector('img')!;
  const featuredTitle = featured.querySelector('strong')!;
  const tabs = root.querySelectorAll<HTMLButtonElement>('[data-featured]');
  let selected = HERO_SCENES[0];

  tabs.forEach((tab) => {
    tab.onclick = () => {
      selected = Number(tab.dataset.featured);
      const scene = SCENES[selected];
      featuredPhoto.src = imageUrl(scene.file);
      featuredPhoto.alt = scene.alt;
      featuredTitle.textContent = scene.title;
      featured.setAttribute('aria-label', metin("openingGallery", "1_gorselini_buyut", scene.title));
      tabs.forEach((option) => option.setAttribute('aria-pressed', String(option === tab)));
    };
  });

  const dialog = root.querySelector<HTMLDialogElement>('.opening-lightbox')!;
  const title = dialog.querySelector('h2')!;
  const photo = dialog.querySelector('img')!;
  const caption = dialog.querySelector('p')!;
  const close = dialog.querySelector<HTMLButtonElement>('[data-close]')!;
  let active = 0;

  const render = (index: number) => {
    active = (index + SCENES.length) % SCENES.length;
    const scene = SCENES[active];
    title.textContent = scene.title;
    photo.src = imageUrl(scene.file);
    photo.alt = scene.alt;
    caption.textContent = `${active + 1} / ${SCENES.length} · ${scene.description}`;
  };
  const open = (index: number) => {
    render(index);
    dialog.showModal();
    close.focus();
  };

  featured.onclick = () => open(selected);
  root.querySelectorAll<HTMLButtonElement>('[data-scene]').forEach((card) => {
    card.onclick = () => open(Number(card.dataset.scene));
  });
  close.onclick = () => dialog.close();
  dialog.querySelector<HTMLButtonElement>('[data-prev]')!.onclick = () => render(active - 1);
  dialog.querySelector<HTMLButtonElement>('[data-next]')!.onclick = () => render(active + 1);
  dialog.onkeydown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    render(active + (event.key === 'ArrowLeft' ? -1 : 1));
  };
}


