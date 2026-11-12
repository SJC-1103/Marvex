export interface MarketSessionStatus {
  exchangeName: string;
  country: 'IN' | 'US';
  timezoneName: string; // 'Asia/Kolkata' or 'America/New_York'
  localTimeFormatted: string;
  isOpen: boolean;
  statusLabel: string; // e.g. "Open (Regular Session)", "Closed (Pre-Market)", "Closed (Weekend)"
  tradingHours: string; // "09:15 – 15:30 IST" or "09:30 – 16:00 ET"
  nextSessionNote: string;
}

/**
 * Calculates authentic market status using real-world timezone conversion
 */
export function getMarketSessionStatus(market: 'IN' | 'US', now: Date = new Date()): MarketSessionStatus {
  const timeZone = market === 'IN' ? 'Asia/Kolkata' : 'America/New_York';

  // Format parts in target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    month: 'short',
    day: 'numeric',
  });

  const parts = formatter.formatToParts(now);
  const partMap: Record<string, string> = {};
  parts.forEach(p => {
    partMap[p.type] = p.value;
  });

  const weekday = partMap['weekday']; // 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
  const hour = parseInt(partMap['hour'] || '0', 10);
  const minute = parseInt(partMap['minute'] || '0', 10);
  const currentTotalMinutes = hour * 60 + minute;

  const isWeekend = weekday === 'Sat' || weekday === 'Sun';

  if (market === 'IN') {
    // NSE & BSE: 09:15 to 15:30 IST, Monday to Friday
    const openMinutes = 9 * 60 + 15; // 555
    const closeMinutes = 15 * 60 + 30; // 930
    const isOpen = !isWeekend && currentTotalMinutes >= openMinutes && currentTotalMinutes < closeMinutes;

    let statusLabel = 'Closed';
    let nextSessionNote = 'Next session: 09:15 IST next trading day';

    if (isOpen) {
      statusLabel = 'Open (Regular Trading)';
      const remainingMinutes = closeMinutes - currentTotalMinutes;
      const h = Math.floor(remainingMinutes / 60);
      const m = remainingMinutes % 60;
      nextSessionNote = `Closes in ${h > 0 ? `${h}h ` : ''}${m}m`;
    } else if (isWeekend) {
      statusLabel = 'Closed (Weekend)';
      nextSessionNote = 'Next session: Monday 09:15 IST';
    } else if (currentTotalMinutes < openMinutes) {
      statusLabel = 'Closed (Pre-Open at 09:00 IST)';
      const tillOpen = openMinutes - currentTotalMinutes;
      const h = Math.floor(tillOpen / 60);
      const m = tillOpen % 60;
      nextSessionNote = `Opens in ${h > 0 ? `${h}h ` : ''}${m}m`;
    } else {
      statusLabel = 'Closed (Post-Market Settled)';
      nextSessionNote = 'Next session: Tomorrow 09:15 IST';
    }

    const localTimeFormatted = `${partMap['weekday']}, ${partMap['month']} ${partMap['day']} · ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} IST`;

    return {
      exchangeName: 'NSE & BSE (India)',
      country: 'IN',
      timezoneName: 'Asia/Kolkata',
      localTimeFormatted,
      isOpen,
      statusLabel,
      tradingHours: '09:15 – 15:30 IST',
      nextSessionNote,
    };
  } else {
    // NYSE & NASDAQ: 09:30 to 16:00 ET, Monday to Friday
    const openMinutes = 9 * 60 + 30; // 570
    const closeMinutes = 16 * 60; // 960
    const isOpen = !isWeekend && currentTotalMinutes >= openMinutes && currentTotalMinutes < closeMinutes;

    let statusLabel = 'Closed';
    let nextSessionNote = 'Next session: 09:30 ET next trading day';

    if (isOpen) {
      statusLabel = 'Open (Regular Trading)';
      const remainingMinutes = closeMinutes - currentTotalMinutes;
      const h = Math.floor(remainingMinutes / 60);
      const m = remainingMinutes % 60;
      nextSessionNote = `Closes in ${h > 0 ? `${h}h ` : ''}${m}m`;
    } else if (isWeekend) {
      statusLabel = 'Closed (Weekend)';
      nextSessionNote = 'Next session: Monday 09:30 ET';
    } else if (currentTotalMinutes < openMinutes) {
      statusLabel = 'Closed (Pre-Market Session)';
      const tillOpen = openMinutes - currentTotalMinutes;
      const h = Math.floor(tillOpen / 60);
      const m = tillOpen % 60;
      nextSessionNote = `Opens in ${h > 0 ? `${h}h ` : ''}${m}m`;
    } else {
      statusLabel = 'Closed (After-Hours Settled)';
      nextSessionNote = 'Next session: Tomorrow 09:30 ET';
    }

    const localTimeFormatted = `${partMap['weekday']}, ${partMap['month']} ${partMap['day']} · ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ET`;

    return {
      exchangeName: 'NYSE & NASDAQ (USA)',
      country: 'US',
      timezoneName: 'America/New_York',
      localTimeFormatted,
      isOpen,
      statusLabel,
      tradingHours: '09:30 – 16:00 ET',
      nextSessionNote,
    };
  }
}
