import axiosInstance from "@/utils/axiosInstance";
import { extractResponseData } from "@/lib/api/standardResponse";

export async function getDashboardsSummary() {
  const { data } = await axiosInstance.get<unknown>("/dashboards/summary");
  return extractResponseData(data);
}
