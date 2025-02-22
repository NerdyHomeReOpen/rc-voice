module.exports = class SocketError extends Error {
  constructor(
    message = 'unknown error',
    part = 'UNKNOWN_PART',
    tag = 'UNKNOWN_ERROR',
    status_code = 500,
  ) {
    super(message);
    this.name = 'SocketError';
    this.part = part;
    this.tag = tag;
    this.status_code = status_code;
  }
};
