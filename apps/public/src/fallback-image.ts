import fallbackImage from "../../assets/clt-coffee-map-logo.jpg";

export { fallbackImage };

export function showFallbackImage(image: HTMLImageElement): void {
  if (image.getAttribute("src") === fallbackImage) {
    return;
  }
  image.removeAttribute("srcset");
  image.removeAttribute("sizes");
  image.alt = "";
  image.className = "shop-placeholder";
  image.src = fallbackImage;
}
