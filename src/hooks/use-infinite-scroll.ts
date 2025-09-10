'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

export type PageResult<T> = { items: T[]; nextCursor: string | null };

type Options<T> = {
  queryKey: ReadonlyArray<string | number>;
  fetchPage: (cursor: string | null) => Promise<PageResult<T>>;
  enabled?: boolean;
};

export const useInfiniteScroll = <T = unknown>({
  queryKey,
  fetchPage,
  enabled = true,
}: Options<T>) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery<
    PageResult<T>,
    Error,
    PageResult<T>,
    ReadonlyArray<string | number>,
    string | null
  >({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam ?? null),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });

  // Normalize pages so consumers don't depend on library internals
  type InfiniteShape = { pages: PageResult<T>[] };
  const dataAny = query.data as unknown;
  const pages: PageResult<T>[] =
    dataAny && typeof dataAny === 'object' && dataAny !== null && 'pages' in dataAny
      ? (dataAny as InfiniteShape).pages
      : query.data
        ? [query.data]
        : [];

  useEffect(() => {
    if (!enabled) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
          }
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enabled, query.hasNextPage, query.isFetchingNextPage, query]);

  return { ...query, sentinelRef, pages };
};
