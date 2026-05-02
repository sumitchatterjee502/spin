import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import ReduxProvider from "@/providers/redux-provider";
import QueryProvider from "@/providers/query-provider";
import SessionProvider from "@/providers/session-provider";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Next.js admin starter architecture",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <QueryProvider>
            <ReduxProvider>
              {children}
              <Toaster richColors position="top-right" />
            </ReduxProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
