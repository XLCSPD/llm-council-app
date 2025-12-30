/**
 * Database type definitions for Supabase.
 * These types match the schema in supabase/migrations/001_initial_schema.sql
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      orgs: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      org_members: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member';
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'member';
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'member';
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          description: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          description?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          description?: string | null;
          created_by?: string;
          created_at?: string;
        };
      };
      councils: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          description: string | null;
          config: Json;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          description?: string | null;
          config?: Json;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          description?: string | null;
          config?: Json;
          created_by?: string;
          created_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          created_by?: string;
          created_at?: string;
        };
      };
      prompts: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          content: string;
          objective: string | null;
          constraints: Json;
          audience: string | null;
          context: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          content: string;
          objective?: string | null;
          constraints?: Json;
          audience?: string | null;
          context?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          content?: string;
          objective?: string | null;
          constraints?: Json;
          audience?: string | null;
          context?: string | null;
          created_at?: string;
        };
      };
      runs: {
        Row: {
          id: string;
          session_id: string;
          prompt_id: string;
          council_config: Json;
          status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
          current_phase: number;
          phase_status: Json;
          started_at: string | null;
          ended_at: string | null;
          error: Json | null;
          cost_usd: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          prompt_id: string;
          council_config: Json;
          status?: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
          current_phase?: number;
          phase_status?: Json;
          started_at?: string | null;
          ended_at?: string | null;
          error?: Json | null;
          cost_usd?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          prompt_id?: string;
          council_config?: Json;
          status?: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
          current_phase?: number;
          phase_status?: Json;
          started_at?: string | null;
          ended_at?: string | null;
          error?: Json | null;
          cost_usd?: number | null;
          created_at?: string;
        };
      };
      run_models: {
        Row: {
          id: string;
          run_id: string;
          model_key: string;
          display_name: string;
          role: 'thinker' | 'critic' | 'devils_advocate' | 'chair';
          weight: number;
          status: 'pending' | 'running' | 'succeeded' | 'failed';
          latency_ms: number | null;
          cost_usd: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          model_key: string;
          display_name: string;
          role: 'thinker' | 'critic' | 'devils_advocate' | 'chair';
          weight?: number;
          status?: 'pending' | 'running' | 'succeeded' | 'failed';
          latency_ms?: number | null;
          cost_usd?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          model_key?: string;
          display_name?: string;
          role?: 'thinker' | 'critic' | 'devils_advocate' | 'chair';
          weight?: number;
          status?: 'pending' | 'running' | 'succeeded' | 'failed';
          latency_ms?: number | null;
          cost_usd?: number | null;
          created_at?: string;
        };
      };
      model_outputs: {
        Row: {
          id: string;
          run_model_id: string;
          phase: number;
          content: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_model_id: string;
          phase: number;
          content: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_model_id?: string;
          phase?: number;
          content?: string;
          metadata?: Json;
          created_at?: string;
        };
      };
      peer_reviews: {
        Row: {
          id: string;
          run_id: string;
          reviewer_run_model_id: string;
          reviewed_run_model_id: string;
          score: number;
          rationale: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          reviewer_run_model_id: string;
          reviewed_run_model_id: string;
          score: number;
          rationale?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          reviewer_run_model_id?: string;
          reviewed_run_model_id?: string;
          score?: number;
          rationale?: string | null;
          created_at?: string;
        };
      };
      artifacts: {
        Row: {
          id: string;
          run_id: string;
          type: 'md' | 'pdf' | 'json';
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          type: 'md' | 'pdf' | 'json';
          storage_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          type?: 'md' | 'pdf' | 'json';
          storage_path?: string;
          created_at?: string;
        };
      };
    };
  };
}

// Convenience type aliases
export type Org = Database['public']['Tables']['orgs']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Council = Database['public']['Tables']['councils']['Row'];
export type Session = Database['public']['Tables']['sessions']['Row'];
export type Prompt = Database['public']['Tables']['prompts']['Row'];
export type Run = Database['public']['Tables']['runs']['Row'];
export type RunModel = Database['public']['Tables']['run_models']['Row'];
export type ModelOutput = Database['public']['Tables']['model_outputs']['Row'];
export type PeerReview = Database['public']['Tables']['peer_reviews']['Row'];
