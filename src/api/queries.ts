import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as direct from "./supabase-direct";
import { getPageInsights } from "./analytics";
import type { AnalyticsRange } from "@/analytics/analytics-range";

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
  profile: ["profile"] as const,
  orgs: ["orgs"] as const,
  platformAdmin: ["platform-admin"] as const,
  pageLinks: (id: string) => ["page-links", id] as const,
  insights: (id: string, range: string) => ["insights", id, range] as const,
};

/**
 * A page's analytics. Read straight from the database with the signed-in
 * user's client — see src/api/analytics.ts for why that needs no backend.
 *
 * Kept fresh for a minute: view events arrive whenever somebody opens the
 * page, so a stale cache here is misleading in a way a stale page list is not.
 */
export function usePageInsights(id: string | undefined, range: AnalyticsRange) {
  return useQuery({
    queryKey: keys.insights(id ?? "", range),
    queryFn: () => getPageInsights(id as string, range),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function usePageLinks(pitchPageId: string | undefined) {
  return useQuery({
    queryKey: keys.pageLinks(pitchPageId ?? ""),
    queryFn: () => direct.listPageLinks(pitchPageId as string),
    enabled: Boolean(pitchPageId),
  });
}

export function useCreatePageLink(pitchPageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (label: string) => direct.createPageLink(pitchPageId, label),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.pageLinks(pitchPageId) }),
  });
}

export function useDeletePageLink(pitchPageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => direct.deletePageLink(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.pageLinks(pitchPageId) }),
  });
}

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
    },
  });
}
