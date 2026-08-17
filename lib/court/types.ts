export type CourtTemplate = {
  id: string;
  category: string;
  title: string;
  summary: string;
  plaintiff_claim: string;
  defendant_claim: string;
  emoji: string;
  difficulty: string;
  is_featured: boolean;
};
export type CourtCase = {
  id: string;
  invite_code: string;
  creator_user_id: string;
  title: string;
  summary: string;
  plaintiff_name: string;
  defendant_name: string;
  plaintiff_claim: string;
  defendant_claim: string;
  status: string;
  visibility: string;
  moderation_status: string;
  moderation_reason: string | null;
  closes_at: string;
  created_at: string;
};
export type CourtChoice = 'plaintiff' | 'defendant' | 'both';
