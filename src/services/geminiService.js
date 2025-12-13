import { API_KEYS } from '../config/apiKeys';

// OpenRouter API Configuration
// OpenRouter provides access to multiple AI models through a unified API
const OPENROUTER_API_KEY = API_KEYS.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// List of free models to try in order of preference
// Using OpenRouter with openai/gpt-oss-20b:free model
const FREE_MODELS = [
    'openai/gpt-oss-20b:free',
];

if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY_HERE') {
    console.warn('⚠️ OpenRouter API key not configured. Please add your API key in src/config/apiKeys.js');
}

/**
 * Helper function to generate content using OpenRouter API with model fallback
 * @param {String} prompt - The prompt to send to the model
 * @returns {Promise<String|null>} Generated text or null if all models fail
 */
const generateContentWithFallback = async (prompt) => {
    if (!OPENROUTER_API_KEY) {
        console.warn('OpenRouter API key not configured.');
        return null;
    }

    // Try multiple free models until one works
    for (const modelName of FREE_MODELS) {
        try {
            const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': typeof window !== 'undefined' && window.location ? window.location.origin : 'https://smartfarmapp.com',
                    'X-Title': 'SmartFarm App',
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                    temperature: 0.7,
                    max_tokens: 500,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                // Log more details for debugging
                if (response.status === 404) {
                    console.warn(`Model ${modelName} not found (404). Trying next model...`);
                } else {
                    console.warn(`Model ${modelName} failed:`, response.status, errorData);
                }
                continue;
            }

            const data = await response.json();
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                return data.choices[0].message.content;
            } else {
                console.warn(`Unexpected response format from ${modelName}:`, data);
                continue;
            }
        } catch (error) {
            console.warn(`Error with model ${modelName}:`, error.message);
            continue;
        }
    }
    
    console.error('❌ No working AI model found. All models failed. Please check:');
    console.error('1. Your OpenRouter API key is valid');
    console.error('2. You have credits/access to free models');
    console.error('3. The models are available on OpenRouter');
    return null;
};

/**
 * Get AI-powered crop advisory based on weather and crop data
 * @param {Object} weatherData - Current weather data
 * @param {Array} userProducts - User's current crops
 * @param {String} location - Location name
 * @returns {Promise<String>} AI-generated advisory
 */
export const getAICropAdvisory = async (weatherData, userProducts, location) => {
    if (!OPENROUTER_API_KEY) {
        console.warn('OpenRouter API not initialized. Please configure API key.');
        return null;
    }

    // Format products list with categories if available
    let cropInfo = 'No crops added yet';
    if (userProducts && userProducts.length > 0) {
        const productsList = userProducts.map(p => {
            if (p.category) {
                return `${p.name} (${p.category})`;
            }
            return p.name;
        }).join(', ');
        cropInfo = productsList;
    }
    
    const prompt = `You are an agricultural expert in Nepal. Provide specific farming advice for the farmer's crops.

FARMER'S CROPS: ${cropInfo}
Location: ${location}
Current Temperature: ${weatherData?.temp || 'N/A'}°C
Humidity: ${weatherData?.humidity || 'N/A'}%
Weather Condition: ${weatherData?.description || 'N/A'}
UV Index: ${weatherData?.uvIndex || 'N/A'}

IMPORTANT: Provide advice SPECIFICALLY for these crops: ${cropInfo}

Give practical, actionable advice (3-4 sentences) covering:
1. Immediate actions needed for EACH crop based on current weather
2. Crop-specific care recommendations (watering, protection, etc.)
3. Any warnings or precautions for these specific crops
4. What the farmer should do TODAY for their crops

Be specific about each crop mentioned. Response in English, simple language:`;

    return await generateContentWithFallback(prompt);
};

/**
 * Get AI-powered crop recommendations based on location, season, and soil type
 * @param {String} location - Location name
 * @param {Number} month - Current month (1-12)
 * @param {String} soilType - Soil type (optional)
 * @returns {Promise<Array>} Array of recommended crops with reasons
 */
export const getAICropRecommendations = async (location, month, soilType = 'loamy') => {
    try {
        if (!OPENROUTER_API_KEY) {
            console.warn('OpenRouter API not initialized. Please configure API key.');
            return null;
        }

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        
        const prompt = `You are an agricultural expert in Nepal. Recommend 3-5 crops suitable for planting in ${location} during ${monthNames[month - 1]}.

Soil Type: ${soilType}
Location: ${location}
Month: ${monthNames[month - 1]}

For each crop, provide:
1. Crop name
2. Brief reason why it's suitable
3. Key planting tips

Format as a simple list. Keep it concise and practical for Nepali farmers:`;

        return await generateContentWithFallback(prompt);
    } catch (error) {
        console.error('Error getting AI crop recommendations:', error);
        return null;
    }
};

/**
 * Get AI-powered pest and disease diagnosis
 * @param {String} cropName - Name of the crop
 * @param {String} symptoms - Description of symptoms
 * @param {String} imageDescription - Description of affected area (optional)
 * @returns {Promise<String>} Diagnosis and treatment recommendations
 */
export const getAIPestDiseaseDiagnosis = async (cropName, symptoms, imageDescription = '') => {
    try {
        if (!OPENROUTER_API_KEY) {
            console.warn('OpenRouter API not initialized. Please configure API key.');
            return null;
        }

        const prompt = `You are an agricultural expert specializing in crop diseases and pests in Nepal. 

Crop: ${cropName}
Symptoms: ${symptoms}
${imageDescription ? `Visual Description: ${imageDescription}` : ''}

Provide:
1. Likely disease or pest identification
2. Severity assessment
3. Treatment recommendations (organic and chemical options)
4. Prevention tips

Keep response practical and suitable for Nepali farming conditions. Response in English:`;

        return await generateContentWithFallback(prompt);
    } catch (error) {
        console.error('Error getting AI pest/disease diagnosis:', error);
        return null;
    }
};

/**
 * Get AI-powered product recommendations for consumers
 * @param {Array} purchaseHistory - User's purchase history
 * @param {String} season - Current season
 * @returns {Promise<Array>} Recommended products
 */
export const getAIProductRecommendations = async (purchaseHistory, season) => {
    try {
        if (!OPENROUTER_API_KEY) {
            console.warn('OpenRouter API not initialized. Please configure API key.');
            return null;
        }

        const history = purchaseHistory.map(item => item.name).join(', ') || 'no previous purchases';
        
        const prompt = `Based on a user's purchase history in a Nepali farming marketplace app, recommend 3-5 products they might like.

Purchase History: ${history}
Current Season: ${season}

Consider:
1. Complementary products
2. Seasonal availability
3. Nutritional balance
4. Popular combinations in Nepal

Provide product names and brief reasons. Keep it concise:`;

        return await generateContentWithFallback(prompt);
    } catch (error) {
        console.error('Error getting AI product recommendations:', error);
        return null;
    }
};

/**
 * Get AI-powered farming tips and best practices
 * @param {String} cropName - Name of the crop
 * @param {String} stage - Growth stage (planting, growing, harvesting)
 * @returns {Promise<String>} Farming tips
 */
export const getAIFarmingTips = async (cropName, stage = 'growing') => {
    try {
        if (!OPENROUTER_API_KEY) {
            console.warn('OpenRouter API not initialized. Please configure API key.');
            return null;
        }

        const prompt = `You are an agricultural expert in Nepal. Provide practical farming tips for ${cropName} during the ${stage} stage.

Focus on:
1. Best practices specific to Nepal
2. Common mistakes to avoid
3. Tips for better yield
4. Organic farming methods if applicable

Keep response concise (3-4 bullet points) and practical:`;

        return await generateContentWithFallback(prompt);
    } catch (error) {
        console.error('Error getting AI farming tips:', error);
        return null;
    }
};

/**
 * Get AI chat response for farmer questions
 * @param {String} question - User's question
 * @param {String} context - Additional context (crops, location, etc.)
 * @returns {Promise<String>} AI response
 */
export const getAIChatResponse = async (question, context = '') => {
    try {
        if (!OPENROUTER_API_KEY) {
            return 'Please configure OpenRouter API key to use this feature.';
        }

        const prompt = `You are an AI agricultural assistant for Nepali farmers. Answer the following question helpfully and accurately.

Question: ${question}
${context ? `Context: ${context}` : ''}

Provide a clear, practical answer suitable for Nepali farming conditions. If you don't know something, say so. Keep response concise but informative:`;

        const result = await generateContentWithFallback(prompt);
        return result || 'Sorry, I encountered an error. Please try again.';
    } catch (error) {
        console.error('Error getting AI chat response:', error);
        return 'Sorry, I encountered an error. Please try again.';
    }
};

/**
 * Get AI-powered price prediction for crops
 * @param {String} cropName - Name of the crop
 * @param {String} season - Current season
 * @param {Number} currentPrice - Current market price
 * @returns {Promise<String>} Price prediction and market insights
 */
export const getAIPricePrediction = async (cropName, season, currentPrice) => {
    try {
        if (!OPENROUTER_API_KEY) {
            console.warn('OpenRouter API not initialized. Please configure API key.');
            return null;
        }

        const prompt = `You are a market analyst for agricultural products in Nepal. Provide price insights for ${cropName}.

Current Price: NPR ${currentPrice}
Season: ${season}

Provide:
1. Short-term price trend (next 1-2 months)
2. Factors affecting price
3. Best time to sell
4. Market demand outlook

Keep response concise and practical:`;

        return await generateContentWithFallback(prompt);
    } catch (error) {
        console.error('Error getting AI price prediction:', error);
        return null;
    }
};

// Export a function to update API key if needed
export const setOpenRouterAPIKey = (apiKey) => {
    if (apiKey) {
        console.log('API key updated. Please update OPENROUTER_API_KEY in apiKeys.js');
    }
};
