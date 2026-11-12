import { describe, expect, it } from "vitest";
import { validateCoordinates } from "../src/domain/location";

describe("location coordinates", () => {
  it("accepts missing coordinates and valid geographic limits", () => {
    expect(() => validateCoordinates(null)).not.toThrow();
    expect(() =>
      validateCoordinates({ latitude: 90, longitude: -180 }),
    ).not.toThrow();
    expect(() =>
      validateCoordinates({ latitude: -90, longitude: 180 }),
    ).not.toThrow();
  });

  it.each([
    { latitude: 91, longitude: 0 },
    { latitude: -91, longitude: 0 },
    { latitude: 0, longitude: 181 },
    { latitude: 0, longitude: -181 },
    { latitude: Number.NaN, longitude: 0 },
    { latitude: 0, longitude: Number.POSITIVE_INFINITY },
  ])("rejects invalid coordinates: $latitude, $longitude", (coordinates) => {
    expect(() => validateCoordinates(coordinates)).toThrow(RangeError);
  });
});
