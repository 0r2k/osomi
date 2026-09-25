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
      experience_edges: {
        Row: {
          prompt: string
          rank: number
          reason: string
          source_id: string
          target_id: string
        }
        Insert: {
          prompt: string
          rank?: number
          reason: string
          source_id: string
          target_id: string
        }
        Update: {
          prompt?: string
          rank?: number
          reason?: string
          source_id?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_edges_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_edges_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_progress: {
        Row: {
          biblical_choice: string
          created_at: string
          id: string
          last_scene_key: string
          revision: number
          status: string
          updated_at: string
          user_id: string
          version_id: string
        }
        Insert: {
          biblical_choice?: string
          created_at?: string
          id?: string
          last_scene_key: string
          revision?: number
          status?: string
          updated_at?: string
          user_id?: string
          version_id: string
        }
        Update: {
          biblical_choice?: string
          created_at?: string
          id?: string
          last_scene_key?: string
          revision?: number
          status?: string
          updated_at?: string
          user_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_progress_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "experience_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_progress_version_id_last_scene_key_fkey"
            columns: ["version_id", "last_scene_key"]
            isOneToOne: false
            referencedRelation: "scene_manifest"
            referencedColumns: ["version_id", "scene_key"]
          },
        ]
      }
      experience_versions: {
        Row: {
          content_hash: string
          content_path: string
          experience_id: string
          id: string
          published_at: string | null
          status: string
          version: number
        }
        Insert: {
          content_hash: string
          content_path: string
          experience_id: string
          id?: string
          published_at?: string | null
          status?: string
          version: number
        }
        Update: {
          content_hash?: string
          content_path?: string
          experience_id?: string
          id?: string
          published_at?: string | null
          status?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "experience_versions_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          id: string
          is_entry: boolean
          published_version_id: string | null
          slug: string
          summary: string | null
          title: string
          visibility: string
        }
        Insert: {
          id?: string
          is_entry?: boolean
          published_version_id?: string | null
          slug: string
          summary?: string | null
          title: string
          visibility?: string
        }
        Update: {
          id?: string
          is_entry?: boolean
          published_version_id?: string | null
          slug?: string
          summary?: string | null
          title?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "published_version_owner"
            columns: ["id", "published_version_id"]
            isOneToOne: false
            referencedRelation: "experience_versions"
            referencedColumns: ["experience_id", "id"]
          },
        ]
      }
      notes: {
        Row: {
          body: string
          created_at: string
          id: string
          revision: number
          scene_key: string | null
          updated_at: string
          user_id: string
          version_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          revision?: number
          scene_key?: string | null
          updated_at?: string
          user_id?: string
          version_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          revision?: number
          scene_key?: string | null
          updated_at?: string
          user_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "experience_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_version_id_scene_key_fkey"
            columns: ["version_id", "scene_key"]
            isOneToOne: false
            referencedRelation: "scene_manifest"
            referencedColumns: ["version_id", "scene_key"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scene_manifest: {
        Row: {
          kind: string
          position: number
          scene_key: string
          version_id: string
        }
        Insert: {
          kind: string
          position: number
          scene_key: string
          version_id: string
        }
        Update: {
          kind?: string
          position?: number
          scene_key?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scene_manifest_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "experience_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_preferences: {
        Row: {
          action_seq: number
          active: boolean
          created_at: string
          experience_id: string
          id: string
          revision: number
          updated_at: string
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          action_seq: number
          active: boolean
          created_at?: string
          experience_id: string
          id?: string
          revision?: number
          updated_at?: string
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          action_seq?: number
          active?: boolean
          created_at?: string
          experience_id?: string
          id?: string
          revision?: number
          updated_at?: string
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_preferences_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_visitor_preferences: {
        Args: {
          p_hash: string
          p_request: string
          p_user: string
          p_visitor: string
        }
        Returns: Json
      }
      create_visitor: {
        Args: { p_expires: string; p_hash: string; p_id: string }
        Returns: undefined
      }
      read_visitor_preferences: {
        Args: { p_hash: string; p_visitor: string }
        Returns: Json
      }
      set_topic_preference: {
        Args: {
          p_active: boolean
          p_request: string
          p_revision: number
          p_topic: string
        }
        Returns: Json
      }
      set_visitor_preference: {
        Args: {
          p_active: boolean
          p_hash: string
          p_request: string
          p_revision: number
          p_topic: string
          p_visitor: string
        }
        Returns: Json
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
