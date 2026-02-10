import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AgentLayoutClient from "./AgentLayoutClient";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { role?: string; name?: string; email?: string };
  if (user.role !== "agent" && user.role !== "admin" && user.role !== "agency_admin") {
    redirect("/dashboard");
  }

  return <AgentLayoutClient userName={user.name || "Agent"}>{children}</AgentLayoutClient>;
}
