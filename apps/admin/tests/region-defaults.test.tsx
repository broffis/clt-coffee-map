import { describe, expect, it } from "vitest";
import { readRegionDefaults } from "../src/editor/region-defaults";
import { PersistenceError } from "../src/persistence/errors";

describe("region defaults", () => {
  it("reads trimmed region and city IDs from the environment", () => {
    expect(
      readRegionDefaults({
        DEFAULT_REGION_ID: " region-1 ",
        DEFAULT_CITY_ID: " city-1 ",
      }),
    ).toEqual({ regionId: "region-1", cityId: "city-1" });
  });

  it.each([
    [{ DEFAULT_CITY_ID: "city-1" }, "DEFAULT_REGION_ID"],
    [
      { DEFAULT_REGION_ID: "region-1", DEFAULT_CITY_ID: " " },
      "DEFAULT_CITY_ID",
    ],
  ])("fails clearly when a setting is missing", (env, name) => {
    expect(() => readRegionDefaults(env)).toThrow(PersistenceError);
    expect(() => readRegionDefaults(env)).toThrow(name);
  });
});
