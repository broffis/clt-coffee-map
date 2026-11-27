export interface PhotoDelivery {
  copy(key: string): Promise<void>;
}

export class PhotoDeliveryError extends Error {
  constructor() {
    super("The publication was saved, but photo delivery is pending.");
    this.name = "PhotoDeliveryError";
  }
}
