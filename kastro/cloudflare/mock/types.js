class CfRequest extends Request {
  constructor(input, init = {}) {
    super(input, init);

    // Add cf property with clientAcceptEncoding
    this.cf = {
      clientAcceptEncoding: init.headers["accept-encoding"] || ''
    };
  }
}

export { CfRequest };
