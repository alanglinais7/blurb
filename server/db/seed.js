import db from './schema.js';
import quotes from './quotes.js';

// Seed quotes into database
const insertQuote = db.prepare('INSERT OR IGNORE INTO quotes (text, source) VALUES (?, ?)');

const seedQuotes = db.transaction(() => {
  for (const quote of quotes) {
    insertQuote.run(quote.text, quote.source);
  }
});

seedQuotes();

console.log(`Seeded ${quotes.length} quotes into database`);
