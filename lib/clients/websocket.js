const { EventEmitter } = require('events');
const Websocket = require('ws');
const snakeCaseKeys = require('snakecase-keys');

const { signRequest, checkAuth } = require('../auth');
const { checkOrderParams } = require('../orders');

const DEFAULT_URI = 'wss://api.testnet.emx.com';

class WebSocketClient extends EventEmitter {
  constructor(key, secret, websocketURI = DEFAULT_URI, options = {}) {
    super();
    this.websocketURI = websocketURI;
    const { devOverride } = options;
    this.auth = checkAuth({ key, secret, devOverride });
    this.connect();
  }

  connect() {
    if (this.socket) {
      this.socket.close();
    }

    this.socket = new Websocket(this.websocketURI);

    this.socket.on('message', this.onMessage.bind(this));
    this.socket.on('open', this.onOpen.bind(this));
    this.socket.on('close', this.onClose.bind(this));
    this.socket.on('error', this.onError.bind(this));
  }

  disconnect() {
    if (!this.socket) {
      throw new Error('Could not disconnect (not connected)');
    }
    this.socket.close();
    this.socket = null;
  }

  _send(obj) {
    this.socket.send(
      JSON.stringify(
        snakeCaseKeys(obj)));
  }

  _sendSubscription(type, { contractCodes, channels }) {
    const message = { type };

    if (channels) {
      message.channels = channels;
    }

    if (contractCodes) {
      message.contractCodes = contractCodes;
    } else {
      // all contracts
      message.contractCodes = [];
    }

    if (this.auth.secret) {
      const sig = signRequest(this.auth, 'GET', '/v1/user/verify');
      Object.assign(message, sig);
    } else if (this.auth.devOverride) {
      Object.assign(message, { traderId: this.auth.devOverride });
    }

    this._send(message);
  }

  // // // Event Handlers // // //

  onOpen() {
    this.emit('open');
  }

  onClose() {
    this.socket = null;
    this.emit('close');
  }

  onMessage(data) {
    const message = JSON.parse(data);
    if (message.type === 'error') {
      this.onError(message);
    } else {
      this.emit('message', message);
    }
  }

  onError(err) {
    if (!err) {
      return;
    }

    this.emit('error', err);
  }

  // // // Subscriptions // // //

  subscribe({ contractCodes, channels }) {
    this._sendSubscription('subscribe', { contractCodes, channels });
  }

  unsubscribe({ contractCodes, channels }) {
    this._sendSubscription('unsubscribe', { contractCodes, channels });
  }

  // // // Trading // // //

  placeOrder(params) {
    checkOrderParams(params);
    const message = {
      type: 'request',
      channel: 'trading',
      action: 'create-order',
      data: params,
    };
    this._send(message);
  }

  modifyOrder(params) {
    const message = {
      type: 'request',
      channel: 'trading',
      action: 'modify-order',
      data: params,
    };
    this._send(message);
  }

  cancelOrder(orderId) {
    const message = {
      type: 'request',
      channel: 'trading',
      action: 'cancel-order',
      data: {
        orderId,
      },
    };
    this._send(message);
  }

  cancelOrders(contractCode) {
    const message = {
      type: 'request',
      channel: 'trading',
      action: 'cancel-all-orders',
      data: {
        contractCode,
      },
    };
    this._send(message);
  }
}

module.exports = WebSocketClient;
