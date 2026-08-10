export interface RangeKey {
  key: "7d" | "30d" | "3m" | "6m" | "1y";
  label: string;
}

export const rangeOptions: RangeKey[] = [
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "3m", label: "3 Months" },
  { key: "6m", label: "6 Months" },
  { key: "1y", label: "1 Year" },
];

const monthly = [
  { period: "Sep 25", reported: 68, rescued: 54 },
  { period: "Oct 25", reported: 74, rescued: 61 },
  { period: "Nov 25", reported: 81, rescued: 69 },
  { period: "Dec 25", reported: 95, rescued: 78 },
  { period: "Jan 26", reported: 112, rescued: 94 },
  { period: "Feb 26", reported: 88, rescued: 76 },
  { period: "Mar 26", reported: 97, rescued: 85 },
  { period: "Apr 26", reported: 104, rescued: 90 },
  { period: "May 26", reported: 121, rescued: 103 },
  { period: "Jun 26", reported: 116, rescued: 99 },
  { period: "Jul 26", reported: 128, rescued: 111 },
  { period: "Aug 26", reported: 62, rescued: 51 },
];

const weekly = [
  { period: "Mon", reported: 9, rescued: 7 },
  { period: "Tue", reported: 12, rescued: 10 },
  { period: "Wed", reported: 7, rescued: 6 },
  { period: "Thu", reported: 14, rescued: 11 },
  { period: "Fri", reported: 11, rescued: 9 },
  { period: "Sat", reported: 16, rescued: 13 },
  { period: "Sun", reported: 10, rescued: 9 },
];

const monthlyDays = [
  { period: "W1", reported: 28, rescued: 22 },
  { period: "W2", reported: 34, rescued: 29 },
  { period: "W3", reported: 31, rescued: 27 },
  { period: "W4", reported: 35, rescued: 30 },
];

export function seriesForRange(range: RangeKey["key"]) {
  switch (range) {
    case "7d":
      return weekly;
    case "30d":
      return monthlyDays;
    case "3m":
      return monthly.slice(-3);
    case "6m":
      return monthly.slice(-6);
    default:
      return monthly;
  }
}

export const responseTimeSeries = [
  { period: "Mar 26", minutes: 26 },
  { period: "Apr 26", minutes: 24 },
  { period: "May 26", minutes: 22 },
  { period: "Jun 26", minutes: 21 },
  { period: "Jul 26", minutes: 19 },
  { period: "Aug 26", minutes: 18 },
];

export const completionRateSeries = [
  { period: "Mar 26", rate: 82 },
  { period: "Apr 26", rate: 84 },
  { period: "May 26", rate: 85 },
  { period: "Jun 26", rate: 86 },
  { period: "Jul 26", rate: 88 },
  { period: "Aug 26", rate: 91 },
];

export const landingStats = [
  { label: "Animals Reported", value: 1250, suffix: "+" },
  { label: "Successful Rescues", value: 980, suffix: "+" },
  { label: "Active Rescuers", value: 120, suffix: "+" },
  { label: "Partner NGOs", value: 35, suffix: "+" },
];