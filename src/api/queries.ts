import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as direct from "./supabase-direct";

/**
 * Query keys and hooks.
 *
 * Everything here currently reads through `supabase-direct`, which is what lets
 * the app work against live accounts before the app API ships. As each API
 * endpoint lands (master plan §9.2), the body of the matching hook swaps over
 * and the screens do not change.
 */

export const keys = {
  pages: ["pages"] as const,
  page: (id: string) => ["page", id] as const,
  credits: ["credits"] as const,
  profile: ["profile"] as const,
  orgs: ["orgs"] as const,
  platformAdmin: ["platform-admin"] as const,
  publishEligibility: (id: string) => ["publish-eligibility", id] as const,
};

export function useMyPages() {
  return useQuery({ queryKey: keys.pages, queryFn: direct.listMyPages });
}

export function useMyPage(id: string | undefined) {
  return useQuery({
    queryKey: keys.page(id ?? ""),
    queryFn: () => direct.getMyPage(id as string),
    enabled: Boolean(id),
  });
}

export function useMyCredits() {
  return useQuery({ queryKey: keys.credits, queryFn: direct.getMyCredits });
}

export function useMyProfile() {
  return useQuery({ queryKey: keys.profile, queryFn: direct.getMyProfile });
}

/** Decides whether the Company tab appears at all (§6.12). */
export function useMyOrgs() {
  return useQuery({ queryKey: keys.orgs, queryFn: direct.getMyOrgs });
}

export function useAmIPlatformAdmin() {
  return useQuery({ queryKey: keys.platformAdmin, queryFn: direct.amIPlatformAdmin });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fullName: string) => direct.createPage(fullName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.pages }),
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => direct.deletePage(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.pages }),
  });
}

export function useUnpublishPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => direct.unpublishPage(id),
    onSuccess: (_result, id) => {
      void queryClient.invalidateQueries({ queryKey: keys.pages });
      void queryClient.invalidateQueries({ queryKey: keys.page(id) });
    },
  });
}

export function usePublishPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => direct.publishPage(id),
    onSuccess: (_result, id) => {
      void queryClient.invalidateQueries({ queryKey: keys.pages });
      void queryClient.invalidateQueries({ queryKey: keys.page(id) });
      // Publishing spends a credit, so the balance on screen is now stale.
      void queryClient.invalidateQueries({ queryKey: keys.credits });
    },
  });
}
