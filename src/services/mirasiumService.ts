import {arşivMetni, metin} from "../metinler.ts";
import type {ArtifactItem, CollectionMeta, MetadataEntry} from '../types.ts';
import {DEVICE_QUALITY} from '../utils/deviceQuality.ts';

const ITEMS_API = 'https://mirasium.org/wp-json/tainacan/v2/items';
const COLLECTIONS_API =
  'https://mirasium.org/wp-json/tainacan/v2/collections?perpage=30';

export const MIN_ARTIFACTS_PER_ENTRY = 50;
const SIYER_COLLECTION_ID = '6680';
export const SIYER_ARCHIVE_URL = 'https://mirasium.org/siyer-i-nebi/';

export interface SiyerLesson {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  itemUrl: string;
}
const SEEN_STORAGE_KEY = 'mirasium_kids_seen_ids_v2';
const LAST_BATCH_STORAGE_KEY = 'mirasium_kids_last_batch_v2';

const KNOWN_COLLECTIONS: Record<string, CollectionMeta> = {
  '11586': {
    id: '11586',
    name: metin("mirasiumService", "osmanli_padisah_portreleri_serisi"),
    shortName: metin("mirasiumService", "padisah_portreleri"),
    color: 0xd97706,
    hexColor: '#f59e0b',
    icon: 'crown',
  },
  '8988': {
    id: '8988',
    name: metin("mirasiumService", "thomas_allom_istanbul_gravurleri"),
    shortName: metin("mirasiumService", "istanbul_gravurleri"),
    color: 0x0284c7,
    hexColor: '#38bdf8',
    icon: 'landscape',
  },
  '6680': {
    id: '6680',
    name: metin("mirasiumService", "siyer_i_nebi_minyaturleri"),
    shortName: metin("mirasiumService", "minyaturler"),
    color: 0x059669,
    hexColor: '#34d399',
    icon: 'auto_stories',
  },
  '3148': {
    id: '3148',
    name: metin("mirasiumService", "18_yuzyil_osmanli_ve_levant_kostumleri"),
    shortName: metin("mirasiumService", "tarihi_kostumler"),
    color: 0xdb2777,
    hexColor: '#f472b6',
    icon: 'checkroom',
  },
  '2514': {
    id: '2514',
    name: metin("mirasiumService", "turquerie_turkori_akimi"),
    shortName: metin("mirasiumService", "turquerie_sanati"),
    color: 0x7c3aed,
    hexColor: '#a78bfa',
    icon: 'palette',
  },
  '1609': {
    id: '1609',
    name: metin("mirasiumService", "osman_hamdi_bey_in_tablolari"),
    shortName: metin("mirasiumService", "osman_hamdi_bey"),
    color: 0xea580c,
    hexColor: '#fb923c',
    icon: 'brush',
  },
  '1163': {
    id: '1163',
    name: metin("mirasiumService", "james_de_kay_istanbul_gravurleri"),
    shortName: metin("mirasiumService", "de_kay_gravurleri"),
    color: 0x0d9488,
    hexColor: '#2dd4bf',
    icon: 'sailing',
  },
};

const FALLBACK_COLLECTION_COLORS = [
  {color: 0x2563eb, hexColor: '#60a5fa', icon: 'museum'},
  {color: 0x16a34a, hexColor: '#4ade80', icon: 'park'},
  {color: 0xd97706, hexColor: '#fbbf24', icon: 'star'},
  {color: 0x9333ea, hexColor: '#c084fc', icon: 'sparkles'},
];

const PREFERRED_META_ORDER = [
  'sanatci',
  'donem-yuzyil',
  'eser-turu',
  'materyal-teknik',
  'konu-tema',
  'bulundugu-yer',
  'sehir-gorunumu',
  'erisim-numarasi',
  'detayli-okuma',
  'daha-fazlasi',
  'kaynak',
  'lisans-durumu',
];

interface RawTainacanThumbEntry {
  0?: string;
  1?: number;
  2?: number;
}

interface RawTainacanMetaField {
  name?: string;
  value?: unknown;
  value_as_string?: string;
  value_as_html?: string;
}

interface RawTainacanItem {
  id: number;
  title?: string;
  description?: string;
  creation_date?: string;
  collection_id?: string | number;
  url?: string;
  document_as_html?: string;
  thumbnail?: Record<string, RawTainacanThumbEntry>;
  metadata?: Record<string, RawTainacanMetaField>;
}

interface RawTainacanResponse {
  items?: RawTainacanItem[];
}

interface RawCollection {
  id: number;
  name?: string;
}

export async function fetchSiyerLessons(signal: AbortSignal): Promise<SiyerLesson[]> {
  const lessons = new Map<number, SiyerLesson>();
  const perPage = 40;
  for (let page = 1; ; page++) {
    const cacheBust = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const url = `https://mirasium.org/wp-json/tainacan/v2/collection/${SIYER_COLLECTION_ID}/items?perpage=${perPage}&paged=${page}&orderby=id&order=ASC&_cb=${cacheBust}`;
    const response = await fetch(url, {signal});
    if (!response.ok) throw new Error(metin("mirasiumService", "siyer_i_nebi_koleksiyonu_yuklenemedi"));
    const data = (await response.json()) as RawTainacanResponse;
    if (!Array.isArray(data.items)) throw new Error(metin("mirasiumService", "koleksiyon_yaniti_okunamadi"));
    for (const item of data.items) {
      if (String(item.collection_id) !== SIYER_COLLECTION_ID) continue;
      const {metaTitle, metaDescription} = extractMetadataEntries(item.metadata);
      const title = cleanText(item.title) || metaTitle;
      if (!title) continue;
      const description = cleanText(item.description);
      lessons.set(item.id, {
        id: item.id,
        title: arşivMetni(item.id, 'başlık', title),
        description: arşivMetni(item.id, 'açıklama',
          (metaDescription?.length ?? 0) > description.length ? metaDescription! : description),
        imageUrl: resolveImageUrls(item)?.imageUrl,
        itemUrl: /^https?:\/\//i.test(item.url ?? '') ? item.url! : SIYER_ARCHIVE_URL,
      });
    }
    const totalPages = Number(response.headers.get('X-WP-TotalPages'));
    if (totalPages > 0 ? page >= totalPages : data.items.length < perPage) break;
  }
  // Tainacan currently returns this collection newest-first even with order=ASC.
  return Array.from(lessons.values()).sort((first, second) => first.id - second.id);
}

function cleanText(raw?: string): string {
  if (!raw) return '';
  const withLineBreaks = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, ' ');
  const doc = new DOMParser().parseFromString(withLineBreaks, 'text/html');
  return (doc.documentElement.textContent || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function shuffleArray<T>(list: T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function loadIdSet(key: string): Set<number> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((v): v is number => typeof v === 'number'));
    }
  } catch {
    // Ignore storage access errors in restricted contexts.
  }
  return new Set();
}

function saveIdSet(key: string, ids: Iterable<number>): void {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(ids)));
  } catch {
    // Ignore storage quota errors.
  }
}

function parseMetaValue(
  rawValue: unknown,
  rawString?: string,
  rawHtml?: string
): {value: string; href?: string} | null {
  if (rawValue === false || rawValue === null || rawValue === undefined) {
    return null;
  }

  let candidate = '';
  if (typeof rawString === 'string' && rawString.trim()) {
    candidate = rawString.trim();
  } else if (typeof rawValue === 'string' && rawValue.trim()) {
    candidate = rawValue.trim();
  } else if (Array.isArray(rawValue)) {
    const joined = rawValue
      .map((v) =>
        typeof v === 'object' && v !== null && 'name' in v
          ? String((v as {name?: unknown}).name ?? '')
          : String(v ?? '')
      )
      .filter(Boolean)
      .join(', ');
    candidate = joined.trim();
  }

  if (!candidate && typeof rawHtml === 'string' && rawHtml.trim()) {
    candidate = cleanText(rawHtml);
  }

  if (!candidate || candidate === 'false') return null;

  // Handle markdown links like [Yale Center for British Art](https://...)
  const mdLink = candidate.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/i);
  if (mdLink) {
    return {
      value: cleanText(mdLink[1]) || mdLink[2],
      href: mdLink[2],
    };
  }

  // Handle HTML anchor in rawHtml if candidate is plain URL or text
  let href: string | undefined;
  if (typeof rawHtml === 'string') {
    const anchorMatch = rawHtml.match(/href=["'](https?:\/\/[^"']+)["']/i);
    if (anchorMatch) {
      href = anchorMatch[1];
    }
  }
  if (!href && /^https?:\/\/\S+$/i.test(candidate)) {
    href = candidate;
  }

  const cleaned = cleanText(candidate);
  if (!cleaned) return null;
  return {value: cleaned, href};
}

function extractMetadataEntries(
  rawMeta?: Record<string, RawTainacanMetaField>
): {
  entries: MetadataEntry[];
  metaTitle?: string;
  metaDescription?: string;
} {
  if (!rawMeta || typeof rawMeta !== 'object') {
    return {entries: []};
  }

  let metaTitle: string | undefined;
  let metaDescription: string | undefined;
  const entries: MetadataEntry[] = [];

  const keys = Object.keys(rawMeta).sort((a, b) => {
    const ia = PREFERRED_META_ORDER.indexOf(a);
    const ib = PREFERRED_META_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b, 'tr');
  });

  for (const key of keys) {
    const field = rawMeta[key];
    if (!field || typeof field !== 'object') continue;
    const label = cleanText(field.name) || key;

    if (key.startsWith('title-') || label.toLowerCase() === 'title') {
      const parsedTitle = parseMetaValue(
        field.value,
        field.value_as_string,
        field.value_as_html
      );
      if (parsedTitle) metaTitle = parsedTitle.value;
      continue;
    }

    if (
      key.startsWith('description-') ||
      label.toLowerCase() === 'description'
    ) {
      const parsedDesc = parseMetaValue(
        field.value,
        field.value_as_string,
        field.value_as_html
      );
      if (parsedDesc) metaDescription = parsedDesc.value;
      continue;
    }

    const parsed = parseMetaValue(
      field.value,
      field.value_as_string,
      field.value_as_html
    );
    if (!parsed) continue;

    entries.push({
      key,
      label,
      value: parsed.value,
      href: parsed.href,
    });
  }

  return {entries, metaTitle, metaDescription};
}

function buildKidStory(
  title: string,
  fullDescription: string,
  collectionName: string
): string {
  if (!fullDescription) {
    return metin("mirasiumService", "bu_eser_1_koleksiyonundan_secildi_2_eserindeki", collectionName, title);
  }
  return fullDescription;
}

function buildQuestClue(
  title: string,
  description: string,
  collectionShortName: string
): string {
  const hay = `${title} ${description}`.toLocaleLowerCase('tr-TR');
  if (hay.includes('cami') || hay.includes('ayasofya') || hay.includes('minare')) {
    return metin("mirasiumService", "ipucu_icinde_tarihi_bir_cami_veya_gorkemli", collectionShortName);
  }
  if (
    hay.includes('boğaziçi') ||
    hay.includes('deniz') ||
    hay.includes('kayık') ||
    hay.includes('gemi') ||
    hay.includes('liman') ||
    hay.includes('haliç')
  ) {
    return metin("mirasiumService", "ipucu_deniz_bogazici_manzarasi_veya_su_kenari", collectionShortName);
  }
  if (hay.includes('sultan') || hay.includes('padişah') || hay.includes('şehzade')) {
    return metin("mirasiumService", "ipucu_bir_osmanli_padisahini_veya_saray_portresini", collectionShortName);
  }
  if (
    hay.includes('müzik') ||
    hay.includes('kanun') ||
    hay.includes('saz') ||
    hay.includes('dans') ||
    hay.includes('eğlence')
  ) {
    return metin("mirasiumService", "ipucu_muzik_aleti_sarki_veya_senlik_sahnesi", collectionShortName);
  }
  if (
    hay.includes('derviş') ||
    hay.includes('melek') ||
    hay.includes('peygamber') ||
    hay.includes('mucize')
  ) {
    return metin("mirasiumService", "ipucu_altin_yaldizli_bir_hikaye_anlatan_1", collectionShortName);
  }
  if (
    hay.includes('kıyafet') ||
    hay.includes('kostüm') ||
    hay.includes('kaftan') ||
    hay.includes('sarık') ||
    collectionShortName.includes('Kostüm')
  ) {
    return metin("mirasiumService", "ipucu_eski_donemlerden_cok_ozel_bir_kiyafet", collectionShortName);
  }
  const firstWord = title.split(/\s+/)[0] || metin("mirasiumService", "tarihi");
  return metin("mirasiumService", "ipucu_1_bolumunde_adi_2_diye_baslayan", collectionShortName, firstWord);
}

function parseSrcsetCandidates(
  html: string
): Array<{url: string; width: number}> {
  const srcsetMatch = html.match(/\bsrcset=["']([^"']+)["']/i);
  if (!srcsetMatch) return [];
  const results: Array<{url: string; width: number}> = [];
  for (const part of srcsetMatch[1].split(',')) {
    const tokens = part.trim().split(/\s+/);
    const url = tokens[0];
    const widthMatch = tokens[1]?.match(/^(\d+)w$/i);
    if (url && widthMatch) {
      results.push({url, width: Number(widthMatch[1])});
    }
  }
  return results.sort((a, b) => a.width - b.width);
}

function resolveImageFromDocHtml(html?: string): {
  imageUrl: string;
  thumbUrl: string;
  lowResUrl?: string;
  aspectRatio: number;
} | null {
  if (!html) return null;
  const imgMatch = html.match(/<img[^>]*\ssrc=["']([^"']+)["'][^>]*>/i);
  if (!imgMatch) return null;
  const imgSrc = imgMatch[1];
  const srcset = parseSrcsetCandidates(html);

  let thumbUrl = imgSrc;
  let imageUrl = imgSrc;
  let lowResUrl: string | undefined;

  if (DEVICE_QUALITY.isMobile) {
    // Mobile: strictly cap at medium / medium_large (<= 1024px), never full/original <a href>.
    const mobileCap = srcset.filter((c) => c.width <= 1024);
    const bestMobile =
      mobileCap.find((c) => c.width >= 600) ??
      mobileCap[mobileCap.length - 1];
    if (bestMobile) {
      thumbUrl = bestMobile.url;
      imageUrl = bestMobile.url;
    }
    const lowCandidate =
      mobileCap.find((c) => c.width >= 200 && c.width <= 480) ?? mobileCap[0];
    if (lowCandidate && lowCandidate.url !== thumbUrl) {
      lowResUrl = lowCandidate.url;
    }
  } else {
    const hrefMatch = html.match(/<a[^>]*\shref=["']([^"']+)["'][^>]*>/i);
    const fullHref = hrefMatch?.[1];
    imageUrl =
      fullHref && /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(fullHref)
        ? fullHref
        : imgSrc;
    const desktopLow = srcset.find((c) => c.width >= 240 && c.width <= 520);
    if (desktopLow && desktopLow.url !== thumbUrl) {
      lowResUrl = desktopLow.url;
    }
  }

  const wMatch = html.match(/\bwidth=["']?(\d+)["']?/i);
  const hMatch = html.match(/\bheight=["']?(\d+)["']?/i);
  const w = Number(wMatch?.[1]) || 4;
  const h = Number(hMatch?.[1]) || 3;
  const aspectRatio = Math.max(0.55, Math.min(1.8, w / h));
  return {imageUrl, thumbUrl, lowResUrl, aspectRatio};
}

function isMobileSafeThumb(entry?: RawTainacanThumbEntry): boolean {
  if (!entry?.[0]) return false;
  const width = Number(entry[1]);
  return !Number.isFinite(width) || width <= 0 || width <= 1024;
}

function resolveImageUrls(item: RawTainacanItem): {
  imageUrl: string;
  thumbUrl: string;
  lowResUrl?: string;
  aspectRatio: number;
} | null {
  const thumb = item.thumbnail;
  if (thumb) {
    if (DEVICE_QUALITY.isMobile) {
      const candidates = [
        thumb.large,
        thumb.medium_large,
        thumb.medium,
        thumb['tainacan-medium'],
        thumb.thumbnail,
      ].filter((e): e is RawTainacanThumbEntry => isMobileSafeThumb(e));

      const preferred =
        candidates[0] ??
        thumb.medium_large ??
        thumb.medium ??
        thumb.thumbnail;

      const lowEntry =
        thumb.medium?.[0]
          ? thumb.medium
          : thumb['tainacan-medium']?.[0]
            ? thumb['tainacan-medium']
            : thumb.thumbnail?.[0]
              ? thumb.thumbnail
              : preferred;

      const lightUrl = preferred?.[0];
      if (lightUrl) {
        const w = Number(preferred?.[1]) || 4;
        const h = Number(preferred?.[2]) || 3;
        const aspectRatio = Math.max(0.55, Math.min(1.8, w / h));
        const lowResUrl =
          lowEntry?.[0] && lowEntry[0] !== lightUrl ? lowEntry[0] : undefined;
        return {
          imageUrl: lightUrl,
          thumbUrl: lightUrl,
          lowResUrl,
          aspectRatio,
        };
      }
    } else {
      const highEntry =
        thumb.large ||
        thumb['tainacan-large-full'] ||
        thumb.full ||
        thumb.medium_large ||
        thumb.medium;
      const thumbEntry =
        thumb.large ||
        thumb.medium_large ||
        thumb['tainacan-large-full'] ||
        thumb.full ||
        thumb.medium;
      const lowEntry =
        thumb.medium ||
        thumb['tainacan-medium'] ||
        thumb.thumbnail ||
        thumb.medium_large;

      const imageUrl = highEntry?.[0];
      const thumbUrl = thumbEntry?.[0] || imageUrl;
      if (imageUrl && thumbUrl) {
        const w = Number((highEntry ?? thumbEntry)?.[1]) || 4;
        const h = Number((highEntry ?? thumbEntry)?.[2]) || 3;
        const aspectRatio = Math.max(0.55, Math.min(1.8, w / h));
        const lowResUrl =
          lowEntry?.[0] && lowEntry[0] !== thumbUrl ? lowEntry[0] : undefined;
        return {imageUrl, thumbUrl, lowResUrl, aspectRatio};
      }
    }
  }
  return resolveImageFromDocHtml(item.document_as_html);
}

async function fetchCollectionsMap(): Promise<Record<string, CollectionMeta>> {
  const map: Record<string, CollectionMeta> = {...KNOWN_COLLECTIONS};
  try {
    const res = await fetch(`${COLLECTIONS_API}&_cb=${Date.now()}`);
    if (!res.ok) return map;
    const data = (await res.json()) as RawCollection[];
    if (!Array.isArray(data)) return map;
    data.forEach((col, idx) => {
      const id = String(col.id);
      if (!map[id]) {
        const fb =
          FALLBACK_COLLECTION_COLORS[idx % FALLBACK_COLLECTION_COLORS.length];
        const name = cleanText(col.name) || metin("mirasiumService", "koleksiyon_1", id);
        map[id] = {
          id,
          name,
          shortName: name.length > 24 ? `${name.slice(0, 22)}…` : name,
          color: fb.color,
          hexColor: fb.hexColor,
          icon: fb.icon,
        };
      }
    });
  } catch {
    // Keep known collections fallback map.
  }
  return map;
}

async function fetchItemsPage(
  page: number,
  perPage: number,
  orderBy: string,
  order: 'ASC' | 'DESC'
): Promise<{items: RawTainacanItem[]; totalPages: number}> {
  // Omitting fetch_only returns complete Tainacan metadata fields and full image HTML.
  const params = new URLSearchParams({
    perpage: String(perPage),
    paged: String(page),
    order,
    orderby: orderBy,
    _cb: `${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
  });

  const res = await fetch(`${ITEMS_API}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(metin("mirasiumService", "mirasium_api_yanit_vermedi_1", res.status));
  }
  const totalPagesHeader = Number(res.headers.get('X-WP-TotalPages'));
  const totalPages =
    Number.isFinite(totalPagesHeader) && totalPagesHeader > 0
      ? totalPagesHeader
      : 8;
  const json = (await res.json()) as RawTainacanResponse;
  return {
    items: Array.isArray(json.items) ? json.items : [],
    totalPages,
  };
}

export async function fetchRandomArtifacts(
  targetCount = MIN_ARTIFACTS_PER_ENTRY
): Promise<{artifacts: ArtifactItem[]; collections: CollectionMeta[]}> {
  const desiredCount = Math.max(50, targetCount);
  const perPage = 40;
  const orderByPool = ['title', 'date', 'id', 'modified'];
  const orderBy = orderByPool[Math.floor(Math.random() * orderByPool.length)];
  const order: 'ASC' | 'DESC' = Math.random() > 0.5 ? "ASC" : "DESC";

  const collectionsMap = await fetchCollectionsMap();

  const initialPage = 1 + Math.floor(Math.random() * 7);
  const firstResult = await fetchItemsPage(initialPage, perPage, orderBy, order);
  const totalPages = Math.max(1, firstResult.totalPages);

  // Pick up to 4 additional distinct pages to build a diverse pool (~160-200 items).
  const candidatePages: number[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p !== initialPage) candidatePages.push(p);
  }
  const shuffledPages = shuffleArray(candidatePages);
  const extraPages = shuffledPages.slice(0, 4);
  const extraResults = await Promise.all(
    extraPages.map((page) =>
      fetchItemsPage(page, perPage, orderBy, order).catch(() => ({
        items: [] as RawTainacanItem[],
        totalPages,
      }))
    )
  );

  const uniqueRaw = new Map<number, RawTainacanItem>();
  for (const item of firstResult.items) {
    uniqueRaw.set(item.id, item);
  }
  for (const result of extraResults) {
    for (const item of result.items) {
      uniqueRaw.set(item.id, item);
    }
  }

  const collectValidItems = () => Array.from(uniqueRaw.values()).filter((item) =>
    String(item.collection_id) !== SIYER_COLLECTION_ID &&
    Boolean(cleanText(item.title) && resolveImageUrls(item))
  );
  let validRaw = collectValidItems();
  for (const page of shuffledPages.slice(4)) {
    if (validRaw.length >= desiredCount) break;
    const result = await fetchItemsPage(page, perPage, orderBy, order).catch(() => null);
    if (!result) continue;
    for (const item of result.items) uniqueRaw.set(item.id, item);
    validRaw = collectValidItems();
  }

  const lastBatchIds = loadIdSet(LAST_BATCH_STORAGE_KEY);
  let seenIds = loadIdSet(SEEN_STORAGE_KEY);

  const unseen = shuffleArray(
    validRaw.filter((item) => !seenIds.has(item.id) && !lastBatchIds.has(item.id))
  );
  const olderSeen = shuffleArray(
    validRaw.filter((item) => seenIds.has(item.id) && !lastBatchIds.has(item.id))
  );
  const fromLastBatch = shuffleArray(
    validRaw.filter((item) => lastBatchIds.has(item.id))
  );

  let selectedRaw: RawTainacanItem[] = [];
  if (unseen.length >= desiredCount) {
    selectedRaw = unseen.slice(0, desiredCount);
  } else {
    seenIds = new Set(lastBatchIds);
    selectedRaw = [...unseen, ...olderSeen, ...fromLastBatch].slice(
      0,
      desiredCount
    );
  }

  const nextLastBatch = new Set<number>();
  for (const item of selectedRaw) {
    seenIds.add(item.id);
    nextLastBatch.add(item.id);
  }
  saveIdSet(SEEN_STORAGE_KEY, seenIds);
  saveIdSet(LAST_BATCH_STORAGE_KEY, nextLastBatch);

  const artifacts: ArtifactItem[] = selectedRaw.map((item, idx) => {
    const {entries: metaEntries, metaTitle, metaDescription} =
      extractMetadataEntries(item.metadata);

    const title =
      cleanText(item.title) || metaTitle || metin("mirasiumService", "tarihi_eser_1", item.id);
    const rawDesc = cleanText(item.description);
    const fullDescription =
      metaDescription && metaDescription.length > rawDesc.length
        ? metaDescription
        : rawDesc || metaDescription || '';

    const colId = String(item.collection_id ?? '0');
    const col = collectionsMap[colId] ?? {
      id: colId,
      name: metin("mirasiumService", "mirasium_koleksiyonu"),
      shortName: metin("mirasiumService", "mirasium"),
      color: 0x3b82f6,
      hexColor: '#60a5fa',
      icon: 'museum',
    };
    const media = resolveImageUrls(item)!;
    const displayTitle = arşivMetni(item.id, 'başlık', title);
    const displayDescription = arşivMetni(item.id, 'açıklama', fullDescription);

    return {
      id: item.id,
      index: idx + 1,
      floor: idx < 26 ? 1 : 2,
      title: displayTitle,
      description: displayDescription,
      fullDescription: displayDescription,
      kidStory: arşivMetni(item.id, 'anlatım', buildKidStory(displayTitle, displayDescription, col.name)),
      questClue: arşivMetni(item.id, 'ipucu', buildQuestClue(title, fullDescription, col.shortName)),
      metadata: metaEntries.map(entry => ({
        ...entry,
        label: arşivMetni(item.id, `etiket.${entry.key}`, entry.label),
        value: arşivMetni(item.id, `değer.${entry.key}`, entry.value),
      })),
      collectionId: col.id,
      collectionName: col.name,
      collectionShortName: col.shortName,
      collectionColor: col.color,
      collectionHexColor: col.hexColor,
      imageUrl: media.imageUrl,
      thumbUrl: media.thumbUrl,
      lowResUrl: media.lowResUrl,
      aspectRatio: media.aspectRatio,
      creationDate: item.creation_date?.slice(0, 10) || metin("mirasiumService", "tarihi_arsiv"),
      itemUrl: item.url || 'https://mirasium.org/koleksiyonlar/',
    };
  });

  const usedCollectionIds = new Set(artifacts.map((a) => a.collectionId));
  const collections = Object.values(collectionsMap).filter((c) =>
    usedCollectionIds.has(c.id)
  );

  return {artifacts, collections};
}

