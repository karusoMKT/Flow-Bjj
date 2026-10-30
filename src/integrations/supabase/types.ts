export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_memories: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          kind: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          last_message_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_message_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_message_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_locations: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_locations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_interests: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_interests_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          status: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          status?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          google_place_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          state: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          google_place_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          state?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          google_place_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          state?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean
          post_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          post_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          post_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string | null
          created_at: string
          event_date: string | null
          event_location: string | null
          event_title: string | null
          id: string
          image_url: string | null
          likes_count: number
          link: string | null
          location: string | null
          post_type: string
          updated_at: string
          user_id: string
          workout_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          event_date?: string | null
          event_location?: string | null
          event_title?: string | null
          id?: string
          image_url?: string | null
          likes_count?: number
          link?: string | null
          location?: string | null
          post_type?: string
          updated_at?: string
          user_id: string
          workout_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          event_date?: string | null
          event_location?: string | null
          event_title?: string | null
          id?: string
          image_url?: string | null
          likes_count?: number
          link?: string | null
          location?: string | null
          post_type?: string
          updated_at?: string
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_queries_used: number
          avatar_url: string | null
          belt: string | null
          city: string | null
          created_at: string
          full_name: string | null
          home_academy: string | null
          id: string
          is_competitor: boolean
          is_pro: boolean
          is_recovering: boolean | null
          is_weekly_champion: boolean
          level: number
          professor: string | null
          push_token: string | null
          stripes: number
          team: string | null
          total_xp: number
          username: string
          weight: string | null
          xp: number
        }
        Insert: {
          ai_queries_used?: number
          avatar_url?: string | null
          belt?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          home_academy?: string | null
          id: string
          is_competitor?: boolean
          is_pro?: boolean
          is_recovering?: boolean | null
          is_weekly_champion?: boolean
          level?: number
          professor?: string | null
          push_token?: string | null
          stripes?: number
          team?: string | null
          total_xp?: number
          username: string
          weight?: string | null
          xp?: number
        }
        Update: {
          ai_queries_used?: number
          avatar_url?: string | null
          belt?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          home_academy?: string | null
          id?: string
          is_competitor?: boolean
          is_pro?: boolean
          is_recovering?: boolean | null
          is_weekly_champion?: boolean
          level?: number
          professor?: string | null
          push_token?: string | null
          stripes?: number
          team?: string | null
          total_xp?: number
          username?: string
          weight?: string | null
          xp?: number
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          gym_id: string | null
          id: string
          image_url: string | null
          intensity: number | null
          notes: string | null
          session_date: string
          session_type: string | null
          start_time: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes: number
          gym_id?: string | null
          id?: string
          image_url?: string | null
          intensity?: number | null
          notes?: string | null
          session_date: string
          session_type?: string | null
          start_time?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          gym_id?: string | null
          id?: string
          image_url?: string | null
          intensity?: number | null
          notes?: string | null
          session_date?: string
          session_type?: string | null
          start_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          image_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          image_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plan_weeks: {
        Row: {
          activities: Json
          created_at: string
          focus: string | null
          id: string
          plan_id: string
          title: string
          updated_at: string
          user_id: string
          week_number: number
        }
        Insert: {
          activities?: Json
          created_at?: string
          focus?: string | null
          id?: string
          plan_id: string
          title: string
          updated_at?: string
          user_id: string
          week_number: number
        }
        Update: {
          activities?: Json
          created_at?: string
          focus?: string | null
          id?: string
          plan_id?: string
          title?: string
          updated_at?: string
          user_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_plan_weeks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_plan_weeks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          attention_notes: string | null
          created_at: string
          goal: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attention_notes?: string | null
          created_at?: string
          goal: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attention_notes?: string | null
          created_at?: string
          goal?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_reflections: {
        Row: {
          ai_summary: string | null
          created_at: string
          highlight: string | null
          id: string
          main_difficulty: string | null
          next_focus: string | null
          position_worked: string | null
          user_id: string
          workout_id: string | null
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          highlight?: string | null
          id?: string
          main_difficulty?: string | null
          next_focus?: string | null
          position_worked?: string | null
          user_id: string
          workout_id?: string | null
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          highlight?: string | null
          id?: string
          main_difficulty?: string | null
          next_focus?: string | null
          position_worked?: string | null
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_reflections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_reflections_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          created_at: string
          description: string | null
          icon_name: string
          id: string
          title: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_name?: string
          id?: string
          title: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_name?: string
          id?: string
          title?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workouts: {
        Row: {
          created_at: string
          duration_minutes: number
          gym_id: string | null
          id: string
          intensity: string | null
          location: string | null
          notes: string | null
          training_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          gym_id?: string | null
          id?: string
          intensity?: string | null
          location?: string | null
          notes?: string | null
          training_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          gym_id?: string | null
          id?: string
          intensity?: string | null
          location?: string | null
          notes?: string | null
          training_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_user_id_fkey"
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
      are_connected: { Args: { _a: string; _b: string }; Returns: boolean }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
