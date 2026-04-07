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
