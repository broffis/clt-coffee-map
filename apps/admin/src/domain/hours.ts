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
