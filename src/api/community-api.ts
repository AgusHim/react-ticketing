import type {
  Community,
  CommunityMember,
  CommunityRole,
  CommunityType,
  InvitationResult,
} from "@/types/community";
import api, { admin_api } from "./axios";

export type CreateCommunityInput = {
  name: string;
  type: CommunityType;
  description?: string;
  location?: string;
};

export async function getCommunity(slug: string): Promise<Community> {
  const response = await api.get(`/api/v1/communities/${encodeURIComponent(slug)}`);
  return response.data.data as Community;
}

export async function createCommunity(input: CreateCommunityInput): Promise<Community> {
  const response = await admin_api.post("/api/v1/communities", input);
  return response.data.data as Community;
}

export async function getMyCommunities(): Promise<Community[]> {
  const response = await admin_api.get("/api/v1/me/communities");
  return response.data.data as Community[];
}

export async function getCommunityMembers(communityId: string): Promise<CommunityMember[]> {
  const response = await admin_api.get(
    `/api/v1/portal/${encodeURIComponent(communityId)}/members`,
  );
  return response.data.data as CommunityMember[];
}

export async function inviteCommunityMember(
  communityId: string,
  email: string,
  role: Exclude<CommunityRole, "owner">,
): Promise<InvitationResult> {
  const response = await admin_api.post(
    `/api/v1/portal/${encodeURIComponent(communityId)}/invitations`,
    { email, role },
  );
  return response.data.data as InvitationResult;
}

export async function acceptCommunityInvitation(token: string): Promise<CommunityMember> {
  const response = await admin_api.post(
    `/api/v1/community-invitations/${encodeURIComponent(token)}/accept`,
  );
  return response.data.data as CommunityMember;
}

export async function getCommunityFollowState(communityId: string): Promise<boolean> {
  const response = await admin_api.get(
    `/api/v1/communities/${encodeURIComponent(communityId)}/follow`,
  );
  return Boolean(response.data.data?.following);
}

export async function setCommunityFollowing(
  communityId: string,
  following: boolean,
): Promise<boolean> {
  const path = `/api/v1/communities/${encodeURIComponent(communityId)}/follow`;
  const response = following
    ? await admin_api.post(path)
    : await admin_api.delete(path);
  return Boolean(response.data.data?.following);
}

export async function getFollowingCommunities(): Promise<Community[]> {
  const response = await admin_api.get("/api/v1/me/following");
  return response.data.data as Community[];
}

export type PortalCommunity = {
  community: Community;
  role: CommunityRole | "platform_admin";
};

export async function getPortalCommunity(communityId: string): Promise<PortalCommunity> {
  const response = await admin_api.get(
    `/api/v1/portal/${encodeURIComponent(communityId)}/`,
  );
  return response.data.data as PortalCommunity;
}

export async function updateCommunityProfile(
  communityId: string,
  input: Pick<
    Community,
    "name" | "description" | "location" | "logo_url" | "cover_url"
  >,
): Promise<Community> {
  const response = await admin_api.put(
    `/api/v1/portal/${encodeURIComponent(communityId)}/`,
    input,
  );
  return response.data.data as Community;
}

export async function updateCommunityMemberRole(
  communityId: string,
  memberId: string,
  role: Exclude<CommunityRole, "owner">,
): Promise<void> {
  await admin_api.patch(
    `/api/v1/portal/${encodeURIComponent(communityId)}/members/${encodeURIComponent(memberId)}`,
    { role },
  );
}

export async function removeCommunityMember(
  communityId: string,
  memberId: string,
): Promise<void> {
  await admin_api.delete(
    `/api/v1/portal/${encodeURIComponent(communityId)}/members/${encodeURIComponent(memberId)}`,
  );
}
