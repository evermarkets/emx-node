const request = require('request');

const DEFAULT_TIMEOUT = 5 * 1000; // 5 sec
const DEFAULT_URI = 'https://api.testnet.emx.com';
const API_VERSION = 'v1';

class PublicClient {
  constructor(apiURI = DEFAULT_URI, options = {}) {
    this.apiURI = apiURI;
    this.timeout = options.timeout > 0 ? options.timeout : DEFAULT_TIMEOUT;
  }

  get(...args) {
    return this.request('get', ...args);
  }
  put(...args) {
    return this.request('put', ...args);
  }
  post(...args) {
    return this.request('post', ...args);
  }
  patch(...args) {
    return this.request('patch', ...args);
  }
  delete(...args) {
    return this.request('delete', ...args);
  }

  addHeaders(obj, additional) {
    obj.headers = obj.headers || {};
    return Object.assign(
      obj.headers, {
        'User-Agent': 'emx-node-client',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      additional,
    )
  }

  makeRelativeURI(parts) {
    return `/${API_VERSION}/${parts.join('/')}`;
  }

  makeAbsoluteURI(relativeURI) {
    return this.apiURI + relativeURI;
  }

  makeRequestCallback(callback, resolve, reject) {
    return (err, response, data) => {
      try {
        data = JSON.parse(data);
      } catch (e) {
        data = null;
      }

      if (err) {
        err.response = response;
        err.data = data;
      } else if (response.statusCode > 299) {
        err = new Error(
          `HTTP ${response.statusCode} Error: ${data && data.message}`
        );
        err.response = response;
        err.data = data;
      } else if (data === null) {
        err = new Error('Response could not be parsed as JSON');
        err.response = response;
        err.data = data;
      }

      if (typeof callback === 'function') {
        if (err) {
          callback(err);
        } else {
          callback(null, response, data);
        }
        return;
      }

      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    };
  }

  request(method, uriParts, opts = {}, callback) {
    Object.assign(opts, {
      method: method.toUpperCase(),
      uri: this.makeAbsoluteURI(this.makeRelativeURI(uriParts)),
      qsStringifyOptions: { arrayFormat: 'repeat' },
      timeout: this.timeout,
    });
    this.addHeaders(opts);
    const p = new Promise((resolve, reject) => {
      request(opts, this.makeRequestCallback(callback, resolve, reject));
    });

    if (callback) {
      p.catch(() => {});
      return undefined;
    } else {
      return p;
    }
  }

  // // // Contracts // // //

  getContracts(callback) {
    return this.get(['contracts'], callback);
  }

  getActiveContracts(callback) {
    return this.get(['contracts', 'active'], callback);
  }

  getContract(contractCode, callback) {
    return this.get(['contracts', contractCode], callback);
  }

  // // // Order Book // // //

  getContractL2OrderBook(contractCode, callback) {
    return this.get(['contracts', contractCode, 'book'], callback);
  }

  getContractQuote(contractCode, callback) {
    return this.get(['contracts', contractCode, 'quote'], callback);
  }

  // // // Auctions // // //

  getContractAuctions(contractCode, callback) {
    return this.get(['contracts', contractCode, 'auctions'], callback);
  }

  getContractAuction(contractCode, auctionId, callback) {
    return this.get(['contracts', contractCode, 'auctions', auctionId], callback);
  }
}

module.exports = PublicClient;
