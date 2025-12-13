# 🤖 Gemini API Integration Guide

This guide explains how to set up and use Google's Gemini AI API in the Hamro Krishi app.

## 📋 Prerequisites

1. Google Account
2. Access to Google AI Studio (https://makersuite.google.com/app/apikey)

## 🚀 Setup Instructions

### Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key" or "Get API Key"
4. Copy your API key (it will look like: `AIzaSy...`)

### Step 2: Configure API Key in the App

1. Open `src/config/apiKeys.js`
2. Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key:

```javascript
export const API_KEYS = {
    GEMINI_API_KEY: 'AIzaSy...your-actual-key-here',
    WEATHERBIT_API_KEY: 'b6d691f2b36741c0b7d036f5c88b7d30',
};
```

### Step 3: Verify Installation

The Gemini package is already installed. If you need to reinstall:

```bash
npm install @google/generative-ai
```

## 🎯 Available AI Features

### 1. **AI Crop Advisory** (Weather Screen)
- Location: `FarmerWeatherScreen.js`
- Function: `getAICropAdvisory()`
- Provides personalized farming advice based on:
  - Current weather conditions
  - User's crops
  - Location

### 2. **AI Crop Recommendations**
- Function: `getAICropRecommendations()`
- Suggests crops based on:
  - Location
  - Season/month
  - Soil type

### 3. **AI Pest & Disease Diagnosis**
- Function: `getAIPestDiseaseDiagnosis()`
- Helps identify:
  - Crop diseases
  - Pest problems
  - Treatment recommendations

### 4. **AI Product Recommendations** (For Users)
- Function: `getAIProductRecommendations()`
- Suggests products based on:
  - Purchase history
  - Season
  - Nutritional balance

### 5. **AI Farming Tips**
- Function: `getAIFarmingTips()`
- Provides tips for:
  - Specific crops
  - Growth stages
  - Best practices

### 6. **AI Chat Assistant**
- Function: `getAIChatResponse()`
- Answers farmer questions
- Provides agricultural guidance

### 7. **AI Price Prediction**
- Function: `getAIPricePrediction()`
- Predicts crop prices
- Market insights

## 📍 Where AI is Integrated

### Currently Integrated:
1. **Weather Screen** (`FarmerWeatherScreen.js`)
   - AI-powered crop advisory button
   - Shows personalized recommendations

### Ready to Integrate:
- **Home Screen**: AI crop recommendations
- **Products Screen**: AI farming tips
- **Discussion Screen**: AI chat assistant
- **User Shop**: AI product recommendations

## 💻 Usage Examples

### Example 1: Get AI Crop Advisory

```javascript
import { getAICropAdvisory } from '../../services/geminiService';

const advisory = await getAICropAdvisory(
    weatherData,      // Current weather object
    userProducts,     // Array of user's products
    locationName      // Location string
);

if (advisory) {
    console.log(advisory); // AI-generated advice
}
```

### Example 2: Get Crop Recommendations

```javascript
import { getAICropRecommendations } from '../../services/geminiService';

const recommendations = await getAICropRecommendations(
    'Kathmandu',  // Location
    6,            // Month (1-12)
    'loamy'       // Soil type
);
```

### Example 3: Pest/Disease Diagnosis

```javascript
import { getAIPestDiseaseDiagnosis } from '../../services/geminiService';

const diagnosis = await getAIPestDiseaseDiagnosis(
    'Rice',                    // Crop name
    'Yellow leaves, wilting',  // Symptoms
    'Leaves turning yellow'    // Image description (optional)
);
```

## 🔒 Security Best Practices

1. **Never commit API keys to Git**
   - Add `src/config/apiKeys.js` to `.gitignore` if it contains real keys
   - Use environment variables for production

2. **Use Environment Variables** (Recommended for Production)
   ```javascript
   // In .env file
   GEMINI_API_KEY=your_key_here
   
   // In apiKeys.js
   const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
   ```

3. **Rate Limiting**
   - Gemini API has rate limits
   - Consider caching responses
   - Add loading states

## 🐛 Troubleshooting

### Error: "API key not configured"
- Make sure you've added your API key in `src/config/apiKeys.js`
- Check that the key is correct (starts with `AIzaSy`)

### Error: "API key invalid"
- Verify your API key is correct
- Check if the API key is enabled in Google AI Studio
- Ensure you haven't exceeded quota limits

### Error: "Network request failed"
- Check your internet connection
- Verify API key permissions
- Check if Gemini API is accessible in your region

## 📊 API Limits

- Free tier: 60 requests per minute
- Paid tier: Higher limits available
- Check [Google AI Studio](https://makersuite.google.com/) for current limits

## 🎨 Customization

You can customize the AI prompts in `src/services/geminiService.js`:

1. Modify prompt text for different responses
2. Adjust response length
3. Change language (currently English, can add Nepali)
4. Add more context to prompts

## 📝 Notes

- All AI functions return `null` if API key is not configured
- Functions include error handling
- Responses are in English (can be modified for Nepali)
- AI responses are generated in real-time (not cached)

## 🔮 Future Enhancements

1. **Caching**: Cache AI responses to reduce API calls
2. **Multi-language**: Support Nepali language responses
3. **Voice Input**: Add voice-to-text for chat
4. **Image Analysis**: Use Gemini Vision for pest/disease identification
5. **Offline Mode**: Cache common responses for offline use

## 📞 Support

For issues or questions:
- Check [Gemini API Documentation](https://ai.google.dev/docs)
- Review error messages in console
- Verify API key configuration

---

**Last Updated**: [Current Date]
**Version**: 1.0.0


