export interface CollectionMeta {
  id: string;
  name: string;
  shortName: string;
  color: number;
  hexColor: string;
  icon: string;
}

export interface MetadataEntry {
  key: string;
  label: string;
  value: string;
  href?: string;
}

export interface ArtifactItem {
  id: number;
  index: number;
  floor: 1 | 2;
  title: string;
  description: string;
  fullDescription: string;
  kidStory: string;
  questClue: string;
  metadata: MetadataEntry[];
  collectionId: string;
  collectionName: string;
  collectionShortName: string;
  collectionColor: number;
  collectionHexColor: string;
  imageUrl: string;
  thumbUrl: string;
  lowResUrl?: string;
  aspectRatio: number;
  creationDate: string;
  itemUrl: string;
}

export interface QuestMission {
  targetArtifactId: number;
  clue: string;
  solved: boolean;
}

export type TimeOfDayMode = 'auto' | 'day' | 'sunset' | 'night';
export type WeatherMode = 'clear' | 'rain';
export type SurfaceKind = 'grass' | 'stone' | 'marble';

export type BadgeId =
  | 'first_art'
  | 'five_arts'
  | 'garden_explorer'
  | 'night_lantern'
  | 'young_artist'
  | 'secret_hunter'
  | 'game_master'
  | 'maze_champion'
  | 'cafe_gourmet'
  | 'social_butterfly';

export interface BadgeDefinition {
  id: BadgeId;
  icon: string;
  title: string;
  description: string;
}

export type InventoryCategory =
  | 'nature'
  | 'treasure'
  | 'game'
  | 'creative'
  | 'food';

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  category: InventoryCategory;
  count: number;
  description: string;
  usableLabel?: string;
}

export type OutdoorActivityKind =
  | 'pingpong'
  | 'mangala'
  | 'ringtoss'
  | 'bestas'
  | 'celikcomak'
  | 'topac'
  | 'misket'
  | 'tugofwar';

export type CafeItemCategory = 'drink' | 'food';

export interface CafeMenuItem {
  id: string;
  name: string;
  icon: string;
  category: CafeItemCategory;
  region: string;
  description: string;
  boostSeconds: number;
}

export type WorldNpcGender = 'kadin' | 'erkek';
export type VendorNpcKind = 'siraci' | 'bozaci' | 'saz' | 'sema';

export interface ClockState {
  hour: number;
  minute: number;
  formatted: string;
  periodLabel: string;
  icon: string;
  mode: TimeOfDayMode;
  isNight: boolean;
}

export interface WorldNpcProfile {
  id: string;
  name: string;
  gender: WorldNpcGender;
  roleTitle: string;
  locationLabel: string;
  isActivityLeader?: boolean;
  activityKind?: OutdoorActivityKind;
  isCafeMaster?: boolean;
  vendorKind?: VendorNpcKind;
  joinedHideSeek: boolean;
  joinedTugOfWar: boolean;
  treatedCount: number;
}

export const MUSEUM_BADGES: BadgeDefinition[] = [
  {
    id: 'first_art',
    icon: '🌟',
    title: 'İlk Eserini Buldun!',
    description: 'Müzedeki ilk tarihî eseri inceledin.',
  },
  {
    id: 'five_arts',
    icon: '🏛️',
    title: '5 Eser İnceledin!',
    description: 'Beş farklı Mirasium eserinin hikâyesini keşfettin.',
  },
  {
    id: 'garden_explorer',
    icon: '🍎',
    title: 'Bahçeyi Keşfettin!',
    description: 'Elma topladın, çeşmeden su içtin veya bahçede oynadın.',
  },
  {
    id: 'night_lantern',
    icon: '🔦',
    title: 'Gece Kâşifi!',
    description: 'Hava karardığında el fenerinle müzeyi dolaştın.',
  },
  {
    id: 'young_artist',
    icon: '🎨',
    title: 'Genç Sanatçı!',
    description: 'Eser oluşturma atölyesinde çizim yaptın veya puzzle çözdün.',
  },
  {
    id: 'secret_hunter',
    icon: '🕵️',
    title: 'Sır Avcısı!',
    description: 'Gizli sürpriz hazinelerden veya arkeoloji kazısından obje buldun.',
  },
  {
    id: 'game_master',
    icon: '🎮',
    title: 'Oyun Ustası!',
    description:
      'Anadolu çocuk oyunlarını, halat çekmeyi veya müze içi saklambacı kazandın.',
  },
  {
    id: 'maze_champion',
    icon: '🌿',
    title: 'Labirent Şampiyonu!',
    description:
      'Bahçedeki dev şimşir labirentinin merkezindeki Kral/Kraliçe tacını buldun.',
  },
  {
    id: 'cafe_gourmet',
    icon: '☕',
    title: 'Anadolu Gurmesi!',
    description:
      'Mirasium Anadolu Kafe’den geleneksel yiyecek ve içecek ikramları aldın.',
  },
  {
    id: 'social_butterfly',
    icon: '🤝',
    title: 'Müze Dostu!',
    description:
      'Mirasium’daki ziyaretçi arkadaşlarınla sohbet edip oyunlara ve ikrama davet ettin.',
  },
];


