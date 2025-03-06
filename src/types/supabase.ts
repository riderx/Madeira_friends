export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_type: Database["public"]["Enums"]["booking_type"]
          created_at: string | null
          end_date: string | null
          event_id: string | null
          id: string
          message: string | null
          moderation_note: string | null
          moderator_id: string | null
          num_attendees: number | null
          rental_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["booking_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          booking_type: Database["public"]["Enums"]["booking_type"]
          created_at?: string | null
          end_date?: string | null
          event_id?: string | null
          id?: string
          message?: string | null
          moderation_note?: string | null
          moderator_id?: string | null
          num_attendees?: number | null
          rental_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          booking_type?: Database["public"]["Enums"]["booking_type"]
          created_at?: string | null
          end_date?: string | null
          event_id?: string | null
          id?: string
          message?: string | null
          moderation_note?: string | null
          moderator_id?: string | null
          num_attendees?: number | null
          rental_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cancellation_policy: string | null
          category: string
          created_at: string | null
          creator_id: string | null
          date: string
          deleted_at: string | null
          description: string | null
          id: string
          images: string[] | null
          is_paid: boolean | null
          location: string
          max_attendees: number | null
          moderation_note: string | null
          moderator_id: string | null
          payment_link: string | null
          rsvp_deadline: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          telegram_contact: string
          title: string
          updated_at: string | null
        }
        Insert: {
          cancellation_policy?: string | null
          category: string
          created_at?: string | null
          creator_id?: string | null
          date: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_paid?: boolean | null
          location: string
          max_attendees?: number | null
          moderation_note?: string | null
          moderator_id?: string | null
          payment_link?: string | null
          rsvp_deadline?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          telegram_contact: string
          title: string
          updated_at?: string | null
        }
        Update: {
          cancellation_policy?: string | null
          category?: string
          created_at?: string | null
          creator_id?: string | null
          date?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_paid?: boolean | null
          location?: string
          max_attendees?: number | null
          moderation_note?: string | null
          moderator_id?: string | null
          payment_link?: string | null
          rsvp_deadline?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          telegram_contact?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string
          id: string
          location_from: string | null
          location_madeira: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          telegram_username: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name: string
          id: string
          location_from?: string | null
          location_madeira?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          telegram_username?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          location_from?: string | null
          location_madeira?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          telegram_username?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rentals: {
        Row: {
          cancellation_policy: string | null
          created_at: string | null
          creator_id: string | null
          deleted_at: string | null
          description: string | null
          id: string
          images: string[] | null
          location: string
          max_duration: number | null
          min_duration: number
          moderation_note: string | null
          moderator_id: string | null
          price_per_day: number
          security_deposit: number | null
          status: Database["public"]["Enums"]["listing_status"] | null
          telegram_contact: string
          title: string
          type: Database["public"]["Enums"]["rental_type"]
          updated_at: string | null
        }
        Insert: {
          cancellation_policy?: string | null
          created_at?: string | null
          creator_id?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          location: string
          max_duration?: number | null
          min_duration: number
          moderation_note?: string | null
          moderator_id?: string | null
          price_per_day: number
          security_deposit?: number | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          telegram_contact: string
          title: string
          type: Database["public"]["Enums"]["rental_type"]
          updated_at?: string | null
        }
        Update: {
          cancellation_policy?: string | null
          created_at?: string | null
          creator_id?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          location?: string
          max_duration?: number | null
          min_duration?: number
          moderation_note?: string | null
          moderator_id?: string | null
          price_per_day?: number
          security_deposit?: number | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          telegram_contact?: string
          title?: string
          type?: Database["public"]["Enums"]["rental_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rentals_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_moderator_id_fkey"
            columns: ["moderator_id"]
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
      cleanup_expired_bookings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      expire_pending_bookings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      booking_status: "pending" | "approved" | "rejected" | "expired"
      booking_type: "event" | "rental"
      listing_status: "draft" | "pending" | "published" | "rejected"
      rental_type: "flat" | "house" | "scooter" | "motorbike" | "car"
      user_role: "user" | "moderator" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
