export type Role = "user" | "moderator" | "admin" | "super_admin";
export type AccountStatus = "active" | "disabled" | "blocked";
export type WorkStatus = "draft" | "published" | "flagged" | "archived" | "deleted";
export type Visibility = "public" | "private";
export type ModerationStatus = "clean" | "flagged" | "underReview" | "approved" | "rejected";
export type ShareTarget = "copy_link" | "whatsapp" | "x" | "facebook" | "telegram" | "native_share";

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  /** Signed out visitors only: there are more works, but they are behind signing in. */
  gated?: boolean;
}

export interface Permissions {
  manageUsers: boolean;
  manageRoles: boolean;
  manageCategories: boolean;
  moderateWorks: boolean;
  deleteWorks: boolean;
  permanentlyDeleteWorks: boolean;
  viewAnalytics: boolean;
  managePlatform: boolean;
  /** Admins and super admins only. Create prompts and choose winners. */
  managePrompts: boolean;
}

export interface AuthorSummary {
  username: string;
  displayName: string;
  profilePhotoUrl: string | null;
  /** A super admin has conferred the verification badge. */
  verified: boolean;
}

export interface PublicProfile extends AuthorSummary {
  bio: string;
  coverPhotoUrl: string | null;
  avatarType: "dicebear" | "uploaded";
  createdAt: string;
  accountStatus: AccountStatus;
  stats: { publishedWorks: number; likesReceived: number };
}

export interface PrivateProfile extends PublicProfile {
  email: string | null;
  role: Role;
}

export interface MeResponse {
  profile: PrivateProfile;
  accountStatus: AccountStatus;
  permissions: Permissions;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  isActive: boolean;
  publishedCount?: number;
}

export interface PostableCategory extends CategoryDto {
  canPost: boolean;
}

export interface ModerationInfo {
  status?: string;
  reason?: string | null;
  flaggedBy?: string | null;
  flaggedAt?: string | null;
  flaggedRevisionNumber?: number;
  reviewId?: string | null;
  note?: string | null;
}

export interface WorkDto {
  id: string;
  title: string;
  description: string;
  excerpt: string;
  category: { id: string; name: string; slug: string };
  author: AuthorSummary;
  /** Set when the work was written for a weekly prompt. `placement` is 1 to 3 for winners. */
  prompt?: WorkPromptTag | null;
  coverImageUrl: string | null;
  status: WorkStatus;
  visibility: Visibility;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  chunkCount: number;
  totalBytes: number;
  currentRevisionId?: string;
  moderationStatus?: ModerationStatus;
  moderation?: ModerationInfo | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  viewer: { isAuthor: boolean; liked?: boolean };
}

export interface WorkPromptTag {
  id: string;
  title: string;
  placement: number | null;
}

export type PromptPhase = "draft" | "upcoming" | "open" | "judging" | "completed";

export interface PromptWinner {
  placement: number;
  note: string | null;
  selectedAt: string;
  work: WorkDto;
  /** The winner's public profile, shown on the billboard. */
  profile: PublicProfile | null;
}

export interface PromptDto {
  id: string;
  title: string;
  description: string;
  category: { id: string; name: string; slug: string };
  phase: PromptPhase;
  /** Admin responses only. */
  status?: "draft" | "published";
  startsAt: string;
  endsAt: string;
  maxEntriesPerUser: number;
  winnersAnnouncedAt: string | null;
  publishedAt: string | null;
  createdAt?: string;
  entryCount: number;
  /** Signed in viewers only. */
  viewer?: { entries: number; canEnter: boolean };
  winners: PromptWinner[];
}

export interface Billboard {
  open: PromptDto[];
  upcoming: PromptDto[];
  judging: PromptDto[];
  completed: PromptDto[];
}

export interface ContentPage {
  revisionId?: string;
  chunks: { index: number; content: string }[];
  nextAfter: number | null;
}

export interface RevisionDto {
  id: string;
  revisionNumber: number;
  title: string;
  description: string;
  excerpt: string;
  categoryId: string;
  coverImageUrl: string | null;
  chunkCount: number;
  totalBytes: number;
  createdAt: string;
  createdBy: string;
  changeReason: string | null;
  basedOnRevisionId: string | null;
  restoredFromRevisionId: string | null;
  isCurrent: boolean;
}

export interface DraftStateDto {
  version: number;
  title: string;
  description: string;
  categoryId: string;
  coverImageUrl: string | null;
  chunkCount: number;
  totalBytes: number;
  basedOnRevisionId: string | null;
  updatedAt: string;
}

export interface CommentDto {
  id: string;
  content: string;
  status: "active" | "deleted";
  parentCommentId: string | null;
  replyCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  author: AuthorSummary;
  authorId: string;
}

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body?: string;
  workId?: string;
  read: boolean;
  createdAt: string;
}

export interface PublicSettings {
  maxCommentLength: number;
  maxBioLength: number;
  allowComments: boolean;
  allowLikes: boolean;
  allowSharing: boolean;
  allowRegistration: boolean;
  maintenanceMode: boolean;
  maxWorkSizeBytes: number;
}

export interface PlatformSettings extends PublicSettings {
  contentChunkThresholdBytes: number;
  defaultCategoryPostingAllowed: boolean;
}

/* ---------------------------------- Admin ---------------------------------- */

export interface AdminUser extends PublicProfile {
  id: string;
  email: string | null;
  role: Role;
  permissions: Permissions;
  permissionOverrides: Partial<Permissions>;
  statusReason: string | null;
  verifiedAt: string | null;
}

export interface AuditRow {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ModerationRow {
  id: string;
  work_id: string;
  user_id: string;
  moderator_id: string;
  actor_role: string | null;
  action: string;
  reason: string | null;
  revision_id: string | null;
  created_at: string;
}

export interface ReviewQueueItem {
  /** Same as reviewId. Lets the item work with the shared list hook. */
  id: string;
  reviewId: string;
  revisionId: string;
  requestedAt: string;
  work: WorkDto;
}

export type Granularity = "daily" | "monthly" | "yearly";
export type MetricName = "signups" | "works_created" | "works_published" | "likes" | "comments" | "shares" | "views";
export type SeriesRow = { bucket: string } & Record<MetricName, number>;

export interface Summary {
  totalUsers: number;
  totalWorks: number;
  publishedWorks: number;
  flaggedWorks: number;
  pendingReviews: number;
  moderation: { flagged: number; pendingReview: number; approved: number; rejected: number };
}
