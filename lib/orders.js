const checkOrderParams = ({ contractCode, side, type, size }) => {
  if (!(contractCode && side && type && size)) {
    throw new Error('`params` must include contractCode, side, type, and size');
  }
};

module.exports = {
  checkOrderParams,
};
