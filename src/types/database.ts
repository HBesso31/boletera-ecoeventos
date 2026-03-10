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
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          phone: string | null
          role: "buyer" | "organizer" | "admin"
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          role?: "buyer" | "organizer" | "admin"
          created_at?: string
        }
        Update: {
          email?: string | null
          full_name?: string | null
          phone?: string | null
          role?: "buyer" | "organizer" | "admin"
        }
      }
      events: {
        Row: {
          id: string
          slug: string
          title: string
          description: string | null
          organizer_id: string
          start_date: string
          end_date: string | null
          location: string | null
          cover_image: string | null
          status: "draft" | "pending" | "approved" | "rejected"
          stripe_account_id: string | null
          application_fee_pct: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description?: string | null
          organizer_id: string
          start_date: string
          end_date?: string | null
          location?: string | null
          cover_image?: string | null
          status?: "draft" | "pending" | "approved" | "rejected"
          stripe_account_id?: string | null
          application_fee_pct?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          slug?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string | null
          location?: string | null
          cover_image?: string | null
          status?: "draft" | "pending" | "approved" | "rejected"
          stripe_account_id?: string | null
          application_fee_pct?: number
          updated_at?: string
        }
      }
      ticket_types: {
        Row: {
          id: string
          event_id: string
          name: string
          price: number
          capacity: number
          available: number
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          price: number
          capacity: number
          available?: number
          created_at?: string
        }
        Update: {
          name?: string
          price?: number
          capacity?: number
          available?: number
        }
      }
      camps: {
        Row: {
          id: string
          event_id: string
          title: string
          description: string | null
          price: number
          capacity: number
          available: number
          requires_payment: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          title: string
          description?: string | null
          price?: number
          capacity: number
          available?: number
          requires_payment?: boolean
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          price?: number
          capacity?: number
          available?: number
          requires_payment?: boolean
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          event_id: string
          stripe_payment_intent_id: string | null
          status: "pending" | "paid" | "failed" | "refunded"
          total: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          stripe_payment_intent_id?: string | null
          status?: "pending" | "paid" | "failed" | "refunded"
          total: number
          created_at?: string
        }
        Update: {
          stripe_payment_intent_id?: string | null
          status?: "pending" | "paid" | "failed" | "refunded"
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          ticket_type_id: string
          quantity: number
          unit_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          ticket_type_id: string
          quantity: number
          unit_price: number
          created_at?: string
        }
        Update: {
          quantity?: number
          unit_price?: number
        }
      }
      camp_registrations: {
        Row: {
          id: string
          order_id: string
          camp_id: string
          user_id: string
          status: "pending" | "confirmed" | "cancelled"
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          camp_id: string
          user_id: string
          status?: "pending" | "confirmed" | "cancelled"
          created_at?: string
        }
        Update: {
          status?: "pending" | "confirmed" | "cancelled"
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Event = Database["public"]["Tables"]["events"]["Row"]
export type TicketType = Database["public"]["Tables"]["ticket_types"]["Row"]
export type Camp = Database["public"]["Tables"]["camps"]["Row"]
export type Order = Database["public"]["Tables"]["orders"]["Row"]
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"]
export type CampRegistration = Database["public"]["Tables"]["camp_registrations"]["Row"]
