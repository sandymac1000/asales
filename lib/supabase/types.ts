export type Stage = 'exploring' | 'qualifying' | 'proposing' | 'closing' | 'won' | 'lost'
export type DealType = 'new_business' | 'expansion'
export type Health = 'red' | 'amber' | 'green'
export type ContactRole = 'economic_buyer' | 'champion' | 'technical_buyer' | 'user_buyer' | 'blocker' | 'influencer'
export type Sentiment = 'positive' | 'neutral' | 'negative' | 'unknown'
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'transcript' | 'milestone' | 'coaching'
export type UserRole = 'founder' | 'sales_rep' | 'manager' | 'member'

export interface Organization {
  id: string
  name: string
  domain: string | null
  features: Features
  q1_target_acv: number | null
  q2_target_acv: number | null
  q3_target_acv: number | null
  q4_target_acv: number | null
  annual_target_acv: number | null
  product_context: string | null
  market_context: string | null
  agent_models: { coach: string; debrief: string; qualify: string; scorecard: string }
  created_at: string
  updated_at: string
}

export type LossCategory = 'price' | 'product' | 'timing' | 'political' | 'no_decision' | 'other'

export interface Features {
  tier1_expansion: boolean
  tier1_milestones: boolean
  tier2_meddpicc_lite: boolean
  tier3_meddpicc_full: boolean
  tier3_debrief_agent: boolean
  tier3_qualification_agent: boolean
  pipeline_kanban: boolean
}

export interface User {
  id: string
  organization_id: string
  name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  organization_id: string
  name: string
  domain: string | null
  industry: string | null
  size_band: '1-50' | '51-200' | '201-1000' | '1001+' | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  organization_id: string
  account_id: string
  name: string
  title: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  linkedin_url: string | null
  referred_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  organization_id: string
  account_id: string
  owner_id: string | null
  name: string
  stage: Stage
  type: DealType
  parent_deal_id: string | null
  // Tier 0
  economic_buyer_contact_id: string | null
  economic_buyer_met: boolean
  pain: string | null
  success_criteria: string | null
  next_action: string | null
  next_action_date: string | null
  // Deal value
  acv_value: number | null
  tcv_value: number | null
  nre_value: number | null
  contract_length_months: number
  currency: string
  expected_close_date: string | null
  lost_reason: string | null
  loss_category: LossCategory | null
  lost_to_competitor: string | null
  win_reason: string | null
  win_notes: string | null
  // Tier 1
  expansion_vision: string | null
  expansion_eb_name: string | null
  expansion_eb_met: boolean
  milestone_30_date: string | null
  milestone_60_date: string | null
  milestone_90_date: string | null
  // Tier 2 MEDDPICC lite
  meddpicc_metrics: string | null
  meddpicc_metrics_health: Health | null
  meddpicc_eb_notes: string | null
  meddpicc_eb_health: Health | null
  meddpicc_pain_notes: string | null
  meddpicc_pain_health: Health | null
  meddpicc_champion_notes: string | null
  meddpicc_champion_health: Health | null
  // Tier 3 MEDDPICC full
  meddpicc_decision_criteria: string | null
  meddpicc_decision_criteria_health: Health | null
  meddpicc_decision_process: string | null
  meddpicc_decision_process_health: Health | null
  meddpicc_paper_process: string | null
  meddpicc_paper_process_health: Health | null
  meddpicc_competition: string | null
  meddpicc_competition_health: Health | null
  // Computed
  qualification_score: number | null
  qualification_updated_at: string | null
  // Meta
  created_at: string
  updated_at: string
  closed_at: string | null
}

export interface DealContact {
  id: string
  deal_id: string
  contact_id: string
  role: ContactRole
  sentiment: Sentiment
  last_engaged_at: string | null
  notes: string | null
  created_at: string
  // joined
  contact?: Contact
}

export interface Activity {
  id: string
  organization_id: string
  deal_id: string
  contact_id: string | null
  created_by: string | null
  type: ActivityType
  title: string | null
  notes: string | null
  raw_transcript: string | null
  agent_summary: string | null
  created_at: string
  // joined
  contact?: Contact
  user?: User
}

export interface Concept {
  id: string
  slug: string
  title: string
  short_explanation: string
  full_explanation: string
  test_question: string
  red_pattern: string
  green_pattern: string
  failure_anecdote: string
  tier: number
  sort_order: number
}

export interface DealAction {
  id: string
  deal_id: string
  organization_id: string
  description: string
  owner_name: string | null
  due_date: string | null
  completed_at: string | null
  sort_order: number
  created_at: string
}

// Enriched types with joins
export interface DealWithAccount extends Deal {
  account: Account
  economic_buyer?: Contact | null
  owner?: User | null
}

export interface DealFull extends DealWithAccount {
  deal_contacts: DealContact[]
  activities: Activity[]
  parent_deal?: Deal | null
}

// Database type (for Supabase client generic)
export type Database = {
  public: {
    Tables: {
      organizations: { Row: Organization; Insert: Partial<Organization>; Update: Partial<Organization> }
      users: { Row: User; Insert: Partial<User>; Update: Partial<User> }
      accounts: { Row: Account; Insert: Partial<Account>; Update: Partial<Account> }
      contacts: { Row: Contact; Insert: Partial<Contact>; Update: Partial<Contact> }
      deals: { Row: Deal; Insert: Partial<Deal>; Update: Partial<Deal> }
      deal_contacts: { Row: DealContact; Insert: Partial<DealContact>; Update: Partial<DealContact> }
      activities: { Row: Activity; Insert: Partial<Activity>; Update: Partial<Activity> }
      concepts: { Row: Concept; Insert: Partial<Concept>; Update: Partial<Concept> }
    }
  }
}
