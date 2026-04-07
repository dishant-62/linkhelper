import { db } from "@/lib/db";

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
      // tags are stored as a comma-separated string (SQLite has no array type)
      tags: data.tags ? data.tags.join(",") : null,
      summary: data.summary,
    },
  });
}

export async function getUserLinks(userId: string) {
  const links = await db.link.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // Deserialise tags back to string[]
  return links.map((link) => ({
    ...link,
    tags: link.tags ? link.tags.split(",").filter(Boolean) : [],
  }));
}

/**
 * Returns links that have had no Notification opened in the last `days` days.
 * "Forgotten" means the user hasn't interacted with the link (no opened
 * notification) within the given window.
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
    tags: link.tags ? link.tags.split(",").filter(Boolean) : [],
  }));
}
