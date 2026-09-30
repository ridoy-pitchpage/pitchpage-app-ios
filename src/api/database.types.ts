/**
 * Supabase schema types — COPIED, DO NOT HAND-EDIT.
 *
 * Source: `src/integrations/supabase/types.ts` in the web repo
 * (gregadosmond-oss/profile-pride-app), copied 2026-09-30.
 *
 * The live database is the source of truth, not the migrations table: every
 * migration after 2026-09-08 was applied by hand in Lovable's SQL editor. To
 * refresh this file, regenerate it against the live project and copy it across
 * again rather than editing here.
 *
 * Note this file describes the whole schema, including tables the app has no
 * grant on. What a signed-in user may actually read or write is decided by RLS
 * and the table grants, not by the presence of a type here — see
 * src/api/supabase-direct.ts for the subset the app uses directly.
 */

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
      attribution_clicks: {
        Row: {
          created_at: string
          from_slug: string
          id: string
          referrer_host: string | null
          ua_family: string | null
        }
        Insert: {
          created_at?: string
          from_slug: string
          id?: string
          referrer_host?: string | null
          ua_family?: string | null
        }
        Update: {
          created_at?: string
          from_slug?: string
          id?: string
          referrer_host?: string | null
          ua_family?: string | null
        }
        Relationships: []
      }
      client_invite_optouts: {
        Row: {
          created_at: string
          email: string
          org_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          org_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_invite_optouts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          created_at: string
          delta: number
          id: string
          metadata: Json
          pitch_page_id: string | null
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          metadata?: Json
          pitch_page_id?: string | null
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          metadata?: Json
          pitch_page_id?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "customer_pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "published_pitch_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_sequences: {
        Row: {
          created_at: string
          current_step: number
          id: string
          link_id: string
          next_send_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          current_step?: number
          id?: string
          link_id: string
          next_send_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          current_step?: number
          id?: string
          link_id?: string
          next_send_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "drip_sequences_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: true
            referencedRelation: "pitch_page_links"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequence_log: {
        Row: {
          id: string
          page_id: string | null
          resend_id: string | null
          sent_at: string
          sequence: string
          stage: number
          user_id: string
        }
        Insert: {
          id?: string
          page_id?: string | null
          resend_id?: string | null
          sent_at?: string
          sequence?: string
          stage: number
          user_id: string
        }
        Update: {
          id?: string
          page_id?: string | null
          resend_id?: string | null
          sent_at?: string
          sequence?: string
          stage?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_log_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "customer_pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequence_log_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequence_log_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "published_pitch_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_accounts: {
        Row: {
          created_at: string
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      org_admin_invites: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          created_by: string | null
          email: string | null
          expires_at: string
          id: string
          org_id: string
          role: string
          token_hash: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at: string
          id?: string
          org_id: string
          role?: string
          token_hash: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          org_id?: string
          role?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_admin_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_client_allocations: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          created_by: string | null
          expires_at: string
          grant_id: string
          id: string
          org_id: string
          remaining: number
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          created_by?: string | null
          expires_at: string
          grant_id: string
          id?: string
          org_id: string
          remaining: number
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          grant_id?: string
          id?: string
          org_id?: string
          remaining?: number
        }
        Relationships: [
          {
            foreignKeyName: "org_client_allocations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "org_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_client_allocations_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "org_credit_grants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_client_allocations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_clients: {
        Row: {
          cohort_id: string | null
          consent_at: string | null
          consented_access: string | null
          consented_terms_version: number
          created_at: string
          email: string
          full_name: string | null
          id: string
          invite_email_sent_at: string | null
          invite_resend_id: string | null
          invite_token: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          joined_via: string | null
          link_names_consent: boolean | null
          link_names_consent_at: string | null
          org_id: string
          removed_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          cohort_id?: string | null
          consent_at?: string | null
          consented_access?: string | null
          consented_terms_version?: number
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          invite_email_sent_at?: string | null
          invite_resend_id?: string | null
          invite_token?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          joined_via?: string | null
          link_names_consent?: boolean | null
          link_names_consent_at?: string | null
          org_id: string
          removed_at?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          cohort_id?: string | null
          consent_at?: string | null
          consented_access?: string | null
          consented_terms_version?: number
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          invite_email_sent_at?: string | null
          invite_resend_id?: string | null
          invite_token?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          joined_via?: string | null
          link_names_consent?: boolean | null
          link_names_consent_at?: string | null
          org_id?: string
          removed_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_clients_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "org_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_clients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_cohorts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          org_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          org_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_cohorts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_credit_grants: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          expires_at: string
          granted_at: string
          id: string
          kind: string
          note: string | null
          org_id: string
          remaining: number
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          expires_at: string
          granted_at?: string
          id?: string
          kind: string
          note?: string | null
          org_id: string
          remaining: number
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          expires_at?: string
          granted_at?: string
          id?: string
          kind?: string
          note?: string | null
          org_id?: string
          remaining?: number
        }
        Relationships: [
          {
            foreignKeyName: "org_credit_grants_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          org_id: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          org_id: string
          type: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          org_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_nudges: {
        Row: {
          actor_id: string
          client_id: string
          created_at: string
          email_sent_at: string | null
          id: string
          kind: string
          org_id: string
          resend_id: string | null
        }
        Insert: {
          actor_id: string
          client_id: string
          created_at?: string
          email_sent_at?: string | null
          id?: string
          kind: string
          org_id: string
          resend_id?: string | null
        }
        Update: {
          actor_id?: string
          client_id?: string
          created_at?: string
          email_sent_at?: string | null
          id?: string
          kind?: string
          org_id?: string
          resend_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_nudges_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "org_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_nudges_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_outcomes: {
        Row: {
          added_by: string | null
          client_id: string
          created_at: string
          id: string
          kind: string
          occurred_on: string
          org_id: string
          pitch_page_id: string | null
          user_id: string
        }
        Insert: {
          added_by?: string | null
          client_id: string
          created_at?: string
          id?: string
          kind: string
          occurred_on?: string
          org_id: string
          pitch_page_id?: string | null
          user_id: string
        }
        Update: {
          added_by?: string | null
          client_id?: string
          created_at?: string
          id?: string
          kind?: string
          occurred_on?: string
          org_id?: string
          pitch_page_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_outcomes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "org_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_outcomes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_outcomes_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "customer_pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_outcomes_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_outcomes_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "published_pitch_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      org_sponsorships: {
        Row: {
          allocation_id: string | null
          created_at: string
          grant_id: string | null
          id: string
          org_id: string
          period: string
          pitch_page_id: string | null
          user_id: string | null
        }
        Insert: {
          allocation_id?: string | null
          created_at?: string
          grant_id?: string | null
          id?: string
          org_id: string
          period: string
          pitch_page_id?: string | null
          user_id?: string | null
        }
        Update: {
          allocation_id?: string | null
          created_at?: string
          grant_id?: string | null
          id?: string
          org_id?: string
          period?: string
          pitch_page_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_sponsorships_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "org_client_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_sponsorships_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "org_credit_grants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_sponsorships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_sponsorships_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "customer_pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_sponsorships_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_sponsorships_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "published_pitch_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          alert_at: number
          archived_at: string | null
          brand_on_member_pages: boolean
          client_page_access: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          credit_mode: string
          id: string
          join_code: string | null
          join_enabled: boolean
          logo_url: string | null
          name: string
          notes: string | null
          page_limit: number | null
          require_approval: boolean
          slug: string
          status: string
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          vertical: string | null
        }
        Insert: {
          alert_at?: number
          archived_at?: string | null
          brand_on_member_pages?: boolean
          client_page_access?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          credit_mode?: string
          id?: string
          join_code?: string | null
          join_enabled?: boolean
          logo_url?: string | null
          name: string
          notes?: string | null
          page_limit?: number | null
          require_approval?: boolean
          slug: string
          status?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          vertical?: string | null
        }
        Update: {
          alert_at?: number
          archived_at?: string | null
          brand_on_member_pages?: boolean
          client_page_access?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          credit_mode?: string
          id?: string
          join_code?: string | null
          join_enabled?: boolean
          logo_url?: string | null
          name?: string
          notes?: string | null
          page_limit?: number | null
          require_approval?: boolean
          slug?: string
          status?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          vertical?: string | null
        }
        Relationships: []
      }
      outreach_contacts: {
        Row: {
          company: string | null
          created_at: string
          custom_fields: Json
          email: string
          first_name: string | null
          id: string
          job_title: string | null
          last_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          custom_fields?: Json
          email: string
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          custom_fields?: Json
          email?: string
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      outreach_enrollments: {
        Row: {
          completed_at: string | null
          contact_id: string
          current_step: number
          enrolled_at: string
          id: string
          next_send_at: string | null
          pitch_page_id: string | null
          pitch_page_link_id: string | null
          replied_at: string | null
          reply_token: string | null
          sequence_id: string
          status: string
          stopped_reason: string | null
        }
        Insert: {
          completed_at?: string | null
          contact_id: string
          current_step?: number
          enrolled_at?: string
          id?: string
          next_send_at?: string | null
          pitch_page_id?: string | null
          pitch_page_link_id?: string | null
          replied_at?: string | null
          reply_token?: string | null
          sequence_id: string
          status?: string
          stopped_reason?: string | null
        }
        Update: {
          completed_at?: string | null
          contact_id?: string
          current_step?: number
          enrolled_at?: string
          id?: string
          next_send_at?: string | null
          pitch_page_id?: string | null
          pitch_page_link_id?: string | null
          replied_at?: string | null
          reply_token?: string | null
          sequence_id?: string
          status?: string
          stopped_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outreach_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_enrollments_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "customer_pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_enrollments_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_enrollments_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "published_pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_enrollments_pitch_page_link_id_fkey"
            columns: ["pitch_page_link_id"]
            isOneToOne: false
            referencedRelation: "pitch_page_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "outreach_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_sends: {
        Row: {
          body_html_rendered: string | null
          created_at: string
          enrollment_id: string
          error: string | null
          id: string
          in_reply_to: string | null
          provider: string
          provider_message_id: string | null
          rfc_message_id: string | null
          scheduled_at: string | null
          sent_at: string | null
          skip_reason: string | null
          status: string
          step_id: string | null
          step_order: number
          subject_rendered: string | null
          user_id: string
        }
        Insert: {
          body_html_rendered?: string | null
          created_at?: string
          enrollment_id: string
          error?: string | null
          id?: string
          in_reply_to?: string | null
          provider?: string
          provider_message_id?: string | null
          rfc_message_id?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          skip_reason?: string | null
          status?: string
          step_id?: string | null
          step_order: number
          subject_rendered?: string | null
          user_id: string
        }
        Update: {
          body_html_rendered?: string | null
          created_at?: string
          enrollment_id?: string
          error?: string | null
          id?: string
          in_reply_to?: string | null
          provider?: string
          provider_message_id?: string | null
          rfc_message_id?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          skip_reason?: string | null
          status?: string
          step_id?: string | null
          step_order?: number
          subject_rendered?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_sends_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "outreach_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_sends_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "outreach_sequence_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_sequence_steps: {
        Row: {
          body_html: string | null
          condition: string
          created_at: string
          delay_amount: number
          delay_unit: string
          id: string
          include_signature: boolean
          kind: string
          sequence_id: string
          step_order: number
          subject: string | null
          thread_with_previous: boolean
          updated_at: string
        }
        Insert: {
          body_html?: string | null
          condition?: string
          created_at?: string
          delay_amount?: number
          delay_unit?: string
          id?: string
          include_signature?: boolean
          kind?: string
          sequence_id: string
          step_order: number
          subject?: string | null
          thread_with_previous?: boolean
          updated_at?: string
        }
        Update: {
          body_html?: string | null
          condition?: string
          created_at?: string
          delay_amount?: number
          delay_unit?: string
          id?: string
          include_signature?: boolean
          kind?: string
          sequence_id?: string
          step_order?: number
          subject?: string | null
          thread_with_previous?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "outreach_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_sequences: {
        Row: {
          created_at: string
          description: string | null
          from_mode: string
          id: string
          name: string
          send_window_end: string
          send_window_start: string
          skip_weekends: boolean
          status: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          from_mode?: string
          id?: string
          name: string
          send_window_end?: string
          send_window_start?: string
          skip_weekends?: boolean
          status?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          from_mode?: string
          id?: string
          name?: string
          send_window_end?: string
          send_window_start?: string
          skip_weekends?: boolean
          status?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      outreach_suppressions: {
        Row: {
          created_at: string
          email: string
          id: string
          note: string | null
          reason: string
          source: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          note?: string | null
          reason?: string
          source?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          note?: string | null
          reason?: string
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      personal_invite_redemptions: {
        Row: {
          redeemed_at: string
          token: string
          user_id: string
        }
        Insert: {
          redeemed_at?: string
          token: string
          user_id: string
        }
        Update: {
          redeemed_at?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_invite_redemptions_token_fkey"
            columns: ["token"]
            isOneToOne: false
            referencedRelation: "personal_invites"
            referencedColumns: ["token"]
          },
        ]
      }
      personal_invites: {
        Row: {
          created_at: string
          credits: number
          label: string | null
          max_redemptions: number
          redeemed_count: number
          token: string
        }
        Insert: {
          created_at?: string
          credits?: number
          label?: string | null
          max_redemptions?: number
          redeemed_count?: number
          token?: string
        }
        Update: {
          created_at?: string
          credits?: number
          label?: string | null
          max_redemptions?: number
          redeemed_count?: number
          token?: string
        }
        Relationships: []
      }
      pitch_page_chat_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          meta: Json
          pitch_page_id: string
          role: string
          surface: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          meta?: Json
          pitch_page_id: string
          role: string
          surface?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          meta?: Json
          pitch_page_id?: string
          role?: string
          surface?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_page_chat_messages_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "customer_pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_page_chat_messages_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_page_chat_messages_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "published_pitch_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_page_links: {
        Row: {
          created_at: string
          id: string
          label: string
          pitch_page_id: string
          recipient_email: string | null
          recipient_name: string | null
          ref_slug: string
          replied_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          pitch_page_id: string
          recipient_email?: string | null
          recipient_name?: string | null
          ref_slug: string
          replied_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          pitch_page_id?: string
          recipient_email?: string | null
          recipient_name?: string | null
          ref_slug?: string
          replied_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pitch_page_links_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "customer_pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_page_links_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_page_links_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "published_pitch_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_page_views: {
        Row: {
          bot_confidence: string | null
          bot_reason: string | null
          city: string | null
          country: string | null
          created_at: string
          dwell_ms: number | null
          event_type: string
          id: string
          is_bot: boolean
          pitch_page_id: string
          ref: string | null
          referrer_host: string | null
          section_id: string | null
          section_label: string | null
          share_source: string | null
          target: string | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          bot_confidence?: string | null
          bot_reason?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          dwell_ms?: number | null
          event_type: string
          id?: string
          is_bot?: boolean
          pitch_page_id: string
          ref?: string | null
          referrer_host?: string | null
          section_id?: string | null
          section_label?: string | null
          share_source?: string | null
          target?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          bot_confidence?: string | null
          bot_reason?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          dwell_ms?: number | null
          event_type?: string
          id?: string
          is_bot?: boolean
          pitch_page_id?: string
          ref?: string | null
          referrer_host?: string | null
          section_id?: string | null
          section_label?: string | null
          share_source?: string | null
          target?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pitch_page_views_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "customer_pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_page_views_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_page_views_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "published_pitch_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_pages: {
        Row: {
          bio: string
          created_at: string
          credential_links: Json
          email: string | null
          film: Json
          final_cta_label: string | null
          final_cta_url: string | null
          full_name: string
          headline: string
          hero_image_url: string | null
          id: string
          last_edited_by_org_member: string | null
          linkedin_url: string | null
          listing: Json
          location: string | null
          og_image_key: string | null
          og_image_url: string | null
          open_to: string[]
          org_id: string | null
          portfolio: Json
          portrait_url: string | null
          primary_cta_label: string | null
          primary_cta_url: string | null
          published_at: string | null
          resume_url: string | null
          sections: Json
          slug: string
          supporting_documents: Json
          tagline: string | null
          template: string
          updated_at: string
          user_id: string
          video_effect: string | null
          video_master_url: string | null
          video_trim_end: number | null
          video_trim_start: number | null
          video_url: string | null
          wizard_meta: Json
        }
        Insert: {
          bio?: string
          created_at?: string
          credential_links?: Json
          email?: string | null
          film?: Json
          final_cta_label?: string | null
          final_cta_url?: string | null
          full_name?: string
          headline?: string
          hero_image_url?: string | null
          id?: string
          last_edited_by_org_member?: string | null
          linkedin_url?: string | null
          listing?: Json
          location?: string | null
          og_image_key?: string | null
          og_image_url?: string | null
          open_to?: string[]
          org_id?: string | null
          portfolio?: Json
          portrait_url?: string | null
          primary_cta_label?: string | null
          primary_cta_url?: string | null
          published_at?: string | null
          resume_url?: string | null
          sections?: Json
          slug: string
          supporting_documents?: Json
          tagline?: string | null
          template?: string
          updated_at?: string
          user_id: string
          video_effect?: string | null
          video_master_url?: string | null
          video_trim_end?: number | null
          video_trim_start?: number | null
          video_url?: string | null
          wizard_meta?: Json
        }
        Update: {
          bio?: string
          created_at?: string
          credential_links?: Json
          email?: string | null
          film?: Json
          final_cta_label?: string | null
          final_cta_url?: string | null
          full_name?: string
          headline?: string
          hero_image_url?: string | null
          id?: string
          last_edited_by_org_member?: string | null
          linkedin_url?: string | null
          listing?: Json
          location?: string | null
          og_image_key?: string | null
          og_image_url?: string | null
          open_to?: string[]
          org_id?: string | null
          portfolio?: Json
          portrait_url?: string | null
          primary_cta_label?: string | null
          primary_cta_url?: string | null
          published_at?: string | null
          resume_url?: string | null
          sections?: Json
          slug?: string
          supporting_documents?: Json
          tagline?: string | null
          template?: string
          updated_at?: string
          user_id?: string
          video_effect?: string | null
          video_master_url?: string | null
          video_trim_end?: number | null
          video_trim_start?: number | null
          video_url?: string | null
          wizard_meta?: Json
        }
        Relationships: [
          {
            foreignKeyName: "pitch_pages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          trends_seen: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          trends_seen?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          trends_seen?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_notified_at: string | null
          last_seen_at: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_notified_at?: string | null
          last_seen_at?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_notified_at?: string | null
          last_seen_at?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_email_connections: {
        Row: {
          connected_at: string
          email_address: string
          id: string
          provider: string
          refresh_token: string
          user_id: string
        }
        Insert: {
          connected_at?: string
          email_address: string
          id?: string
          provider?: string
          refresh_token: string
          user_id: string
        }
        Update: {
          connected_at?: string
          email_address?: string
          id?: string
          provider?: string
          refresh_token?: string
          user_id?: string
        }
        Relationships: []
      }
      viewer_notification_log: {
        Row: {
          id: string
          notified_at: string
          page_id: string
          resend_id: string | null
          visitor_key: string
        }
        Insert: {
          id?: string
          notified_at?: string
          page_id: string
          resend_id?: string | null
          visitor_key: string
        }
        Update: {
          id?: string
          notified_at?: string
          page_id?: string
          resend_id?: string | null
          visitor_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "viewer_notification_log_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "customer_pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewer_notification_log_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewer_notification_log_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "published_pitch_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      viewer_visit_notifications: {
        Row: {
          arrived_at: string
          attempts: number
          city: string | null
          claim_token: string | null
          claimed_at: string | null
          country: string | null
          created_at: string
          end_reason: string | null
          hidden_at: string | null
          id: string
          last_error: string | null
          left_at: string | null
          next_attempt_at: string | null
          page_id: string
          pushed_at: string | null
          ref: string | null
          ref_label: string | null
          referrer_host: string | null
          region: string | null
          sent_at: string | null
          share_source: string | null
          skip_reason: string | null
          status: string
          summary: Json | null
          updated_at: string
          user_agent: string | null
          view_event_id: string | null
          visitor_id: string | null
          visitor_key: string
        }
        Insert: {
          arrived_at?: string
          attempts?: number
          city?: string | null
          claim_token?: string | null
          claimed_at?: string | null
          country?: string | null
          created_at?: string
          end_reason?: string | null
          hidden_at?: string | null
          id?: string
          last_error?: string | null
          left_at?: string | null
          next_attempt_at?: string | null
          page_id: string
          pushed_at?: string | null
          ref?: string | null
          ref_label?: string | null
          referrer_host?: string | null
          region?: string | null
          sent_at?: string | null
          share_source?: string | null
          skip_reason?: string | null
          status?: string
          summary?: Json | null
          updated_at?: string
          user_agent?: string | null
          view_event_id?: string | null
          visitor_id?: string | null
          visitor_key: string
        }
        Update: {
          arrived_at?: string
          attempts?: number
          city?: string | null
          claim_token?: string | null
          claimed_at?: string | null
          country?: string | null
          created_at?: string
          end_reason?: string | null
          hidden_at?: string | null
          id?: string
          last_error?: string | null
          left_at?: string | null
          next_attempt_at?: string | null
          page_id?: string
          pushed_at?: string | null
          ref?: string | null
          ref_label?: string | null
          referrer_host?: string | null
          region?: string | null
          sent_at?: string | null
          share_source?: string | null
          skip_reason?: string | null
          status?: string
          summary?: Json | null
          updated_at?: string
          user_agent?: string | null
          view_event_id?: string | null
          visitor_id?: string | null
          visitor_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "viewer_visit_notifications_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "customer_pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewer_visit_notifications_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewer_visit_notifications_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "published_pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewer_visit_notifications_view_event_id_fkey"
            columns: ["view_event_id"]
            isOneToOne: false
            referencedRelation: "pitch_page_views"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewer_visit_notifications_view_event_id_fkey"
            columns: ["view_event_id"]
            isOneToOne: false
            referencedRelation: "pitch_page_views_human"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_sessions: {
        Row: {
          agent: string
          conversation_id: string | null
          ended_at: string | null
          id: string
          page_id: string | null
          period: string
          reconciled_at: string | null
          reserved_seconds: number
          seconds: number | null
          started_at: string
          user_id: string | null
          visitor_key: string | null
        }
        Insert: {
          agent: string
          conversation_id?: string | null
          ended_at?: string | null
          id?: string
          page_id?: string | null
          period: string
          reconciled_at?: string | null
          reserved_seconds: number
          seconds?: number | null
          started_at?: string
          user_id?: string | null
          visitor_key?: string | null
        }
        Update: {
          agent?: string
          conversation_id?: string | null
          ended_at?: string | null
          id?: string
          page_id?: string | null
          period?: string
          reconciled_at?: string | null
          reserved_seconds?: number
          seconds?: number | null
          started_at?: string
          user_id?: string | null
          visitor_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_sessions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "customer_pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_sessions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_sessions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "published_pitch_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_errors: {
        Row: {
          created_at: string
          id: string
          payload: Json
          reason: string
          resolved_at: string | null
          source: string
          stripe_event_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          reason: string
          resolved_at?: string | null
          source?: string
          stripe_event_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          reason?: string
          resolved_at?: string | null
          source?: string
          stripe_event_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      customer_pitch_pages: {
        Row: {
          bio: string | null
          created_at: string | null
          credential_links: Json | null
          email: string | null
          film: Json | null
          final_cta_label: string | null
          final_cta_url: string | null
          full_name: string | null
          headline: string | null
          hero_image_url: string | null
          id: string | null
          last_edited_by_org_member: string | null
          linkedin_url: string | null
          listing: Json | null
          location: string | null
          og_image_key: string | null
          og_image_url: string | null
          open_to: string[] | null
          org_id: string | null
          portfolio: Json | null
          portrait_url: string | null
          primary_cta_label: string | null
          primary_cta_url: string | null
          published_at: string | null
          resume_url: string | null
          sections: Json | null
          slug: string | null
          supporting_documents: Json | null
          tagline: string | null
          template: string | null
          updated_at: string | null
          user_id: string | null
          video_effect: string | null
          video_master_url: string | null
          video_trim_end: number | null
          video_trim_start: number | null
          video_url: string | null
          wizard_meta: Json | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          credential_links?: Json | null
          email?: string | null
          film?: Json | null
          final_cta_label?: string | null
          final_cta_url?: string | null
          full_name?: string | null
          headline?: string | null
          hero_image_url?: string | null
          id?: string | null
          last_edited_by_org_member?: string | null
          linkedin_url?: string | null
          listing?: Json | null
          location?: string | null
          og_image_key?: string | null
          og_image_url?: string | null
          open_to?: string[] | null
          org_id?: string | null
          portfolio?: Json | null
          portrait_url?: string | null
          primary_cta_label?: string | null
          primary_cta_url?: string | null
          published_at?: string | null
          resume_url?: string | null
          sections?: Json | null
          slug?: string | null
          supporting_documents?: Json | null
          tagline?: string | null
          template?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_effect?: string | null
          video_master_url?: string | null
          video_trim_end?: number | null
          video_trim_start?: number | null
          video_url?: string | null
          wizard_meta?: Json | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          credential_links?: Json | null
          email?: string | null
          film?: Json | null
          final_cta_label?: string | null
          final_cta_url?: string | null
          full_name?: string | null
          headline?: string | null
          hero_image_url?: string | null
          id?: string | null
          last_edited_by_org_member?: string | null
          linkedin_url?: string | null
          listing?: Json | null
          location?: string | null
          og_image_key?: string | null
          og_image_url?: string | null
          open_to?: string[] | null
          org_id?: string | null
          portfolio?: Json | null
          portrait_url?: string | null
          primary_cta_label?: string | null
          primary_cta_url?: string | null
          published_at?: string | null
          resume_url?: string | null
          sections?: Json | null
          slug?: string | null
          supporting_documents?: Json | null
          tagline?: string | null
          template?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_effect?: string | null
          video_master_url?: string | null
          video_trim_end?: number | null
          video_trim_start?: number | null
          video_url?: string | null
          wizard_meta?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pitch_pages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_page_views_human: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          dwell_ms: number | null
          event_type: string | null
          id: string | null
          pitch_page_id: string | null
          ref: string | null
          referrer_host: string | null
          section_id: string | null
          section_label: string | null
          share_source: string | null
          target: string | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          dwell_ms?: number | null
          event_type?: string | null
          id?: string | null
          pitch_page_id?: string | null
          ref?: string | null
          referrer_host?: string | null
          section_id?: string | null
          section_label?: string | null
          share_source?: string | null
          target?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          dwell_ms?: number | null
          event_type?: string | null
          id?: string | null
          pitch_page_id?: string | null
          ref?: string | null
          referrer_host?: string | null
          section_id?: string | null
          section_label?: string | null
          share_source?: string | null
          target?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pitch_page_views_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "customer_pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_page_views_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "pitch_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_page_views_pitch_page_id_fkey"
            columns: ["pitch_page_id"]
            isOneToOne: false
            referencedRelation: "published_pitch_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      published_pitch_pages: {
        Row: {
          bio: string | null
          created_at: string | null
          credential_links: Json | null
          film: Json | null
          final_cta_label: string | null
          final_cta_url: string | null
          full_name: string | null
          headline: string | null
          hero_image_url: string | null
          id: string | null
          linkedin_url: string | null
          listing: Json | null
          location: string | null
          og_image_url: string | null
          open_to: string[] | null
          portfolio: Json | null
          portrait_url: string | null
          primary_cta_label: string | null
          primary_cta_url: string | null
          published_at: string | null
          resume_url: string | null
          sections: Json | null
          slug: string | null
          supporting_documents: Json | null
          tagline: string | null
          template: string | null
          updated_at: string | null
          video_trim_end: number | null
          video_trim_start: number | null
          video_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          credential_links?: Json | null
          film?: Json | null
          final_cta_label?: string | null
          final_cta_url?: string | null
          full_name?: string | null
          headline?: string | null
          hero_image_url?: string | null
          id?: string | null
          linkedin_url?: string | null
          listing?: Json | null
          location?: string | null
          og_image_url?: string | null
          open_to?: string[] | null
          portfolio?: Json | null
          portrait_url?: string | null
          primary_cta_label?: string | null
          primary_cta_url?: string | null
          published_at?: string | null
          resume_url?: string | null
          sections?: Json | null
          slug?: string | null
          supporting_documents?: Json | null
          tagline?: string | null
          template?: string | null
          updated_at?: string | null
          video_trim_end?: number | null
          video_trim_start?: number | null
          video_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          credential_links?: Json | null
          film?: Json | null
          final_cta_label?: string | null
          final_cta_url?: string | null
          full_name?: string | null
          headline?: string | null
          hero_image_url?: string | null
          id?: string | null
          linkedin_url?: string | null
          listing?: Json | null
          location?: string | null
          og_image_url?: string | null
          open_to?: string[] | null
          portfolio?: Json | null
          portrait_url?: string | null
          primary_cta_label?: string | null
          primary_cta_url?: string | null
          published_at?: string | null
          resume_url?: string | null
          sections?: Json | null
          slug?: string | null
          supporting_documents?: Json | null
          tagline?: string | null
          template?: string | null
          updated_at?: string | null
          video_trim_end?: number | null
          video_trim_start?: number | null
          video_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _access_rank: { Args: { _level: string }; Returns: number }
      _analytics_heartbeat_seconds: { Args: never; Returns: number }
      _analytics_min_visitors_for_percent: { Args: never; Returns: number }
      _analytics_min_visitors_to_compare: { Args: never; Returns: number }
      _analytics_read_min_ms: { Args: never; Returns: number }
      _analytics_tracking_markers: { Args: never; Returns: string[] }
      _can_read_org: { Args: { _org_id: string }; Returns: boolean }
      _client_credit_balance: { Args: { _client_id: string }; Returns: number }
      _client_spend_credit: {
        Args: { _client_id: string }
        Returns: {
          allocation_id: string
          grant_id: string
        }[]
      }
      _consent_is_current: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      _consent_terms_version: { Args: never; Returns: number }
      _is_org_admin: { Args: { _org_id: string }; Returns: boolean }
      _is_org_staff: { Args: { _org_id: string }; Returns: boolean }
      _link_client_pages: {
        Args: { _org_id: string; _user_id: string }
        Returns: number
      }
      _may_invite_role: {
        Args: { _org_id: string; _role: string }
        Returns: boolean
      }
      _org_allocate_credits: {
        Args: { _client_id: string; _n: number; _org_id: string }
        Returns: number
      }
      _org_assigned_balance: { Args: { _org_id: string }; Returns: number }
      _org_credit_balance: { Args: { _org_id: string }; Returns: number }
      _org_reclaim_credits: {
        Args: { _client_id: string; _n?: number }
        Returns: number
      }
      _org_role: { Args: { _org_id: string }; Returns: string }
      _org_slugify: { Args: { _name: string }; Returns: string }
      _org_spend_credit: { Args: { _org_id: string }; Returns: string }
      _org_sponsorship_for_page: {
        Args: { _pitch_page_id: string }
        Returns: {
          client_id: string
          credits: number
          eligible: boolean
          mode: string
          org_id: string
          org_name: string
          period: string
          reason: string
        }[]
      }
      _random_code: { Args: { _len?: number }; Returns: string }
      _sync_trial_grant_expiry: { Args: { _org_id: string }; Returns: number }
      admin_archive_org: {
        Args: { _archived?: boolean; _org_id: string }
        Returns: Json
      }
      admin_create_org: {
        Args: {
          _contact_email?: string
          _contact_name?: string
          _name: string
          _vertical?: string
        }
        Returns: string
      }
      admin_create_org_invite: {
        Args: { _days?: number; _org_id: string }
        Returns: string
      }
      admin_delete_client: {
        Args: { _client_id: string; _org_id: string }
        Returns: Json
      }
      admin_delete_org: { Args: { _org_id: string }; Returns: Json }
      admin_expire_grant: { Args: { _grant_id: string }; Returns: Json }
      admin_grant_credits: {
        Args: {
          _amount: number
          _kind?: string
          _months?: number
          _note?: string
          _org_id: string
        }
        Returns: Json
      }
      admin_list_grants: { Args: { _org_id: string }; Returns: Json }
      admin_list_orgs: { Args: never; Returns: Json }
      admin_set_trial: {
        Args: {
          _action: string
          _credits?: number
          _days?: number
          _org_id: string
        }
        Returns: Json
      }
      admin_update_org: {
        Args: { _org_id: string; _patch: Json }
        Returns: Json
      }
      claim_org_invite: { Args: { _token: string }; Returns: string }
      claim_visit_notification: {
        Args: { p_id: string; p_stale?: string }
        Returns: {
          arrived_at: string
          attempts: number
          city: string | null
          claim_token: string | null
          claimed_at: string | null
          country: string | null
          created_at: string
          end_reason: string | null
          hidden_at: string | null
          id: string
          last_error: string | null
          left_at: string | null
          next_attempt_at: string | null
          page_id: string
          pushed_at: string | null
          ref: string | null
          ref_label: string | null
          referrer_host: string | null
          region: string | null
          sent_at: string | null
          share_source: string | null
          skip_reason: string | null
          status: string
          summary: Json | null
          updated_at: string
          user_agent: string | null
          view_event_id: string | null
          visitor_id: string | null
          visitor_key: string
        }[]
        SetofOptions: {
          from: "*"
          to: "viewer_visit_notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      flag_suspected_bot_views: {
        Args: { p_lookback?: string; p_min_pages?: number; p_window?: string }
        Returns: number
      }
      get_claim_preview: { Args: { _token: string }; Returns: Json }
      get_client_invite_candidates: {
        Args: { _limit?: number }
        Returns: {
          client_id: string
          email: string
          full_name: string
          invited_at: string
          join_url: string
          logo_url: string
          org_id: string
          org_name: string
          unsubscribe_url: string
        }[]
      }
      get_client_sponsor: { Args: never; Returns: Json }
      get_due_visit_notifications: {
        Args: {
          p_cap?: string
          p_hidden_grace?: string
          p_idle?: string
          p_limit?: number
          p_stale?: string
        }
        Returns: {
          due_reason: string
          id: string
        }[]
      }
      get_join_preview: { Args: { _code: string }; Returns: Json }
      get_my_orgs: { Args: never; Returns: Json }
      get_my_outcomes: { Args: { _org_id: string }; Returns: Json }
      get_onboarding_candidates: {
        Args: never
        Returns: {
          email: string
          full_name: string
          has_page: boolean
          last_sent_at: string
          last_stage: number
          signup_at: string
          user_id: string
        }[]
      }
      get_org_analytics: {
        Args: { _cohort_id?: string; _days?: number; _org_id: string }
        Returns: Json
      }
      get_org_attention: { Args: { _org_id: string }; Returns: Json }
      get_org_branding: { Args: { _org_id: string }; Returns: Json }
      get_org_dashboard: { Args: { _org_id: string }; Returns: Json }
      get_org_export: { Args: { _org_id: string }; Returns: Json }
      get_org_nudge_candidates: {
        Args: { _limit?: number }
        Returns: {
          client_id: string
          email: string
          full_name: string
          join_url: string
          kind: string
          logo_url: string
          nudge_id: string
          org_id: string
          org_name: string
          queued_at: string
          unsubscribe_url: string
        }[]
      }
      get_org_outcomes: { Args: { _org_id: string }; Returns: Json }
      get_org_page: {
        Args: { _org_id: string; _page_id: string }
        Returns: Json
      }
      get_org_page_analytics: {
        Args: { _org_id: string; _page_id: string }
        Returns: Json
      }
      get_org_team: { Args: { _org_id: string }; Returns: Json }
      get_org_tracked_links: {
        Args: { _cohort_id?: string; _org_id: string }
        Returns: Json
      }
      get_owner_dashboard_stats: { Args: never; Returns: Json }
      get_personal_invite_preview: { Args: { _token: string }; Returns: Json }
      get_pitchpage_ledger: {
        Args: never
        Returns: {
          amount_spent: number
          bonus_credits: number
          credits_balance: number
          credits_purchased: number
          credits_used: number
          email: string
          name: string
          pages_created: number
          pages_published: number
          published_urls: string
          signed_up: string
        }[]
      }
      get_publish_eligibility: {
        Args: { _pitch_page_id: string }
        Returns: Json
      }
      grant_credits: {
        Args: {
          _amount: number
          _metadata?: Json
          _reason: string
          _user_id: string
        }
        Returns: number
      }
      is_platform_admin: { Args: never; Returns: boolean }
      join_org: { Args: { _code: string }; Returns: Json }
      mark_client_invite_sent: {
        Args: { _client_id: string; _resend_id?: string }
        Returns: boolean
      }
      mark_org_nudge_sent: {
        Args: { _nudge_id: string; _resend_id?: string }
        Returns: boolean
      }
      org_client_reconsent: { Args: { _org_id: string }; Returns: Json }
      org_client_set_link_consent: {
        Args: { _consent: boolean; _org_id: string }
        Returns: Json
      }
      org_create_client_page: {
        Args: { _client_id: string; _full_name?: string; _org_id: string }
        Returns: Json
      }
      org_create_cohort: {
        Args: { _name: string; _org_id: string }
        Returns: Json
      }
      org_delete_cohort: {
        Args: { _cohort_id: string; _org_id: string }
        Returns: Json
      }
      org_invite_clients: {
        Args: { _org_id: string; _rows: Json }
        Returns: number
      }
      org_invite_member: {
        Args: {
          _days?: number
          _email: string
          _org_id: string
          _role?: string
        }
        Returns: Json
      }
      org_publish_client_page: {
        Args: { _org_id: string; _page_id: string }
        Returns: Json
      }
      org_regenerate_join_code: { Args: { _org_id: string }; Returns: string }
      org_remove_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: Json
      }
      org_revoke_member_invite: {
        Args: { _invite_id: string; _org_id: string }
        Returns: Json
      }
      org_send_nudge: {
        Args: { _client_id: string; _kind: string; _org_id: string }
        Returns: Json
      }
      org_set_branding: {
        Args: {
          _brand_on_member_pages: boolean
          _logo_url: string
          _org_id: string
        }
        Returns: Json
      }
      org_set_client_cohort: {
        Args: { _client_id: string; _cohort_id: string; _org_id: string }
        Returns: Json
      }
      org_set_client_credits: {
        Args: { _client_id: string; _delta: number; _org_id: string }
        Returns: Json
      }
      org_set_client_status: {
        Args: { _client_id: string; _org_id: string; _status: string }
        Returns: Json
      }
      org_set_credit_mode: {
        Args: { _mode: string; _org_id: string }
        Returns: Json
      }
      org_set_join_settings: {
        Args: {
          _join_enabled: boolean
          _org_id: string
          _require_approval: boolean
        }
        Returns: Json
      }
      org_set_member_role: {
        Args: { _org_id: string; _role: string; _user_id: string }
        Returns: Json
      }
      org_set_page_access: {
        Args: { _level: string; _org_id: string }
        Returns: Json
      }
      org_update_client_page: {
        Args: { _page_id: string; _patch: Json }
        Returns: Json
      }
      publish_pitch_page: { Args: { _pitch_page_id: string }; Returns: boolean }
      redeem_personal_invite: { Args: { _token: string }; Returns: Json }
      spend_credit_for_pitch_page: {
        Args: { _pitch_page_id: string }
        Returns: boolean
      }
      unsubscribe_client_invite: { Args: { _token: string }; Returns: Json }
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
