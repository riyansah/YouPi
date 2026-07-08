export const APP_DEFAULT_TIME_ZONE = "Asia/Jakarta";

const weekdayIndexByShortLabel: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function toUtcDate(value: string) {
  const { year, month, day } = parseDateKey(value);
  return new Date(Date.UTC(year, month - 1, day));
}

function dateKeyFromUtcDate(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function getTimeZoneOffsetMs(timeZone: string, value: number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "shortOffset",
    hourCycle: "h23"
  });
  const zoneLabel = formatter.formatToParts(date).find((part) => part.type === "timeZoneName")?.value || "GMT";

  if (zoneLabel === "GMT" || zoneLabel === "UTC") {
    return 0;
  }

  const match = zoneLabel.match(/^(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) {
    return 0;
  }

  const [, sign, hours, minutes = "00"] = match;
  const totalMinutes = Number(hours) * 60 + Number(minutes);
  return (sign === "+" ? 1 : -1) * totalMinutes * 60 * 1000;
}

export function isSupportedAppTimeZone(value: unknown): value is string {
  return value === APP_DEFAULT_TIME_ZONE;
}

export function normalizeTimeZone(value: string | undefined | null) {
  void value;
  return APP_DEFAULT_TIME_ZONE;
}

export function addDaysToDateKey(value: string, offset: number) {
  const date = toUtcDate(value);
  date.setUTCDate(date.getUTCDate() + offset);
  return dateKeyFromUtcDate(date);
}

export function addMonthsToDateKey(value: string, offset: number) {
  const date = toUtcDate(value);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return dateKeyFromUtcDate(date);
}

export function endOfMonthDateKey(value: string) {
  const { year, month } = parseDateKey(value);
  return dateKeyFromUtcDate(new Date(Date.UTC(year, month, 0)));
}

export function startOfWeekDateKey(value: string) {
  const date = toUtcDate(value);
  const day = date.getUTCDay();
  const diffToMonday = day == 0 ? 6 : day - 1;
  date.setUTCDate(date.getUTCDate() - diffToMonday);
  return dateKeyFromUtcDate(date);
}

export function getWeekdayIndexFromDateKey(value: string) {
  return toUtcDate(value).getUTCDay();
}

export function getDateTimePartsInTimeZone(value: number | string | Date, timeZone: string) {
  const date = value instanceof Date ? value : new Date(value);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    weekday: parts.weekday,
    weekdayIndex: weekdayIndexByShortLabel[parts.weekday] ?? 0,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second
  };
}

export function getDateKeyInTimeZone(value: number | string | Date, timeZone: string) {
  const parts = getDateTimePartsInTimeZone(value, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getTimeValueInTimeZone(value: number | string | Date, timeZone: string, withSeconds = false) {
  const parts = getDateTimePartsInTimeZone(value, timeZone);
  return withSeconds ? `${parts.hour}:${parts.minute}:${parts.second}` : `${parts.hour}:${parts.minute}`;
}

export function zonedDateTimeToTimestamp(value: string, time: string, timeZone: string, endOfMinute = false) {
  const { year, month, day } = parseDateKey(value);
  const [hour, minute] = time.split(":").map(Number);
  const seconds = endOfMinute ? 59 : 0;
  const milliseconds = endOfMinute ? 999 : 0;
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, seconds, milliseconds);
  const offset = getTimeZoneOffsetMs(timeZone, utcGuess);
  let timestamp = utcGuess - offset;
  const adjustedOffset = getTimeZoneOffsetMs(timeZone, timestamp);

  if (adjustedOffset !== offset) {
    timestamp = utcGuess - adjustedOffset;
  }

  return timestamp;
}

export function getStartOfDayTimestampInTimeZone(value: string, timeZone: string) {
  return zonedDateTimeToTimestamp(value, "00:00", timeZone);
}

export function getEndOfDayTimestampInTimeZone(value: string, timeZone: string) {
  return zonedDateTimeToTimestamp(value, "23:59", timeZone, true);
}

export function formatDateKeyInTimeZone(value: string, locale: string, timeZone: string, withWeekday = false) {
  const timestamp = zonedDateTimeToTimestamp(value, "12:00", timeZone);
  return new Intl.DateTimeFormat(locale, withWeekday
    ? { timeZone, weekday: "long", day: "2-digit", month: "short", year: "numeric" }
    : { timeZone, day: "2-digit", month: "short", year: "numeric" }).format(new Date(timestamp));
}

export function formatDateTimeInTimeZone(
  value: number | string | Date,
  locale: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions
) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, { timeZone, ...options }).format(date);
}

export function getTimestampInTimeZone(value: number | string | Date, timeZone = APP_DEFAULT_TIME_ZONE) {
  const date = value instanceof Date ? value : new Date(value);
  const parts = getDateTimePartsInTimeZone(date, timeZone);
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0");
  const offsetMinutes = getTimeZoneOffsetMs(timeZone, date) / 60000;
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.floor(absoluteMinutes / 60));
  const offsetRemainder = pad(absoluteMinutes % 60);

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${milliseconds}${sign}${offsetHours}:${offsetRemainder}`;
}

export function getCurrentTimestampInTimeZone(timeZone = APP_DEFAULT_TIME_ZONE) {
  return getTimestampInTimeZone(Date.now(), timeZone);
}

export function getDateKeyFromTimestamp(value: number | string | Date, timeZone = APP_DEFAULT_TIME_ZONE) {
  return getDateKeyInTimeZone(value, timeZone);
}
