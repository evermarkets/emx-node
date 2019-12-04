const crypto = require('crypto');
const querystring = require('querystring');

function signRequest(auth, method, path, options = {}) {
  checkAuth(auth);
  const timestamp = Math.round(Date.now() / 1000);
  let body = options.body || '';
  if (options.qs && Object.keys(options.qs).length !== 0) {
    path = `${path}?${querystring.stringify(options.qs)}`;
  }
  const what = timestamp + method.toUpperCase() + path + body;
  const key = Buffer(auth.secret, 'base64');
  const hmac = crypto.createHmac('sha256', key);
  const signature = hmac.update(what).digest('base64');
  return {
    key: auth.key,
    sig: signature,
    timestamp: timestamp,
  };
}

function checkAuth(auth) {
  if (auth && !(auth.key && auth.secret) && !auth.devOverride) {
    throw new Error('Incomplete authentication credentials. You must include key and secret.')
  }
  return auth || {};
}

module.exports = {
  signRequest,
  checkAuth,
};
