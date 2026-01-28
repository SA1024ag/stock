const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama3-70b-8192';

class AIService {
  // Analyze a single stock for the Stock Detail page
  async analyzeStock(symbol, stockData, historicalData) {
    try {
      const prompt = `You are a helpful financial advisor for Indian investors. Provide a clear, informative analysis.

Stock Symbol: ${symbol}
Current Price: ₹${stockData.price}
Change: ${stockData.change > 0 ? '+' : ''}₹${stockData.change} (${stockData.changePercent > 0 ? '+' : ''}${stockData.changePercent}%)
Volume: ${stockData.volume.toLocaleString()}
52-Week High: ₹${stockData.high}
52-Week Low: ₹${stockData.low}

Provide analysis using this format:

Performance:
- [Explain current price trend and what it indicates - 1-2 sentences]
- [Analyze trading volume and activity - 1-2 sentences]

Key Insights:
- [Main factor affecting the stock with brief reasoning - 1-2 sentences]
- [Notable trend or pattern with implications - 1-2 sentences]
- [Key risk or opportunity to be aware of - 1-2 sentences]

Assessment:
- [Overall evaluation for beginner investors - 1-2 sentences]

IMPORTANT: Use ONLY hyphens (-) for bullets. NO asterisks. Keep each point concise (1-2 sentences max). Always use ₹ for currency.`;

      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful Indian stock market analyst. Provide clear, informative analysis using bullet points with hyphens only. NO asterisks. Keep each point concise (1-2 sentences). Always use ₹ for currency.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error in AI stock analysis:', error.message);
      return this.getFallbackAnalysis(symbol, stockData);
    }
  }

  // Analyze portfolio risk and diversification
  async analyzePortfolio(portfolio, stockPrices) {
    try {
      const portfolioValue = portfolio.reduce((total, holding) => {
        const currentPrice = stockPrices[holding.symbol] || holding.averagePrice;
        return total + (holding.shares * currentPrice);
      }, 0);

      const holdingsBreakdown = portfolio.map(holding => {
        const currentPrice = stockPrices[holding.symbol] || holding.averagePrice;
        const currentValue = holding.shares * currentPrice;
        const gainLoss = currentValue - holding.totalInvested;
        return {
          symbol: holding.symbol,
          shares: holding.shares,
          invested: holding.totalInvested,
          currentValue: currentValue,
          gainLoss: gainLoss,
          gainLossPercent: ((gainLoss / holding.totalInvested) * 100),
          allocation: (currentValue / portfolioValue) * 100
        };
      });

      const prompt = `Review this portfolio: ${JSON.stringify(holdingsBreakdown)}. Total Value: $${portfolioValue.toFixed(2)}. 
      Assess diversification, risk level, and provide simple improvement suggestions.`;

      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are a friendly portfolio advisor.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 600,
        temperature: 0.7
      });

      return {
        analysis: response.choices[0].message.content,
        portfolioValue,
        holdingsBreakdown
      };
    } catch (error) {
      console.error('Error in portfolio analysis:', error.message);
      return this.getFallbackPortfolioAnalysis(portfolio, stockPrices);
    }
  }

  // AI Tutor for Learning Hub - Explains terms using analogies
  async askTutor(term, context = {}) {
    try {
      const { definition, analogy, userQuestion } = context;
      let prompt = `Financial Term: "${term}"\n`;
      if (definition) prompt += `Definition: ${definition}\n`;
      if (analogy) prompt += `Analogy: ${analogy}\n`;
      if (userQuestion) prompt += `Question: ${userQuestion}\n`;

      prompt += `\nExplain this concept warmly using everyday language, relatable stories, and why it matters for investing.`;

      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a patient Financial Mentor. Use analogies like comparing a Stock Exchange to a Farmer\'s Market. Be positive and clear.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 400,
        temperature: 0.8
      });

      return {
        explanation: response.choices[0].message.content,
        term,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in AI tutor:', error.message);
      return { explanation: `I can't reach the mentor right now, but ${term} is a key concept!`, term, error: true };
    }
  }

  // Simulate market scenario for "What-If" feature
  async simulateScenario(portfolio, stockPrices, scenarioText) {
    try {
      const portfolioData = portfolio.map(holding => ({
        symbol: holding.symbol,
        quantity: holding.shares,
        current_price: stockPrices[holding.symbol] || holding.averagePrice,
        total_value: holding.shares * (stockPrices[holding.symbol] || holding.averagePrice)
      }));

      const prompt = `Interpret this scenario: "${scenarioText}". Estimate how these stocks react: ${JSON.stringify(portfolioData)}. Return ONLY valid JSON.`;

      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are a financial simulator AI. Return only JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5
      });

      const jsonMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error in scenario simulation:', error.message);
      throw error;
    }
  }

  // Predict stock price based on macro parameters
  async predictStockPrice(symbol, currentPrice, parameters) {
    try {
      const prompt = `Analyze stock ${symbol} with current price ₹${currentPrice}.
Economic parameters: Inflation Rate: ${parameters.inflation}%, Interest Rate: ${parameters.interestRate}%.

Based on these economic indicators, predict the stock price range for the next 6-12 months.

You MUST return ONLY a valid JSON object with this exact structure:
{
  "predicted_low": <number>,
  "predicted_high": <number>,
  "confidence_score": <number 0-100>,
  "reasoning": "<brief explanation>"
}

Do not include any other text, just the JSON object.`;

      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are a financial prediction AI. You MUST return ONLY valid JSON with predicted_low,predicted_high, confidence_score, and reasoning fields. No other text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 300
      });

      const content = response.choices[0].message.content.trim();
      console.log('AI Prediction Response:', content);

      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const prediction = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!prediction.predicted_low || !prediction.predicted_high) {
        throw new Error('Missing required fields in prediction');
      }

      return prediction;
    } catch (error) {
      console.error('Error in prediction:', error.message);
      // Fallback prediction based on volatility
      const volatility = 0.05 + (parameters.inflation / 200) + (parameters.interestRate / 300);
      const predicted_low = currentPrice * (1 - volatility);
      const predicted_high = currentPrice * (1 + volatility);

      return {
        predicted_low,
        predicted_high,
        confidence_score: 50,
        reasoning: `Estimation based on economic parameters. Higher inflation (${parameters.inflation}%) and interest rates (${parameters.interestRate}%) typically increase market volatility.`
      };
    }
  }

  // Fallbacks
  getFallbackAnalysis(symbol, stockData) {
    return `Analysis for ${symbol}: Trading at ₹${stockData.price}. Ensure Groq API key is configured for detailed insights.`;
  }

  getFallbackPortfolioAnalysis(portfolio, stockPrices) {
    const totalValue = portfolio.reduce((t, h) => t + (h.shares * (stockPrices[h.symbol] || h.averagePrice)), 0);
    return {
      analysis: `Your portfolio contains ${portfolio.length} holdings with a total value of $${totalValue.toFixed(2)}.`,
      portfolioValue: totalValue,
      holdingsBreakdown: []
    };
  }
}

module.exports = new AIService();