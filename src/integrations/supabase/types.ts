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
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          gst_no: string | null
          id: string
          name: string
          phone_no: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          gst_no?: string | null
          id?: string
          name: string
          phone_no: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          gst_no?: string | null
          id?: string
          name?: string
          phone_no?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          after_discount: number | null
          balance: number | null
          cake_color: string | null
          cake_description: string | null
          cake_photo_url: string | null
          cake_size: string | null
          cash_payment: number | null
          coupon_code: string | null
          created_at: string
          credit_card_payment: number | null
          customer_id: string
          delivery_address: string | null
          delivery_charge: number | null
          delivery_city: string | null
          delivery_date: string | null
         
          delivery_type: string | null
          discount_percentage: number | null
          flavour: string | null
          grand_total: number | null
          id: string
          message_on_cake: string | null
          occasion_date: string | null
          occasion_type: string | null
          online_payment: number | null
          order_number: string
          other_menu: string | null
          free_bill: number | null
          same_as_customer_address: boolean | null
          status: string | null
          tax_extra_no: string | null
          tax_percentage: number | null
          tax_value: number | null
          total_amount: number | null
          updated_at: string
          kitchen_acknowledged: boolean | null
        }
        Insert: {
          after_discount?: number | null
          balance?: number | null
          cake_color?: string | null
          cake_description?: string | null
          cake_photo_url?: string | null
          cake_size?: string | null
          cash_payment?: number | null
          coupon_code?: string | null
          created_at?: string
          credit_card_payment?: number | null
          customer_id: string
          delivery_address?: string | null
          delivery_charge?: number | null
          delivery_city?: string | null
          delivery_date?: string | null
        
          delivery_type?: string | null
          discount_percentage?: number | null
          flavour?: string | null
          grand_total?: number | null
          id?: string
          message_on_cake?: string | null
          occasion_date?: string | null
          occasion_type?: string | null
          online_payment?: number | null
          order_number: string
          other_menu?: string | null
          free_bill?: number | null
          same_as_customer_address?: boolean | null
          status?: string | null
          tax_extra_no?: string | null
          tax_percentage?: number | null
          tax_value?: number | null
          total_amount?: number | null
          updated_at?: string
          kitchen_acknowledged?: boolean | null
        }
        Update: {
          after_discount?: number | null
          balance?: number | null
          cake_color?: string | null
          cake_description?: string | null
          cake_photo_url?: string | null
          cake_size?: string | null
          cash_payment?: number | null
          coupon_code?: string | null
          created_at?: string
          credit_card_payment?: number | null
          customer_id?: string
          delivery_address?: string | null
          delivery_charge?: number | null
          delivery_city?: string | null
          delivery_date?: string | null
         
          delivery_type?: string | null
          discount_percentage?: number | null
          flavour?: string | null
          grand_total?: number | null
          id?: string
          message_on_cake?: string | null
          occasion_date?: string | null
          occasion_type?: string | null
          online_payment?: number | null
          order_number?: string
          other_menu?: string | null
          free_bill?: number | null
          same_as_customer_address?: boolean | null
          status?: string | null
          tax_extra_no?: string | null
          tax_percentage?: number | null
          tax_value?: number | null
          total_amount?: number | null
          updated_at?: string
          kitchen_acknowledged?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          id: string
          key: string
          value: string | null
          gst_enabled:boolean
          gst_percentage:number| null
          updated_at: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          key: string
          value?: string | null
          gst_enabled?:boolean
          gst_percentage:number| null
          updated_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          key?: string
          value?: string | null
          gst_enabled?:boolean
          gst_percentage?:number| null
          updated_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          id: string
          outlet_id: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          outlet_id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          outlet_id?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      outlets:{
        Row: {
          created_at: string | null
          id: string
          name: string | null
          city:string|null
          updated_at: string | null
      }
      Insert: {
        created_at?: string | null
        id:string
        name?: string | null
        city?:string|null
        updated_at?: string | null
    }
    Update: {
      created_at?: string | null
      id?:string
      name?: string | null  
      city?:string|null
      updated_at?: string | null
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
    : never,
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
