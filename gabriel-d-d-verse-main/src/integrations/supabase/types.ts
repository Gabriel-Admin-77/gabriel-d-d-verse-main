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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_id: string
          character_id: string
          description: string
          icon: string
          id: string
          rarity: string
          title: string
          unlocked_at: string
        }
        Insert: {
          achievement_id: string
          character_id: string
          description?: string
          icon?: string
          id?: string
          rarity?: string
          title: string
          unlocked_at?: string
        }
        Update: {
          achievement_id?: string
          character_id?: string
          description?: string
          icon?: string
          id?: string
          rarity?: string
          title?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      bestiary_entries: {
        Row: {
          ac: number
          character_id: string
          cr: string
          first_seen_at: string
          hp: number
          id: string
          last_seen_at: string
          max_hp: number
          monster_id: string
          monster_name: string
          portrait_url: string | null
          times_defeated: number
          times_encountered: number
          weakness_notes: string | null
        }
        Insert: {
          ac?: number
          character_id: string
          cr?: string
          first_seen_at?: string
          hp?: number
          id?: string
          last_seen_at?: string
          max_hp?: number
          monster_id: string
          monster_name: string
          portrait_url?: string | null
          times_defeated?: number
          times_encountered?: number
          weakness_notes?: string | null
        }
        Update: {
          ac?: number
          character_id?: string
          cr?: string
          first_seen_at?: string
          hp?: number
          id?: string
          last_seen_at?: string
          max_hp?: number
          monster_id?: string
          monster_name?: string
          portrait_url?: string | null
          times_defeated?: number
          times_encountered?: number
          weakness_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bestiary_entries_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_abilities: {
        Row: {
          ability_type: string
          character_id: string
          created_at: string
          description: string
          id: string
          name: string
          unlocked_at_level: number
        }
        Insert: {
          ability_type?: string
          character_id: string
          created_at?: string
          description?: string
          id?: string
          name: string
          unlocked_at_level?: number
        }
        Update: {
          ability_type?: string
          character_id?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          unlocked_at_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_abilities_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_inventory: {
        Row: {
          character_id: string
          created_at: string
          id: string
          item_icon: string
          item_name: string
          item_type: string
          quantity: number
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          item_icon?: string
          item_name: string
          item_type: string
          quantity?: number
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          item_icon?: string
          item_name?: string
          item_type?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_inventory_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_spells: {
        Row: {
          casting_time: string | null
          character_id: string
          created_at: string
          damage: string | null
          description: string
          icon: string
          id: string
          max_uses: number
          range: string | null
          school: string
          spell_level: number
          spell_name: string
          uses_remaining: number
        }
        Insert: {
          casting_time?: string | null
          character_id: string
          created_at?: string
          damage?: string | null
          description?: string
          icon?: string
          id?: string
          max_uses?: number
          range?: string | null
          school?: string
          spell_level?: number
          spell_name: string
          uses_remaining?: number
        }
        Update: {
          casting_time?: string | null
          character_id?: string
          created_at?: string
          damage?: string | null
          description?: string
          icon?: string
          id?: string
          max_uses?: number
          range?: string | null
          school?: string
          spell_level?: number
          spell_name?: string
          uses_remaining?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_spells_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_status_effects: {
        Row: {
          character_id: string
          created_at: string
          damage_per_turn: number | null
          duration_turns: number
          effect_name: string
          effect_type: string
          heal_per_turn: number | null
          icon: string
          id: string
          stat_modifier: Json | null
          turns_remaining: number
        }
        Insert: {
          character_id: string
          created_at?: string
          damage_per_turn?: number | null
          duration_turns?: number
          effect_name: string
          effect_type?: string
          heal_per_turn?: number | null
          icon?: string
          id?: string
          stat_modifier?: Json | null
          turns_remaining?: number
        }
        Update: {
          character_id?: string
          created_at?: string
          damage_per_turn?: number | null
          duration_turns?: number
          effect_name?: string
          effect_type?: string
          heal_per_turn?: number | null
          icon?: string
          id?: string
          stat_modifier?: Json | null
          turns_remaining?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_status_effects_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          ac: number
          cha: number
          class: string
          con: number
          copper: number
          created_at: string
          dex: number
          gold: number
          hp_current: number
          hp_max: number
          id: string
          int: number
          level: number
          moral_score: number
          name: string
          portrait_url: string | null
          silver: number
          str: number
          updated_at: string
          user_id: string
          wis: number
          xp: number
          xp_to_next: number
        }
        Insert: {
          ac: number
          cha?: number
          class: string
          con?: number
          copper?: number
          created_at?: string
          dex?: number
          gold?: number
          hp_current: number
          hp_max: number
          id?: string
          int?: number
          level?: number
          moral_score?: number
          name: string
          portrait_url?: string | null
          silver?: number
          str?: number
          updated_at?: string
          user_id: string
          wis?: number
          xp?: number
          xp_to_next?: number
        }
        Update: {
          ac?: number
          cha?: number
          class?: string
          con?: number
          copper?: number
          created_at?: string
          dex?: number
          gold?: number
          hp_current?: number
          hp_max?: number
          id?: string
          int?: number
          level?: number
          moral_score?: number
          name?: string
          portrait_url?: string | null
          silver?: number
          str?: number
          updated_at?: string
          user_id?: string
          wis?: number
          xp?: number
          xp_to_next?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          adventure_id: string | null
          character_id: string
          content: string
          created_at: string
          id: string
          player_name: string | null
          role: string
          session_id: string | null
        }
        Insert: {
          adventure_id?: string | null
          character_id: string
          content: string
          created_at?: string
          id?: string
          player_name?: string | null
          role: string
          session_id?: string | null
        }
        Update: {
          adventure_id?: string | null
          character_id?: string
          content?: string
          created_at?: string
          id?: string
          player_name?: string | null
          role?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          adventure_id: string
          adventure_title: string
          created_at: string
          current_turn_user_id: string | null
          host_user_id: string
          id: string
          max_players: number
          status: string
          turn_order: string[] | null
          updated_at: string
        }
        Insert: {
          adventure_id?: string
          adventure_title?: string
          created_at?: string
          current_turn_user_id?: string | null
          host_user_id: string
          id?: string
          max_players?: number
          status?: string
          turn_order?: string[] | null
          updated_at?: string
        }
        Update: {
          adventure_id?: string
          adventure_title?: string
          created_at?: string
          current_turn_user_id?: string | null
          host_user_id?: string
          id?: string
          max_players?: number
          status?: string
          turn_order?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      moral_choices: {
        Row: {
          character_id: string
          choice_made: string
          created_at: string
          dilemma_id: string
          dilemma_title: string
          id: string
          moral_shift: number
        }
        Insert: {
          character_id: string
          choice_made: string
          created_at?: string
          dilemma_id: string
          dilemma_title: string
          id?: string
          moral_shift: number
        }
        Update: {
          character_id?: string
          choice_made?: string
          created_at?: string
          dilemma_id?: string
          dilemma_title?: string
          id?: string
          moral_shift?: number
        }
        Relationships: [
          {
            foreignKeyName: "moral_choices_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      npc_reputation: {
        Row: {
          character_id: string
          disposition: string
          first_met_at: string
          id: string
          interactions: number
          last_interaction: string | null
          last_met_at: string
          npc_id: string
          npc_name: string
          reputation: number
        }
        Insert: {
          character_id: string
          disposition?: string
          first_met_at?: string
          id?: string
          interactions?: number
          last_interaction?: string | null
          last_met_at?: string
          npc_id: string
          npc_name: string
          reputation?: number
        }
        Update: {
          character_id?: string
          disposition?: string
          first_met_at?: string
          id?: string
          interactions?: number
          last_interaction?: string | null
          last_met_at?: string
          npc_id?: string
          npc_name?: string
          reputation?: number
        }
        Relationships: [
          {
            foreignKeyName: "npc_reputation_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_log: {
        Row: {
          adventure_id: string
          character_id: string
          completed_at: string | null
          created_at: string
          description: string
          id: string
          quest_id: string
          status: string
          title: string
        }
        Insert: {
          adventure_id?: string
          character_id: string
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          quest_id: string
          status?: string
          title: string
        }
        Update: {
          adventure_id?: string
          character_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          quest_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_log_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      save_slots: {
        Row: {
          adventure_id: string
          adventure_title: string
          character_id: string
          character_name: string
          created_at: string
          id: string
          message_count: number
          slot_name: string
          updated_at: string
        }
        Insert: {
          adventure_id: string
          adventure_title?: string
          character_id: string
          character_name?: string
          created_at?: string
          id?: string
          message_count?: number
          slot_name?: string
          updated_at?: string
        }
        Update: {
          adventure_id?: string
          adventure_title?: string
          character_id?: string
          character_name?: string
          created_at?: string
          id?: string
          message_count?: number
          slot_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "save_slots_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      session_players: {
        Row: {
          character_class: string
          character_id: string
          character_name: string
          id: string
          joined_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          character_class: string
          character_id: string
          character_name: string
          id?: string
          joined_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          character_class?: string
          character_id?: string
          character_name?: string
          id?: string
          joined_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_players_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_players_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          item_type: string
          min_level: number
          name: string
          price_gold: number
          rarity: string
          stat_bonus: Json | null
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          item_type?: string
          min_level?: number
          name: string
          price_gold?: number
          rarity?: string
          stat_bonus?: Json | null
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          item_type?: string
          min_level?: number
          name?: string
          price_gold?: number
          rarity?: string
          stat_bonus?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
