-- All users in the app
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user',  -- app-level: 'user', 'superadmin' (could also related to business plan- 'free_user', etc)
  created_at TIMESTAMP DEFAULT NOW()
);

-- The companies (a company / brand / website / domain)
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,  -- "OpenAI", "Acme Corp"
  domain VARCHAR(255) NOT NULL,
  include_urls TEXT[] DEFAULT '{}',
  exclude_patterns TEXT[] DEFAULT '{}',
  default_crawl_interval_hours INTEGER DEFAULT 24, -- Crawl scheduling
  rate_limit_ms INTEGER DEFAULT 1000,
  max_staleness_hours INTEGER DEFAULT 168,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- Other ideas for companies:
-- high_priority_interval_hours INTEGER DEFAULT 6,   -- for homepage, key pages
-- low_priority_interval_hours INTEGER DEFAULT 168,  -- for rarely changing pages (7 days)
-- -- Profile status
-- status VARCHAR(20) DEFAULT 'active',  -- 'active', 'paused', 'archived'
-- last_crawl_started_at TIMESTAMP,
-- last_crawl_completed_at TIMESTAMP,
-- initial_discovery_completed BOOLEAN DEFAULT false,  -- have we parsed sitemap/robots yet?
-- -- Stats (denormalized for quick access)
-- total_urls_discovered INTEGER DEFAULT 0,
-- total_urls_crawled INTEGER DEFAULT 0,

CREATE TABLE company_urls (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  discovered_from VARCHAR(50), -- 'sitemap', 'robots', 'page_link', 'manual_include'
  depth INTEGER DEFAULT 0,  -- distance from homepage
  priority_score INTEGER DEFAULT 50,  -- 0-100, higher = more important
  manual_priority INTEGER,  -- admin override
  last_crawled_at TIMESTAMP,
  last_modified_at TIMESTAMP,  -- when content actually changed
  change_frequency VARCHAR(20) DEFAULT 'unknown',  -- 'hourly', 'daily', 'weekly', 'monthly', 'rarely'
  consecutive_unchanged_crawls INTEGER DEFAULT 0,  -- how many times it hasn't changed
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'crawled', 'stale', 'excluded'
  next_crawl_at TIMESTAMP,  -- when to crawl next
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, url)  -- one URL per profile
);

-- CREATE INDEX idx_company_urls_next_crawl ON company_urls(company_id, next_crawl_at);
-- CREATE INDEX idx_company_urls_status ON company_urls(company_id, status);

CREATE TABLE crawl_configs (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  -- Rate limiting & throttling
  rate_limit_ms INTEGER DEFAULT 1000,  -- delay between requests
  aggression_level VARCHAR(20) DEFAULT 'moderate',  -- 'conservative', 'moderate', 'aggressive'
  max_concurrent_requests INTEGER DEFAULT 1,  -- parallel requests per domain
  -- Budget controls
  max_pages_per_day INTEGER DEFAULT 1000,  -- daily crawl limit
  max_pages_per_month INTEGER,  -- optional monthly cap
  pages_crawled_today INTEGER DEFAULT 0,
  pages_crawled_this_month INTEGER DEFAULT 0,
  daily_budget_reset_at TIMESTAMP DEFAULT NOW(),
  monthly_budget_reset_at TIMESTAMP DEFAULT NOW(),
  -- Scheduling intervals (moved from companies)
  default_crawl_interval_hours INTEGER DEFAULT 24,
  high_priority_interval_hours INTEGER DEFAULT 6,
  low_priority_interval_hours INTEGER DEFAULT 168,
  -- Crawl behavior
  respect_robots_txt BOOLEAN DEFAULT true,
  follow_external_links BOOLEAN DEFAULT false,  -- stay within domain
  max_depth INTEGER DEFAULT 10,  -- how deep to follow links
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(company_id)  -- one config per profile
);

-- Junction: which users can access which profiles
CREATE TABLE company_users (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- profile-level: 'owner', 'admin', 'member'
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, user_id)  -- prevent duplicate access grants
);

-- Stores every crawl of every page (history preserved)
CREATE TABLE crawled_pages (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status_code INTEGER,
  content TEXT,  -- HTML content
  headers JSONB,  -- response headers as JSON
  load_time_ms INTEGER,
  crawled_at TIMESTAMP DEFAULT NOW(),
  discovered_from_url TEXT,  -- which page linked to this one
  depth INTEGER,  -- distance from base URLs
  page_type VARCHAR(50) DEFAULT 'html'  -- 'html', 'robots', 'sitemap', 'unknown'
);

-- Index for fast "latest crawl" queries
CREATE INDEX idx_crawled_pages_latest ON crawled_pages(company_id, url, crawled_at DESC);
CREATE INDEX idx_crawled_pages_profile_time ON crawled_pages(company_id, crawled_at);
-- first index gives us the latest for a specific page www.mybrand.com/page1 while the 2nd gives us overall last crawls for that brand (any url)
-- we may want to do something in between which is brand --> domain if needed 

-- Simple crawl job tracking
CREATE TABLE crawl_jobs (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'running', 'completed', 'failed'
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  pages_crawled INTEGER DEFAULT 0,
  pages_pending INTEGER DEFAULT 0,
  error_message TEXT
);