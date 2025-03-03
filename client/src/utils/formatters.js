/**
 * Format a date string to a readable format (e.g., "Mon, Jan 1")
 * @param {string} dateString - The date string to format
 * @returns {string} - The formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'TBD';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format a time string to a readable format (e.g., "7:30 PM")
 * @param {string} dateString - The date string to format
 * @returns {string} - The formatted time
 */
export const formatTime = (dateString) => {
  if (!dateString) return 'TBD';
  
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Convert American odds to decimal odds
 * @param {number} americanOdds - The American odds value
 * @returns {number} - The decimal odds value
 */
export const americanToDecimal = (americanOdds) => {
  if (americanOdds === undefined || americanOdds === null) return null;
  
  if (americanOdds > 0) {
    // Positive American odds (e.g. +150)
    return parseFloat((americanOdds / 100 + 1).toFixed(2));
  } else {
    // Negative American odds (e.g. -200)
    return parseFloat((100 / Math.abs(americanOdds) + 1).toFixed(2));
  }
};

/**
 * Format odds to a readable format
 * @param {number} odds - The odds value (in American format)
 * @returns {string} - The formatted odds in decimal format
 */
export const formatOdds = (odds) => {
  if (odds === undefined || odds === null) return 'N/A';
  
  // Convert to decimal odds and format
  const decimalOdds = americanToDecimal(odds);
  return decimalOdds ? decimalOdds.toFixed(2) : 'N/A';
};

/**
 * Calculate potential winnings based on bet amount and odds
 * @param {number} amount - The bet amount
 * @param {number} odds - The odds value (in American format)
 * @returns {number} - The potential winnings
 */
export const calculateWinnings = (amount, odds) => {
  if (!amount || !odds) return 0;
  
  // Convert to decimal odds and calculate winnings
  const decimalOdds = americanToDecimal(odds);
  return amount * (decimalOdds - 1);
};

/**
 * Format currency value
 * @param {number} value - The currency value
 * @returns {string} - The formatted currency value
 */
export const formatCurrency = (value) => {
  if (value === undefined || value === null) return '$0.00';
  
  return `$${value.toFixed(2)}`;
};

/**
 * Get status color based on bet status
 * @param {string} status - The bet status
 * @returns {string} - The color for the status
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'won':
      return 'success.main';
    case 'lost':
      return 'error.main';
    case 'pending':
      return 'primary.main';
    case 'cancelled':
      return 'text.secondary';
    default:
      return 'text.primary';
  }
}; 