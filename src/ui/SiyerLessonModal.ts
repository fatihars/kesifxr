import {metin} from "../metinler.ts";
import {fetchSiyerLessons, SIYER_ARCHIVE_URL, type SiyerLesson} from '../services/mirasiumService.ts';

export class SiyerLessonModal {
  readonly dialog = document.createElement('dialog');
  private readonly body = document.createElement('div');
  private readonly heading = document.createElement('h2');
  private lessons: SiyerLesson[] = [];
  private index = 0;
  private request?: AbortController;

  constructor(host: HTMLElement) {
    this.dialog.className = "explorer-dialog siyer-dialog";
    this.heading.id = 'siyer-title';
    this.heading.textContent = metin("SiyerLessonModal", "siyer_i_nebi_dersi");
    this.heading.tabIndex = -1;
    this.dialog.setAttribute('aria-labelledby', this.heading.id);
    const header = document.createElement('header');
    header.append(this.heading, this.button(metin("SiyerLessonModal", "kapat"), () => this.dialog.close()));
    this.dialog.append(header, this.body);
    this.dialog.onclose = () => {
      this.request?.abort();
      this.request = undefined;
      this.body.replaceChildren();
    };
    host.append(this.dialog);
  }

  open(): void {
    if (this.dialog.open) return;
    this.dialog.showModal();
    if (this.lessons.length) this.renderLesson();
    else void this.load();
    this.heading.focus();
  }

  private async load(): Promise<void> {
    this.request?.abort();
    const request = new AbortController();
    this.request = request;
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      request.abort();
    }, 20000);
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    status.textContent = metin("SiyerLessonModal", "mirasium_koleksiyonu_yukleniyor");
    this.body.replaceChildren(status);
    try {
      const lessons = await fetchSiyerLessons(request.signal);
      if (request.signal.aborted) return;
      if (!lessons.length) throw new Error(metin("SiyerLessonModal", "koleksiyon_bos"));
      this.lessons = lessons;
      this.renderLesson();
    } catch {
      if (request.signal.aborted && !timedOut) return;
      status.textContent = metin("SiyerLessonModal", "dersler_yuklenemedi");
      this.body.append(this.button(metin("SiyerLessonModal", "tekrar_dene"), () => void this.load()), this.archiveLink(metin("SiyerLessonModal", "mirasium_koleksiyonunu_ac")));
    } finally {
      window.clearTimeout(timeoutId);
      if (this.request === request) this.request = undefined;
    }
  }

  private renderLesson(focusTitle = false): void {
    const lesson = this.lessons[this.index];
    const title = document.createElement('h3');
    title.tabIndex = -1;
    title.textContent = lesson.title;
    const counter = document.createElement('p');
    counter.className = 'siyer-counter';
    counter.textContent = metin("SiyerLessonModal", "1_2_mirasium_arsivi", this.index + 1, this.lessons.length);
    const sections = lesson.description.split(/\n+/).filter(Boolean);
    const description = document.createElement('div');
    for (const section of sections) {
      const paragraph = document.createElement('p');
      paragraph.textContent = section;
      description.append(paragraph);
    }
    if (!sections.length) description.textContent = metin("SiyerLessonModal", "eserin_ayrintilari_mirasium_arsivinde_yer_aliyor");

    this.body.replaceChildren(counter, title, description);
    if (lesson.imageUrl) {
      const image = document.createElement('img');
      image.alt = lesson.title;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.referrerPolicy = 'no-referrer';
      image.src = lesson.imageUrl;
      this.body.append(image);
    }

    const navigation = document.createElement('nav');
    navigation.setAttribute('aria-label', metin("SiyerLessonModal", "ders_kayitlari"));
    const previous = this.button(metin("SiyerLessonModal", "onceki_kayit"), () => {
      this.index--;
      this.renderLesson(true);
    });
    const next = this.button(metin("SiyerLessonModal", "sonraki_kayit"), () => {
      this.index++;
      this.renderLesson(true);
    });
    previous.disabled = this.index === 0;
    next.disabled = this.index >= this.lessons.length - 1;
    navigation.append(previous, next, this.archiveLink(metin("SiyerLessonModal", "mirasium_da_bu_eseri_ac"), lesson.itemUrl));
    this.body.append(navigation);
    if (focusTitle) title.focus();
  }

  private button(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.onclick = onClick;
    return button;
  }

  private archiveLink(label: string, url = SIYER_ARCHIVE_URL): HTMLAnchorElement {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = metin("SiyerLessonModal", "noopener_noreferrer");
    link.textContent = label;
    return link;
  }

  dispose(): void {
    this.request?.abort();
    this.dialog.remove();
  }
}
