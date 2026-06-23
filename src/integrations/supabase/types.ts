export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          created_at: string;
          details: string | null;
          id: string;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          details?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          details?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
          subject: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
          subject: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          subject?: string;
        };
        Relationships: [];
      };
      devices: {
        Row: {
          brand: string;
          category: Database["public"]["Enums"]["device_category"];
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          interface: string;
          location: string | null;
          model: string;
          name: string;
          price: number;
          purchase_date: string | null;
          quantity: number;
          serial_number: string;
          status: Database["public"]["Enums"]["device_status"];
          supplier: string | null;
          updated_at: string;
          warranty_expiry: string | null;
        };
        Insert: {
          brand: string;
          category: Database["public"]["Enums"]["device_category"];
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          interface: string;
          location?: string | null;
          model: string;
          name: string;
          price: number;
          purchase_date?: string | null;
          quantity?: number;
          serial_number: string;
          status?: Database["public"]["Enums"]["device_status"];
          supplier?: string | null;
          updated_at?: string;
          warranty_expiry?: string | null;
        };
        Update: {
          brand?: string;
          category?: Database["public"]["Enums"]["device_category"];
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          interface?: string;
          location?: string | null;
          model?: string;
          name?: string;
          price?: number;
          purchase_date?: string | null;
          quantity?: number;
          serial_number?: string;
          status?: Database["public"]["Enums"]["device_status"];
          supplier?: string | null;
          updated_at?: string;
          warranty_expiry?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          created_at: string;
          device_id: string | null;
          device_name: string;
          id: string;
          order_id: string;
          quantity: number;
          unit_price: number;
        };
        Insert: {
          created_at?: string;
          device_id?: string | null;
          device_name: string;
          id?: string;
          order_id: string;
          quantity: number;
          unit_price: number;
        };
        Update: {
          created_at?: string;
          device_id?: string | null;
          device_name?: string;
          id?: string;
          order_id?: string;
          quantity?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_device_id_fkey";
            columns: ["device_id"];
            isOneToOne: false;
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          address: string;
          city: string;
          created_at: string;
          customer_name: string;
          email: string;
          id: string;
          notes: string | null;
          order_number: string;
          phone: string;
          postal_code: string | null;
          status: Database["public"]["Enums"]["order_status"];
          total: number;
          updated_at: string;
        };
        Insert: {
          address: string;
          city: string;
          created_at?: string;
          customer_name: string;
          email: string;
          id?: string;
          notes?: string | null;
          order_number: string;
          phone: string;
          postal_code?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          total?: number;
          updated_at?: string;
        };
        Update: {
          address?: string;
          city?: string;
          created_at?: string;
          customer_name?: string;
          email?: string;
          id?: string;
          notes?: string | null;
          order_number?: string;
          phone?: string;
          postal_code?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          total?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          id: string;
          name: string;
          needs_password_change: boolean;
          phone: string | null;
          status: Database["public"]["Enums"]["user_status"];
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          id: string;
          name: string;
          needs_password_change?: boolean;
          phone?: string | null;
          status?: Database["public"]["Enums"]["user_status"];
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          needs_password_change?: boolean;
          phone?: string | null;
          status?: Database["public"]["Enums"]["user_status"];
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      assign_staff_role_by_admin: {
        Args: { staff_name?: string; target_user_id: string };
        Returns: undefined;
      };
      delete_user_by_admin: {
        Args: { target_user_id: string };
        Returns: undefined;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "staff";
      device_category: "Input Device" | "Output Device";
      device_status: "Available" | "In Use" | "Under Maintenance" | "Damaged" | "Disposed";
      order_status: "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
      user_status: "active" | "inactive";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff"],
      device_category: ["Input Device", "Output Device"],
      device_status: ["Available", "In Use", "Under Maintenance", "Damaged", "Disposed"],
      order_status: ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"],
      user_status: ["active", "inactive"],
    },
  },
} as const;
