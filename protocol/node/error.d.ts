/**
 * @fileoverview Error message structs.
 *
 * @author KimlikDAO
 */

interface ErrorMessage {
  readonly code: number;
  readonly messages: string[];
}

export { ErrorMessage };
