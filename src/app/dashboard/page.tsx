import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getTodaysPicks,
  getRecentLinks,
  getLinksByCategory,
  getForgottenLinks,
} from "@/lib/db-helpers";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const userId = session.user.id;

  const [todaysPicks, recentLinks, linksByCategory, forgottenGems] =
    await Promise.all([
      getTodaysPicks(userId),
      getRecentLinks(userId, 10),
      getLinksByCategory(userId),
      getForgottenLinks(userId, 30),
    ]);

  return (
    <DashboardClient
      todaysPicks={todaysPicks}
      recentLinks={recentLinks}
      linksByCategory={linksByCategory}
      forgottenGems={forgottenGems}
      userName={session.user.name ?? session.user.email ?? "User"}
    />
  );
}
