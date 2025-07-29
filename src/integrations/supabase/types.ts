export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      billing_subscriptions: {
        Row: {
          created_at: string
          id: string
          plan: Database["public"]["Enums"]["plan_type"]
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan?: Database["public"]["Enums"]["plan_type"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          plan?: Database["public"]["Enums"]["plan_type"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscriptions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      event_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      no_meeting_blocks: {
        Row: {
          created_at: string
          day_of_week: number
          end_minute: number
          id: string
          member_id: string
          start_minute: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_minute: number
          id?: string
          member_id: string
          start_minute: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_minute?: number
          id?: string
          member_id?: string
          start_minute?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "no_meeting_blocks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      rules: {
        Row: {
          cadence: Database["public"]["Enums"]["cadence_type"]
          created_at: string
          duration_minutes: number
          id: string
          min_attendance_ratio: number
          night_cap_per_week: number
          prohibited_days: number[] | null
          required_member_ids: string[] | null
          rotation_enabled: boolean
          team_id: string
          updated_at: string
        }
        Insert: {
          cadence?: Database["public"]["Enums"]["cadence_type"]
          created_at?: string
          duration_minutes?: number
          id?: string
          min_attendance_ratio?: number
          night_cap_per_week?: number
          prohibited_days?: number[] | null
          required_member_ids?: string[] | null
          rotation_enabled?: boolean
          team_id: string
          updated_at?: string
        }
        Update: {
          cadence?: Database["public"]["Enums"]["cadence_type"]
          created_at?: string
          duration_minutes?: number
          id?: string
          min_attendance_ratio?: number
          night_cap_per_week?: number
          prohibited_days?: number[] | null
          required_member_ids?: string[] | null
          rotation_enabled?: boolean
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rules_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      share_links: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          team_id: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          team_id: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          team_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_links_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          attending_member_ids: string[]
          created_at: string
          created_by: string | null
          ends_at_utc: string
          fairness_score: number
          id: string
          overlap_ratio: number
          penalties_json: Json | null
          starts_at_utc: string
          team_id: string
          updated_at: string
          version: number
        }
        Insert: {
          attending_member_ids?: string[]
          created_at?: string
          created_by?: string | null
          ends_at_utc: string
          fairness_score?: number
          id?: string
          overlap_ratio?: number
          penalties_json?: Json | null
          starts_at_utc: string
          team_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          attending_member_ids?: string[]
          created_at?: string
          created_by?: string | null
          ends_at_utc?: string
          fairness_score?: number
          id?: string
          overlap_ratio?: number
          penalties_json?: Json | null
          starts_at_utc?: string
          team_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          display_name: string
          email: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          team_id: string
          timezone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          team_id: string
          timezone?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          team_id?: string
          timezone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          default_timezone: string | null
          id: string
          locale: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_timezone?: string | null
          id?: string
          locale?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_timezone?: string | null
          id?: string
          locale?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          locale: string | null
          name: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          locale?: string | null
          name?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          locale?: string | null
          name?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      working_blocks: {
        Row: {
          created_at: string
          day_of_week: number
          end_minute: number
          id: string
          member_id: string
          start_minute: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_minute: number
          id?: string
          member_id: string
          start_minute: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_minute?: number
          id?: string
          member_id?: string
          start_minute?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_blocks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_can_manage_team: {
        Args: { _user_id: string; _team_id: string }
        Returns: boolean
      }
      user_has_team_access: {
        Args: { _user_id: string; _team_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "member"
      cadence_type: "weekly" | "biweekly"
      plan_type: "free" | "pro" | "team"
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
      app_role: ["owner", "admin", "member"],
      cadence_type: ["weekly", "biweekly"],
      plan_type: ["free", "pro", "team"],
    },
  },
} as const
