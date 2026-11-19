import { PersistenceError } from "../persistence/errors";

export interface RegionDefaults {
  readonly regionId: string;
  readonly cityId: string;
}

function requireSetting(
  env: Readonly<Record<string, string | undefined>>,
  name: string,
): string {
  const value = env[name]?.trim() ?? "";
  if (value === "") {
    throw new PersistenceError("configuration", `${name} must be set.`);
  }
  return value;
}

// New locations get their region and city from server configuration only.
export function readRegionDefaults(
  env: Readonly<Record<string, string | undefined>>,
): RegionDefaults {
  return {
    regionId: requireSetting(env, "DEFAULT_REGION_ID"),
    cityId: requireSetting(env, "DEFAULT_CITY_ID"),
  };
}
