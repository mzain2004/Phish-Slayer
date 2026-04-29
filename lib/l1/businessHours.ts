/**
 * Business Hours Anomaly Detection
 */
export function isBusinessHours(timestamp: Date, timezone: string = 'UTC'): boolean {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      weekday: 'short',
      hour: 'numeric'
    });
    
    const parts = formatter.formatToParts(timestamp);
    const weekdayName = parts.find(p => p.type === 'weekday')?.value || ""; // "Mon", "Tue", etc.
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || "0");

    // Mon-Fri 08:00-18:00
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const isWeekday = weekdays.includes(weekdayName);
    const isWorkingHour = hour >= 8 && hour < 18;

    return isWeekday && isWorkingHour;
  } catch (err) {
    console.error("[businessHours] Error:", err);
    return true; // Default to true to avoid false alarms on error
  }
}

export function flagOutOfHoursLogin(alert: { alert_type: string; title: string }, timezone: string = 'UTC'): boolean {
  const now = new Date();
  const typeStr = (alert.alert_type + " " + alert.title).toLowerCase();
  const isLoginRelated = typeStr.includes('login') || typeStr.includes('authentication') || typeStr.includes('access');
  
  if (isLoginRelated && !isBusinessHours(now, timezone)) {
    return true;
  }
  return false;
}
