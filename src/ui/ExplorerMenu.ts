import {metin} from "../metinler.ts";
import type {OutdoorActivityKind} from '../types.ts';
import {MARKET_STALLS} from '../scene/HeritageGarden.ts';

interface ExplorerActions {
  gallery: () => void;
  activity: (kind: OutdoorActivityKind) => void;
  hideSeek: () => void;
  art: () => void;
  puzzle: () => void;
  theater: () => void;
  cafe: () => void;
  patternWon: () => void;
  visitTileWorkshop: () => void;
  visitMosque: () => void;
  visitObservatory: () => void;
  visitExcavation: () => void;
  visitConcert: () => void;
  visitHodja: () => void;
  visitPhotoBooth: () => void;
  visitMarket: (index: number) => void;
}

const GAMES: Array<[OutdoorActivityKind, string, string]> = [
  ['mangala', metin("ExplorerMenu", "mangala"), metin("ExplorerMenu", "taslari_dagit_hazineni_doldur")],
  ['bestas', metin("ExplorerMenu", "bestas"), metin("ExplorerMenu", "taslari_topla_havadakini_yakala")],
  ['celikcomak', metin("ExplorerMenu", "celik_comak"), metin("ExplorerMenu", "vurusu_zamanla_mesafe_kazan")],
  ['topac', metin("ExplorerMenu", "topac"), metin("ExplorerMenu", "topacini_dondur_hedefleri_vur")],
  ['misket', metin("ExplorerMenu", "misket"), metin("ExplorerMenu", "misketleri_cemberin_disina_cikar")],
  ['ringtoss', metin("ExplorerMenu", "halka_atma"), metin("ExplorerMenu", "hedefe_nisan_al")],
  ['pingpong', metin("ExplorerMenu", "masa_tenisi"), metin("ExplorerMenu", "rakibinden_once_bes_sayi_al")],
  ['tugofwar', metin("ExplorerMenu", "halat_cekme"), metin("ExplorerMenu", "takiminla_ayni_ritmi_yakala")],
];

const PATTERNS = [
  {size: 3, cells: [1, 2, 1, 2, 3, 2, 1, 2, 1], gaps: [2, 5, 8]},
  {size: 5, cells: [1, 0, 2, 0, 1, 0, 2, 3, 2, 0, 2, 3, 1, 3, 2, 0, 2, 3, 2, 0, 1, 0, 2, 0, 1], gaps: [3, 4, 8, 13, 18, 24]},
  {size: 5, cells: [1, 2, 0, 2, 1, 3, 1, 2, 1, 3, 0, 3, 1, 3, 0, 3, 1, 2, 1, 3, 1, 2, 0, 2, 1], gaps: [4, 8, 9, 13, 14, 18, 23, 24]},
];

const EXTRA_DESIGNS = [
  ['0121', '1232', '2303', '3010', '2303', '1232', '0121'],
  ['3210', '2101', '1012', '0123', '1012', '2101', '3210'],
  ['1203', '2031', '0312', '3120', '0312', '2031', '1203'],
  ['20302', '03130', '31013', '10201', '02120', '10201', '31013', '03130', '20302'],
  ['01310', '13231', '32023', '20302', '03230', '20302', '32023', '13231', '01310'],
  ['32023', '20302', '01010', '13231', '32323', '13231', '01010', '20302', '32023'],
  ['31213', '12021', '23032', '01210', '10301', '01210', '23032', '12021', '31213'],
];

for (const [index, rows] of EXTRA_DESIGNS.entries()) {
  const size = rows.length;
  const middle = Math.floor(size / 2);
  const cells = rows.flatMap((row) => {
    const half = Array.from(row, Number);
    return [...half, ...half.slice(0, -1).reverse()];
  });
  const rightHalf = cells.flatMap((_, i) => i % size > middle ? [i] : []);
  const gaps = rightHalf.filter((_, i) => ((i * 5 + index * 3) % rightHalf.length) < 10 + index * 3);
  PATTERNS.push({size, cells, gaps});
}

const COLORS = [metin("ExplorerMenu", "krem"), metin("ExplorerMenu", "lacivert"), metin("ExplorerMenu", "turkuaz"), metin("ExplorerMenu", "kirmizi")];
const SYMBOLS = ['○', '◆', '✦', '✿'];

export class ExplorerMenu {
  readonly dialog = document.createElement('dialog');
  private readonly menu = document.createElement('div');
  private readonly workshop = document.createElement('div');
  private readonly title = document.createElement('h2');
  private readonly board = document.createElement('div');
  private readonly palette = document.createElement('div');
  private readonly status = document.createElement('p');
  private readonly advance = document.createElement('button');
  private round = 0;
  private color = 1;
  private remaining = 0;
  private awarded = false;

  constructor(host: HTMLElement, private readonly actions: ExplorerActions) {
    this.dialog.className = 'explorer-dialog';
    this.dialog.setAttribute('aria-labelledby', 'explorer-title');
    this.title.id = 'explorer-title';
    this.title.tabIndex = -1;

    const header = document.createElement('header');
    const close = this.makeButton(metin("ExplorerMenu", "kapat"), () => this.dialog.close());
    header.append(this.title, close);

    this.addSection(metin("ExplorerMenu", "muze_ve_atolyeler"), [
      [metin("ExplorerMenu", "sergi"), metin("ExplorerMenu", "eserleri_ve_koleksiyonlari_incele"), actions.gallery],
      [metin("ExplorerMenu", "cini_deseni"), metin("ExplorerMenu", "simetriyi_kullanip_deseni_tamamla"), () => this.openWorkshop(), true],
      [metin("ExplorerMenu", "cini_atolyesine_git"), metin("ExplorerMenu", "bahcedeki_cini_tezgahini_ziyaret_et"), actions.visitTileWorkshop],
      [metin("ExplorerMenu", "takiyuddin_in_rasathanesi"), metin("ExplorerMenu", "gokyuzunu_olc_ve_1577_minyaturunu_incele"), actions.visitObservatory],
      [metin("ExplorerMenu", "arkeoloji_kazisi"), metin("ExplorerMenu", "topragi_fircala_ve_buluntuyu_kaydet"), actions.visitExcavation],
      [metin("ExplorerMenu", "konser_alani"), metin("ExplorerMenu", "sahneyi_dinle_ve_istek_sarki_ilet"), actions.visitConcert],
      [metin("ExplorerMenu", "nasreddin_hoca"), metin("ExplorerMenu", "dere_kiyisinda_maya_calma_fikrasini_dinle"), actions.visitHodja],
      [metin("ExplorerMenu", "cami"), metin("ExplorerMenu", "siyer_i_nebi_dersini_iceride_ac"), actions.visitMosque],
      [metin("ExplorerMenu", "resim_atolyesi"), metin("ExplorerMenu", "kendi_eserini_muzede_sergile"), actions.art],
      [metin("ExplorerMenu", "eser_yapbozu"), metin("ExplorerMenu", "arsivden_bir_eseri_birlestir"), actions.puzzle],
      [metin("ExplorerMenu", "karagoz_ve_hacivat"), metin("ExplorerMenu", "golge_oyununu_izle"), actions.theater],
      ['📸 İstanbul Hatırası', 'Körüklü kamera önünde poz ver ve fotoğrafını indir', actions.visitPhotoBooth],
      [metin("ExplorerMenu", "anadolu_kafesi"), metin("ExplorerMenu", "yoresel_tatlari_kesfet"), actions.cafe],
    ]);
    this.addSection(metin("ExplorerMenu", "oyunlar"), [
      ...GAMES.map(([kind, name, detail]): [string, string, () => void] => [
        name, detail, () => actions.activity(kind),
      ]),
      [metin("ExplorerMenu", "saklambac"), metin("ExplorerMenu", "saklan_veya_arkadaslarini_bul"), actions.hideSeek],
    ]);
    this.addSection(metin("ExplorerMenu", "bahce_tezgahlari"), MARKET_STALLS.map((stall, index) => [
      stall.seller, stall.name, () => actions.visitMarket(index),
    ]));

    const instructions = document.createElement('p');
    instructions.textContent = metin("ExplorerMenu", "sol_yariya_bak_bir_renk_sec_ve");
    this.board.className = 'explorer-pattern';
    this.board.setAttribute('aria-label', metin("ExplorerMenu", "cini_deseni_2"));
    this.palette.className = 'explorer-palette';
    this.palette.setAttribute('aria-label', metin("ExplorerMenu", "desen_renkleri"));
    this.status.setAttribute('role', 'status');

    const facts = document.createElement('p');
    facts.textContent = metin("ExplorerMenu", "cini_ustalari_sirli_yuzeylerde_bitki_hayvan_ve");
    const source = document.createElement('a');
    source.href = 'https://ich.unesco.org/en/RL/traditional-craftsmanship-of-cini-making-01058';
    source.target = '_blank';
    source.rel = metin("ExplorerMenu", "noopener_noreferrer");
    source.textContent = metin("ExplorerMenu", "unesco_kaydi");
    facts.append(source);

    this.advance.onclick = () => {
      this.round = (this.round + 1) % PATTERNS.length;
      this.startRound();
    };
    this.workshop.append(instructions, this.palette, this.board, this.status, this.advance, facts);
    this.dialog.append(header, this.menu, this.workshop);
    host.append(this.dialog);
  }

  open(): void {
    this.showMenu();
    if (!this.dialog.open) this.dialog.showModal();
    this.title.focus();
  }

  private showMenu(): void {
    this.title.textContent = metin("ExplorerMenu", "kesfe_cik");
    this.menu.hidden = false;
    this.workshop.hidden = true;
    if (this.dialog.open) this.title.focus();
  }

  private makeButton(label: string, action: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.onclick = action;
    return button;
  }

  private addSection(title: string, entries: Array<[string, string, () => void, boolean?]>): void {
    const section = document.createElement('section');
    const heading = document.createElement('h3');
    heading.textContent = title;
    const grid = document.createElement('div');
    grid.className = 'explorer-destinations';

    for (const [label, detail, action, stayOpen] of entries) {
      const button = this.makeButton(label, () => {
        if (!stayOpen) this.dialog.close();
        action();
      });
      const subtitle = document.createElement('span');
      subtitle.textContent = detail;
      button.append(subtitle);
      grid.append(button);
    }
    section.append(heading, grid);
    this.menu.append(section);
  }

  openWorkshop(): void {
    this.menu.hidden = true;
    this.workshop.hidden = false;
    if (!this.dialog.open) this.dialog.showModal();
    if (!this.board.childElementCount) this.startRound();
    else this.showRoundTitle();
  }

  private showRoundTitle(): void {
    this.title.textContent = metin("ExplorerMenu", "cini_deseni_tur_1_2", this.round + 1, PATTERNS.length);
    this.title.focus();
  }

  private startRound(): void {
    const {size, cells, gaps} = PATTERNS[this.round];
    this.showRoundTitle();
    this.remaining = gaps.length;
    this.advance.hidden = true;
    this.palette.replaceChildren(...COLORS.map((name, color) => {
      const swatch = this.makeButton(`${SYMBOLS[color]} ${name}`, () => {
        this.color = color;
        this.updatePalette();
      });
      swatch.dataset.color = String(color);
      return swatch;
    }));
    this.updatePalette();
    this.board.style.setProperty('--pattern-size', String(size));
    this.board.replaceChildren(...cells.map((color, index) => {
      if (!gaps.includes(index)) {
        const tile = document.createElement('span');
        tile.dataset.color = String(color);
        tile.textContent = SYMBOLS[color];
        return tile;
      }
      const tile = this.makeButton('?', () => {
        if (this.color !== color) {
          this.status.textContent = metin("ExplorerMenu", "sol_tarafta_ayni_siradaki_aynali_kareye_bak");
          return;
        }
        tile.dataset.color = String(color);
        tile.textContent = SYMBOLS[color];
        tile.setAttribute('aria-label', metin("ExplorerMenu", "tamamlandi_1", COLORS[color]));
        tile.disabled = true;
        this.remaining--;
        this.updateProgress();
        const next = this.board.querySelector<HTMLButtonElement>('button:enabled');
        (next ?? this.advance).focus();
      });
      tile.setAttribute('aria-label', metin("ExplorerMenu", "bos_kare_1_sira_2_sutun", Math.floor(index / size) + 1, index % size + 1));
      return tile;
    }));
    this.updateProgress();
  }

  private updatePalette(): void {
    Array.from(this.palette.children).forEach((swatch, index) => {
      swatch.setAttribute('aria-pressed', String(index === this.color));
    });
  }

  private updateProgress(): void {
    if (this.remaining > 0) {
      this.status.textContent = metin("ExplorerMenu", "1_bos_kare_kaldi", this.remaining);
      return;
    }
    const finalRound = this.round === PATTERNS.length - 1;
    this.status.textContent = finalRound ? metin("ExplorerMenu", "on_desenin_hepsini_tamamladin") : metin("ExplorerMenu", "desen_tamamlandi");
    this.advance.textContent = finalRound ? metin("ExplorerMenu", "bastan_oyna") : metin("ExplorerMenu", "sonraki_desen");
    this.advance.hidden = false;
    if (finalRound && !this.awarded) {
      this.awarded = true;
      this.actions.patternWon();
    }
  }
}
