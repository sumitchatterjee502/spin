"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Sidebar from "./_components/Sidebar";
import UserNavigation from "./_components/UserNavigation";
import TopHeader from "./_components/TopHeader";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const { status } = useSession();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 text-slate-600">
        <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 text-sm text-slate-600">
        Redirecting to sign in…
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <div
            className={`${
                    isCollapsed ? 'w-20' : 'w-64'
                } bg-white transition-all duration-300 ease-in-out border-r border-slate-200 flex flex-col shadow-lg ring-1 ring-slate-200`}
      >
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <UserNavigation />
      </div>
      <main className="flex-1 flex flex-col overflow-hidden">
          <TopHeader/>
          <div className="flex-1 overflow-auto p-4">
              {children}
          </div>
      </main>
    </div>
  );
}
