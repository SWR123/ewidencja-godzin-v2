// Test new formatDateSafe function
function formatDateSafe(dateValue: any): string {
  if (!dateValue) return "";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "";
    
    // Add 2 hours to handle Polish timezone (UTC+1 winter, UTC+2 summer)
    const polishDate = new Date(d.getTime() + 2 * 60 * 60 * 1000);
    
    const day = String(polishDate.getUTCDate()).padStart(2, "0");
    const month = String(polishDate.getUTCMonth() + 1).padStart(2, "0");
    const year = polishDate.getUTCFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return "";
  }
}

// Test cases from database
const testDates = [
  "2026-01-22T23:00:00.000Z",  // Should be 23.01.2026 (Polish time)
  "2026-01-23T23:00:00.000Z",  // Should be 24.01.2026
  "2026-01-24T23:00:00.000Z",  // Should be 25.01.2026
];

console.log("=== DATE FORMAT TEST ===");
for (const date of testDates) {
  console.log(`${date} -> ${formatDateSafe(date)}`);
}
