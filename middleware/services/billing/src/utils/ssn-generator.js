/**
 * Utility for generating SSN-format IDs
 * 
 * This utility generates unique identifiers in the SSN format (xxx-xx-xxxx)
 * as required by the project specification.
 */

// Keep track of generated SSNs to avoid duplicates
const generatedSSNs = new Set();

/**
 * Generate a random number between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random number
 */
const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate a random SSN-format ID
 * @returns {string} - SSN-format ID (xxx-xx-xxxx)
 */
const generateRandomSSN = () => {
  // Generate the three parts of the SSN
  const part1 = getRandomInt(100, 999).toString();
  const part2 = getRandomInt(10, 99).toString();
  const part3 = getRandomInt(1000, 9999).toString();
  
  // Combine the parts with hyphens
  return `${part1}-${part2}-${part3}`;
};

/**
 * Generate a unique SSN-format ID
 * @returns {string} - Unique SSN-format ID
 */
const generateUniqueSSN = () => {
  let ssn;
  let attempts = 0;
  const maxAttempts = 1000; // Prevent infinite loop
  
  // Keep generating until we get a unique SSN or reach max attempts
  do {
    ssn = generateRandomSSN();
    attempts++;
    
    if (attempts >= maxAttempts) {
      console.warn('Max attempts reached when generating unique SSN');
      break;
    }
  } while (generatedSSNs.has(ssn));
  
  // Add the SSN to the set of generated SSNs
  generatedSSNs.add(ssn);
  
  return ssn;
};

/**
 * Validate if a string is in SSN format
 * @param {string} ssn - String to validate
 * @returns {boolean} - Whether the string is in SSN format
 */
const validateSSNFormat = (ssn) => {
  const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
  return ssnRegex.test(ssn);
};

/**
 * SSN Generator utility
 */
const SSNGenerator = {
  /**
   * Generate a unique SSN-format ID
   * @returns {Promise<string>} - Unique SSN-format ID
   */
  generate: async () => {
    return generateUniqueSSN();
  },
  
  /**
   * Validate if a string is in SSN format
   * @param {string} ssn - String to validate
   * @returns {boolean} - Whether the string is in SSN format
   */
  validate: (ssn) => {
    return validateSSNFormat(ssn);
  }
};

module.exports = {
  SSNGenerator
};