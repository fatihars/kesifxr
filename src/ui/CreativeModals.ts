import {htmlMetin, metin} from "../metinler.ts";
import type {ArtifactItem} from '../types.ts';

export interface CreativeModalsCallbacks {
  onPublishArtwork: (dataUrl: string, title: string) => void;
  onPuzzleSolved: (artifact: ArtifactItem, moves: number) => void;
  onPlaySelect: () => void;
}

type DrawTool = 'brush' | 'eraser' | 'stamp';

const PALETTE_COLORS = [
  '#0284c7',
  '#f59e0b',
  '#dc2626',
  '#16a34a',
  '#7c3aed',
  '#ec4899',
  '#1e3a8a',
  '#78350f',
  '#0f172a',
  '#ffffff',
];

const STAMPS = ['⭐', '🌷', '🌙', '🔶', '🏛️', '💎'];

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vRot: number;
  color: string;
}

export class CreativeModals {
  private callbacks: CreativeModalsCallbacks;
  private artifacts: ArtifactItem[] = [];

  // Art studio DOM
  private artBackdrop!: HTMLDivElement;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private titleInput!: HTMLInputElement;
  private inspImg!: HTMLImageElement;
  private inspTitle!: HTMLSpanElement;
  private symmetryCheck!: HTMLInputElement;
  private sizeSlider!: HTMLInputElement;

  private activeTool: DrawTool = 'brush';
  private activeColor = PALETTE_COLORS[0];
  private activeStamp = STAMPS[0];
  private brushSize = 9;
  private symmetryMode = false;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;
  private historyStack: ImageData[] = [];
  private inspIndex = 0;

  // Puzzle DOM
  private puzzleBackdrop!: HTMLDivElement;
  private puzzleBoard!: HTMLDivElement;
  private puzzlePreviewImg!: HTMLImageElement;
  private puzzleTitleEl!: HTMLSpanElement;
  private puzzleMovesEl!: HTMLSpanElement;
  private puzzleStatusEl!: HTMLDivElement;
  private gridSize: 3 | 4 = 3;
  private puzzleTiles: number[] = [];
  private selectedTilePos: number | null = null;
  private puzzleMoves = 0;
  private puzzleSolved = false;
  private currentPuzzleArtifact: ArtifactItem | null = null;
  private showTileNumbers = true;

  // 2s Screen Confetti Canvas
  private confettiCanvas!: HTMLCanvasElement;
  private confettiCtx!: CanvasRenderingContext2D;
  private confettiPieces: ConfettiPiece[] = [];
  private confettiEndsAt = 0;
  private confettiRaf = 0;

  constructor(hostRoot: HTMLElement, callbacks: CreativeModalsCallbacks) {
    this.callbacks = callbacks;
    this.buildArtStudioModal(hostRoot);
    this.buildPuzzleModal(hostRoot);
    this.buildConfettiOverlay(hostRoot);
  }

  setArtifacts(artifacts: ArtifactItem[]): void {
    this.artifacts = artifacts;
    this.inspIndex = 0;
    this.updateInspirationDisplay();
  }

  private buildArtStudioModal(host: HTMLElement): void {
    this.artBackdrop = document.createElement('div');
    this.artBackdrop.className = "hud-modal-backdrop hidden";
    this.artBackdrop.onclick = (e) => {
      if (e.target === this.artBackdrop) this.closeAll();
    };

    const card = document.createElement('div');
    card.className = "hud-modal-card hud-creative-card";

    const top = document.createElement('div');
    top.className = 'hud-modal-top';
    top.innerHTML = `
      <div class="hud-group">
        <span class="hud-pill hud-pill-gold">${htmlMetin("CreativeModals", "eser_olusturma_atolyesi")}</span>
        <span class="hud-pill hud-pill-sky">${htmlMetin("CreativeModals", "kendi_dijital_eserini_tasarla")}</span>
      </div>
    `;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-close-btn';
    closeBtn.textContent = metin("CreativeModals", "kapat_simgeli");
    closeBtn.onclick = () => this.closeAll();
    top.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'hud-artstudio-body';

    // Left Canvas Column
    const canvasCol = document.createElement('div');
    canvasCol.className = 'hud-artstudio-canvas-col';

    this.canvas = document.createElement('canvas');
    this.canvas.width = 600;
    this.canvas.height = 450;
    this.canvas.className = 'hud-art-canvas';
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      this.ctx = ctx;
      this.resetCanvasSurface();
    }

    this.bindCanvasEvents();
    canvasCol.appendChild(this.canvas);

    // Right Tools Column
    const toolsCol = document.createElement('div');
    toolsCol.className = 'hud-artstudio-tools';

    // Inspiration Card
    const inspBox = document.createElement('div');
    inspBox.className = 'hud-insp-box';
    this.inspImg = document.createElement('img');
    this.inspImg.alt = metin("CreativeModals", "ilham_eseri");
    this.inspImg.setAttribute('referrerpolicy', 'no-referrer');
    const inspInfo = document.createElement('div');
    inspInfo.className = 'hud-insp-info';
    this.inspTitle = document.createElement('span');
    this.inspTitle.className = 'hud-insp-title';
    this.inspTitle.textContent = metin("CreativeModals", "mirasium_desen_ilhami");
    const nextInspBtn = document.createElement('button');
    nextInspBtn.className = 'hud-mini-btn';
    nextInspBtn.textContent = metin("CreativeModals", "baska_ilham");
    nextInspBtn.onclick = () => {
      this.callbacks.onPlaySelect();
      if (this.artifacts.length > 0) {
        this.inspIndex = (this.inspIndex + 1) % this.artifacts.length;
        this.updateInspirationDisplay();
      }
    };
    const templateBtn = document.createElement('button');
    templateBtn.className = "hud-mini-btn hud-mini-primary";
    templateBtn.textContent = metin("CreativeModals", "cini_sablonu_ciz");
    templateBtn.onclick = () => {
      this.callbacks.onPlaySelect();
      this.drawPatternGuide();
    };
    const inspBtns = document.createElement('div');
    inspBtns.className = 'hud-group';
    inspBtns.append(nextInspBtn, templateBtn);
    inspInfo.append(this.inspTitle, inspBtns);
    inspBox.append(this.inspImg, inspInfo);

    // Colors
    const colorRow = document.createElement('div');
    colorRow.className = 'hud-swatch-row';
    const swatchBtns: HTMLButtonElement[] = [];
    PALETTE_COLORS.forEach((hex, idx) => {
      const sw = document.createElement('button');
      sw.className = `hud-swatch ${idx === 0 ? 'active' : ''}`;
      sw.style.backgroundColor = hex;
      sw.setAttribute('aria-label', metin("CreativeModals", "renk_1", hex));
      sw.onclick = () => {
        this.activeColor = hex;
        if (this.activeTool === 'eraser') this.activeTool = 'brush';
        swatchBtns.forEach((b) => b.classList.remove('active'));
        sw.classList.add('active');
        refreshToolButtons();
      };
      swatchBtns.push(sw);
      colorRow.appendChild(sw);
    });

    // Mode Buttons
    const toolRow = document.createElement('div');
    toolRow.className = 'hud-group';
    const brushBtn = document.createElement('button');
    brushBtn.className = "hud-mini-btn hud-mini-primary";
    brushBtn.textContent = metin("CreativeModals", "firca");
    const eraserBtn = document.createElement('button');
    eraserBtn.className = 'hud-mini-btn';
    eraserBtn.textContent = metin("CreativeModals", "silgi");
    const stampModeBtn = document.createElement('button');
    stampModeBtn.className = 'hud-mini-btn';
    stampModeBtn.textContent = metin("CreativeModals", "damga_modu");

    const refreshToolButtons = () => {
      brushBtn.classList.toggle('hud-mini-primary', this.activeTool === 'brush');
      eraserBtn.classList.toggle('hud-mini-primary', this.activeTool === 'eraser');
      stampModeBtn.classList.toggle('hud-mini-primary', this.activeTool === 'stamp');
    };

    brushBtn.onclick = () => {
      this.activeTool = 'brush';
      refreshToolButtons();
    };
    eraserBtn.onclick = () => {
      this.activeTool = 'eraser';
      refreshToolButtons();
    };
    stampModeBtn.onclick = () => {
      this.activeTool = 'stamp';
      refreshToolButtons();
    };
    toolRow.append(brushBtn, eraserBtn, stampModeBtn);

    // Stamps Bar
    const stampRow = document.createElement('div');
    stampRow.className = 'hud-group';
    const stampBtns: HTMLButtonElement[] = [];
    STAMPS.forEach((emoji, idx) => {
      const sb = document.createElement('button');
      sb.className = `hud-mini-btn ${idx === 0 ? 'hud-mini-primary' : ''}`;
      sb.textContent = emoji;
      sb.onclick = () => {
        this.activeStamp = emoji;
        this.activeTool = 'stamp';
        stampBtns.forEach((b) => b.classList.remove('hud-mini-primary'));
        sb.classList.add('hud-mini-primary');
        refreshToolButtons();
      };
      stampBtns.push(sb);
      stampRow.appendChild(sb);
    });

    // Brush size & Symmetry checkbox
    const slidersRow = document.createElement('div');
    slidersRow.className = 'hud-artstudio-controls-row';
    const sizeLabel = document.createElement('label');
    sizeLabel.className = 'hud-tool-label';
    sizeLabel.textContent = metin("CreativeModals", "kalinlik");
    this.sizeSlider = document.createElement('input');
    this.sizeSlider.type = 'range';
    this.sizeSlider.min = '4';
    this.sizeSlider.max = '28';
    this.sizeSlider.value = String(this.brushSize);
    this.sizeSlider.oninput = () => {
      this.brushSize = Number(this.sizeSlider.value);
    };

    const symLabel = document.createElement('label');
    symLabel.className = 'hud-sym-toggle';
    this.symmetryCheck = document.createElement('input');
    this.symmetryCheck.type = 'checkbox';
    this.symmetryCheck.onchange = () => {
      this.symmetryMode = this.symmetryCheck.checked;
    };
    const symSpan = document.createElement('span');
    symSpan.textContent = metin("CreativeModals", "4x_cini_simetrisi");
    symLabel.append(this.symmetryCheck, symSpan);

    slidersRow.append(sizeLabel, this.sizeSlider, symLabel);

    // Artwork Title + Undo/Clear
    this.titleInput = document.createElement('input');
    this.titleInput.type = 'text';
    this.titleInput.className = 'hud-title-input';
    this.titleInput.maxLength = 40;
    this.titleInput.value = metin("CreativeModals", "genc_kasifin_cini_eseri");
    this.titleInput.placeholder = metin("CreativeModals", "eserine_bir_isim_ver");

    const quickBtns = document.createElement('div');
    quickBtns.className = 'hud-group';
    const undoBtn = document.createElement('button');
    undoBtn.className = 'hud-mini-btn';
    undoBtn.textContent = metin("CreativeModals", "geri_al");
    undoBtn.onclick = () => this.undoStroke();

    const clearBtn = document.createElement('button');
    clearBtn.className = 'hud-mini-btn';
    clearBtn.textContent = metin("CreativeModals", "temizle");
    clearBtn.onclick = () => {
      this.pushHistory();
      this.resetCanvasSurface();
    };
    quickBtns.append(undoBtn, clearBtn);

    toolsCol.append(
      inspBox,
      colorRow,
      toolRow,
      stampRow,
      slidersRow,
      this.titleInput,
      quickBtns
    );

    body.append(canvasCol, toolsCol);

    const actions = document.createElement('div');
    actions.className = 'hud-modal-actions';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = "hud-btn hud-btn-dark";
    cancelBtn.textContent = metin("CreativeModals", "kapat");
    cancelBtn.onclick = () => this.closeAll();

    const publishBtn = document.createElement('button');
    publishBtn.className = "hud-btn hud-btn-amber";
    publishBtn.textContent = metin("CreativeModals", "muzeye_sergile");
    publishBtn.onclick = () => {
      const title = this.titleInput.value.trim() || metin("CreativeModals", "genc_kasifin_eseri");
      const dataUrl = this.canvas.toDataURL('image/png');
      this.closeAll();
      this.callbacks.onPublishArtwork(dataUrl, title);
    };
    actions.append(cancelBtn, publishBtn);

    card.append(top, body, actions);
    this.artBackdrop.appendChild(card);
    host.appendChild(this.artBackdrop);
  }

  private resetCanvasSurface(): void {
    if (!this.ctx) return;
    this.ctx.fillStyle = '#fffdf7';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(10, 10, this.canvas.width - 20, this.canvas.height - 20);
  }

  private drawPatternGuide(): void {
    if (!this.ctx) return;
    this.pushHistory();
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(2, 132, 199, 0.25)';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([8, 6]);
    [70, 135, 195].forEach((r) => {
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
      this.ctx.stroke();
    });
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy);
      this.ctx.lineTo(cx + Math.cos(a) * 200, cy + Math.sin(a) * 200);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private pushHistory(): void {
    if (!this.ctx) return;
    if (this.historyStack.length >= 15) {
      this.historyStack.shift();
    }
    this.historyStack.push(
      this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    );
  }

  private undoStroke(): void {
    const snap = this.historyStack.pop();
    if (snap && this.ctx) {
      this.ctx.putImageData(snap, 0, 0);
    }
  }

  private bindCanvasEvents(): void {
    const getPos = (e: PointerEvent): [number, number] => {
      const rect = this.canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * this.canvas.width;
      const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * this.canvas.height;
      return [x, y];
    };

    const plotSymmetric = (fn: (px: number, py: number) => void, x: number, y: number) => {
      fn(x, y);
      if (this.symmetryMode) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        fn(w - x, y);
        fn(x, h - y);
        fn(w - x, h - y);
      }
    };

    const drawSegment = (x1: number, y1: number, x2: number, y2: number) => {
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.lineWidth = this.brushSize;
      this.ctx.strokeStyle = this.activeTool === 'eraser' ? '#fffdf7' : this.activeColor;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.pushHistory();
      const [x, y] = getPos(e);
      if (this.activeTool === 'stamp') {
        this.callbacks.onPlaySelect();
        this.ctx.font = `${Math.max(28, this.brushSize * 3.2)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        plotSymmetric((px, py) => {
          this.ctx.fillText(this.activeStamp, px, py);
        }, x, y);
        return;
      }
      this.isDrawing = true;
      this.canvas.setPointerCapture(e.pointerId);
      this.lastX = x;
      this.lastY = y;
      plotSymmetric((px, py) => drawSegment(px, py, px + 0.1, py + 0.1), x, y);
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.isDrawing) return;
      e.stopPropagation();
      const [x, y] = getPos(e);
      const lx = this.lastX;
      const ly = this.lastY;
      drawSegment(lx, ly, x, y);
      if (this.symmetryMode) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        drawSegment(w - lx, ly, w - x, y);
        drawSegment(lx, h - ly, x, h - y);
        drawSegment(w - lx, h - ly, w - x, h - y);
      }
      this.lastX = x;
      this.lastY = y;
    });

    const stopDraw = () => {
      this.isDrawing = false;
    };
    this.canvas.addEventListener('pointerup', stopDraw);
    this.canvas.addEventListener('pointercancel', stopDraw);
  }

  private updateInspirationDisplay(): void {
    const art = this.artifacts[this.inspIndex];
    if (!art) {
      this.inspTitle.textContent = metin("CreativeModals", "anadolu_cini_geometrik_yildiz_deseni");
      return;
    }
    this.inspImg.src = art.thumbUrl || art.imageUrl;
    this.inspTitle.textContent = metin("CreativeModals", "ilham_1", art.title);
  }

  private buildPuzzleModal(host: HTMLElement): void {
    this.puzzleBackdrop = document.createElement('div');
    this.puzzleBackdrop.className = "hud-modal-backdrop hidden";
    this.puzzleBackdrop.onclick = (e) => {
      if (e.target === this.puzzleBackdrop) this.closeAll();
    };

    const card = document.createElement('div');
    card.className = "hud-modal-card hud-creative-card";

    const top = document.createElement('div');
    top.className = 'hud-modal-top';
    const badges = document.createElement('div');
    badges.className = 'hud-group';
    const badge1 = document.createElement('span');
    badge1.className = "hud-pill hud-pill-gold";
    badge1.textContent = metin("CreativeModals", "eser_puzzle_oyunu");
    this.puzzleMovesEl = document.createElement('span');
    this.puzzleMovesEl.className = "hud-pill hud-pill-sky";
    this.puzzleMovesEl.textContent = metin("CreativeModals", "baslangic_hamle");
    badges.append(badge1, this.puzzleMovesEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hud-close-btn';
    closeBtn.textContent = metin("CreativeModals", "kapat_simgeli");
    closeBtn.onclick = () => this.closeAll();
    top.append(badges, closeBtn);

    const body = document.createElement('div');
    body.className = 'hud-puzzle-body';

    const boardWrap = document.createElement('div');
    boardWrap.className = 'hud-puzzle-board-wrap';
    this.puzzleBoard = document.createElement('div');
    this.puzzleBoard.className = 'hud-puzzle-board';
    boardWrap.appendChild(this.puzzleBoard);

    const sideCol = document.createElement('div');
    sideCol.className = 'hud-puzzle-side';

    this.puzzleTitleEl = document.createElement('span');
    this.puzzleTitleEl.className = 'hud-modal-title';
    this.puzzleTitleEl.style.fontSize = '19px';

    const previewCard = document.createElement('div');
    previewCard.className = 'hud-puzzle-preview';
    this.puzzlePreviewImg = document.createElement('img');
    this.puzzlePreviewImg.alt = metin("CreativeModals", "tamamlanmis_eser_ornegi");
    this.puzzlePreviewImg.setAttribute('referrerpolicy', 'no-referrer');
    previewCard.appendChild(this.puzzlePreviewImg);

    this.puzzleStatusEl = document.createElement('div');
    this.puzzleStatusEl.className = 'hud-discovery-box';
    this.puzzleStatusEl.textContent =
      metin("CreativeModals", "yerini_degistirmek_istedigin_iki_parcaya_sirayla_tikla");

    const controlsRow = document.createElement('div');
    controlsRow.className = 'hud-group';

    const sizeToggleBtn = document.createElement('button');
    sizeToggleBtn.className = 'hud-mini-btn';
    sizeToggleBtn.textContent = metin("CreativeModals", "4_4_zorluk");
    sizeToggleBtn.onclick = () => {
      this.callbacks.onPlaySelect();
      this.gridSize = this.gridSize === 3 ? 4 : 3;
      sizeToggleBtn.textContent = this.gridSize === 3 ? metin("CreativeModals", "4_4_zorluk") : metin("CreativeModals", "3_3_kolay");
      this.resetPuzzleGame();
    };

    const numToggleBtn = document.createElement('button');
    numToggleBtn.className = 'hud-mini-btn';
    numToggleBtn.textContent = metin("CreativeModals", "sayilari_gizle");
    numToggleBtn.onclick = () => {
      this.showTileNumbers = !this.showTileNumbers;
      numToggleBtn.textContent = this.showTileNumbers
        ? metin("CreativeModals", "sayilari_gizle")
        : metin("CreativeModals", "sayilari_goster");
      this.renderPuzzleBoard();
    };

    const newPuzzleBtn = document.createElement('button');
    newPuzzleBtn.className = "hud-mini-btn hud-mini-primary";
    newPuzzleBtn.textContent = metin("CreativeModals", "yeni_eser");
    newPuzzleBtn.onclick = () => {
      this.callbacks.onPlaySelect();
      this.openPuzzleModal();
    };

    controlsRow.append(sizeToggleBtn, numToggleBtn, newPuzzleBtn);
    sideCol.append(this.puzzleTitleEl, previewCard, this.puzzleStatusEl, controlsRow);

    body.append(boardWrap, sideCol);
    card.append(top, body);
    this.puzzleBackdrop.appendChild(card);
    host.appendChild(this.puzzleBackdrop);
  }

  openArtStudioModal(): void {
    this.closeAll();
    this.updateInspirationDisplay();
    this.artBackdrop.classList.remove('hidden');
  }

  openPuzzleModal(preferredArtifact?: ArtifactItem): void {
    this.closeAll();
    const pool = this.artifacts;
    if (preferredArtifact) {
      this.currentPuzzleArtifact = preferredArtifact;
    } else if (pool.length > 0) {
      this.currentPuzzleArtifact = pool[Math.floor(Math.random() * pool.length)];
    } else {
      this.currentPuzzleArtifact = null;
    }

    if (!this.currentPuzzleArtifact) {
      this.puzzleTitleEl.textContent = metin("CreativeModals", "mirasium_eser_puzzle");
      this.puzzleStatusEl.textContent = metin("CreativeModals", "eserler_yukleniyor_birkac_saniye_sonra_tekrar_dene");
    } else {
      this.puzzleTitleEl.textContent = this.currentPuzzleArtifact.title;
      this.puzzlePreviewImg.src =
        this.currentPuzzleArtifact.imageUrl || this.currentPuzzleArtifact.thumbUrl;
    }

    this.resetPuzzleGame();
    this.puzzleBackdrop.classList.remove('hidden');
  }

  private resetPuzzleGame(): void {
    const total = this.gridSize * this.gridSize;
    this.puzzleTiles = Array.from({length: total}, (_, i) => i);
    // Fisher-Yates shuffle avoiding already-solved arrangement
    for (let i = total - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.puzzleTiles[i], this.puzzleTiles[j]] = [
        this.puzzleTiles[j],
        this.puzzleTiles[i],
      ];
    }
    if (this.puzzleTiles.every((val, idx) => val === idx) && total >= 2) {
      [this.puzzleTiles[0], this.puzzleTiles[1]] = [
        this.puzzleTiles[1],
        this.puzzleTiles[0],
      ];
    }
    this.selectedTilePos = null;
    this.puzzleMoves = 0;
    this.puzzleSolved = false;
    this.puzzleMovesEl.textContent = metin("CreativeModals", "baslangic_hamle");
    this.puzzleStatusEl.textContent =
      metin("CreativeModals", "yerini_degistirmek_istedigin_iki_parcaya_sirayla_tikla");
    this.renderPuzzleBoard();
  }

  private renderPuzzleBoard(): void {
    const N = this.gridSize;
    const imgUrl =
      this.currentPuzzleArtifact?.imageUrl ||
      this.currentPuzzleArtifact?.thumbUrl ||
      '';

    this.puzzleBoard.innerHTML = '';
    this.puzzleBoard.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
    this.puzzleBoard.style.gridTemplateRows = `repeat(${N}, 1fr)`;

    this.puzzleTiles.forEach((pieceIdx, slotIdx) => {
      const btn = document.createElement('button');
      btn.className = 'hud-puzzle-tile';
      if (this.selectedTilePos === slotIdx) btn.classList.add('selected');
      if (pieceIdx === slotIdx) btn.classList.add('correct');

      const col = pieceIdx % N;
      const row = Math.floor(pieceIdx / N);
      if (imgUrl) {
        // Pure CSS background slicing avoids any external-image CORS canvas taint!
        btn.style.backgroundImage = `url("${imgUrl}")`;
        btn.style.backgroundSize = `${N * 100}% ${N * 100}%`;
        btn.style.backgroundPosition = `${(col / (N - 1)) * 100}% ${(row / (N - 1)) * 100}%`;
      } else {
        btn.style.backgroundColor = '#1e293b';
      }

      if (this.showTileNumbers) {
        const num = document.createElement('span');
        num.className = 'hud-puzzle-num';
        num.textContent = String(pieceIdx + 1);
        btn.appendChild(num);
      }

      btn.onclick = () => this.handleTileClick(slotIdx);
      this.puzzleBoard.appendChild(btn);
    });
  }

  private handleTileClick(slotIdx: number): void {
    if (this.puzzleSolved) return;
    this.callbacks.onPlaySelect();

    if (this.selectedTilePos === null) {
      this.selectedTilePos = slotIdx;
      this.renderPuzzleBoard();
      return;
    }
    if (this.selectedTilePos === slotIdx) {
      this.selectedTilePos = null;
      this.renderPuzzleBoard();
      return;
    }

    const a = this.selectedTilePos;
    [this.puzzleTiles[a], this.puzzleTiles[slotIdx]] = [
      this.puzzleTiles[slotIdx],
      this.puzzleTiles[a],
    ];
    this.selectedTilePos = null;
    this.puzzleMoves++;
    this.puzzleMovesEl.textContent = `Hamle: ${this.puzzleMoves}`;

    const isDone = this.puzzleTiles.every((val, idx) => val === idx);
    if (isDone) {
      this.puzzleSolved = true;
      this.puzzleStatusEl.textContent = metin("CreativeModals", "harika_eseri_1_hamlede_basariyla_tamamladin", this.puzzleMoves);
      this.renderPuzzleBoard();
      if (this.currentPuzzleArtifact) {
        this.callbacks.onPuzzleSolved(this.currentPuzzleArtifact, this.puzzleMoves);
      }
      return;
    }

    this.renderPuzzleBoard();
  }

  private buildConfettiOverlay(host: HTMLElement): void {
    this.confettiCanvas = document.createElement('canvas');
    this.confettiCanvas.className = "hud-confetti-canvas hidden";
    const ctx = this.confettiCanvas.getContext('2d');
    if (ctx) this.confettiCtx = ctx;
    host.appendChild(this.confettiCanvas);
  }

  triggerScreenConfetti(durationMs = 2000): void {
    if (!this.confettiCtx) return;
    this.confettiCanvas.width = window.innerWidth;
    this.confettiCanvas.height = window.innerHeight;
    this.confettiCanvas.classList.remove('hidden');

    const colors = ['#fbbf24', '#38bdf8', '#f472b6', '#34d399', '#a78bfa', '#fb923c'];
    this.confettiPieces = Array.from({length: 110}, () => ({
      x: Math.random() * this.confettiCanvas.width,
      y: -20 - Math.random() * 140,
      vx: (Math.random() - 0.5) * 280,
      vy: 140 + Math.random() * 340,
      w: 7 + Math.random() * 8,
      h: 5 + Math.random() * 7,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    this.confettiEndsAt = performance.now() + durationMs;
    if (this.confettiRaf) cancelAnimationFrame(this.confettiRaf);

    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const w = this.confettiCanvas.width;
      const h = this.confettiCanvas.height;
      this.confettiCtx.clearRect(0, 0, w, h);

      const remaining = Math.max(0, (this.confettiEndsAt - now) / durationMs);
      this.confettiCtx.globalAlpha = Math.min(1, remaining * 1.4);

      for (const p of this.confettiPieces) {
        p.vy += 240 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vRot * dt;

        this.confettiCtx.save();
        this.confettiCtx.translate(p.x, p.y);
        this.confettiCtx.rotate(p.rot);
        this.confettiCtx.fillStyle = p.color;
        this.confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        this.confettiCtx.restore();
      }

      if (now < this.confettiEndsAt) {
        this.confettiRaf = requestAnimationFrame(step);
      } else {
        this.confettiCtx.clearRect(0, 0, w, h);
        this.confettiCanvas.classList.add('hidden');
        this.confettiRaf = 0;
      }
    };
    this.confettiRaf = requestAnimationFrame(step);
  }

  closeAll(): void {
    this.artBackdrop.classList.add('hidden');
    this.puzzleBackdrop.classList.add('hidden');
  }

  isOpen(): boolean {
    return (
      !this.artBackdrop.classList.contains('hidden') ||
      !this.puzzleBackdrop.classList.contains('hidden')
    );
  }

  dispose(): void {
    if (this.confettiRaf) cancelAnimationFrame(this.confettiRaf);
    this.artBackdrop.remove();
    this.puzzleBackdrop.remove();
    this.confettiCanvas.remove();
  }
}
