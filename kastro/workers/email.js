/** @define {string} */
const RESEND_API_KEY = "RESEND_API_KEY";

/**
 * @param {{
 *   from: string,
 *   to: (string|string[]),
 *   subject: string,
 *   html: string
 * }} params
 */
const sendEmail = (params) => fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "authorization": `Bearer ${RESEND_API_KEY}`
  },
  body: JSON.stringify(params)
});

export { sendEmail };
