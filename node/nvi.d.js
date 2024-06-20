/**
 * @fileoverview e-devlet API veri şekli tanımları.
 *
 * @author KimlikDAO
 * @externs
 */

import node from "./node.d";

/** @const */
node.nvi = {};

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
node.nvi.TemelBilgileri;

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
node.nvi.KutukBilgileri;

/**
 * @typedef {{
 *   telefon: string,
 *   eposta: string,
 *   KEP: string,
 *   UETS: string,
 * }}
 */
node.nvi.IletisimBilgileri;

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
node.nvi.AdresBilgileri;
