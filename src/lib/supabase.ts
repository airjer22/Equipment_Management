import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'admin' | 'coach' | 'sports_captain';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      students: {
        Row: {
          id: string;
          student_id: string;
          full_name: string;
          year_group: string;
          class_name: string | null;
          house: string | null;
          email: string | null;
          avatar_url: string | null;
          trust_score: number;
          is_blacklisted: boolean;
          blacklist_end_date: string | null;
          blacklist_reason: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      equipment_items: {
        Row: {
          id: string;
          item_id: string;
          name: string;
          category: string;
          image_url: string | null;
          location: string | null;
          status: 'available' | 'borrowed' | 'reserved' | 'repair';
          condition_notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      loans: {
        Row: {
          id: string;
          student_id: string;
          equipment_id: string;
          borrowed_by_user_id: string | null;
          borrowed_at: string;
          due_at: string;
          returned_at: string | null;
          is_overdue: boolean;
          status: 'active' | 'returned' | 'overdue';
          created_at: string;
        };
      };
      settings: {
        Row: {
          id: string;
          school_name: string;
          academic_year: string;
          overdue_alerts_enabled: boolean;
          low_stock_warnings_enabled: boolean;
          email_digest_frequency: 'daily' | 'weekly';
          borrow_history_retention_months: number;
          require_student_id: boolean;
          app_version: string;
          updated_at: string;
        };
      };
    };
  };
};
