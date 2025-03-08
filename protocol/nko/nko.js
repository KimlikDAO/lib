import "../../did/section.d";
import { SeedNodes } from "../network/network";

/** @enum {number} */
const ErrorCode = {
  DOCUMENT_EXPIRED: 0,
  INVALID_RECORD: 1,
  INCORRECT_INSTITUTION: 2,
  PERSON_NOT_ALIVE: 3,
  INVALID_CHALLENGE: 4,
  AUTHENTICATION_FAILURE: 5,
  INVALID_POW: 6,
  INCORRECT_FILE_FORMAT: 7,
  INVALID_TIMESTAMP: 8,
  INVALID_REQUEST: 9
};

/**
 * @param {string} commitmentPow 
 * @return {!Promise<string>}
 */
const getPDFCommitment = (commitmentPow) => fetch(`//${SeedNodes[0]}/edevlet/nko/commit?${commitmentPow}`)
  .then((res) => res.text())
  .catch(console.log);

/**
 * @param {string} commitmentPow
 * @param {!FormData} pdfFormData
 * @param {number} clientTime
 * @param {number} numSigners
 * @return {!Promise<!Array<!did.DecryptedSections>>}
 */
const getCredentialsFromPDF = (commitmentPow, pdfFormData, clientTime, numSigners) =>
  Promise.allSettled(SeedNodes
    .slice(0, numSigners)
    .map((node) =>
      fetch(`//${node}/edevlet/nko?${commitmentPow}&ts=${clientTime}`, {
        method: "POST",
        body: pdfFormData
      }).then((/** @type {!Response} */ res) => res.json()
        .then((data) => res.ok && data ? data : Promise.reject(data))
      ))
  ).then((/** @type {!Array<!Promise.AllSettledResultElement<!did.DecryptedSections>>} */
    results) => results
      .filter((result) => result.status == "fulfilled")
      .map((result) => result.value)
  );

/**
 * @return {!Promise<number>}
 */
const getPoWThreshold = () => Promise.resolve(20_000);

export default {
  ErrorCode,
  getPDFCommitment,
  getCredentialsFromPDF,
  getPoWThreshold,
}
