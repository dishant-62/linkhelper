import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserLinks } from "@/lib/db-helpers";
import LinksClient from "./links-client";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const links = await getUserLinks(session.user.id);

  return (
    <LinksClient
      initialLinks={links}
      userName={session.user.name ?? session.user.email ?? "User"}
    />
  );
}
