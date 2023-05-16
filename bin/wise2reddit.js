// Import the necessary libraries
const axios = require('axios');
const snoowrap = require('snoowrap');
require('dotenv').config();

// Define a log function to output messages to the console
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

async function main() {
  // Authenticate with the Readwise API
  const readwiseToken = process.env.READWISE_TOKEN;
  const readwiseUrl = 'https://readwise.io/api/v2/books/';
  const headers = { Authorization: `Token ${readwiseToken}` };
  log('Fetching books from Readwise API...');
  const response = await axios.get(readwiseUrl, { headers });
  const books = response.data.results;
  log(`Found ${books.length} books.`);

  // Filter the list of books to only include the ones that were added on the current day
  const today = new Date().toISOString().slice(0, 10);
  const redditBooks = books.filter(book => book.last_highlight_at && book.last_highlight_at.slice(0, 10) === today);
  log(`Found ${redditBooks.length} books added today.`);

  // Authenticate with the Reddit API
  const r = new snoowrap({
      userAgent: process.env.REDDIT_USER_AGENT,
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
      username: process.env.REDDIT_USERNAME,
      password: process.env.REDDIT_PASSWORD,
  });

  const subredditName = 'thirdbrain';

  // Use the access token to create a new Reddit post for each book you want to share
  for (const book of redditBooks) {
      const title = book.title;
      const url = book.source_url;

      await r.getSubreddit(subredditName).submitLink({ title, url });
      log(`Posted book "${title}" to Reddit.`);
  }
}

main();