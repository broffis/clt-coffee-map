import "@tanstack/react-start/server-only";
import type { PhotoDelivery } from "./delivery";
import { createS3PhotoDelivery, readPhotoDeliveryConfig } from "./delivery-s3";

let delivery: PhotoDelivery | undefined;

export const serverPhotoDelivery: PhotoDelivery = {
  copy(key) {
    delivery ??= createS3PhotoDelivery(readPhotoDeliveryConfig(process.env));
    return delivery.copy(key);
  },
};
