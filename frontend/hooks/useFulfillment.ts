"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmWinner,
  dispatchPrize,
  getFulfillmentList,
  markDelivered,
} from "@/services/fulfillment.service";
import type {
  ConfirmWinnerPayload,
  DispatchPrizePayload,
  FulfillmentFilters,
  FulfillmentStatus,
} from "@/types/fulfillment.types";

type QueryFilters = {
  status: FulfillmentStatus | "";
  storeLocation: string;
  search: string;
  page: number;
  limit: number;
};

export function useFulfillment(filters: QueryFilters, accessToken?: string | null, enabled = true) {
  const queryClient = useQueryClient();
  const queryFilters = useMemo<FulfillmentFilters>(
    () => ({
      status: filters.status,
      storeLocation: filters.storeLocation,
      search: filters.search,
      page: filters.page,
      limit: filters.limit,
    }),
    [filters.limit, filters.page, filters.search, filters.status, filters.storeLocation]
  );

  const listQuery = useQuery({
    queryKey: ["fulfillment-list", queryFilters],
    queryFn: ({ signal }) => getFulfillmentList(queryFilters, accessToken, signal),
    placeholderData: (previousData) => previousData,
    enabled,
  });

  const invalidateList = () => queryClient.invalidateQueries({ queryKey: ["fulfillment-list"] });

  const confirmMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ConfirmWinnerPayload }) =>
      confirmWinner(id, payload, accessToken),
    onSuccess: invalidateList,
  });

  const dispatchMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DispatchPrizePayload }) =>
      dispatchPrize(id, payload, accessToken),
    onSuccess: invalidateList,
  });

  const deliverMutation = useMutation({
    mutationFn: (id: number) => markDelivered(id, accessToken),
    onSuccess: invalidateList,
  });

  return {
    listQuery,
    confirmMutation,
    dispatchMutation,
    deliverMutation,
  };
}
