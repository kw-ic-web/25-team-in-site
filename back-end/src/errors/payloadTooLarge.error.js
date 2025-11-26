export class PayloadTooLargeError extends Error {
  constructor(message = "Payload Too Large") {
    super(message);
    this.name = "PayloadTooLargeError";
    this.status = 413;
  }
}
