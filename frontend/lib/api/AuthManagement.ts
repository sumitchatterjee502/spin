import axiosInstance from "@/utils/axiosInstance";
import { extractResponseData } from "@/lib/api/standardResponse";

export async function login(payload: { email: string; password: string }) {
  const { data } = await axiosInstance.post<unknown>("/auth/login", payload);
  return extractResponseData(data);
}

export async function resetPassword(payload: { email: string }) {
  const { data } = await axiosInstance.post<unknown>(
    "/auth/reset-password",
    payload
  );
  return extractResponseData(data);
}
