import axiosInstance from "@/utils/axiosInstance";
import { extractResponseData } from "@/lib/api/standardResponse";

export async function getUsers() {
  const { data } = await axiosInstance.get<unknown>("/users");
  return extractResponseData(data);
}
