import { db } from "@/lib/db";

// ─── Tag serialisation ────────────────────────────────────────────────────────

function serializeTags(tags: string[]): string {
  return JSON.stringify(tags);
}

function deserializeTags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Fallback: treat legacy comma-separated values gracefully
    return raw.split(",").filter(Boolean);
  }
}

// ─── User ────────────────────────────────────────────────────────────────────

export async function createUser(data: {
  name?: string;
  email: string;
  password?: string;
}) {
  return db.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: data.password,
    },
  });
}

// ─── Links ───────────────────────────────────────────────────────────────────

export type LinkWithTags = {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  category: string | null;
  tags: string[];
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

export async function addLink(data: {
  userId: string;
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  tags?: string[];
  summary?: string;
}) {
  return db.link.create({
    data: {
      userId: data.userId,
      url: data.url,
      title: data.title,
      description: data.description,
      thumbnail: data.thumbnail,
      category: data.category,
      tags: data.tags ? serializeTags(data.tags) : null,
      summary: data.summary,
    },
  });
}

export async function getUserLinks(userId: string) {
  const links = await db.link.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return links.map((link) => ({
    ...link,
    tags: deserializeTags(link.tags),
  }));
}

/** Returns the N most recently saved links for a user. */
export async function getRecentLinks(
  userId: string,
  limit: number = 10
): Promise<LinkWithTags[]> {
  const links = await db.link.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return links.map((link) => ({ ...link, tags: deserializeTags(link.tags) }));
}

/**
 * Returns "Today's Picks": links saved in the last 7 days that have not been
 * clicked (no Engagement row) or are in a high-priority category.
 * Returns up to `limit` results, newest first.
 */
export async function getTodaysPicks(
  userId: string,
  limit: number = 10
): Promise<LinkWithTags[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const highPriorityCategories = [
    "Technology",
    "Science",
    "Education",
    "Programming",
    "Research",
  ];

  const links = await db.link.findMany({
    where: {
      userId,
      OR: [
        // Not clicked at all
        { engagements: { none: {} } },
        // Saved recently
        { createdAt: { gte: sevenDaysAgo } },
        // High-priority category
        { category: { in: highPriorityCategories } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return links.map((link) => ({ ...link, tags: deserializeTags(link.tags) }));
}

/**
 * Returns all links for a user grouped by category.
 * The result is a map of category name → links array.
 */
export async function getLinksByCategory(
  userId: string
): Promise<Record<string, LinkWithTags[]>> {
  const links = await db.link.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const grouped: Record<string, LinkWithTags[]> = {};
  for (const link of links) {
    const cat = link.category ?? "Uncategorized";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ ...link, tags: deserializeTags(link.tags) });
  }
  return grouped;
}

/**
 * Returns links that have had no opened Notification in the last `days` days.
 * "Forgotten" means the user hasn't interacted with the link within the window.
 */
export async function getForgottenLinks(userId: string, days: number = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const links = await db.link.findMany({
    where: {
      userId,
      // Exclude links that have at least one opened notification after the cutoff
      NOT: {
        notifications: {
          some: {
            opened: true,
            sentAt: { gte: cutoff },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return links.map((link) => ({
    ...link,
    tags: deserializeTags(link.tags),
  }));
}
