import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/logowanie");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
