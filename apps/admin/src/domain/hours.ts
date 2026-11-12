export type DayHours =
  | { readonly status: "unknown" }
  | { readonly status: "closed" }
  | {
      readonly status: "open";
      readonly periods: readonly {
        readonly opensAt: string;
        readonly closesAt: string;
        readonly closesNextDay: boolean;
      }[];
    };

export interface RegularHours {
  readonly timeZone: string;
  readonly days: {
    readonly monday: DayHours;
    readonly tuesday: DayHours;
    readonly wednesday: DayHours;
    readonly thursday: DayHours;
    readonly friday: DayHours;
    readonly saturday: DayHours;
    readonly sunday: DayHours;
  };
  readonly source: {
    readonly url: string;
    readonly verifiedOn: string;
  };
}

export function validateRegularHours(hours: RegularHours | null): void {
  if (hours === null) {
    return;
  }

  if (
    !URL.canParse(hours.source.url) ||
    !["http:", "https:"].includes(new URL(hours.source.url).protocol)
  ) {
    throw new RangeError("Regular hours require a valid source URL.");
  }

  const { verifiedOn } = hours.source;
  const date = new Date(`${verifiedOn}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(verifiedOn) ||
    Number.isNaN(date.valueOf()) ||
    date.toISOString().slice(0, 10) !== verifiedOn
  ) {
    throw new RangeError("Regular hours require a valid verification date.");
  }

  if (!/[a-z]/i.test(hours.timeZone)) {
    throw new RangeError("Regular hours require a valid time zone.");
  }
  try {
    new Intl.DateTimeFormat("en", { timeZone: hours.timeZone });
  } catch (error) {
    if (error instanceof RangeError) {
      throw new RangeError("Regular hours require a valid time zone.");
    }
    throw error;
  }
}

function copyDayHours(day: DayHours): DayHours {
  if (day.status !== "open") {
    return { ...day };
  }

  return { ...day, periods: day.periods.map((period) => ({ ...period })) };
}

export function copyRegularHours(
  hours: RegularHours | null,
): RegularHours | null {
  if (hours === null) {
    return null;
  }

  return {
    timeZone: hours.timeZone,
    source: { ...hours.source },
    days: {
      monday: copyDayHours(hours.days.monday),
      tuesday: copyDayHours(hours.days.tuesday),
      wednesday: copyDayHours(hours.days.wednesday),
      thursday: copyDayHours(hours.days.thursday),
      friday: copyDayHours(hours.days.friday),
      saturday: copyDayHours(hours.days.saturday),
      sunday: copyDayHours(hours.days.sunday),
    },
  };
}
