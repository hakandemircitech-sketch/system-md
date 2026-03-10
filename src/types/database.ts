// Supabase veritabanı tipleri — schema.sql ile tam uyumlu
// Gerçek projede: npx supabase gen types typescript --project-id YOUR_ID > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Relationships: []
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          username: string | null
          plan: 'free' | 'pro' | 'team'
          plan_expires_at: string | null
          timezone: string
          language: string
          blueprint_count: number
          api_tokens_used: number
          deployment_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          plan?: 'free' | 'pro' | 'team'
          plan_expires_at?: string | null
          timezone?: string
          language?: string
          blueprint_count?: number
          api_tokens_used?: number
          deployment_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          plan?: 'free' | 'pro' | 'team'
          plan_expires_at?: string | null
          timezone?: string
          language?: string
          blueprint_count?: number
          api_tokens_used?: number
          deployment_count?: number
          updated_at?: string
        }
      }
      blueprints: {
        Relationships: []
        Row: {
          id: string
          user_id: string
          title: string
          idea_text: string
          industry: string | null
          stage: 'idea' | 'validation' | 'mvp' | 'growth' | null
          target_users: string | null
          status: 'generating' | 'complete' | 'failed'
          score_total: number | null
          score_market: number | null
          score_tech: number | null
          score_revenue: number | null
          score_brand: number | null
          model_used: string
          tokens_used: number
          generation_ms: number | null
          is_public: boolean
          public_slug: string | null
          view_count: number
          fork_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          idea_text: string
          industry?: string | null
          stage?: 'idea' | 'validation' | 'mvp' | 'growth' | null
          target_users?: string | null
          status?: 'generating' | 'complete' | 'failed'
          score_total?: number | null
          score_market?: number | null
          score_tech?: number | null
          score_revenue?: number | null
          score_brand?: number | null
          model_used?: string
          tokens_used?: number
          generation_ms?: number | null
          is_public?: boolean
          public_slug?: string | null
          view_count?: number
          fork_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          idea_text?: string
          industry?: string | null
          stage?: 'idea' | 'validation' | 'mvp' | 'growth' | null
          target_users?: string | null
          status?: 'generating' | 'complete' | 'failed'
          score_total?: number | null
          score_market?: number | null
          score_tech?: number | null
          score_revenue?: number | null
          score_brand?: number | null
          model_used?: string
          tokens_used?: number
          generation_ms?: number | null
          is_public?: boolean
          public_slug?: string | null
          view_count?: number
          fork_count?: number
          updated_at?: string
        }
      }
      blueprint_sections: {
        Relationships: []
        Row: {
          id: string
          blueprint_id: string
          section_type:
            | 'problem'
            | 'value_proposition'
            | 'mvp_scope'
            | 'tech_stack'
            | 'db_schema'
            | 'api_design'
            | 'ui_architecture'
            | 'revenue_model'
            | 'build_kit_meta'
          content: Json
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          blueprint_id: string
          section_type:
            | 'problem'
            | 'value_proposition'
            | 'mvp_scope'
            | 'tech_stack'
            | 'db_schema'
            | 'api_design'
            | 'ui_architecture'
            | 'revenue_model'
            | 'build_kit_meta'
          content?: Json
          order_index?: number
          created_at?: string
        }
        Update: {
          section_type?:
            | 'problem'
            | 'value_proposition'
            | 'mvp_scope'
            | 'tech_stack'
            | 'db_schema'
            | 'api_design'
            | 'ui_architecture'
            | 'revenue_model'
            | 'build_kit_meta'
          content?: Json
          order_index?: number
        }
      }
      build_kits: {
        Relationships: []
        Row: {
          id: string
          blueprint_id: string
          cursorrules: string | null
          build_md: string | null
          schema_sql: string | null
          env_example: string | null
          readme_md: string | null
          dockerfile: string | null
          storage_path: string | null
          download_count: number
          created_at: string
        }
        Insert: {
          id?: string
          blueprint_id: string
          cursorrules?: string | null
          build_md?: string | null
          schema_sql?: string | null
          env_example?: string | null
          readme_md?: string | null
          dockerfile?: string | null
          storage_path?: string | null
          download_count?: number
          created_at?: string
        }
        Update: {
          cursorrules?: string | null
          build_md?: string | null
          schema_sql?: string | null
          env_example?: string | null
          readme_md?: string | null
          dockerfile?: string | null
          storage_path?: string | null
          download_count?: number
        }
      }
      deployments: {
        Relationships: []
        Row: {
          id: string
          user_id: string
          blueprint_id: string | null
          project_name: string
          platform: 'vercel' | 'railway' | 'fly' | 'custom'
          branch: string
          region: string
          status: 'queued' | 'building' | 'success' | 'failed' | 'cancelled'
          deploy_url: string | null
          build_log: string | null
          error_message: string | null
          platform_deploy_id: string | null
          queued_at: string
          started_at: string | null
          completed_at: string | null
          duration_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          blueprint_id?: string | null
          project_name: string
          platform: 'vercel' | 'railway' | 'fly' | 'custom'
          branch?: string
          region?: string
          status?: 'queued' | 'building' | 'success' | 'failed' | 'cancelled'
          deploy_url?: string | null
          build_log?: string | null
          error_message?: string | null
          platform_deploy_id?: string | null
          queued_at?: string
          started_at?: string | null
          completed_at?: string | null
          duration_ms?: number | null
          created_at?: string
        }
        Update: {
          project_name?: string
          platform?: 'vercel' | 'railway' | 'fly' | 'custom'
          branch?: string
          region?: string
          status?: 'queued' | 'building' | 'success' | 'failed' | 'cancelled'
          deploy_url?: string | null
          build_log?: string | null
          error_message?: string | null
          platform_deploy_id?: string | null
          started_at?: string | null
          completed_at?: string | null
          duration_ms?: number | null
        }
      }
      subscriptions: {
        Relationships: []
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          plan: string
          billing_period: 'monthly' | 'yearly' | null
          status: 'active' | 'past_due' | 'cancelled' | 'trialing' | 'incomplete'
          current_period_start: string | null
          current_period_end: string | null
          trial_end: string | null
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          plan?: string
          billing_period?: 'monthly' | 'yearly' | null
          status: 'active' | 'past_due' | 'cancelled' | 'trialing' | 'incomplete'
          current_period_start?: string | null
          current_period_end?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          plan?: string
          billing_period?: 'monthly' | 'yearly' | null
          status?: 'active' | 'past_due' | 'cancelled' | 'trialing' | 'incomplete'
          current_period_start?: string | null
          current_period_end?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          updated_at?: string
        }
      }
      invoices: {
        Relationships: []
        Row: {
          id: string
          user_id: string
          stripe_invoice_id: string
          amount_usd: number
          currency: string
          status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
          description: string | null
          invoice_pdf_url: string | null
          period_start: string | null
          period_end: string | null
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_invoice_id: string
          amount_usd: number
          currency?: string
          status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
          description?: string | null
          invoice_pdf_url?: string | null
          period_start?: string | null
          period_end?: string | null
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          amount_usd?: number
          currency?: string
          status?: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
          description?: string | null
          invoice_pdf_url?: string | null
          period_start?: string | null
          period_end?: string | null
          paid_at?: string | null
        }
      }
      api_usage: {
        Relationships: []
        Row: {
          id: string
          user_id: string
          blueprint_id: string | null
          action: 'blueprint_generate' | 'blueprint_score' | 'deployment' | 'sql_query'
          model: string | null
          tokens_input: number
          tokens_output: number
          tokens_total: number
          cost_usd: number
          duration_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          blueprint_id?: string | null
          action: 'blueprint_generate' | 'blueprint_score' | 'deployment' | 'sql_query'
          model?: string | null
          tokens_input?: number
          tokens_output?: number
          cost_usd?: number
          duration_ms?: number | null
          created_at?: string
        }
        Update: {
          duration_ms?: number | null
        }
      }
      notifications: {
        Relationships: []
        Row: {
          id: string
          user_id: string
          type:
            | 'blueprint_complete'
            | 'deployment_success'
            | 'deployment_failed'
            | 'usage_warning'
            | 'plan_upgraded'
            | 'payment_failed'
            | 'welcome'
          title: string
          message: string | null
          action_url: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type:
            | 'blueprint_complete'
            | 'deployment_success'
            | 'deployment_failed'
            | 'usage_warning'
            | 'plan_upgraded'
            | 'payment_failed'
            | 'welcome'
          title: string
          message?: string | null
          action_url?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      plan_type: 'free' | 'pro' | 'team'
      blueprint_status: 'generating' | 'complete' | 'failed'
      blueprint_stage: 'idea' | 'validation' | 'mvp' | 'growth'
      deployment_platform: 'vercel' | 'railway' | 'fly' | 'custom'
      deployment_status: 'queued' | 'building' | 'success' | 'failed' | 'cancelled'
      subscription_status: 'active' | 'past_due' | 'cancelled' | 'trialing' | 'incomplete'
    }
    CompositeTypes: Record<string, never>
  }
}

// Kısa tip takma adları (kullanım kolaylığı için)
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type DbUser = Tables<'users'>
export type DbBlueprint = Tables<'blueprints'>
export type DbBlueprintSection = Tables<'blueprint_sections'>
export type DbBuildKit = Tables<'build_kits'>
export type DbDeployment = Tables<'deployments'>
export type DbSubscription = Tables<'subscriptions'>
export type DbInvoice = Tables<'invoices'>
export type DbApiUsage = Tables<'api_usage'>
export type DbNotification = Tables<'notifications'>
