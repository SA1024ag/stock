const stockService = require('./services/stockService');

async function findIndices() {
    console.log('Waiting for Master List...');
    let retries = 0;
    while (stockService.instrumentList.length === 0 && retries < 20) {
        await new Promise(r => setTimeout(r, 1000));
        retries++;
    }
    console.log(`List Size: ${stockService.instrumentList.length}`);

    // Check types
    const types = [...new Set(stockService.instrumentList.map(i => i.instrument_type))];
    console.log('Available Types:', types);

    const queries = ['Nifty 50', 'Nifty Bank', 'SENSEX'];

    queries.forEach(q => {
        const match = stockService.instrumentList.find(i =>
            i.name?.toLowerCase() === q.toLowerCase() ||
            i.trading_symbol?.toLowerCase() === q.toLowerCase()
        );
        if (match) {
            console.log(`FOUND ${q}: ${match.name} -> ${match.instrument_key}`);
        } else {
            console.log(`NOT FOUND ${q}`);
            // Fuzzy search?
            const fuzzy = stockService.instrumentList.filter(i => i.name?.includes(q) && i.instrument_type === 'INDEX');
            if (fuzzy.length > 0) {
                console.log(`Fuzzy Matches for ${q}:`, fuzzy.map(f => `${f.name} -> ${f.instrument_key}`));
            }
        }
    });
}

findIndices();
