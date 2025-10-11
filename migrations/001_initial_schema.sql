-- All users in the app
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user',  -- app-level: 'user', 'superadmin' (could also related to business plan- 'free_user', etc)
  created_at TIMESTAMP DEFAULT NOW()
);

-- The branding profiles
CREATE TABLE branding_profiles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,  -- "OpenAI", "Acme Corp"
  domain VARCHAR(255) NOT NULL,
  include_urls TEXT[] DEFAULT '{}',
  exclude_patterns TEXT[] DEFAULT '{}',
  rate_limit_ms INTEGER DEFAULT 1000,
  max_staleness_hours INTEGER DEFAULT 168,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Junction: which users can access which profiles
CREATE TABLE branding_profile_users (
  id SERIAL PRIMARY KEY,
  branding_profile_id INTEGER REFERENCES branding_profiles(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- profile-level: 'owner', 'admin', 'member'
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(branding_profile_id, user_id)  -- prevent duplicate access grants
);

-- Stores every crawl of every page (history preserved)
-- CREATE TABLE crawled_pages (
--   id SERIAL PRIMARY KEY,
--   branding_profile_id INTEGER REFERENCES branding_profiles(id) ON DELETE CASCADE,
--   url TEXT NOT NULL,
--   status_code INTEGER,
--   content TEXT,  -- HTML content
--   headers JSONB,  -- response headers as JSON
--   load_time_ms INTEGER,
--   crawled_at TIMESTAMP DEFAULT NOW(),
--   discovered_from_url TEXT,  -- which page linked to this one
--   depth INTEGER,  -- distance from base URLs
--   page_type VARCHAR(50) DEFAULT 'html'  -- 'html', 'robots', 'sitemap', 'unknown'
-- );

-- Just track crawled pages for now, for testing
CREATE TABLE crawled_pages_simple (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  status_code INTEGER,
  content TEXT,
  headers JSONB,
  load_time_ms INTEGER,
  crawled_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast "latest crawl" queries
CREATE INDEX idx_crawled_pages_latest ON crawled_pages(branding_profile_id, url, crawled_at DESC);
CREATE INDEX idx_crawled_pages_profile_time ON crawled_pages(branding_profile_id, crawled_at);
-- first index gives us the latest for a specific page www.mybrand.com/page1 while the 2nd gives us overall last crawls for that brand (any url)
-- we may want to do something in between which is brand --> domain if needed 

-- Simple crawl job tracking
CREATE TABLE crawl_jobs (
  id SERIAL PRIMARY KEY,
  branding_profile_id INTEGER REFERENCES branding_profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'running', 'completed', 'failed'
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  pages_crawled INTEGER DEFAULT 0,
  pages_pending INTEGER DEFAULT 0,
  error_message TEXT
);