/*
  # Initial Schema for RAG-Powered Nutritionist Chatbot

  ## Overview
  This migration sets up the complete database schema for an athlete fitness monitoring
  and nutrition advisory system with RAG capabilities.

  ## New Tables

  1. **athletes**
     - `id` (uuid, primary key) - Unique athlete identifier, linked to auth.users
     - `email` (text, unique) - Athlete email address
     - `name` (text) - Athlete full name
     - `age` (integer) - Athlete age
     - `sport_type` (text) - Type of sport/activity
     - `fitness_goal` (text) - Primary fitness objective
     - `dietary_restrictions` (text) - Any dietary limitations or preferences
     - `created_at` (timestamptz) - Account creation timestamp
     - `updated_at` (timestamptz) - Last profile update timestamp

  2. **fitness_metrics**
     - `id` (uuid, primary key) - Unique metric entry identifier
     - `athlete_id` (uuid, foreign key) - Reference to athletes table
     - `date` (date) - Date of measurement
     - `weight` (decimal) - Weight in kg
     - `body_fat_percentage` (decimal) - Body fat percentage
     - `muscle_mass` (decimal) - Muscle mass in kg
     - `workout_performance_score` (integer) - Performance rating (1-10)
     - `recovery_score` (integer) - Recovery rating (1-10)
     - `notes` (text) - Optional notes about metrics
     - `created_at` (timestamptz) - Entry creation timestamp

  3. **nutrition_logs**
     - `id` (uuid, primary key) - Unique nutrition log identifier
     - `athlete_id` (uuid, foreign key) - Reference to athletes table
     - `date` (date) - Date of meal/nutrition
     - `meal_type` (text) - Breakfast, lunch, dinner, snack
     - `calories` (decimal) - Total calories
     - `protein_grams` (decimal) - Protein in grams
     - `carbs_grams` (decimal) - Carbohydrates in grams
     - `fats_grams` (decimal) - Fats in grams
     - `meal_description` (text) - Description of meal
     - `created_at` (timestamptz) - Entry creation timestamp

  4. **chat_messages**
     - `id` (uuid, primary key) - Unique message identifier
     - `athlete_id` (uuid, foreign key) - Reference to athletes table
     - `session_id` (uuid) - Chat session grouping identifier
     - `role` (text) - Message role: 'user' or 'assistant'
     - `content` (text) - Message content
     - `timestamp` (timestamptz) - Message timestamp

  5. **knowledge_base**
     - `id` (uuid, primary key) - Unique document chunk identifier
     - `title` (text) - Document title
     - `content` (text) - Text content of chunk
     - `document_type` (text) - Type: nutrition_guideline, meal_plan, fitness_protocol
     - `embedding` (vector(1536)) - Vector embedding for semantic search
     - `metadata` (jsonb) - Additional metadata (source, page, etc.)
     - `created_at` (timestamptz) - Entry creation timestamp

  ## Security
  - Enable RLS on all tables
  - Athletes can only access their own data
  - Knowledge base is readable by all authenticated users
  - Proper authentication checks on all policies

  ## Extensions
  - Enable pgvector for embeddings storage and similarity search
*/

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create athletes table
CREATE TABLE IF NOT EXISTS athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  age integer,
  sport_type text,
  fitness_goal text,
  dietary_restrictions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create fitness_metrics table
CREATE TABLE IF NOT EXISTS fitness_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  weight decimal(5,2),
  body_fat_percentage decimal(4,2),
  muscle_mass decimal(5,2),
  workout_performance_score integer CHECK (workout_performance_score >= 1 AND workout_performance_score <= 10),
  recovery_score integer CHECK (recovery_score >= 1 AND recovery_score <= 10),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create nutrition_logs table
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  meal_type text DEFAULT 'meal',
  calories decimal(7,2),
  protein_grams decimal(6,2),
  carbs_grams decimal(6,2),
  fats_grams decimal(6,2),
  meal_description text,
  created_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Create knowledge_base table with vector embeddings
CREATE TABLE IF NOT EXISTS knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('nutrition_guideline', 'meal_plan', 'fitness_protocol')),
  embedding vector(1536),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fitness_metrics_athlete_date ON fitness_metrics(athlete_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_athlete_date ON nutrition_logs(athlete_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_athlete_session ON chat_messages(athlete_id, session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable Row Level Security on all tables
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS Policies for athletes table
CREATE POLICY "Athletes can view own profile"
  ON athletes FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Athletes can update own profile"
  ON athletes FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Athletes can insert own profile"
  ON athletes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for fitness_metrics table
CREATE POLICY "Athletes can view own fitness metrics"
  ON fitness_metrics FOR SELECT
  TO authenticated
  USING (athlete_id = auth.uid());

CREATE POLICY "Athletes can insert own fitness metrics"
  ON fitness_metrics FOR INSERT
  TO authenticated
  WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "Athletes can update own fitness metrics"
  ON fitness_metrics FOR UPDATE
  TO authenticated
  USING (athlete_id = auth.uid())
  WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "Athletes can delete own fitness metrics"
  ON fitness_metrics FOR DELETE
  TO authenticated
  USING (athlete_id = auth.uid());

-- RLS Policies for nutrition_logs table
CREATE POLICY "Athletes can view own nutrition logs"
  ON nutrition_logs FOR SELECT
  TO authenticated
  USING (athlete_id = auth.uid());

CREATE POLICY "Athletes can insert own nutrition logs"
  ON nutrition_logs FOR INSERT
  TO authenticated
  WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "Athletes can update own nutrition logs"
  ON nutrition_logs FOR UPDATE
  TO authenticated
  USING (athlete_id = auth.uid())
  WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "Athletes can delete own nutrition logs"
  ON nutrition_logs FOR DELETE
  TO authenticated
  USING (athlete_id = auth.uid());

-- RLS Policies for chat_messages table
CREATE POLICY "Athletes can view own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (athlete_id = auth.uid());

CREATE POLICY "Athletes can insert own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (athlete_id = auth.uid());

-- RLS Policies for knowledge_base table (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view knowledge base"
  ON knowledge_base FOR SELECT
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on athletes table
CREATE TRIGGER update_athletes_updated_at
  BEFORE UPDATE ON athletes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function for semantic search in knowledge base
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  document_type text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_base.id,
    knowledge_base.title,
    knowledge_base.content,
    knowledge_base.document_type,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  FROM knowledge_base
  WHERE 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_base.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;