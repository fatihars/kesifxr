import {metin} from "../metinler.ts";
import type {ArtifactItem} from '../types.ts';

const PROMPTS: Record<string, string> = {
  '11586': metin("artifactObservation", "portrede_en_cok_hangi_renk_one_cikiyor"),
  '8988': metin("artifactObservation", "cizgileri_izle_hangi_ayrintilar_sana_yakin_hangileri"),
  '6680': metin("artifactObservation", "resme_once_butun_olarak_bak_sonra_bir"),
  '3148': metin("artifactObservation", "kiyafette_tekrar_eden_bir_cizgi_ya_da"),
  '2514': metin("artifactObservation", "bir_esya_kumas_ya_da_desen_sec"),
  '1609': metin("artifactObservation", "isigin_en_cok_vurdugu_yeri_bul_bu"),
  '1163': metin("artifactObservation", "manzarada_bir_yapi_ve_bir_insan_izi"),
};

export function artifactObservation(artifact: ArtifactItem): string {
  return PROMPTS[artifact.collectionId] ??
    metin("artifactObservation", "eserde_kucuk_bir_ayrinti_sec_arkadasin_gorseli");
}
