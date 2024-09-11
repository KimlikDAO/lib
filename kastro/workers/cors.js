


/**
 * @param {number} status
 * @param {string} allowOrigin
 * @return {!Response}
 */
const respondWith = (status, allowOrigin) => new Response(null, {
  status,
  headers: { "access-control-allow-origin": allowOrigin }
});

/**
 * @param {string} allowOrigin
 * @return {!Response}
 */
const approve = (allowOrigin) => new Response("", {
  headers: {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "PUT",
    "access-control-allow-headers": "content-type"
  }
});

export default {
  respondWith,
  approve,
}