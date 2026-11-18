import {metin} from "../metinler.ts";
import {CONCERT_TRACKS, type ConcertPlayer} from '../services/concertPlayer.ts';

export class ConcertModal {
  readonly dialog = document.createElement('dialog');
  private readonly current = document.createElement('p');
  private readonly next = document.createElement('p');
  private readonly feedback = document.createElement('p');
  private readonly play = document.createElement('button');
  private readonly queue = document.createElement('ol');
  private readonly choose = document.createElement('select');
  private readonly requestButton = document.createElement('button');
  private readonly unsubscribe: () => void;

  constructor(host: HTMLElement, private readonly player: ConcertPlayer) {
    this.dialog.className = "explorer-dialog concert-dialog";
    this.dialog.setAttribute('aria-labelledby', 'concert-title');
    const title = document.createElement('h2');
    title.id = 'concert-title';
    title.textContent = metin("ConcertModal", "konser_alani");
    const header = document.createElement('header');
    header.append(title, this.button(metin("ConcertModal", "kapat"), () => this.dialog.close()));

    const now = document.createElement('section');
    now.className = 'concert-now';
    now.append(this.current, this.next, this.play, this.button(metin("ConcertModal", "sonraki_parca"), () => player.advance()));
    this.play.type = 'button';
    this.play.onclick = () => player.togglePlayback();

    const form = document.createElement('form');
    const label = document.createElement('label');
    label.textContent = metin("ConcertModal", "istek_sarki");
    label.htmlFor = 'concert-song';
    this.choose.id = 'concert-song';
    CONCERT_TRACKS.forEach(({title: name}, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = name;
      this.choose.append(option);
    });
    this.choose.onchange = () => this.sync();
    this.requestButton.type = 'submit';
    this.requestButton.textContent = metin("ConcertModal", "istek_sarki_ilet");
    form.append(label, this.choose, this.requestButton);
    form.onsubmit = (event) => {
      event.preventDefault();
      player.request(Number(this.choose.value));
    };

    const program = document.createElement('ol');
    for (const track of CONCERT_TRACKS) {
      const entry = document.createElement('li');
      entry.textContent = track.title;
      program.append(entry);
    }
    const programTitle = document.createElement('h3');
    programTitle.textContent = metin("ConcertModal", "konser_sirasi");
    const programSection = document.createElement('section');
    programSection.append(programTitle, program);

    const queueTitle = document.createElement('h3');
    queueTitle.textContent = metin("ConcertModal", "istek_sirasi");
    const queueSection = document.createElement('section');
    queueSection.append(queueTitle, this.queue);
    const lists = document.createElement('div');
    lists.className = 'concert-lists';
    lists.append(programSection, queueSection);
    this.feedback.setAttribute('role', 'status');
    this.dialog.append(header, now, form, this.feedback, lists);
    host.append(this.dialog);
    this.unsubscribe = player.subscribe(() => this.sync());
    this.sync();
  }

  open(): void {
    this.sync();
    if (!this.dialog.open) this.dialog.showModal();
  }

  private sync(): void {
    const {current, next, playing, intendsToPlay, status, queued} = this.player;
    this.current.textContent = `${playing ? metin("ConcertModal", "simdi_caliyor") : metin("ConcertModal", "secili_parca")} · Mirasium – ${CONCERT_TRACKS[current].title}`;
    this.next.textContent = metin("ConcertModal", "siradaki_1", CONCERT_TRACKS[next].title);
    this.play.textContent = intendsToPlay ? metin("ConcertModal", "duraklat") : metin("ConcertModal", "oynat");
    this.feedback.textContent = status;
    this.requestButton.disabled = queued.includes(Number(this.choose.value)) || Number(this.choose.value) === current;
    this.queue.replaceChildren(...queued.map((index) => {
      const entry = document.createElement('li');
      entry.textContent = CONCERT_TRACKS[index].title;
      return entry;
    }));
    if (!queued.length) {
      const empty = document.createElement('li');
      empty.textContent = metin("ConcertModal", "istek_yok");
      this.queue.append(empty);
    }
  }

  private button(label: string, action: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.onclick = action;
    return button;
  }

  dispose(): void {
    this.unsubscribe();
    this.dialog.remove();
  }
}
