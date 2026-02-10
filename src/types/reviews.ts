// Phase 5: Reviews & Trust Types

export interface Review {
  id: number;
  agent_id: number;
  reviewer_id: number;
  property_id?: number;
  lead_id?: number;
  rating: number;
  title?: string;
  content?: string;
  transaction_type: 'sale' | 'rental' | 'viewing';
  is_verified_transaction: boolean;
  verified_at?: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderation_note?: string;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  reviewer_name?: string;
  reviewer_avatar?: string;
  property_title?: string;
  property_suburb?: string;
  response?: ReviewResponse;
}

export interface ReviewResponse {
  id: number;
  review_id: number;
  agent_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  verified_count: number;
}

export interface Dispute {
  id: number;
  reporter_id: number;
  reported_user_id?: number;
  reported_property_id?: number;
  reported_review_id?: number;
  category: DisputeCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  evidence_urls?: string[];
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  priority: number;
  resolution?: string;
  resolved_by?: number;
  resolved_at?: string;
  assigned_to?: number;
  assigned_at?: string;
  created_at: string;
  updated_at: string;
  // Joined
  reporter_name?: string;
  reported_user_name?: string;
  reported_property_title?: string;
  messages?: DisputeMessage[];
}

export type DisputeCategory = 
  | 'scam'
  | 'misrepresentation'
  | 'harassment'
  | 'spam'
  | 'fake_listing'
  | 'unprofessional'
  | 'discrimination'
  | 'other';

export const DISPUTE_CATEGORIES: Record<DisputeCategory, { label: string; description: string; severity: string }> = {
  scam: { label: 'Scam / Fraud', description: 'Attempted to defraud or steal money', severity: 'critical' },
  misrepresentation: { label: 'Misrepresentation', description: 'Property or agent info is false/misleading', severity: 'high' },
  harassment: { label: 'Harassment', description: 'Abusive, threatening, or unwanted contact', severity: 'high' },
  spam: { label: 'Spam', description: 'Unsolicited bulk messaging or fake listings', severity: 'medium' },
  fake_listing: { label: 'Fake Listing', description: 'Property does not exist or is already sold/rented', severity: 'medium' },
  unprofessional: { label: 'Unprofessional Conduct', description: 'Rude, unresponsive, or poor service', severity: 'low' },
  discrimination: { label: 'Discrimination', description: 'Discriminatory behaviour based on race, gender, etc.', severity: 'high' },
  other: { label: 'Other', description: 'Other issue not listed above', severity: 'medium' },
};

export interface DisputeMessage {
  id: number;
  dispute_id: number;
  sender_id: number;
  content: string;
  is_internal: boolean;
  created_at: string;
  sender_name?: string;
}

export interface AreaReview {
  id: number;
  suburb: string;
  city: string;
  province: string;
  reviewer_id: number;
  is_verified_resident: boolean;
  residency_type?: 'resident' | 'former_resident' | 'worker' | 'visitor';
  years_in_area?: number;
  overall_rating: number;
  safety_rating?: number;
  schools_rating?: number;
  transport_rating?: number;
  amenities_rating?: number;
  value_rating?: number;
  title?: string;
  pros?: string;
  cons?: string;
  tips?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  reviewer_name?: string;
}

export interface TrustScoreBreakdown {
  total: number;
  rating_score: number;
  response_score: number;
  completion_score: number;
  dispute_penalty: number;
  review_count: number;
}

export interface AgentTrustProfile {
  user_id: number;
  name: string;
  avatar_url?: string;
  agency_name?: string;
  trust_score: number;
  total_reviews: number;
  average_rating: number;
  response_rate: number;
  avg_response_time_hours?: number;
  completed_transactions: number;
  is_verified: boolean;
  years_experience?: number;
  areas_served?: string[];
}
