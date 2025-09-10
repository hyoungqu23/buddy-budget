'use client';
import * as React from 'react';

type InfiniteListProps<T> = {
  pages: { items: T[]; nextCursor: string | null }[] | undefined;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean | undefined;
  onLoadMore: () => void;
  sentinelRef: React.RefObject<HTMLDivElement>;
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyText?: string;
};

export function InfiniteList<T>(props: InfiniteListProps<T>) {
  const {
    pages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    onLoadMore,
    sentinelRef,
    renderItem,
    emptyText,
  } = props;

  const items = pages?.flatMap((p) => p.items) ?? [];

  return (
    <div className='flex flex-col gap-3'>
      {isLoading && items.length === 0 ? (
        <div role='status' aria-live='polite' className='text-sm text-muted-foreground'>
          불러오는 중…
        </div>
      ) : items.length === 0 ? (
        <div className='text-sm text-muted-foreground'>{emptyText ?? '항목이 없습니다.'}</div>
      ) : (
        items.map((it, idx) => <React.Fragment key={idx}>{renderItem(it, idx)}</React.Fragment>)
      )}

      <div ref={sentinelRef} aria-hidden='true' />

      {hasNextPage && (
        <button
          type='button'
          className='self-center rounded-md border px-3 py-2 text-sm disabled:opacity-50'
          onClick={onLoadMore}
          disabled={isFetchingNextPage}
          aria-live='polite'
        >
          {isFetchingNextPage ? '더 불러오는 중…' : '더 보기'}
        </button>
      )}
    </div>
  );
}
