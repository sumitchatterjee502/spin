import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/auth-config";
import type { NextRequest } from "next/server";

const handler = (NextAuth as any)(authOptions);

export async function GET(request: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
    return handler(request, context);
}
  
export async function POST(request: NextRequest,context: { params: Promise<{ nextauth: string[] }> }) {
    return handler(request, context);
} 