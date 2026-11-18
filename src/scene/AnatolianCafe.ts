import {metin} from "../metinler.ts";
import * as THREE from 'three';
import * as xb from 'xrblocks';

import type {CafeMenuItem} from '../types.ts';
import {
  createAnatolianColumn,
  createOttomanAlem,
  createPointedArchGeometry,
  getAnatolianKilimTexture,
  getCobblePlazaTextures,
  getIznikTileTexture,
  getMarbleInlayTexture,
  getTerracottaRoofTextures,
  getWalnutWoodTextures,
} from '../utils/anatolianMaterials.ts';
import {ExplorerCharacter} from './ExplorerCharacter.ts';
import type {WallRect} from './MuseumBuilding.ts';

export const CAFE_ORIGIN = new THREE.Vector3(24.5, 0, 5.8);

export const CAFE_MENU_ITEMS: CafeMenuItem[] = [
  {
    id: 'cafe-cay',
    name: metin("AnatolianCafe", "tavsan_kani_rize_cayi"),
    icon: '🍵',
    category: 'drink',
    region: metin("AnatolianCafe", "karadeniz_rize"),
    description:
      metin("AnatolianCafe", "ince_belli_cam_bardakta_sicak_mis_kokulu"),
    boostSeconds: 12,
  },
  {
    id: 'cafe-ayran',
    name: metin("AnatolianCafe", "kopuklu_yayik_ayrani"),
    icon: '🥛',
    category: 'drink',
    region: metin("AnatolianCafe", "anadolu_gelenegi"),
    description:
      metin("AnatolianCafe", "bakir_masrapada_bol_kopuklu_serin_yayik_ayrani"),
    boostSeconds: 14,
  },
  {
    id: 'cafe-salep',
    name: metin("AnatolianCafe", "tarcinli_sicak_salep"),
    icon: '☕',
    category: 'drink',
    region: metin("AnatolianCafe", "burdur_kahramanmaras"),
    description:
      metin("AnatolianCafe", "uzeri_tarcinli_kadife_gibi_sicak_anadolu_salebi"),
    boostSeconds: 15,
  },
  {
    id: 'cafe-serbet',
    name: metin("AnatolianCafe", "osmanli_gul_demirhindi_serbeti"),
    icon: '🧃',
    category: 'drink',
    region: metin("AnatolianCafe", "istanbul_saray_mutfagi"),
    description:
      metin("AnatolianCafe", "tarihi_osmanli_baharatlari_ve_gul_yapraklariyla_hazirlanan"),
    boostSeconds: 16,
  },
  {
    id: 'cafe-limonata',
    name: metin("AnatolianCafe", "taze_naneli_limonata"),
    icon: '🍋',
    category: 'drink',
    region: metin("AnatolianCafe", "akdeniz_mersin_adana"),
    description:
      metin("AnatolianCafe", "bahce_limonlari_ve_taze_nane_yapraklariyla_serinletici"),
    boostSeconds: 14,
  },
  {
    id: 'cafe-simit',
    name: metin("AnatolianCafe", "tas_firin_susamli_simit"),
    icon: '🥯',
    category: 'food',
    region: metin("AnatolianCafe", "ankara_izmir_istanbul"),
    description:
      metin("AnatolianCafe", "altin_renkli_citir_susamli_taze_sokak_simidi"),
    boostSeconds: 14,
  },
  {
    id: 'cafe-gozleme',
    name: metin("AnatolianCafe", "sacda_taze_gozleme"),
    icon: '🫓',
    category: 'food',
    region: metin("AnatolianCafe", "ic_anadolu_koyleri"),
    description:
      metin("AnatolianCafe", "bakir_sac_uzerinde_ozenle_pisirilmis_peynirli_ve"),
    boostSeconds: 18,
  },
  {
    id: 'cafe-baklava',
    name: metin("AnatolianCafe", "antep_fistikli_baklava"),
    icon: '🥮',
    category: 'food',
    region: metin("AnatolianCafe", "gaziantep_mutfagi"),
    description:
      metin("AnatolianCafe", "incecik_yufkalar_arasinda_citir_antep_fistigi_soleni"),
    boostSeconds: 18,
  },
  {
    id: 'cafe-dondurma',
    name: metin("AnatolianCafe", "kahramanmaras_dondurmasi"),
    icon: '🍨',
    category: 'food',
    region: metin("AnatolianCafe", "kahramanmaras"),
    description:
      metin("AnatolianCafe", "keci_sutu_ve_hakiki_saleple_dovulerek_yapilan"),
    boostSeconds: 15,
  },
  {
    id: 'cafe-salgam',
    name: metin("AnatolianCafe", "adana_havuclu_salgam_suyu"),
    icon: '🍷',
    category: 'drink',
    region: metin("AnatolianCafe", "cukurova_adana"),
    description:
      metin("AnatolianCafe", "siyah_havuc_ve_salgam_turpuyla_fermente_edilen"),
    boostSeconds: 14,
  },
  {
    id: 'cafe-menengic',
    name: metin("AnatolianCafe", "sanliurfa_menengic_kahvesi"),
    icon: '🫖',
    category: 'drink',
    region: metin("AnatolianCafe", "guneydogu_sanliurfa"),
    description:
      metin("AnatolianCafe", "yabani_fistik_tanelerinin_sut_ile_bulustugu_kafeinsiz"),
    boostSeconds: 16,
  },
  {
    id: 'cafe-dibek',
    name: metin("AnatolianCafe", "osmanli_dibek_sutlu_kahve"),
    icon: '☕',
    category: 'drink',
    region: metin("AnatolianCafe", "ege_ic_anadolu"),
    description:
      metin("AnatolianCafe", "tas_dibekte_dovulen_kahve_ve_kakule_aromasiyla"),
    boostSeconds: 15,
  },
  {
    id: 'cafe-manti',
    name: metin("AnatolianCafe", "kayseri_ev_mantisi"),
    icon: '🥟',
    category: 'food',
    region: metin("AnatolianCafe", "ic_anadolu_kayseri"),
    description:
      metin("AnatolianCafe", "bir_kasiga_kirk_tane_sigan_el_acmasi"),
    boostSeconds: 20,
  },
  {
    id: 'cafe-kuymak',
    name: metin("AnatolianCafe", "trabzon_uzayan_kuymak"),
    icon: '🧀',
    category: 'food',
    region: metin("AnatolianCafe", "karadeniz_trabzon"),
    description:
      metin("AnatolianCafe", "tereyagi_misir_unu_ve_kolot_peyniriyle_bakir"),
    boostSeconds: 19,
  },
  {
    id: 'cafe-kunefe',
    name: metin("AnatolianCafe", "hatay_sicak_kunefesi"),
    icon: '🍯',
    category: 'food',
    region: metin("AnatolianCafe", "akdeniz_antakya"),
    description:
      metin("AnatolianCafe", "bakir_tabakta_nar_gibi_kizarmis_tel_kadayif"),
    boostSeconds: 20,
  },
  {
    id: 'cafe-boyoz',
    name: metin("AnatolianCafe", "izmir_citir_boyozu"),
    icon: '🥐',
    category: 'food',
    region: metin("AnatolianCafe", "ege_izmir"),
    description:
      metin("AnatolianCafe", "izmir_sabahlarinin_vazgecilmezi_kat_kat_ince_hamurlu"),
    boostSeconds: 15,
  },
  {
    id: 'cafe-kadayif',
    name: metin("AnatolianCafe", "erzurum_kadayif_dolmasi"),
    icon: '🍮',
    category: 'food',
    region: metin("AnatolianCafe", "dogu_anadolu_erzurum"),
    description:
      metin("AnatolianCafe", "ici_bol_cevizli_disi_citir_citir_sarilmis"),
    boostSeconds: 18,
  },
];

export const STREET_VENDOR_ITEMS: CafeMenuItem[] = [
  {
    id: 'siraci-sira',
    name: metin("AnatolianCafe", "buz_gibi_uzum_sirasi"),
    icon: '🍇',
    category: 'drink',
    region: metin("AnatolianCafe", "geleneksel_osmanli_anadolu_sokagi"),
    description:
      metin("AnatolianCafe", "gunduzleri_bakir_gugumden_sunulan_siyah_uzumden_yapilmis"),
    boostSeconds: 20,
  },
  {
    id: 'bozaci-boza',
    name: metin("AnatolianCafe", "tarcinli_sicak_boza"),
    icon: '🥣',
    category: 'drink',
    region: metin("AnatolianCafe", "vefa_geleneksel_kis_aksamlari"),
    description:
      metin("AnatolianCafe", "aksamlari_feneriyle_gezen_bozacinin_tarcin_ve_leblebiyle"),
    boostSeconds: 22,
  },
];

export class AnatolianCafe extends xb.Script {
  private disposables: Array<{dispose: () => void}> = [];
  private interactiveMeshes: THREE.Object3D[] = [];
  private wallRects: WallRect[] = [];
  private cafeMaster!: ExplorerCharacter;
  private cafeMasterWorldPos = new THREE.Vector3();
  private bubbleSprite!: THREE.Sprite;
  private bubbleMat!: THREE.SpriteMaterial;
  private bubbleTex!: THREE.CanvasTexture;
  private semaverSteam: THREE.Mesh[] = [];
  private time = 0;

  private track<T extends {dispose: () => void}>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  constructor() {
    super();
    this.buildCafePavilion();
    this.buildCafeMasterNpc();
  }

  init(): void {}

  private buildCafePavilion(): void {
    const group = new THREE.Group();
    group.position.copy(CAFE_ORIGIN);

    const cobbleTex = getCobblePlazaTextures(3, 2.5);
    const walnutTex = getWalnutWoodTextures(2, 1);
    const roofTex = getTerracottaRoofTextures(4, 2);
    const marbleTex = getMarbleInlayTexture(2, 1);
    const iznikTex = getIznikTileTexture('turquoise', 3, 1);
    const kilimTex = getAnatolianKilimTexture('crimson');

    const stoneMat = this.track(
      new THREE.MeshStandardMaterial({
        map: cobbleTex.map,
        bumpMap: cobbleTex.bumpMap,
        bumpScale: 0.015,
        roughness: 0.85,
      })
    );
    const stoneTrimMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xd6c7b0, roughness: 0.72})
    );
    const timberMat = this.track(
      new THREE.MeshStandardMaterial({
        map: walnutTex.map,
        bumpMap: walnutTex.bumpMap,
        bumpScale: 0.012,
        roughness: 0.68,
      })
    );
    const creamWallMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xfbf0db, roughness: 0.72})
    );
    const tileRoofMat = this.track(
      new THREE.MeshStandardMaterial({
        map: roofTex.map,
        bumpMap: roofTex.bumpMap,
        bumpScale: 0.02,
        roughness: 0.62,
      })
    );
    const iznikMat = this.track(
      new THREE.MeshStandardMaterial({map: iznikTex, roughness: 0.34})
    );
    const kilimMat = this.track(
      new THREE.MeshStandardMaterial({map: kilimTex, roughness: 0.86})
    );
    const copperMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.82,
        roughness: 0.22,
      })
    );
    const brassMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.8,
        roughness: 0.24,
      })
    );

    // 1. Cobblestone Terrace Deck (7.8m wide x 6.4m deep) + Cut Stone Border
    const deck = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(7.8, 0.14, 6.4)),
      stoneMat
    );
    deck.position.set(0, 0.07, 0);
    deck.receiveShadow = true;
    deck.name = 'walkable-ground';
    group.add(deck);

    const deckRim = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(8.0, 0.06, 6.6)),
      stoneTrimMat
    );
    deckRim.position.set(0, 0.03, 0);
    deckRim.receiveShadow = true;
    group.add(deckRim);

    // 2. Safranbolu Bağdadi Plaster & Exposed Walnut Timber-Frame Kiosk
    const backWall = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(3.2, 3.1, 0.28)),
      creamWallMat
    );
    backWall.position.set(2.0, 1.65, -2.5);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    backWall.userData.cafeInteractive = true;

    const eastWall = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.28, 3.1, 5.2)),
      creamWallMat
    );
    eastWall.position.set(3.46, 1.65, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    eastWall.userData.cafeInteractive = true;

    const southWall = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(3.2, 3.1, 0.28)),
      creamWallMat
    );
    southWall.position.set(2.0, 1.65, 2.5);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    southWall.userData.cafeInteractive = true;
    group.add(backWall, eastWall, southWall);

    // Bağdadi Walnut Horizontal Belts & Corner Studs on Walls
    [0.24, 1.55, 3.08].forEach((by) => {
      const beltBack = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(3.24, 0.11, 0.32)),
        timberMat
      );
      beltBack.position.set(2.0, by, -2.5);
      const beltSouth = beltBack.clone();
      beltSouth.position.z = 2.5;
      const beltEast = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(0.32, 0.11, 5.26)),
        timberMat
      );
      beltEast.position.set(3.46, by, 0);
      group.add(beltBack, beltSouth, beltEast);
    });
    // Back kiosk shelf / spice niche detail facing west customer counter
    const backShelf = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.42, 0.08, 3.8)),
      timberMat
    );
    backShelf.position.set(3.12, 1.68, 0);
    group.add(backShelf);
    [-1.4, -0.5, 0.5, 1.4].forEach((jz, idx) => {
      const jar = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.085, 0.1, 0.28, 12)),
        idx % 2 === 0 ? copperMat : iznikMat
      );
      jar.position.set(3.12, 1.86, jz);
      group.add(jar);
    });

    // Fluted Anatolian Timber Columns on Terrace Corners + Kemer Arch Valance
    [
      [0.45, -2.5],
      [0.45, 2.5],
      [-3.3, -2.5],
      [-3.3, 2.5],
    ].forEach(([px, pz]) => {
      const col = createAnatolianColumn(
        (item) => this.track(item),
        0.11,
        3.16,
        timberMat,
        brassMat,
        brassMat
      );
      col.position.set(px, 0.14, pz);
      group.add(col);
    });

    const facadeArch = new THREE.Mesh(
      this.track(createPointedArchGeometry(5.15, 0.85, 4.45, 0.08, 0.72, 0.14)),
      timberMat
    );
    facadeArch.rotation.y = -Math.PI / 2;
    facadeArch.position.set(-3.3, 2.48, 0);
    group.add(facadeArch);

    // 3. Anatolian Alaturka Terracotta Roof + Ottoman Alem + Red-Cream Striped Awning
    const mainRoof = new THREE.Mesh(
      this.track(new THREE.ConeGeometry(3.85, 1.32, 4)),
      tileRoofMat
    );
    mainRoof.rotation.y = Math.PI / 4;
    mainRoof.position.set(1.9, 3.88, 0);
    mainRoof.castShadow = true;

    const eaveBox = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(5.4, 0.12, 5.65)),
      timberMat
    );
    eaveBox.position.set(1.9, 3.24, 0);

    const roofAlem = createOttomanAlem((item) => this.track(item), 0.72, brassMat);
    roofAlem.position.set(1.9, 4.48, 0);
    group.add(eaveBox, mainRoof, roofAlem);

    // Striped Awning Canvas Texture
    const awCanvas = document.createElement('canvas');
    awCanvas.width = 512;
    awCanvas.height = 128;
    const awCtx = awCanvas.getContext('2d');
    if (awCtx) {
      for (let i = 0; i < 16; i++) {
        awCtx.fillStyle = i % 2 === 0 ? '#b91c1c' : '#fef3c7';
        awCtx.fillRect(i * 32, 0, 32, 128);
      }
      awCtx.fillStyle = '#78350f';
      awCtx.fillRect(0, 114, 512, 14);
    }
    const awTex = this.track(new THREE.CanvasTexture(awCanvas));
    awTex.colorSpace = THREE.SRGBColorSpace;
    const awning = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(4.2, 0.1, 5.4)),
      this.track(new THREE.MeshStandardMaterial({map: awTex, roughness: 0.65}))
    );
    awning.position.set(-1.45, 3.08, 0);
    awning.rotation.z = 0.22;
    awning.castShadow = true;
    awning.userData.cafeInteractive = true;
    group.add(awning);

    // 4. Marble-Topped Serving Counter with İznik Turquoise Apron
    const counterBase = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.85, 1.05, 4.4)),
      timberMat
    );
    counterBase.position.set(0.55, 0.62, 0);
    counterBase.castShadow = true;
    counterBase.receiveShadow = true;
    counterBase.userData.cafeInteractive = true;

    const iznikApron = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.05, 0.82, 4.1)),
      iznikMat
    );
    iznikApron.position.set(0.11, 0.62, 0);
    iznikApron.userData.cafeInteractive = true;

    const counterTop = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(1.08, 0.1, 4.58)),
      this.track(new THREE.MeshStandardMaterial({map: marbleTex, roughness: 0.26}))
    );
    counterTop.position.set(0.52, 1.18, 0);
    counterTop.castShadow = true;
    counterTop.userData.cafeInteractive = true;
    group.add(counterBase, iznikApron, counterTop);

    // 5. Lathe-Turned Copper Turkish Semaver + Demlik Teapot + Steam
    const semaverProfile = [
      new THREE.Vector2(0.01, 0.0),
      new THREE.Vector2(0.18, 0.0),
      new THREE.Vector2(0.19, 0.05),
      new THREE.Vector2(0.11, 0.11),
      new THREE.Vector2(0.21, 0.28),
      new THREE.Vector2(0.22, 0.4),
      new THREE.Vector2(0.14, 0.5),
      new THREE.Vector2(0.17, 0.55),
      new THREE.Vector2(0.02, 0.55),
    ];
    const semaverBody = new THREE.Mesh(
      this.track(new THREE.LatheGeometry(semaverProfile, 20)),
      copperMat
    );
    semaverBody.position.set(0.5, 1.23, -1.2);
    semaverBody.castShadow = true;
    semaverBody.userData.cafeInteractive = true;

    const demlikProfile = [
      new THREE.Vector2(0.01, 0.0),
      new THREE.Vector2(0.11, 0.0),
      new THREE.Vector2(0.14, 0.11),
      new THREE.Vector2(0.09, 0.21),
      new THREE.Vector2(0.11, 0.24),
      new THREE.Vector2(0.03, 0.28),
      new THREE.Vector2(0.01, 0.31),
    ];
    const semaverTeapot = new THREE.Mesh(
      this.track(new THREE.LatheGeometry(demlikProfile, 16)),
      copperMat
    );
    semaverTeapot.position.set(0.5, 1.76, -1.2);
    semaverTeapot.userData.cafeInteractive = true;

    const tap = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.022, 0.022, 0.16, 8)),
      brassMat
    );
    tap.rotation.z = Math.PI / 2;
    tap.position.set(0.26, 1.45, -1.2);

    const handleGeo = this.track(new THREE.TorusGeometry(0.08, 0.015, 6, 12, Math.PI));
    [-1, 1].forEach((side) => {
      const h = new THREE.Mesh(handleGeo, brassMat);
      h.position.set(0.5, 1.56, -1.2 + side * 0.21);
      h.rotation.y = side * (Math.PI / 2);
      h.rotation.z = -Math.PI / 2;
      group.add(h);
    });
    group.add(semaverBody, semaverTeapot, tap);

    const steamGeo = this.track(new THREE.SphereGeometry(0.06, 8, 6));
    const steamMat = this.track(
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.45,
      })
    );
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Mesh(steamGeo, steamMat);
      s.position.set(0.5, 2.04 + i * 0.16, -1.2);
      group.add(s);
      this.semaverSteam.push(s);
    }

    // 6. Brass Sini Simit Tray & Antep Pistachio Baklava Pan on Counter
    const tray = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.38, 0.34, 0.06, 18)),
      brassMat
    );
    tray.position.set(0.5, 1.26, 0.15);
    tray.userData.cafeInteractive = true;
    group.add(tray);

    const simitGeo = this.track(new THREE.TorusGeometry(0.1, 0.032, 8, 16));
    const simitMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xd97706, roughness: 0.65})
    );
    for (let s = 0; s < 4; s++) {
      const simit = new THREE.Mesh(simitGeo, simitMat);
      simit.rotation.x = Math.PI / 2;
      simit.position.set(
        0.5 + (s % 2 === 0 ? -0.1 : 0.1),
        1.32 + Math.floor(s / 2) * 0.065,
        0.15
      );
      simit.userData.cafeInteractive = true;
      group.add(simit);
    }

    const bakTray = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.48, 0.06, 0.58)),
      copperMat
    );
    bakTray.position.set(0.5, 1.26, 1.25);
    bakTray.userData.cafeInteractive = true;
    const bakBlock = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.38, 0.08, 0.46)),
      this.track(new THREE.MeshStandardMaterial({color: 0xf59e0b, roughness: 0.48}))
    );
    bakBlock.position.set(0.5, 1.32, 1.25);
    bakBlock.userData.cafeInteractive = true;
    const pistachioTop = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.32, 0.015, 0.4)),
      this.track(new THREE.MeshStandardMaterial({color: 0x65a30d, roughness: 0.6}))
    );
    pistachioTop.position.set(0.5, 1.365, 1.25);
    group.add(bakTray, bakBlock, pistachioTop);

    // 7. Prominent Wooden Signboard "ANADOLU KAFESİ"
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 640;
    signCanvas.height = 176;
    const ctx = signCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.roundRect(6, 6, 628, 164, 24);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 34px "Google Sans", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(metin("AnatolianCafe", "mirasium_anadolu_kafe"), 320, 58);

      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 22px "Google Sans", Arial, sans-serif';
      ctx.fillText(metin("AnatolianCafe", "menu"), 320, 118);
    }
    const signTex = this.track(new THREE.CanvasTexture(signCanvas));
    signTex.colorSpace = THREE.SRGBColorSpace;
    const signboard = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(3.4, 0.94)),
      this.track(
        new THREE.MeshBasicMaterial({map: signTex, side: THREE.DoubleSide})
      )
    );
    signboard.position.set(-1.35, 3.68, 0);
    signboard.rotation.y = -Math.PI / 2;
    signboard.userData.cafeInteractive = true;
    group.add(signboard);

    // 8. Two Cozy Walnut Tables + Kilim Stools + İnce Belli Tulip Tea Glasses
    const tableTopGeo = this.track(new THREE.CylinderGeometry(0.54, 0.54, 0.07, 16));
    const tableLegGeo = this.track(new THREE.CylinderGeometry(0.06, 0.1, 0.72, 10));
    const stoolGeo = this.track(new THREE.CylinderGeometry(0.22, 0.2, 0.42, 12));
    const cushionTopGeo = this.track(new THREE.CylinderGeometry(0.21, 0.21, 0.05, 14));
    const tulipProfile = [
      new THREE.Vector2(0.005, 0.0),
      new THREE.Vector2(0.032, 0.0),
      new THREE.Vector2(0.044, 0.036),
      new THREE.Vector2(0.028, 0.075),
      new THREE.Vector2(0.04, 0.115),
    ];
    const tulipGlassGeo = this.track(new THREE.LatheGeometry(tulipProfile, 14));
    const saucerGeo = this.track(new THREE.CylinderGeometry(0.068, 0.048, 0.014, 12));
    const saucerMat = this.track(
      new THREE.MeshStandardMaterial({color: 0xfef2f2, roughness: 0.25})
    );
    const teaGlassMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        roughness: 0.14,
        metalness: 0.22,
      })
    );

    [-1.4, 1.4].forEach((tz) => {
      const tx = -1.65;
      const top = new THREE.Mesh(tableTopGeo, timberMat);
      top.position.set(tx, 0.76, tz);
      top.castShadow = true;
      top.userData.cafeInteractive = true;
      const leg = new THREE.Mesh(tableLegGeo, timberMat);
      leg.position.set(tx, 0.39, tz);
      const saucer = new THREE.Mesh(saucerGeo, saucerMat);
      saucer.position.set(tx + 0.12, 0.805, tz - 0.08);
      const cup = new THREE.Mesh(tulipGlassGeo, teaGlassMat);
      cup.position.set(tx + 0.12, 0.812, tz - 0.08);
      group.add(top, leg, saucer, cup);

      [-0.75, 0.75].forEach((sxOff) => {
        const stool = new THREE.Mesh(stoolGeo, timberMat);
        stool.position.set(tx + sxOff, 0.25, tz);
        stool.castShadow = true;
        const cushion = new THREE.Mesh(cushionTopGeo, kilimMat);
        cushion.position.set(tx + sxOff, 0.48, tz);
        group.add(stool, cushion);
      });
      this.interactiveMeshes.push(top);
    });

    this.interactiveMeshes.push(
      backWall,
      awning,
      counterBase,
      iznikApron,
      counterTop,
      semaverBody,
      tray,
      bakTray,
      signboard
    );
    this.add(group);

    // Collision WallRects in world coordinates (only solid back kiosk + counter, terrace stays walkable!)
    this.wallRects.push(
      // Counter block (x: 24.5+0.1 .. 24.5+1.1 = 24.6..25.6, z: 5.8-2.3 .. 5.8+2.3)
      {
        minX: CAFE_ORIGIN.x + 0.05,
        maxX: CAFE_ORIGIN.x + 3.65,
        minZ: CAFE_ORIGIN.z - 2.65,
        maxZ: CAFE_ORIGIN.z + 2.65,
      },
      // Café Table 1
      {
        minX: CAFE_ORIGIN.x - 2.25,
        maxX: CAFE_ORIGIN.x - 1.05,
        minZ: CAFE_ORIGIN.z - 2.0,
        maxZ: CAFE_ORIGIN.z - 0.8,
      },
      // Café Table 2
      {
        minX: CAFE_ORIGIN.x - 2.25,
        maxX: CAFE_ORIGIN.x - 1.05,
        minZ: CAFE_ORIGIN.z + 0.8,
        maxZ: CAFE_ORIGIN.z + 2.0,
      }
    );
  }

  private buildCafeMasterNpc(): void {
    this.cafeMaster = new ExplorerCharacter('erkek', 2, 'culture');
    this.cafeMasterWorldPos.set(
      CAFE_ORIGIN.x - 0.45,
      0.14,
      CAFE_ORIGIN.z - 0.15
    );
    this.cafeMaster.position.copy(this.cafeMasterWorldPos);
    this.cafeMaster.rotation.y = Math.PI / 2;
    this.cafeMaster.traverse((obj) => {
      obj.userData.cafeInteractive = true;
      obj.userData.worldNpcId = 'npc-cafe-master';
    });

    this.bubbleTex = createCafeBubbleTexture(
      metin("AnatolianCafe", "usta_hasan_taze_cay_simit_gozleme_ikram")
    );
    this.bubbleMat = this.track(
      new THREE.SpriteMaterial({
        map: this.bubbleTex,
        transparent: true,
        depthWrite: false,
      })
    );
    this.bubbleSprite = new THREE.Sprite(this.bubbleMat);
    this.bubbleSprite.scale.set(2.45, 0.74, 1);
    this.bubbleSprite.position.set(0, 2.24, 0);
    this.cafeMaster.add(this.bubbleSprite);

    this.add(this.cafeMaster);
    this.interactiveMeshes.push(this.cafeMaster);
  }

  getWallRects(): WallRect[] {
    return this.wallRects;
  }

  getInteractiveMeshes(): THREE.Object3D[] {
    return this.interactiveMeshes;
  }

  getMasterPosition(): THREE.Vector3 {
    return this.cafeMasterWorldPos;
  }

  getMasterCharacter(): ExplorerCharacter {
    return this.cafeMaster;
  }

  isNearCafe(playerPos: THREE.Vector3, maxDist = 4.6): boolean {
    if (playerPos.y > 1.3) return false;
    return (
      Math.hypot(
        playerPos.x - (CAFE_ORIGIN.x - 0.6),
        playerPos.z - CAFE_ORIGIN.z
      ) < maxDist
    );
  }

  triggerServeWave(): void {
    this.cafeMaster.setWaveTimer(2.4);
  }

  updateWithPlayer(dt: number, playerPos: THREE.Vector3): void {
    this.time += dt;

    // Semaver gentle rising steam
    for (let i = 0; i < this.semaverSteam.length; i++) {
      const s = this.semaverSteam[i];
      const phase = (this.time * 0.7 + i * 0.25) % 1;
      s.position.y = 1.98 + phase * 0.72;
      s.position.x = 0.5 + Math.sin(this.time * 2.5 + i) * 0.05;
      const sc = 0.65 + phase * 0.85;
      s.scale.setScalar(sc);
    }

    const d = Math.hypot(
      playerPos.x - this.cafeMasterWorldPos.x,
      playerPos.z - this.cafeMasterWorldPos.z
    );
    if (d < 7.0 && playerPos.y < 1.4) {
      const targetYaw = Math.atan2(
        -(playerPos.x - this.cafeMasterWorldPos.x),
        -(playerPos.z - this.cafeMasterWorldPos.z)
      );
      let diff = ((targetYaw - this.cafeMaster.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (diff < -Math.PI) diff += Math.PI * 2;
      this.cafeMaster.rotation.y += diff * Math.min(1, 5 * dt);
    }
    this.bubbleSprite.position.y = 2.24 + Math.sin(this.time * 3.2) * 0.04;
  }

  dispose(): void {
    this.bubbleTex.dispose();
    this.cafeMaster.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}

function createCafeBubbleTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 620;
  canvas.height = 184;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(255, 247, 237, 0.96)';
    ctx.beginPath();
    ctx.roundRect(12, 10, 596, 134, 28);
    ctx.fill();
    ctx.strokeStyle = '#c2410c';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(292, 140);
    ctx.lineTo(328, 140);
    ctx.lineTo(310, 174);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#431407';
    ctx.font = 'bold 26px "Google Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const words = text.split(/\s+/u);
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      const cand = current ? `${current} ${w}` : w;
      if (current && ctx.measureText(cand).width > 540) {
        lines.push(current);
        current = w;
      } else {
        current = cand;
      }
    }
    if (current) lines.push(current);

    const visible = lines.slice(0, 2);
    const lh = 34;
    const startY = 76 - ((visible.length - 1) * lh) / 2;
    visible.forEach((ln, i) => ctx.fillText(ln, 310, startY + i * lh));
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
