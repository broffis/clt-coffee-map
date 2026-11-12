import { describe, expect, it } from "vitest";
import { type RegularHours, validateRegularHours } from "../src/domain/hours";

function hours(): RegularHours {
  return {
    timeZone: "America/New_York",
    source: { url: "https://example.com/hours", verifiedOn: "2024-02-29" },
    days: {
      monday: { status: "unknown" },
      tuesday: { status: "closed" },
      wednesday: { status: "closed" },
      thursday: { status: "closed" },
      friday: { status: "closed" },
      saturday: { status: "closed" },
      sunday: { status: "closed" },
    },
  };
}

describe("regular hours verification", () => {
  it("accepts unknown hours and valid source metadata", () => {
    expect(() => validateRegularHours(null)).not.toThrow();
    expect(() => validateRegularHours(hours())).not.toThrow();
  });

  it.each([
    { source: { url: "", verifiedOn: "2024-02-29" } },
    { source: { url: "javascript:alert(1)", verifiedOn: "2024-02-29" } },
    { source: { url: "https://example.com", verifiedOn: "2023-02-29" } },
    { source: { url: "https://example.com", verifiedOn: "2024-2-29" } },
    { timeZone: "Not/A_Real_Zone" },
    { timeZone: "+05:00" },
  ])("rejects invalid source or timezone: %o", (invalid) => {
    expect(() => validateRegularHours({ ...hours(), ...invalid })).toThrow(
      RangeError,
    );
  });
});
