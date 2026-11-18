import {metin} from "../metinler.ts";
import {COMET_IMAGE} from '../scene/HeritageGarden.ts';

export type ObservatoryPage = 'observe' | 'comet' | 'biography';
export const OBSERVATORY_SOURCE = 'https://mirasium.org/takiyuddin-ve-istanbul-rasathanesi/';

const REFERENCE = {azimuth: 132, altitude: 32};
const COMET_POSITIONS = [{azimuth: 143, altitude: 44}, {azimuth: 150, altitude: 41}];
const STARS = [
  [98, 55, 1], [107, 17, 1], [113, 47, 1.6], [119, 24, 1.3],
  [122, 65, 1], [125, 41, 1], [132, 32, 2.9], [135, 52, 1.1],
  [138, 23, 0.8], [149, 58, 1.2], [156, 26, 1.4], [162, 39, 1],
  [165, 63, 1.5], [170, 19, 1], [180, 46, 1], [186, 33, 1.7],
];
const STEPS = [
  {night: 1, target: REFERENCE, instruction: metin("ObservatoryModal", "once_mavi_isaretli_kilavuz_yildizi_nisangahin_ortasina")},
  {night: 1, target: COMET_POSITIONS[0], instruction: metin("ObservatoryModal", "kuyruklu_yildizi_bul_ve_ilk_geceki_konumunu")},
  {night: 2, target: COMET_POSITIONS[1], instruction: metin("ObservatoryModal", "ikinci_gece_ayni_kuyruklu_yildizi_yeniden_olc")},
];

export class ObservatoryModal {
  readonly dialog = document.createElement('dialog');
  private readonly title = document.createElement('h2');
  private readonly content = document.createElement('div');
  private azimuth = 120;
  private altitude = 28;
  private readonly observations: Array<{azimuth: number; altitude: number}> = [];

  constructor(host: HTMLElement) {
    this.dialog.className = "explorer-dialog observatory-dialog";
    this.title.id = 'observatory-title';
    this.title.tabIndex = -1;
    this.dialog.setAttribute('aria-labelledby', this.title.id);
    const header = document.createElement('header');
    header.append(this.title, this.button(metin("ObservatoryModal", "kapat"), () => this.dialog.close()));
    const tabs = document.createElement('nav');
    tabs.setAttribute('aria-label', metin("ObservatoryModal", "rasathane_bolumleri"));
    tabs.append(
      this.button(metin("ObservatoryModal", "gozlem_terasi"), () => this.open('observe')),
      this.button(metin("ObservatoryModal", "1577_minyaturu"), () => this.open('comet')),
      this.button(metin("ObservatoryModal", "kitabe"), () => this.open('biography'))
    );
    this.dialog.append(header, tabs, this.content);
    host.append(this.dialog);
  }

  open(page: ObservatoryPage): void {
    this.content.replaceChildren();
    if (page === 'observe') this.renderObservation();
    else if (page === 'comet') {
      this.title.textContent = metin("ObservatoryModal", "1577_kuyruklu_yildizi");
      const image = document.createElement('img');
      image.src = COMET_IMAGE;
      image.alt = metin("ObservatoryModal", "istanbul_un_uzerinde_uzun_altin_renkli_kuyruguyla");
      this.content.append(image, this.paragraph(metin("ObservatoryModal", "1577_de_istanbul_dan_gorulen_kuyruklu_yildiz")));
    } else {
      this.title.textContent = metin("ObservatoryModal", "takiyuddin_er_rasid");
      this.content.append(
        this.paragraph(metin("ObservatoryModal", "takiyuddin_astronominin_yani_sira_matematik_optik_ve")),
        this.paragraph(metin("ObservatoryModal", "ekip_halkali_aletle_gok_cisimlerinin_konumunu_libne")),
        this.paragraph(metin("ObservatoryModal", "bu_kose_takiyuddin_in_ve_birlikte_calistigi"))
      );
    }
    const source = document.createElement('a');
    source.href = OBSERVATORY_SOURCE;
    source.textContent = metin("ObservatoryModal", "kaynak_mirasium");
    source.target = '_blank';
    source.rel = metin("ObservatoryModal", "noopener_noreferrer");
    source.className = 'observatory-source';
    this.content.append(source);
    if (!this.dialog.open) this.dialog.showModal();
    this.title.focus();
  }

  private renderObservation(): void {
    this.title.textContent = metin("ObservatoryModal", "kuyruklu_yildiz_rasadi");
    const step = STEPS[this.observations.length];
    const log = this.buildLog();
    if (!step) {
      const east = this.observations[2].azimuth - this.observations[1].azimuth;
      const lower = this.observations[1].altitude - this.observations[2].altitude;
      this.content.append(
        this.paragraph(metin("ObservatoryModal", "iki_geceyi_karsilastir")),
        log,
        this.paragraph(metin("ObservatoryModal", "olcum_defterine_gore_kuyruklu_yildizin_yatay_acisi", east, lower)),
        this.button(metin("ObservatoryModal", "yeni_rasat"), () => {
          this.observations.length = 0;
          this.azimuth = 120;
          this.altitude = 28;
          this.open('observe');
        })
      );
      return;
    }

    const sky = document.createElement('canvas');
    sky.className = 'observatory-sight';
    sky.width = 720;
    sky.height = 360;
    sky.tabIndex = 0;
    sky.setAttribute('aria-label', metin("ObservatoryModal", "rasat_nisangahi_fare_veya_parmakla_surukle_ya"));
    const ctx = sky.getContext('2d')!;
    const readings = this.paragraph('');
    readings.className = 'observatory-readings';
    const feedback = this.paragraph('');
    feedback.className = 'observatory-feedback';
    feedback.setAttribute('role', 'status');
    const record = this.button(metin("ObservatoryModal", "rasat_defterine_yaz"), () => {
      const dx = this.azimuth - step.target.azimuth;
      const dy = this.altitude - step.target.altitude;
      if (Math.hypot(dx, dy) > 1.65) {
        feedback.textContent = Math.abs(dx) > Math.abs(dy)
          ? (dx < 0 ? metin("ObservatoryModal", "aleti_biraz_saga_cevir") : metin("ObservatoryModal", "aleti_biraz_sola_cevir"))
          : (dy < 0 ? metin("ObservatoryModal", "nisangahi_biraz_yukselt") : metin("ObservatoryModal", "nisangahi_biraz_alcalt"));
        return;
      }
      this.observations.push({azimuth: Math.round(this.azimuth), altitude: Math.round(this.altitude)});
      this.open('observe');
    });

    const render = () => {
      this.drawSky(ctx, step.night);
      readings.textContent = metin("ObservatoryModal", "yon_1_yukseklik_2", this.azimuth.toFixed(1).replace('.', ','), this.altitude.toFixed(1).replace('.', ','));
    };
    const aim = (x: number, y: number) => {
      this.azimuth = Math.max(95, Math.min(180, this.azimuth + x));
      this.altitude = Math.max(8, Math.min(70, this.altitude + y));
      render();
    };

    let drag: {id: number; x: number; y: number} | undefined;
    sky.onpointerdown = (event) => {
      if (drag || event.button !== 0) return;
      sky.setPointerCapture(event.pointerId);
      drag = {id: event.pointerId, x: event.clientX, y: event.clientY};
    };
    sky.onpointermove = (event) => {
      if (drag?.id !== event.pointerId) return;
      const degreesPerPixel = 62 / sky.clientWidth;
      aim((drag.x - event.clientX) * degreesPerPixel, (event.clientY - drag.y) * degreesPerPixel);
      drag.x = event.clientX;
      drag.y = event.clientY;
    };
    sky.onlostpointercapture = () => { drag = undefined; };
    const directions = [
      {name: metin("ObservatoryModal", "sola"), label: '←', key: 'ArrowLeft', x: -1, y: 0},
      {name: metin("ObservatoryModal", "yukari"), label: '↑', key: 'ArrowUp', x: 0, y: 1},
      {name: metin("ObservatoryModal", "asagi"), label: '↓', key: 'ArrowDown', x: 0, y: -1},
      {name: metin("ObservatoryModal", "saga"), label: '→', key: 'ArrowRight', x: 1, y: 0},
    ];
    sky.onkeydown = (event) => {
      const direction = directions.find(({key}) => event.key === key);
      if (!direction) return;
      event.preventDefault();
      aim(direction.x, direction.y);
    };
    const controls = document.createElement('div');
    controls.className = 'observatory-controls';
    for (const move of directions) {
      const button = this.button(move.label, () => aim(move.x, move.y));
      button.setAttribute('aria-label', move.name);
      controls.append(button);
    }
    controls.append(record);
    this.content.append(
      this.paragraph(`${step.night}. gece · ${step.instruction}`),
      sky, readings, controls, feedback, log,
      this.paragraph(metin("ObservatoryModal", "bu_uygulama_iki_gecelik_bir_olcum_canlandirmasidir"))
    );
    render();
  }

  private drawSky(ctx: CanvasRenderingContext2D, night: number): void {
    const {width, height} = ctx.canvas;
    const scale = width / 62;
    const project = (azimuth: number, altitude: number) => [
      width / 2 + (azimuth - this.azimuth) * scale,
      height / 2 - (altitude - this.altitude) * scale,
    ];
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#060c25');
    sky.addColorStop(1, '#283f60');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#101e33';
    const horizon = project(0, 0)[1];
    ctx.fillRect(0, horizon, width, height);

    for (const [azimuth, altitude, radius] of STARS) {
      const [x, y] = project(azimuth, altitude);
      ctx.fillStyle = radius > 2 ? '#92e1ff' : '#f4e7ca';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      if (radius > 2) {
        ctx.strokeStyle = '#6bb2ce';
        ctx.strokeRect(x - 7, y - 7, 14, 14);
      }
    }
    const comet = COMET_POSITIONS[night - 1];
    const [x, y] = project(comet.azimuth, comet.altitude);
    const tail = ctx.createLinearGradient(x, y, x + 86, y - 33);
    tail.addColorStop(0, '#fff4bb');
    tail.addColorStop(1, '#e8bc6a00');
    ctx.fillStyle = tail;
    ctx.beginPath();
    ctx.moveTo(x, y + 4);
    ctx.quadraticCurveTo(x + 36, y + 4, x + 90, y - 35);
    ctx.quadraticCurveTo(x + 32, y - 19, x, y - 4);
    ctx.fill();
    ctx.fillStyle = '#fff4bc';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#c5a46a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 20, 0, Math.PI * 2);
    ctx.moveTo(width / 2 - 33, height / 2);
    ctx.lineTo(width / 2 + 33, height / 2);
    ctx.moveTo(width / 2, height / 2 - 33);
    ctx.lineTo(width / 2, height / 2 + 33);
    ctx.stroke();
  }

  private buildLog(): HTMLElement {
    const list = document.createElement('ol');
    list.className = 'observatory-log';
    list.setAttribute('aria-label', metin("ObservatoryModal", "rasat_defteri"));
    this.observations.forEach(({azimuth, altitude}, i) => {
      const line = document.createElement('li');
      line.textContent = metin("ObservatoryModal", "1_yon_2_yukseklik_3", [metin("ObservatoryModal", "kilavuz_yildiz"), metin("ObservatoryModal", "kuyruklu_yildiz_1_gece"), metin("ObservatoryModal", "kuyruklu_yildiz_2_gece")][i], azimuth, altitude);
      list.append(line);
    });
    return list;
  }

  private button(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.onclick = onClick;
    return button;
  }

  private paragraph(text: string): HTMLParagraphElement {
    const p = document.createElement('p');
    p.textContent = text;
    return p;
  }
}
