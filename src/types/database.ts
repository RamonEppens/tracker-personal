/**
 * Tipos TypeScript generados del schema de Supabase.
 * Cuando agregues o modifiques tablas en Supabase, podés regenerar esto con:
 *   npx supabase gen types typescript --project-id <tu-project-id> > src/types/database.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      exercises: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_custom: boolean;
          muscle_group: string;
          name: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_custom?: boolean;
          muscle_group: string;
          name: string;
          user_id?: string | null;
        };
        Update: {
          description?: string | null;
          is_custom?: boolean;
          muscle_group?: string;
          name?: string;
        };
      };
      workout_sessions: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          notes: string | null;
          user_id: string;
          duration_minutes: number | null;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          notes?: string | null;
          user_id: string;
          duration_minutes?: number | null;
        };
        Update: {
          date?: string;
          notes?: string | null;
          duration_minutes?: number | null;
        };
      };
      workout_sets: {
        Row: {
          exercise_id: string;
          id: string;
          reps: number;
          session_id: string;
          set_number: number;
          weight_kg: number;
          notes: string | null;
        };
        Insert: {
          exercise_id: string;
          id?: string;
          reps: number;
          session_id: string;
          set_number: number;
          weight_kg: number;
          notes?: string | null;
        };
        Update: {
          reps?: number;
          set_number?: number;
          weight_kg?: number;
          notes?: string | null;
        };
      };
      personal_records: {
        Row: {
          achieved_at: string;
          exercise_id: string;
          id: string;
          reps: number;
          user_id: string;
          weight_kg: number;
        };
        Insert: {
          achieved_at?: string;
          exercise_id: string;
          id?: string;
          reps: number;
          user_id: string;
          weight_kg: number;
        };
        Update: {
          reps?: number;
          weight_kg?: number;
        };
      };
      tasks: {
        Row: {
          created_at: string;
          description: string | null;
          done: boolean;
          due_date: string | null;
          google_event_id: string | null;
          id: string;
          module: "work" | "faculty";
          priority: "low" | "medium" | "high";
          subject_id: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          done?: boolean;
          due_date?: string | null;
          google_event_id?: string | null;
          id?: string;
          module: "work" | "faculty";
          priority?: "low" | "medium" | "high";
          subject_id?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          description?: string | null;
          done?: boolean;
          due_date?: string | null;
          priority?: "low" | "medium" | "high";
          subject_id?: string | null;
          title?: string;
        };
      };
      subjects: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          semester: string;
          schedule_slots: Json;
          status: "active" | "passed" | "failed" | "pending";
          user_id: string;
          color: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          semester: string;
          schedule_slots?: Json;
          status?: "active" | "passed" | "failed" | "pending";
          user_id: string;
          color?: string | null;
        };
        Update: {
          name?: string;
          semester?: string;
          schedule_slots?: Json;
          status?: "active" | "passed" | "failed" | "pending";
          color?: string | null;
        };
      };
      achievements: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          module: "work" | "faculty" | "gym";
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          module: "work" | "faculty" | "gym";
          title: string;
          user_id: string;
        };
        Update: {
          description?: string | null;
          title?: string;
        };
      };
    };
  };
};

// Tipos de conveniencia
export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
export type WorkoutSession = Database["public"]["Tables"]["workout_sessions"]["Row"];
export type WorkoutSet = Database["public"]["Tables"]["workout_sets"]["Row"];
export type PersonalRecord = Database["public"]["Tables"]["personal_records"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Subject = Database["public"]["Tables"]["subjects"]["Row"];
export type Achievement = Database["public"]["Tables"]["achievements"]["Row"];

export type TaskModule = "work" | "faculty";
export type TaskPriority = "low" | "medium" | "high";
export type SubjectStatus = "active" | "passed" | "failed" | "pending";
