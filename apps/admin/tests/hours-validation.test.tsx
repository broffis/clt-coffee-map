import { describe, expect, it, vi } from "vitest";
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

  it("rejects a future verification date in the location's time zone", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-12T03:00:00Z"));
    try {
      const regular = hours();
      expect(() =>
        validateRegularHours({
          ...regular,
          source: { ...regular.source, verifiedOn: "2026-11-12" },
        }),
      ).toThrow(RangeError);
      expect(() =>
        validateRegularHours({
          ...regular,
          source: { ...regular.source, verifiedOn: "2026-11-11" },
        }),
      ).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });

  describe("regular hours periods", () => {
    it("accepts split, overnight, and adjacent 24-hour periods", () => {
      const regular = hours();
      expect(() =>
        validateRegularHours({
          ...regular,
          days: {
            ...regular.days,
            monday: {
              status: "open",
              periods: [
                { opensAt: "08:00", closesAt: "12:00", closesNextDay: false },
                { opensAt: "20:00", closesAt: "02:00", closesNextDay: true },
              ],
            },
            wednesday: {
              status: "open",
              periods: [
                { opensAt: "00:00", closesAt: "00:00", closesNextDay: true },
              ],
            },
            thursday: {
              status: "open",
              periods: [
                { opensAt: "00:00", closesAt: "00:00", closesNextDay: true },
              ],
            },
          },
        }),
      ).not.toThrow();
    });

    it.each([
      { periods: [] },
      {
        periods: [{ opensAt: "9:00", closesAt: "17:00", closesNextDay: false }],
      },
      {
        periods: [
          { opensAt: "08:00", closesAt: "24:00", closesNextDay: false },
        ],
      },
      {
        periods: [
          { opensAt: "08:00", closesAt: "08:00", closesNextDay: false },
        ],
      },
      {
        periods: [
          { opensAt: "17:00", closesAt: "08:00", closesNextDay: false },
        ],
      },
      {
        periods: [
          { opensAt: "08:00", closesAt: "12:00", closesNextDay: false },
          { opensAt: "11:00", closesAt: "13:00", closesNextDay: false },
        ],
      },
    ])("rejects malformed or overlapping periods: %o", ({ periods }) => {
      const regular = hours();
      expect(() =>
        validateRegularHours({
          ...regular,
          days: { ...regular.days, monday: { status: "open", periods } },
        }),
      ).toThrow(RangeError);
    });

    it("rejects overlapping overnight periods across the end of the week", () => {
      const regular = hours();
      expect(() =>
        validateRegularHours({
          ...regular,
          days: {
            ...regular.days,
            sunday: {
              status: "open",
              periods: [
                { opensAt: "22:00", closesAt: "02:00", closesNextDay: true },
              ],
            },
            monday: {
              status: "open",
              periods: [
                { opensAt: "01:00", closesAt: "04:00", closesNextDay: false },
              ],
            },
          },
        }),
      ).toThrow(RangeError);
    });
  });

  it.each([
    { source: { url: "", verifiedOn: "2024-02-29" } },
    { source: { url: "http://example.com", verifiedOn: "2024-02-29" } },
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
