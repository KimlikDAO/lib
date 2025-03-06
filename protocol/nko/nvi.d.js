/**
 * @fileoverview Structs as defined by e-devlet NVI.
 *
 * @author KimlikDAO
 */

import protocol from "../protocol.d";

/** @const */
protocol.nvi = {};

/**
 * @typedef {{
 *   ad: string,
 *   soyad: string,
 *   dt: string,
 *   TCKN: number,
 *   dyeri: string,
 *   cinsiyet: string
 * }}
 */
protocol.nvi.TemelBilgileri;

/**
 * @typedef {{
 *   il: string,
 *   ilçe: string,
 *   mahalle: string,
 *   cilt: number,
 *   hane: number,
 *   BSN: number,
 *   tescil: string,
 *   annead: string,
 *   babaad: string,
 *   mhali: string
 * }}
 */
protocol.nvi.KutukBilgileri;

/**
 * @typedef {{
 *   telefon: string,
 *   eposta: string,
 *   KEP: string,
 *   UETS: string,
 * }}
 */
protocol.nvi.IletisimBilgileri;

/**
 * @typedef {{
 *   il: string,
 *   ilçe: string,
 *   mahalle: string,
 *   CSBM: string,
 *   dışKapı: string,
 *   içKapı: string,
 * }}
 */
protocol.nvi.AdresBilgileri;
