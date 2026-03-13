import { DecryptedSections } from "../../did/section.d";
import { SeedNodes } from "../network/nodes";

enum ErrorCode {
  DOCUMENT_EXPIRED = 0,
  INVALID_RECORD = 1,
  INCORRECT_INSTITUTION = 2,
  PERSON_NOT_ALIVE = 3,
  INVALID_CHALLENGE = 4,
  AUTHENTICATION_FAILURE = 5,
  INVALID_POW = 6,
  INCORRECT_FILE_FORMAT = 7,
  INVALID_TIMESTAMP = 8,
  INVALID_REQUEST = 9
}

const getPDFCommitment = (commitmentPow: string): Promise<string> =>
  fetch(`//${SeedNodes[0]}/edevlet/nko/commit?${commitmentPow}`)
    .then(
      (res) => res.text(),
      (e) => { console.log(e); return ""; }
    );

const getCredentialsFromPDF = (
  commitmentPow: string,
  pdfFormData: FormData,
  clientTime: number,
  numSigners: number
): Promise<DecryptedSections[]> =>
  Promise.allSettled(SeedNodes
    .slice(0, numSigners)
    .map((node) =>
      fetch(`//${node}/edevlet/nko?${commitmentPow}&ts=${clientTime}`, {
        method: "POST",
        body: pdfFormData
      }).then((res: Response) => res.json()
        .then((data) => res.ok && data ? data : Promise.reject(data))
      ))
  ).then((results: PromiseSettledResult<DecryptedSections>[]) => results
    .filter((result) => result.status == "fulfilled")
    .map((result) => result.value)
  );

const getPoWThreshold = (): Promise<number> => Promise.resolve(20_000);

export default {
  ErrorCode,
  getPDFCommitment,
  getCredentialsFromPDF,
  getPoWThreshold,
}
