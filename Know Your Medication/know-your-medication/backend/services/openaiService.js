const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Fetches medication information using OpenAI
 * @param {string} medicationName - The name of the medication to fetch information about
 * @returns {Promise<Object>} - Medication details including description, uses, side effects, etc.
 */
const getMedicationInfo = async (medicationName) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful medical assistant providing accurate information about medications. Provide information in a structured format including generic name, brand names, classification, uses, side effects, contraindications, and dosing guidelines."
        },
        {
          role: "user",
          content: `Provide detailed information about the medication "${medicationName}". Return the response as a JSON object with the following fields: genericName, brandNames, classification, description, uses, sideEffects, contraindications, dosingGuidelines, warnings, interactions.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    // Parse the JSON response
    const resultContent = response.choices[0].message.content;
    return JSON.parse(resultContent);
  } catch (error) {
    console.error('Error fetching medication info from OpenAI:', error);
    throw new Error('Failed to fetch medication information');
  }
};

/**
 * Checks for drug interactions between multiple medications
 * @param {Array<string>} medications - Array of medication names
 * @returns {Promise<Object>} - Information about potential drug interactions
 */
const checkDrugInteractions = async (medications) => {
  if (!medications || medications.length < 2) {
    return { interactions: [], message: "At least two medications are required to check for interactions" };
  }

  try {
    const medicationList = medications.join(", ");
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful medical assistant specializing in drug interactions. Provide accurate information about potential interactions between medications."
        },
        {
          role: "user",
          content: `Check for potential drug interactions between the following medications: ${medicationList}. Return the response as a JSON object with fields: interactions (array of interaction objects with 'drugs' and 'description'), severityLevel (array of 'mild', 'moderate', or 'severe' interactions), and recommendations.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    // Parse the JSON response
    const resultContent = response.choices[0].message.content;
    return JSON.parse(resultContent);
  } catch (error) {
    console.error('Error checking drug interactions from OpenAI:', error);
    throw new Error('Failed to check drug interactions');
  }
};

module.exports = {
  getMedicationInfo,
  checkDrugInteractions
}; 