## Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file in the root directory and add the following (you'll need a firecrawl api key):
   ```
   PORT=3000
   DATABASE_URL=postgresql://localhost:5432/web_scraper_mvp
   FIRECRAWL_API_URL=https://api.firecrawl.dev/v1/scrape
   FIRECRAWL_API_KEY=your_firecrawl_api_key
   ```
4. Create local Postgres database with `createdb web_scraper_mvp` (if this fails, reference Setup Troubleshooting below)
5. Start the server with `npm run dev`

![Web Scraper Homepage](public/images/homepage-example.png)

## Setup Troubleshooting / Extra Details

1. Make sure you have a local instance of postgress running. You can try connecting with `psql postgres`
2. If you don't have postgres installed, you can install it with `brew install postgresql` then make sure it is running
3. If it's not running, you can start it with `brew services start postgresql`
4. Afer creating your local postgres database, you can connect to it with `psql web_scraper_mvp` and you should see it listed when you run `psql -l` in your terminal

## Tech Stack (MVP Focus)

- **Node.js/TypeScript** - Main application
- **PostgreSQL** - Storage
- **Firecrawl API** - External crawling service
- **Express** - REST API endpoints
