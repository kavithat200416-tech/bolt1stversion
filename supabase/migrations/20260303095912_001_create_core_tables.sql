/*
  # Create Soundlog Core Tables
  
  1. Core Tables
    - users: User profiles with preferences
    - songs: Music library from Spotify/Last.fm
    - artists: Artist profiles
    - logs: User song listening logs
    - reviews: Written reviews with sentiment
    - interactions: Engagement tracking
    - follows: Social connections
    - trending_cache: Cached trending songs
    - recommendation_cache: Cached recommendations
  
  2. Security
    - Enable RLS on all tables
    - Public unauthenticated access for songs/artists/trending
    - Authenticated access for logs/reviews/follows
    - User-owned data restrictions
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  bio text DEFAULT '',
  avatar_url text,
  banner_url text,
  preferred_languages text[] DEFAULT '{}',
  favorite_artists text[] DEFAULT '{}',
  preferred_eras text[] DEFAULT '{}',
  favorite_music_directors text[] DEFAULT '{}',
  onboarding_complete boolean DEFAULT false,
  is_virtual boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Songs table
CREATE TABLE IF NOT EXISTS songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist_name text NOT NULL,
  artist_id text,
  album text,
  language text,
  genre text,
  year integer,
  spotify_id text UNIQUE,
  spotify_url text,
  cover_image text,
  preview_url text,
  audio_features jsonb,
  average_rating decimal(3,2) DEFAULT 0,
  total_logs integer DEFAULT 0,
  lastfm_playcount integer,
  created_at timestamptz DEFAULT now()
);

-- Artists table
CREATE TABLE IF NOT EXISTS artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  language text,
  genre text,
  spotify_id text UNIQUE,
  spotify_url text,
  cover_image text,
  bio text,
  followers integer,
  average_rating decimal(3,2) DEFAULT 0,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  rating decimal(2,1) NOT NULL,
  listened_before boolean DEFAULT false,
  listened_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  text text NOT NULL,
  sentiment_score decimal(3,2) DEFAULT 0.5,
  sentiment_tag text DEFAULT 'neutral',
  toxicity_score decimal(3,2) DEFAULT 0,
  likes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Interactions table
CREATE TABLE IF NOT EXISTS interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  type text NOT NULL,
  rating decimal(2,1),
  sentiment_score decimal(3,2),
  toxicity_score decimal(3,2),
  created_at timestamptz DEFAULT now()
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Trending cache table
CREATE TABLE IF NOT EXISTS trending_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL,
  songs jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(language)
);

-- Recommendation cache table
CREATE TABLE IF NOT EXISTS recommendation_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  songs jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_cache ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read public profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Songs policies (public read)
CREATE POLICY "Anyone can read songs"
  ON songs FOR SELECT
  TO authenticated, anon
  USING (true);

-- Artists policies (public read)
CREATE POLICY "Anyone can read artists"
  ON artists FOR SELECT
  TO authenticated, anon
  USING (true);

-- Logs policies
CREATE POLICY "Users can read own logs"
  ON logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read all logs"
  ON logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own logs"
  ON logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create own reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Interactions policies
CREATE POLICY "Users can read interactions"
  ON interactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own interactions"
  ON interactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Users can read follows"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create follows"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

-- Trending cache policies (public read)
CREATE POLICY "Anyone can read trending"
  ON trending_cache FOR SELECT
  TO authenticated, anon
  USING (true);

-- Recommendation cache policies
CREATE POLICY "Users can read own recommendations"
  ON recommendation_cache FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_song_id ON logs(song_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_song_id ON reviews(song_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_songs_language ON songs(language);
CREATE INDEX idx_songs_year ON songs(year);
CREATE INDEX idx_interactions_user_id ON interactions(user_id);
