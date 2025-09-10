'use client';
import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

type PageResult<T> = { items: T[]; nextCursor: string | null };

type Options<TQueryFnData, TError, TData> = Omit<
  UseInfiniteQueryOptions<TQueryFnData, TError, PageResult<TData>, PageResult<TData>, any>,
  'queryKey' | 'getNextPageParam' | 'initialPageParam'
> & {
  queryKey: any[];
  fetchPage: (cursor: string | null) => Promise<PageResult<TData>>;
  enabled?: boolean;
};

export const useInfiniteScroll = <T = unknown>(opts: Options<any, any, T>) => {
  const { queryKey, fetchPage, enabled = true, ...rest } = opts;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage((pageParam as string) ?? null),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
    ...rest,
  });

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

  return { ...query, sentinelRef };
};
