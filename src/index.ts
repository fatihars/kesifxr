import {htmlMetin, metin} from "./metinler.ts";
import type {CharacterStyleId} from './scene/ExplorerCharacter.ts';
import {bindOpeningGallery, openingGalleryMarkup, openingHeroPhotoMarkup} from './ui/openingGallery.ts';

const logo = import.meta.env.BASE_URL + 'assets/aistudio/mirasium_cocuk_logo_2_04df5ea2.png';

function showOpening(): void {
  const root = document.querySelector<HTMLElement>('#root')!;
  root.innerHTML = `
    <main class="opening">
      <header class="opening-header">
        <a class="opening-brand" href="#opening-title">
          <img src="${logo}" alt="" width="46" height="46">
          <span>${htmlMetin("index", "mirasium_cocuk_muzesi")} <small>${htmlMetin("index", "cocuk_mirasium_org")}</small></span>
        </a>
        <nav aria-label="${htmlMetin("index", "acilis_menusu")}">
          <a class="opening-link opening-home-link" href="https://cocuk.mirasium.org/">${htmlMetin("index", "ana_sayfa")}</a>
          <a class="opening-link" href="#opening-gallery">${htmlMetin("index", "galeri")} <span aria-hidden="true">↓</span></a>
          <a class="opening-link" href="#opening-features">${htmlMetin("index", "muzede_neler_var")}</a>
        </nav>
      </header>
      <section class="opening-hero" aria-labelledby="opening-title">
        <div class="opening-intro">
          <h1 id="opening-title">${htmlMetin("index", "anadolu_yu")}<br> <span>${htmlMetin("index", "kesfe_cik")}</span></h1>
          <p>${htmlMetin("index", "mirasium_cocuk_muzesi_nde_anadolu_nun_sanatini")}</p>
          <form class="opening-form">
            <fieldset>
              <legend>${htmlMetin("index", "karakterini_sec")}</legend>
              <label><input type="radio" name="character" value="kadin" required><span><b aria-hidden="true">👧</b> ${htmlMetin("index", "kiz_kasif")}</span></label>
              <label><input type="radio" name="character" value="erkek" required><span><b aria-hidden="true">👦</b> ${htmlMetin("index", "erkek_kasif")}</span></label>
            </fieldset>
            <button type="submit" disabled>${htmlMetin("index", "muzeye_gir")} <span aria-hidden="true">↗</span></button>
            <p class="opening-status" role="status" hidden></p>
          </form>
        </div>
        ${openingHeroPhotoMarkup()}
      </section>
      ${openingGalleryMarkup()}
      <section class="opening-features" id="opening-features" aria-labelledby="opening-features-title">
        <h2 id="opening-features-title">${htmlMetin("index", "muzede_neler_var")}</h2>
        <div class="opening-feature-grid">
          <article><h3>${htmlMetin("index", "canli_sergi_ve_hazine_avi")}</h3><p>${htmlMetin("index", "mirasium_arsivinden_secilen_50_eseri_iki_katta")}</p></article>
          <article><h3>${htmlMetin("index", "bahce_oyunlari")}</h3><p>${htmlMetin("index", "mangala_bestas_misket_topac_celik_comak_halka")}</p></article>
          <article><h3>${htmlMetin("index", "atolyeler_ve_kazi")}</h3><p>${htmlMetin("index", "on_cini_desenini_simetriyle_tamamla_resim_yap")}</p></article>
          <article><h3>${htmlMetin("index", "rasathane_ve_siyer_dersi")}</h3><p>${htmlMetin("index", "takiyuddin_in_rasathanesinde_kuyruklu_yildizin_iki_gecedeki")}</p></article>
          <article><h3>${htmlMetin("index", "sahneler_ve_anlatilar")}</h3><p>${htmlMetin("index", "karagoz_ile_hacivat_i_izle_keloglan_masalini")}</p></article>
          <article><h3>${htmlMetin("index", "bahcede_bir_mola")}</h3><p>${htmlMetin("index", "anadolu_kafesi_nde_yoresel_tatlari_kesfet_bahce")}</p></article>
        </div>
        <p class="opening-access">${htmlMetin("index", "bilgisayarda_klavye_ve_fare_telefonda_dokunmatik_kontroller")}</p>
      </section>
    </main>`;

  bindOpeningGallery(root);
  const form = root.querySelector<HTMLFormElement>('form')!;
  const launch = form.querySelector<HTMLButtonElement>('button')!;
  const status = form.querySelector<HTMLElement>('[role="status"]')!;
  form.onchange = () => { launch.disabled = !new FormData(form).get('character'); };
  form.onsubmit = async (event) => {
    event.preventDefault();
    if (launch.disabled) return;
    const selected = new FormData(form).get('character') as CharacterStyleId | null;
    if (!selected) return;
    launch.disabled = true;
    const fieldset = form.querySelector('fieldset')!;
    fieldset.disabled = true;
    status.hidden = false;
    status.textContent = metin("index", "muze_sahnesi_hazirlaniyor");
    try {
      const [xb, {MuseumWorld}, {DEVICE_QUALITY}] = await Promise.all([
        import('xrblocks'),
        import('./scene/MuseumWorld.ts'),
        import('./utils/deviceQuality.ts'),
      ]);
      const options = new xb.Options();
      options.antialias = DEVICE_QUALITY.antialias;
      options.xrButton.enabled = false;
      options.xrButton.alwaysAutostartSimulator = false;
      options.reticles.enabled = false;
      if (import.meta.env.PROD) {
        options.simulator.simulatorSettingsPanel.enabled = false;
        options.simulator.instructions.enabled = false;
        options.simulator.instructions.showAutomatically = false;
        options.simulator.instructions.overlayEnabled = false;
        document.body.classList.add('mirasium-prod');
      }
      options.setAppTitle(metin("index", "mirasium_cocuk_muzesi"));
      options.setAppDescription(metin("index", "anadolu_kulturel_mirasini_eserler_oyunlar_ve_atolyelerle"));
      xb.add(new MuseumWorld(selected));
      await xb.init(options);
      root.replaceChildren();
    } catch (error) {
      console.error('Mirasium başlatılamadı', error);
      status.textContent = metin("index", "muze_acilirken_bir_sorun_olustu_sayfayi_yenileyip");
    }
  };
}

showOpening();
