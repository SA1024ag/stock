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

      const topHoldings = holdingsBreakdown.slice(0, 3).map(h => `${h.symbol} (${h.allocation.toFixed(1)}%)`).join(', ');

      const prompt = `Analyze this Indian stock portfolio worth ₹${portfolioValue.toFixed(2)} with ${portfolio.length} holdings.

Top Holdings: ${topHoldings}

Provide analysis in this EXACT format:

📊 Diversification:
- [Assess if portfolio is well-diversified or concentrated - 1 sentence]
- [Comment on sector/stock allocation balance - 1 sentence]

⚠️ Risk Assessment:
- [Evaluate overall risk level (Low/Medium/High) with reasoning - 1 sentence]
- [Identify main risk factor - 1 sentence]

💡 Recommendations:
- [Suggest 1 key improvement - 1 sentence]
- [Suggest 1 opportunity or action - 1 sentence]

IMPORTANT: Use ONLY the emoji icons and hyphens shown above. Keep each point to 1-2 sentences. Always use ₹ for currency.`;

      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are a portfolio advisor. Use the EXACT format requested with emoji icons and bullet points. Be concise (1-2 sentences per point). Always use ₹ for Indian Rupees.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 400,
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

      // First, check if the question is finance/stock-related
      const relevanceCheck = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a relevance checker. Determine if a question is related to finance, stocks, investing, economics, business, or trading. Reply ONLY with "YES" or "NO".'
          },
          {
            role: 'user',
            content: `Is this question related to finance, stocks, investing, or business? Question: "${userQuestion || term}"`
          }
        ],
        max_tokens: 10,
        temperature: 0.3
      });

      const isRelevant = relevanceCheck.choices[0].message.content.trim().toUpperCase().includes('YES');

      // If not relevant, return a polite fallback
      if (!isRelevant) {
        return {
          explanation: "I'm your Study Buddy for finance and investing! 📈 I can help you understand stocks, trading, market concepts, and investment strategies. Try asking me about financial terms like 'dividend', 'market cap', or 'portfolio diversification'!",
          term: userQuestion || term,
          timestamp: new Date().toISOString(),
          fallback: true
        };
      }

      // Build the prompt for relevant questions
      let prompt = `Financial Question: "${userQuestion || term}"\n`;
      if (definition) prompt += `Definition: ${definition}\n`;
      if (analogy) prompt += `Analogy: ${analogy}\n`;

      prompt += `\nProvide a clear, concise explanation in this format:
- Start with a 1-sentence simple definition
- Give a relatable real-world example or analogy (1-2 sentences)
- Explain why it matters for investors (1-2 sentences)
- Add one practical tip if relevant

Keep it friendly, brief, and easy to scan. Use short sentences and bullet points where helpful.`;

      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a friendly Financial Study Buddy. Explain concepts clearly and concisely using everyday language. Keep responses short and scannable with bullet points. Be warm and encouraging.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      return {
        explanation: response.choices[0].message.content,
        term: userQuestion || term,
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
      const prompt = `Predict future price range for ${symbol} at ₹${currentPrice}.

Economic: Inflation ${parameters.inflation}%, Interest Rate ${parameters.interestRate}%

Return ONLY JSON:
{
  "predicted_low": <number>,
  "predicted_high": <number>,
  "confidence_score": <number 0-100>,
  "reasoning": "📈 Key Factors:\\n- [Main driver - 1 sentence]\\n- [Economic impact - 1 sentence]\\n\\n✨ Outlook: [Summary - 1 sentence]"
}

Use ₹ for currency. No extra text.`;

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