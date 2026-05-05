const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const ISSUE_EPOCH = { year: 2025, monthIndex: 3 } as const;

export type EditorialDate = {
  issueNum: number;
  monthEn: string;
  monthEs: string;
  year: number;
};

export function getEditorialDate(now: Date = new Date()): EditorialDate {
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const issueNum =
    (year - ISSUE_EPOCH.year) * 12 + (monthIndex - ISSUE_EPOCH.monthIndex) + 1;
  return {
    issueNum: Math.max(1, issueNum),
    monthEn: MONTHS_EN[monthIndex],
    monthEs: MONTHS_ES[monthIndex],
    year,
  };
}
