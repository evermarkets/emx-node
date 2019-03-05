# EMX [![npm version](https://badge.fury.io/js/emx.svg)](https://badge.fury.io/js/emx)

The official Node.js library for the [EMX API](https://docs.emx.com).

## Features

* Public, Authenticated, and WebSocket API client libraries
* Built-in HMAC signing

## Installation

```bash
npm install emx
```

You can learn about the API responses of each endpoint [by reading our
documentation](https://docs.emx.com).

## Quick Start

The EMX API has both public and private endpoints. If you're only interested in
the public endpoints, you should use `PublicClient`.

```js
const EMX = require('emx');
const publicClient = new EMX.PublicClient();
```

All methods, unless otherwise specified, can be used with either a promise or
callback API.

### Using Promises

```js
publicClient
  .getContracts()
  .then(data => {
    // work with data
  })
  .catch(error => {
    // handle the error
  });
```

The promise API can be used as expected in `async` functions in ES2017+
environments:

```js
async function yourFunction() {
  try {
    const contracts = await publicClient.getContracts();
  } catch (error) {
    /* ... */
  }
}
```

### Using Callbacks

Your callback should accept three arguments:

* `error`: contains an error message (`string`), or `null` if no error was
  encountered
* `response`: a generic HTTP response abstraction created by the [`request`
  library](https://github.com/request/request)
* `data`: contains data returned by the EMX API, or `undefined` if an error was
  encountered

```js
publicClient.getContracts((error, response, data) => {
  if (error) {
    // handle the error
  } else {
    // work with data
  }
});
```

### The Public API Client

```js
const publicClient = new EMX.PublicClient(apiURI);
```

* `apiURI` _optional_ - defaults to 'https://api.testnet.emx.com' if not specified.

#### Public API Methods

These methods allow you to pull public contract information and market data. You may pass pagination and filtering parameters, as described in the EMX API documentation. These methods are subject to rate limiting.

* [`getContract(contractcode)`, `getContracts()`, `getActiveContracts()`](https://docs.emx.com/#list-contracts)

```js
// get metadata for all active contracts.
publicClient.getActiveContracts(callback);
```

* [`getContractL2OrderBook()`](https://docs.emx.com/#get-order-book-level-2)
* [`getContractQuote()`](https://docs.emx.com/#get-quote-level-1)
* [`getContractAuction(auctionCode)`, `getContractAuctions(contractCode)`](https://docs.emx.com/#list-auctions)

### The Authenticated API Client

The [private exchange API endpoints](https://docs.emx.com/#private) require you to authenticate with an EMX API key. You can create a new API key [in your exchange account's settings](https://testnet.emx.com/account). You can also specify the API URI (defaults to `https://api.testnet.emx.com`).

```js
const authedClient = new EMX.AuthenticatedClient(
  'your_api_key', 'your_b64_secret', 'https://api.testnet.emx.com',
);
```

Like `PublicClient`, all API methods can be used with either callbacks or will return promises.

`AuthenticatedClient` inherits all of the API methods from
`PublicClient`, so if you're hitting both public and private API endpoints you only need to create a single client.

#### Private API Methods

* [`placeOrder()`](https://docs.emx.com/#create-new-order)

```js
// Buy 5.01 BTCH19 @ 3800 USD
const buyParams = {
  contractCode: 'BTCH19',
  side: 'buy',
  size: '5.0125', // BTC
  price: '3800.00', // USD
  type: 'limit',
};
authedClient.placeOrder(buyParams, callback);

// Sell 2.5 BTCH19 @ 3800 USD
const sellParams = {
  contractCode: 'BTCH19',
  side: 'sell',
  size: '2.5', // BTC
  price: '3800.00', // USD
  type: 'limit',
};
authedClient.placeOrder(sellParams, callback);
```

* [`getOrder(orderId)`, `getOrders()`](https://docs.emx.com/#list-orders)
* [`modifyOrder(orderId, mods)`](https://docs.emx.com/#modify-existing-order)
* [`cancelOrder(orderId)`, `cancelOrders(contractCode)`](https://docs.emx.com/#cancel-specific-order-by-id)
* [`getFills()`](https://docs.emx.com/#list-fills)
* [`getPositions()`](https://docs.emx.com/#list-positions)
* [`getAccount(traderId)`, `getAccounts()`](https://docs.emx.com/#get-balances)

### WebSocket Client

The `WebSocketClient` allows you to connect and listen to (and send) the [exchange
WebSocket messages](https://docs.emx.com/#channels).

```js
const websocket = new EMX.WebSocketClient(['BTCH19']);

websocket.on('message', data => {
  /* work with data */
});
websocket.on('error', err => {
  /* handle error */
});
websocket.on('close', () => {
  /* ... */
});
```

To access higher rate limits and/or to enable [trading across the socket](https://docs.emx.com/#trading), you may authenticate with an EMX API key. You can create a new API key [in your exchange account's settings](https://testnet.emx.com/account). You can also specify the API URI (defaults to `wss://api.testnet.emx.com`).

```javascript
const websocket = new EMX.WebSocketClient(
  'your_api_key', 'your_b64_secret', 'wss://api.testnet.emx.com',
);
```

Once you create the `WebSocketClient` object, you'll be connected to the socket and you may [subscribe to channels](https://docs.emx.com/#subscriptions):

```javascript
websocket.subscribe({ contractCodes: ['BTCH19'], channels: ['auctions', 'level2'] });

websocket.unsubscribe({ channels: ['auctions'] });
```

The following events will be emitted from the `WebSocketClient`:

* `open`
* `message`
* `close`
* `error`

If you subscribe to the `trading` channel, you may call the following order-management methods:

* [`placeOrder(params)`](https://docs.emx.com/#create-new-order)
* [`modifyOrder(params)`](https://docs.emx.com/#modify-existing-order)
* [`cancelOrder(orderId)`, `cancelOrders(contractCode)`](https://docs.emx.com/#cancel-specific-order-by-id)
