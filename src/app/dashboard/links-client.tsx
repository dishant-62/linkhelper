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

type Link = {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  summary: string | null;
  category: string | null;
  tags: string[];
  createdAt: Date;
};

type Props = {
  initialLinks: Link[];
  userName: string;
};

export default function LinksClient({ initialLinks, userName }: Props) {
  const [links, setLinks] = useState<Link[]>(initialLinks);
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

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

    const newLink = (await res.json()) as Link;
    setLinks((prev) => [{ ...newLink, tags: newLink.tags ?? [] }, ...prev]);
    setUrl("");
    setAdding(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLinks((prev) => prev.filter((l) => l.id !== id));
    }
  }

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

      <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">My Links</h1>

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
            {adding ? "Saving…" : "Save"}
          </Button>
        </form>
        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        {/* Links list */}
        {links.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">
            No links yet. Paste a URL above to get started!
          </p>
        ) : (
          <ul className="space-y-4">
            {links.map((link) => (
              <li key={link.id}>
                <Card>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleDelete(link.id)}
                        aria-label="Delete link"
                      >
                        ✕
                      </Button>
                    </div>
                    {link.title && (
                      <CardDescription className="break-all">
                        {link.url}
                      </CardDescription>
                    )}
                  </CardHeader>
                  {(link.summary || link.description || link.tags.length > 0) && (
                    <CardContent className="pt-0 space-y-2">
                      {link.summary && (
                        <p className="text-sm text-muted-foreground">
                          {link.summary}
                        </p>
                      )}
                      {!link.summary && link.description && (
                        <p className="text-sm text-muted-foreground">
                          {link.description}
                        </p>
                      )}
                      {link.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {link.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
