const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Default to a strong general-purpose Llama model on Groq.
// You can change this via env without code changes.
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama3-70b-8192';

class AIService {
  // Analyze a single stock
  async analyzeStock(symbol, stockData, historicalData) {
    try {
      const prompt = `You are a helpful financial advisor explaining stock market information in simple, beginner-friendly language.

Stock Symbol: ${symbol}
Current Price: $${stockData.price}
Change: ${stockData.change > 0 ? '+' : ''}${stockData.change} (${stockData.changePercent > 0 ? '+' : ''}${stockData.changePercent}%)
Volume: ${stockData.volume.toLocaleString()}
52-Week High: $${stockData.high}
52-Week Low: $${stockData.low}

Please provide:
1. A brief explanation of what this stock's current performance means
2. Key trends or patterns you notice
3. Simple factors that might be affecting the price
4. A beginner-friendly assessment of the stock's current state

Keep the explanation clear, educational, and avoid financial jargon.

If you don't know something, say so clearly. Do not give financial advice; focus on education.`;

      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a friendly financial educator helping beginners understand the stock market. Use simple language and avoid complex financial terms.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error in AI stock analysis:', error.message);
      // Fallback response if AI service is unavailable
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
        const gainLossPercent = ((gainLoss / holding.totalInvested) * 100);
        return {
          symbol: holding.symbol,
          shares: holding.shares,
          invested: holding.totalInvested,
          currentValue: currentValue,
          gainLoss: gainLoss,
          gainLossPercent: gainLossPercent,
          allocation: (currentValue / portfolioValue) * 100
        };
      });

      const prompt = `You are a helpful financial advisor reviewing a virtual stock portfolio for a beginner investor.

Portfolio Holdings:
${holdingsBreakdown.map(h =>
        `- ${h.symbol}: ${h.shares} shares, Invested: $${h.invested.toFixed(2)}, Current Value: $${h.currentValue.toFixed(2)}, ${h.gainLoss >= 0 ? 'Gain' : 'Loss'}: ${h.gainLossPercent.toFixed(2)}%`
      ).join('\n')}

Total Portfolio Value: $${portfolioValue.toFixed(2)}
Number of Holdings: ${portfolio.length}

Please provide:
1. An assessment of portfolio diversification (is it too concentrated in one area?)
2. Overall risk level (low/medium/high) and why
3. Strengths and potential concerns
4. Simple suggestions for improvement (if any)

Keep the explanation educational and beginner-friendly.`;

      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a friendly financial educator helping beginners understand portfolio management. Use simple language and provide constructive, educational feedback.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 600,
        temperature: 0.7
      });

      return {
        analysis: response.choices[0].message.content,
        portfolioValue: portfolioValue,
        holdingsBreakdown: holdingsBreakdown
      };
    } catch (error) {
      console.error('Error in AI portfolio analysis:', error.message);
      return this.getFallbackPortfolioAnalysis(portfolio, stockPrices);
    }
  }

  // Fallback analysis if AI service is unavailable
  getFallbackAnalysis(symbol, stockData) {
    const trend = stockData.changePercent > 0 ? 'positive' : 'negative';
    return `Stock Analysis for ${symbol}:

Current Performance: The stock is currently trading at $${stockData.price}, showing a ${trend} movement of ${Math.abs(stockData.changePercent)}% today.

Key Observations:
- The stock has ${stockData.changePercent > 0 ? 'gained' : 'lost'} value today
- Trading volume is ${stockData.volume > 1000000 ? 'high' : 'moderate'}
- Price range today: $${stockData.low} - $${stockData.high}

Note: This is a simplified analysis. For detailed insights, ensure your Groq API key is configured.`;
  }

  getFallbackPortfolioAnalysis(portfolio, stockPrices) {
    const portfolioValue = portfolio.reduce((total, holding) => {
      const currentPrice = stockPrices[holding.symbol] || holding.averagePrice;
      return total + (holding.shares * currentPrice);
    }, 0);

    return {
      analysis: `Portfolio Overview:

Your portfolio contains ${portfolio.length} different stock${portfolio.length > 1 ? 's' : ''} with a total value of $${portfolioValue.toFixed(2)}.

Diversification: ${portfolio.length < 3 ? 'Consider adding more stocks to diversify your portfolio and reduce risk.' : 'You have a good number of holdings for diversification.'}

Note: For detailed AI-powered analysis, ensure your Groq API key is configured.`,
      portfolioValue: portfolioValue,
      holdingsBreakdown: portfolio.map(holding => {
        const currentPrice = stockPrices[holding.symbol] || holding.averagePrice;
        const currentValue = holding.shares * currentPrice;
        return {
          symbol: holding.symbol,
          shares: holding.shares,
          invested: holding.totalInvested,
          currentValue: currentValue,
          gainLoss: currentValue - holding.totalInvested,
          gainLossPercent: ((currentValue - holding.totalInvested) / holding.totalInvested) * 100,
          allocation: (currentValue / portfolioValue) * 100
        };
      })
    };
  }

  // AI Tutor for Learning Hub - Explains financial terms using simple analogies
  async askTutor(term, context = {}) {
    try {
      const { definition, analogy, userQuestion } = context;

      let prompt = `You are a friendly Financial Mentor helping a complete beginner understand stock market concepts.

Financial Term: "${term}"
`;

      if (definition) {
        prompt += `\nBasic Definition: ${definition}\n`;
      }

      if (analogy) {
        prompt += `\nReal-World Analogy: ${analogy}\n`;
      }

      if (userQuestion) {
        prompt += `\nStudent's Question: ${userQuestion}\n`;
      }

      prompt += `

Please explain this concept in a warm, encouraging way:
1. Use everyday language and avoid jargon
2. Provide a relatable example or story
3. Explain why this concept matters for investing
4. If relevant, give a simple tip or key takeaway

Remember: Your student is brand new to investing. Make them feel confident and excited to learn!`;

      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a patient, encouraging Financial Mentor. Think of yourself as a friendly teacher explaining concepts to a curious student over coffee. Use analogies like comparing the Stock Exchange to a Farmer's Market, or P/E Ratio to comparing house prices. Always be positive, clear, and make complex ideas simple. Never use intimidating financial jargon without explaining it first.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.8 // Slightly higher for more creative analogies
      });

      return {
        explanation: response.choices[0].message.content,
        term,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in AI tutor:', error.message);
      // Fallback response
      return {
        explanation: `I'd love to explain "${term}" to you! Unfortunately, I'm having trouble connecting right now. 

Here's a quick tip: ${term} is an important concept in investing. Try searching for "${term} explained simply" on YouTube, or check out Zerodha Varsity for beginner-friendly explanations.

Feel free to ask me again in a moment!`,
        term,
        timestamp: new Date().toISOString(),
        error: true
      };
    }
  }
}

module.exports = new AIService();
