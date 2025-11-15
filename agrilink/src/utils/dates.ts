/**
 * Utility functions for generating realistic dates for the AgriLink platform
 */

/**
 * Generates a consistent, realistic join date for a user based on their ID
 * This ensures the same user always gets the same join date (stable)
 * but creates variety across different users
 */
export function generateJoinDate(userId: string): string {
  // Create a stable hash from the user ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value to ensure positive number
  const seed = Math.abs(hash);
  
  // Define platform timeline (AgriLink launched in early 2020)
  const platformLaunch = new Date('2020-01-01');
  const currentDate = new Date();
  const totalDays = Math.floor((currentDate.getTime() - platformLaunch.getTime()) / (1000 * 60 * 60 * 24));
  
  // Weight the distribution to be more realistic:
  // 10% early adopters (2020-2021)
  // 40% growth phase (2022-2023) 
  // 50% recent users (2024-current)
  
  const randomValue = seed % 1000; // 0-999
  
  let joinDateOffset: number;
  
  if (randomValue < 100) {
    // Early adopters (10%) - 2020-2021
    const earlyPhaseDays = 730; // ~2 years
    joinDateOffset = seed % earlyPhaseDays;
  } else if (randomValue < 500) {
    // Growth phase (40%) - 2022-2023
    const growthStartDays = 730;
    const growthPhaseDays = 730; // ~2 years
    joinDateOffset = growthStartDays + (seed % growthPhaseDays);
  } else {
    // Recent users (50%) - 2024-current
    const recentStartDays = 1460; // ~4 years from launch
    const recentPhaseDays = totalDays - recentStartDays;
    joinDateOffset = recentStartDays + (seed % Math.max(recentPhaseDays, 30));
  }
  
  // Calculate final join date
  const joinDate = new Date(platformLaunch);
  joinDate.setDate(joinDate.getDate() + joinDateOffset);
  
  // Format as month year for display
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return `${months[joinDate.getMonth()]} ${joinDate.getFullYear()}`;
}

/**
 * Generates a realistic "years active" number based on join date
 */
export function calculateYearsActive(joinDateString: string): number {
  const currentDate = new Date();
  
  // Parse the join date string (e.g., "March 2022")
  const [monthName, yearStr] = joinDateString.split(' ');
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthIndex = months.indexOf(monthName);
  const year = parseInt(yearStr);
  
  if (monthIndex === -1 || isNaN(year)) {
    return 1; // Default fallback
  }
  
  const joinDate = new Date(year, monthIndex);
  const yearsDiff = (currentDate.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  
  return Math.max(1, Math.floor(yearsDiff)); // At least 1 year, rounded down
}


/**
 * Formats a date string or ISO timestamp to a readable format for display
 * Handles various input formats and returns a clean display format
 */
export function formatMemberSinceDate(dateInput: string | undefined): string {
  if (!dateInput) {
    return 'Recently';
  }

  // If it's already in a human-readable format (e.g., "March 2022"), return as-is
  if (!dateInput.includes('T') && !dateInput.includes('-')) {
    return dateInput;
  }

  try {
    // Handle ISO timestamp format (2025-09-28T17:24:05.772Z)
    const date = new Date(dateInput);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Recently';
    }

    // Format as "Month Year"
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch (error) {
    console.warn('Failed to parse date:', dateInput, error);
    return 'Recently';
  }
}

/**
 * Gets relative time for product updates (e.g., "2 hours ago", "3 days ago")
 * After 30 days, shows the actual date instead
 */
export function getRelativeTime(dateInput: string | undefined): string {
  if (!dateInput) {
    return 'Recently';
  }

  try {
    let targetDate: Date;

    // Handle different date formats
    if (typeof dateInput === 'object' && dateInput instanceof Date) {
      // Already a Date object
      targetDate = dateInput;
    } else if (typeof dateInput === 'string' && (dateInput.includes('T') || dateInput.includes('Z'))) {
      // ISO timestamp format (2025-09-28T17:24:05.772Z)
      targetDate = new Date(dateInput);
    } else if (typeof dateInput === 'string' && dateInput.includes('-')) {
      // Date format like "2025-09-29" or "2024-12-15"
      targetDate = new Date(dateInput + 'T00:00:00');
    } else {
      // Assume it's already a readable format, return as-is
      return dateInput;
    }

    // Check if date is valid
    if (isNaN(targetDate.getTime())) {
      return 'Recently';
    }

    const now = new Date();
    const diffMs = now.getTime() - targetDate.getTime();
    
    // If date is in the future (allowing for small clock differences), show "Recently"
    if (diffMs < -60000) { // Allow 1 minute tolerance for clock differences
      return 'Recently';
    }
    
    // Treat small negative differences as "Just now"
    if (diffMs < 0) {
      return 'Just now';
    }

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Show relative time for recent updates
    if (diffSeconds < 30) {
      return 'Just now';
    } else if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      // After 30 days, show actual date
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      
      const day = targetDate.getDate();
      const month = months[targetDate.getMonth()];
      const year = targetDate.getFullYear();
      const currentYear = now.getFullYear();
      
      // Show year only if different from current year
      if (year === currentYear) {
        return `${month} ${day}`;
      } else {
        return `${month} ${day}, ${year}`;
      }
    }
  } catch (error) {
    console.warn('Failed to parse date for relative time:', dateInput, error);
    return 'Recently';
  }
}