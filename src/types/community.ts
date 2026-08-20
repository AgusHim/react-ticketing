import type { User } from "./user";

export type CommunityType = "general" | "dakwah" | "running";

export type Community = {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: CommunityType;
  status: "active" | "inactive";
  logo_url?: string;
  cover_url?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  follower_count?: number;
};

export type CommunityRole =
  | "owner"
  | "admin"
  | "event_manager"
  | "checkin_staff"
  | "moderator"
  | "mentor";

export type CommunityMember = {
  id: string;
  community_id: string;
  user_id: string;
  role: CommunityRole;
  status: "active" | "invited" | "removed";
  user: User;
};

export type InvitationResult = {
  invitation: {
    id: string;
    community_id: string;
    email: string;
    role: CommunityRole;
    expires_at: string;
  };
  token: string;
};
