// Polyfill Request/Response/Headers for Next.js server route unit tests
try {
  const { Request, Response, Headers, fetch } = require('undici');

  if (typeof global.Request === 'undefined') {
    global.Request = Request;
  }
  if (typeof global.Response === 'undefined') {
    global.Response = Response;
  }
  if (typeof global.Headers === 'undefined') {
    global.Headers = Headers;
  }
  if (typeof global.fetch === 'undefined') {
    global.fetch = fetch;
  }
} catch (error) {
  // undici may not be available in some environments, but Jest should still work with jsdom.
}
