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

  validatePeriods(hours.days);
}

function minutesSinceMidnight(time: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new RangeError("Opening periods require valid local times.");
  }
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
}

function validatePeriods(days: RegularHours["days"]): void {
  const intervals: { start: number; end: number }[] = [];
  const week = [
    days.monday,
    days.tuesday,
    days.wednesday,
    days.thursday,
    days.friday,
    days.saturday,
    days.sunday,
  ];

  week.forEach((day, index) => {
    if (day.status !== "open") {
      return;
    }
    if (day.periods.length === 0) {
      throw new RangeError("An open day requires at least one period.");
    }

    for (const period of day.periods) {
      const start = index * 1440 + minutesSinceMidnight(period.opensAt);
      const end =
        index * 1440 +
        minutesSinceMidnight(period.closesAt) +
        (period.closesNextDay ? 1440 : 0);
      if (end <= start) {
        throw new RangeError("An opening period must end after it starts.");
      }
      intervals.push({ start, end });
    }
  });

  intervals.sort((a, b) => a.start - b.start);
  for (let index = 1; index < intervals.length; index += 1) {
    if (intervals[index - 1].end > intervals[index].start) {
      throw new RangeError("Opening periods must not overlap.");
    }
  }
  if (
    intervals.length > 0 &&
    intervals[intervals.length - 1].end > intervals[0].start + 7 * 1440
  ) {
    throw new RangeError("Opening periods must not overlap.");
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
