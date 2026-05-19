type IcsEventInput = {
  start: Date;
  end?: Date;
  summary: string;
  description: string;
  uidPrefix?: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatIcsDate(date: Date) {
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate())
  ].join("") + `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export function createIcsEvent(input: IcsEventInput) {
  if (Number.isNaN(input.start.getTime())) {
    return null;
  }

  const end = input.end && !Number.isNaN(input.end.getTime())
    ? input.end
    : new Date(input.start.getTime() + 30 * 60 * 1000);
  const now = new Date();
  const uid = `${input.uidPrefix || "nexcall"}-${now.getTime()}-${Math.random().toString(16).slice(2)}@nexcall.one`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NexCall//AI Receptionist//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(input.start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(input.summary)}`,
    `DESCRIPTION:${escapeIcsText(input.description)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}
