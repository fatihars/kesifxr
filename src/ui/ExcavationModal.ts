import {metin} from "../metinler.ts";
import type {DigArtifactInfo} from '../scene/InteractiveGardenProps.ts';

const GRID = ['A1', 'B1', 'C1', 'A2', 'B2', 'C2'];

export class ExcavationModal {
  readonly dialog = document.createElement('dialog');
  private readonly title = document.createElement('h2');
  private readonly content = document.createElement('div');

  constructor(host: HTMLElement) {
    this.dialog.className = "explorer-dialog excavation-dialog";
    this.dialog.setAttribute('aria-labelledby', 'excavation-title');
    this.title.id = 'excavation-title';
    this.title.tabIndex = -1;
    const head = document.createElement('header');
    head.append(this.title, this.button(metin("ExcavationModal", "kapat"), () => this.dialog.close()));
    this.dialog.append(head, this.content);
    host.append(this.dialog);
  }

  open(artifact: DigArtifactInfo, onRecord: () => boolean): void {
    const square = GRID[artifact.index];
    this.title.textContent = metin("ExcavationModal", "kazi_karesi_1", square);
    const instructions = document.createElement('p');
    instructions.textContent = metin("ExcavationModal", "once_mala_ile_gevsek_ust_topragi_al");
    const upper = this.button(metin("ExcavationModal", "ust_topragi_al"), () => {
      upper.hidden = true;
      grid.hidden = false;
      instructions.textContent = metin("ExcavationModal", "topragin_uzerinde_fircayi_surukle_veya_bolmelere_dokun");
      cells[0].focus();
    });
    const grid = document.createElement('div');
    grid.className = 'excavation-grid';
    grid.hidden = true;
    grid.setAttribute('aria-label', metin("ExcavationModal", "1_karesindeki_ince_toprak", square));
    const find = document.createElement('span');
    find.className = 'excavation-find';
    find.textContent = artifact.icon;
    find.setAttribute('aria-hidden', 'true');
    grid.append(find);

    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    const record = this.button(metin("ExcavationModal", "1_olarak_kaydet", square), () => {
      if (!onRecord()) return;
      this.title.textContent = metin("ExcavationModal", "saha_kaydi_tamamlandi");
      this.showRecord(artifact);
      this.title.focus();
    });
    record.hidden = true;

    let remaining = 6;
    const brush = (part: HTMLButtonElement) => {
      if (part.disabled) return;
      part.disabled = true;
      part.classList.add('brushed');
      remaining--;
      status.textContent = remaining
        ? metin("ExcavationModal", "1_toprak_bolmesi_kaldi", remaining)
        : metin("ExcavationModal", "1_aciga_cikti_buluntu_yerini_kaydet", artifact.title);
      if (!remaining) record.hidden = false;
    };
    const cells = Array.from({length: 6}, (_, index) => {
      const part = this.button('', () => {
        brush(part);
        (cells.find((cell) => !cell.disabled) ?? record).focus();
      });
      part.setAttribute('aria-label', metin("ExcavationModal", "topragi_fircala_1", index + 1));
      return part;
    });
    grid.append(...cells);
    grid.onpointermove = (event) => {
      if (!event.buttons && event.pointerType !== 'touch') return;
      const part = document.elementFromPoint(event.clientX, event.clientY);
      if (part instanceof HTMLButtonElement && cells.includes(part)) brush(part);
    };
    this.content.replaceChildren(instructions, upper, grid, status, record);
    this.show();
  }

  openJournal(records: DigArtifactInfo[]): void {
    this.title.textContent = metin("ExcavationModal", "kazi_defteri");
    const intro = document.createElement('p');
    intro.textContent = metin("ExcavationModal", "1_2_kare_kaydedildi", records.length, GRID.length);
    const list = document.createElement('ul');
    for (const record of records) {
      const row = document.createElement('li');
      row.textContent = `${GRID[record.index]} · ${record.title}`;
      list.append(row);
    }
    this.content.replaceChildren(intro, list);
    this.show();
  }

  private showRecord(artifact: DigArtifactInfo): void {
    const title = document.createElement('h3');
    title.textContent = `${artifact.icon} ${artifact.title}`;
    const label = document.createElement('p');
    label.textContent = metin("ExcavationModal", "kare_1_buluntu_kopyasi", GRID[artifact.index]);
    const fact = document.createElement('p');
    fact.textContent = artifact.fact;
    this.content.replaceChildren(title, label, fact, this.button(metin("ExcavationModal", "kaziya_don"), () => this.dialog.close()));
  }

  private show(): void {
    if (!this.dialog.open) this.dialog.showModal();
    this.title.focus();
  }

  private button(label: string, action: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.onclick = action;
    return button;
  }
}
