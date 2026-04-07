import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        LinkHelper
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        Save, organize, and rediscover your links — powered by AI summaries and
        smart reminders so bookmarks never get forgotten again.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/auth/register">Get started free</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/auth/login">Sign in</Link>
        </Button>
      </div>

      <div className="mt-20 grid max-w-3xl grid-cols-1 gap-8 text-left sm:grid-cols-3">
        <div>
          <h2 className="font-semibold text-foreground">📌 Save links</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bookmark any URL in one click and keep everything in one place.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-foreground">🤖 AI summaries</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Automatically generate summaries and tags so you always know what a
            link is about.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-foreground">🔔 Rediscover</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Get reminded about forgotten links before they slip through the
            cracks.
          </p>
        </div>
      </div>
    </main>
  );
}

