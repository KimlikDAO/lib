/**
 * @fileoverview Structs as defined by e-devlet NVI.
 *
 * @author KimlikDAO
 */

interface TemelBilgileri {
  ad: string;
  soyad: string;
  dt: string;
  TCKN: number;
  dyeri: string;
  cinsiyet: string;
}

interface KutukBilgileri {
  il: string;
  ilçe: string;
  mahalle: string;
  cilt: number;
  hane: number;
  BSN: number;
  tescil: string;
  annead: string;
  babaad: string;
  mhali: string;
}

interface IletisimBilgileri {
  telefon: string;
  eposta: string;
  KEP: string;
  UETS: string;
}

interface AdresBilgileri {
  il: string;
  ilçe: string;
  mahalle: string;
  CSBM: string;
  dışKapı: string;
  içKapı: string;
}

export {
  TemelBilgileri,
  KutukBilgileri,
  IletisimBilgileri,
  AdresBilgileri
};
