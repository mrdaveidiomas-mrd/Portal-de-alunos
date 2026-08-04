// ATENÇÃO: arquivo gerado automaticamente a partir do schema do Supabase.
// Não editar à mão. Regerar após cada migration com o conector Supabase
// (generate_typescript_types) ou `supabase gen types typescript`.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          set_code: string | null
          tier: number | null
          title: string
          xp_reward: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          set_code?: string | null
          tier?: number | null
          title: string
          xp_reward?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          set_code?: string | null
          tier?: number | null
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      blocks: {
        Row: {
          course_id: string
          created_at: string
          data: Json
          id: string
          lesson_id: string
          part_id: string
          position: number
          type: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          data?: Json
          id?: string
          lesson_id: string
          part_id: string
          position?: number
          type: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          data?: Json
          id?: string
          lesson_id?: string
          part_id?: string
          position?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          language: Database["public"]["Enums"]["course_language"]
          level: Database["public"]["Enums"]["cefr_level"]
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          language: Database["public"]["Enums"]["course_language"]
          level: Database["public"]["Enums"]["cefr_level"]
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          language?: Database["public"]["Enums"]["course_language"]
          level?: Database["public"]["Enums"]["cefr_level"]
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          course_id: string
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_attempts: {
        Row: {
          attempts: number
          block_id: string
          course_id: string
          created_at: string
          id: string
          part_id: string
          solved: boolean
          solved_first_try: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          block_id: string
          course_id: string
          created_at?: string
          id?: string
          part_id: string
          solved?: boolean
          solved_first_try?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          block_id?: string
          course_id?: string
          created_at?: string
          id?: string
          part_id?: string
          solved?: boolean
          solved_first_try?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_attempts_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_attempts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_attempts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_solutions: {
        Row: {
          block_id: string
          course_id: string
          created_at: string
          solution: Json
          updated_at: string
        }
        Insert: {
          block_id: string
          course_id: string
          created_at?: string
          solution: Json
          updated_at?: string
        }
        Update: {
          block_id?: string
          course_id?: string
          created_at?: string
          solution?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_solutions_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: true
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_solutions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          module_id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          module_id: string
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          module_id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      part_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          part_id: string
          score: number | null
          stars: number
          status: Database["public"]["Enums"]["progress_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          part_id: string
          score?: number | null
          stars?: number
          status?: Database["public"]["Enums"]["progress_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          part_id?: string
          score?: number | null
          stars?: number
          status?: Database["public"]["Enums"]["progress_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_progress_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["part_kind"]
          lesson_id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["part_kind"]
          lesson_id: string
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["part_kind"]
          lesson_id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      review_marks: {
        Row: {
          course_id: string
          created_at: string
          id: string
          note: string | null
          part_id: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          note?: string | null
          part_id: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          note?: string | null
          part_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_marks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_marks_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_marks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      speaking_attempts: {
        Row: {
          attempts: number
          best_state: string
          block_id: string
          course_id: string
          created_at: string
          id: string
          part_id: string
          phrase_index: number
          updated_at: string
          user_id: string
          via_text: boolean
          xp_awarded: number
        }
        Insert: {
          attempts?: number
          best_state?: string
          block_id: string
          course_id: string
          created_at?: string
          id?: string
          part_id: string
          phrase_index: number
          updated_at?: string
          user_id: string
          via_text?: boolean
          xp_awarded?: number
        }
        Update: {
          attempts?: number
          best_state?: string
          block_id?: string
          course_id?: string
          created_at?: string
          id?: string
          part_id?: string
          phrase_index?: number
          updated_at?: string
          user_id?: string
          via_text?: boolean
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "speaking_attempts_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speaking_attempts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speaking_attempts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speaking_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      srs_items: {
        Row: {
          course_id: string
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          last_quality: number | null
          last_reviewed_at: string | null
          next_review_at: string
          payload: Json
          repetitions: number
          source_id: string
          source_key: string
          source_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_quality?: number | null
          last_reviewed_at?: string | null
          next_review_at?: string
          payload: Json
          repetitions?: number
          source_id: string
          source_key?: string
          source_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_quality?: number | null
          last_reviewed_at?: string | null
          next_review_at?: string
          payload?: Json
          repetitions?: number
          source_id?: string
          source_key?: string
          source_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "srs_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "srs_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_live_sessions: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          meet_url: string
          start_time: string
          student_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          meet_url: string
          start_time: string
          student_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          meet_url?: string
          start_time?: string
          student_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_live_sessions_link_fk"
            columns: ["teacher_id", "student_id"]
            isOneToOne: false
            referencedRelation: "teacher_students"
            referencedColumns: ["teacher_id", "student_id"]
          },
          {
            foreignKeyName: "student_live_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_live_sessions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_students: {
        Row: {
          created_at: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          claimed_at: string | null
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          claimed_at?: string | null
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          claimed_at?: string | null
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          created_at: string
          current_streak: number
          last_activity_date: string | null
          longest_streak: number
          total_srs_reviews: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          total_srs_reviews?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          total_srs_reviews?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_gamification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          tts_rate: number | null
          tts_voice_en: string | null
          tts_voice_es: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          tts_rate?: number | null
          tts_voice_en?: string | null
          tts_voice_es?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          tts_rate?: number | null
          tts_voice_en?: string | null
          tts_voice_es?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          part_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          part_id?: string | null
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          part_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cefr_level: "a1" | "a2" | "b1" | "b2" | "c1" | "c2"
      course_language: "en" | "es"
      part_kind: "regular" | "golden"
      progress_status: "in_progress" | "completed"
      user_role: "student" | "teacher" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cefr_level: ["a1", "a2", "b1", "b2", "c1", "c2"],
      course_language: ["en", "es"],
      part_kind: ["regular", "golden"],
      progress_status: ["in_progress", "completed"],
      user_role: ["student", "teacher", "admin"],
    },
  },
} as const
