"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LinkWithTags } from "@/lib/db-helpers";

type Props = {
  todaysPicks: LinkWithTags[];
  recentLinks: LinkWithTags[];
  linksByCategory: Record<string, LinkWithTags[]>;
  forgottenGems: LinkWithTags[];
  userName: string;
};

// ─── Shared link card ─────────────────────────────────────────────────────────

function LinkCard({
  link,
  onDelete,
}: {
  link: LinkWithTags;
  onDelete?: (id: string) => void;
}) {
  return (
    <Card className="h-full flex flex-col">
      {link.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={link.thumbnail}
          alt={link.title ?? "Link thumbnail"}
          className="w-full h-36 object-cover rounded-t-lg"
        />
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline break-all"
            >
              {link.title ?? link.url}
            </a>
          </CardTitle>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => onDelete(link.id)}
              aria-label="Delete link"
            >
              ✕
            </Button>
          )}
        </div>
        {link.title && (
          <CardDescription className="break-all text-xs">
            {link.url}
          </CardDescription>
        )}
      </CardHeader>
      {(link.summary || link.description || link.tags.length > 0) && (
        <CardContent className="pt-0 space-y-2 flex-1">
          {link.summary && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {link.summary}
            </p>
          )}
          {!link.summary && link.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {link.description}
            </p>
          )}
          {link.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {link.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Cards grid ───────────────────────────────────────────────────────────────

function LinksGrid({
  links,
  emptyMessage,
  onDelete,
}: {
  links: LinkWithTags[];
  emptyMessage: string;
  onDelete?: (id: string) => void;
}) {
  if (links.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">{emptyMessage}</p>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {links.map((link) => (
        <LinkCard key={link.id} link={link} onDelete={onDelete} />
      ))}
    </div>
  );
}

// ─── Main client component ───────────────────────────────────────────────────

export default function DashboardClient({
  todaysPicks: initialTodaysPicks,
  recentLinks: initialRecentLinks,
  linksByCategory: initialLinksByCategory,
  forgottenGems: initialForgottenGems,
  userName,
}: Props) {
  const [todaysPicks, setTodaysPicks] =
    useState<LinkWithTags[]>(initialTodaysPicks);
  const [recentLinks, setRecentLinks] =
    useState<LinkWithTags[]>(initialRecentLinks);
  const [linksByCategory, setLinksByCategory] = useState<
    Record<string, LinkWithTags[]>
  >(initialLinksByCategory);
  const [forgottenGems, setForgottenGems] =
    useState<LinkWithTags[]>(initialForgottenGems);

  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  function removeFromAllSections(id: string) {
    setTodaysPicks((prev) => prev.filter((l) => l.id !== id));
    setRecentLinks((prev) => prev.filter((l) => l.id !== id));
    setForgottenGems((prev) => prev.filter((l) => l.id !== id));
    setLinksByCategory((prev) => {
      const updated: Record<string, LinkWithTags[]> = {};
      for (const [cat, links] of Object.entries(prev)) {
        updated[cat] = links.filter((l) => l.id !== id);
      }
      return updated;
    });
  }

  function addToSections(link: LinkWithTags) {
    setRecentLinks((prev) => [link, ...prev]);
    setTodaysPicks((prev) => [link, ...prev]);
    setLinksByCategory((prev) => {
      const cat = link.category ?? "Uncategorized";
      return { ...prev, [cat]: [link, ...(prev[cat] ?? [])] };
    });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setError("");
    setAdding(true);

    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim() }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Failed to save link.");
      setAdding(false);
      return;
    }

    const newLink = (await res.json()) as LinkWithTags;
    addToSections({ ...newLink, tags: newLink.tags ?? [] });
    setUrl("");
    setAdding(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
    if (res.ok) removeFromAllSections(id);
  }

  const categoryNames = Object.keys(linksByCategory).sort();

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-foreground">LinkHelper</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {userName}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </Button>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* Add link form */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-8">
          <Input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" disabled={adding}>
            {adding ? "Saving…" : "Save Link"}
          </Button>
        </form>
        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        {/* Tabs */}
        <Tabs defaultValue="picks">
          <TabsList className="mb-6">
            <TabsTrigger value="picks">⭐ Today&apos;s Picks</TabsTrigger>
            <TabsTrigger value="recent">🕐 Recently Saved</TabsTrigger>
            <TabsTrigger value="categories">🗂 Categories</TabsTrigger>
            <TabsTrigger value="forgotten">💎 Forgotten Gems</TabsTrigger>
          </TabsList>

          {/* Today's Picks */}
          <TabsContent value="picks">
            <p className="text-sm text-muted-foreground mb-4">
              Links you haven&apos;t visited yet or that match high-priority
              topics.
            </p>
            <LinksGrid
              links={todaysPicks}
              emptyMessage="No picks today. Save some links to get started!"
              onDelete={handleDelete}
            />
          </TabsContent>

          {/* Recently Saved */}
          <TabsContent value="recent">
            <p className="text-sm text-muted-foreground mb-4">
              Your 10 most recently saved links.
            </p>
            <LinksGrid
              links={recentLinks}
              emptyMessage="No links saved yet. Paste a URL above!"
              onDelete={handleDelete}
            />
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories">
            {categoryNames.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">
                No categories yet. Save and process some links to see them here.
              </p>
            ) : (
              <div className="space-y-8">
                {categoryNames.map((cat) => (
                  <section key={cat}>
                    <div className="flex items-center gap-2 mb-3">
                      <h2 className="text-lg font-semibold">{cat}</h2>
                      <Badge variant="secondary">
                        {linksByCategory[cat].length}
                      </Badge>
                    </div>
                    <LinksGrid
                      links={linksByCategory[cat]}
                      emptyMessage=""
                      onDelete={handleDelete}
                    />
                  </section>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Forgotten Gems */}
          <TabsContent value="forgotten">
            <p className="text-sm text-muted-foreground mb-4">
              Links saved more than 30 days ago that you haven&apos;t revisited.
            </p>
            <LinksGrid
              links={forgottenGems}
              emptyMessage="No forgotten gems — you're on top of everything! 🎉"
              onDelete={handleDelete}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
