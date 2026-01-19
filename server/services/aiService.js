const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama3-70b-8192';

class AIService {
  // Analyze a single stock for the Stock Detail page
  async analyzeStock(symbol, stockData, historicalData) {
    try {
      const prompt = `You are a helpful financial advisor explaining stock market information in simple language.
Stock Symbol: ${symbol}
Current Price: $${stockData.price}
Change: ${stockData.change > 0 ? '+' : ''}${stockData.change} (${stockData.changePercent > 0 ? '+' : ''}${stockData.changePercent}%)
Volume: ${stockData.volume.toLocaleString()}
52-Week High: $${stockData.high}
52-Week Low: $${stockData.low}

Please provide:
1. A brief explanation of what this stock's current performance means
2. Key trends or patterns notice
3. Simple factors affecting the price
4. A beginner-friendly assessment of the current state.`;

      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are a friendly financial educator. Use simple language.' },
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
      const prompt = `Stock: ${symbol}, Price: ${currentPrice}. Inflation: ${parameters.inflation}%, Interest: ${parameters.interestRate}%. Predict 6-12 month range. Return ONLY JSON.`;

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
      console.error('Error in prediction:', error.message);
      const volatility = 0.05 + (parameters.inflation / 100);
      return {
        predicted_low: currentPrice * (1 - volatility),
        predicted_high: currentPrice * (1 + volatility),
        confidence_score: 50,
        reasoning: "Estimation based on standard volatility due to service timeout."
      };
    }
  }

  // Fallbacks
  getFallbackAnalysis(symbol, stockData) {
    return `Analysis for ${symbol}: Trading at $${stockData.price}. Ensure Groq API key is configured for detailed insights.`;
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