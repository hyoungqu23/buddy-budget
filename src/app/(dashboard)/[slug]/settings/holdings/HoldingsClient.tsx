'use client';
import { InfiniteList } from '@/components/infinite/InfiniteList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import * as React from 'react';

type PageResult<T> = { items: T[]; nextCursor: string | null };

type ListAction = (args: {
  slug: string;
  cursor?: string | null;
  limit?: number;
  q?: string;
  type?: 'bank' | 'card' | 'cash' | 'etc';
}) => Promise<PageResult<any>>;

type MutateAction<TArgs extends any[]> = (...args: TArgs) => Promise<any>;

type Props = {
  slug: string;
  listAction: ListAction;
  createAction: MutateAction<
    [
      string,
      {
        name: string;
        color: string;
        type: 'bank' | 'card' | 'cash' | 'etc';
        currency?: string;
        openingBalance: number;
      },
    ]
  >;
  updateAction: MutateAction<[string, string, Partial<{ name: string; color: string }>]>;
  deleteAction: MutateAction<[string, string]>;
};

const HoldingsClient = ({ slug, listAction, createAction, updateAction, deleteAction }: Props) => {
  const [q, setQ] = React.useState('');
  const [type, setType] = React.useState<'' | 'bank' | 'card' | 'cash' | 'etc'>('');

  const fetchPage = React.useCallback(
    (cursor: string | null) => listAction({ slug, cursor, limit: 20, q, type: type || undefined }),
    [slug, q, type, listAction],
  );
  const query = useInfiniteScroll({ queryKey: ['holdings', slug, q, type], fetchPage });

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='계정 검색'
          className='max-w-xs'
        />
        <select
          className='h-10 rounded-md border bg-background px-3 text-sm'
          value={type}
          onChange={(e) => setType(e.target.value as any)}
        >
          <option value=''>전체</option>
          <option value='bank'>은행</option>
          <option value='card'>카드</option>
          <option value='cash'>현금</option>
          <option value='etc'>기타</option>
        </select>
        <form
          className='ml-auto flex gap-2'
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget as HTMLFormElement);
            const name = String(fd.get('name') || '');
            const color = String(fd.get('color') || '');
            const type = String(fd.get('type') || '') as 'bank' | 'card' | 'cash' | 'etc';
            const currency = String(fd.get('currency') || 'KRW');
            const openingBalance = Number(fd.get('openingBalance') || 0);
            await createAction(slug, { name, color, type, currency, openingBalance });
            (e.currentTarget as HTMLFormElement).reset();
          }}
        >
          <Input name='name' placeholder='새 계정' required className='max-w-[200px]' />
          <Input name='color' placeholder='#34C759' required className='w-28' />
          <select
            name='type'
            className='h-10 rounded-md border bg-background px-2 text-sm'
            required
          >
            <option value='bank'>은행</option>
            <option value='card'>카드</option>
            <option value='cash'>현금</option>
            <option value='etc'>기타</option>
          </select>
          <Input
            name='openingBalance'
            placeholder='0.00'
            type='number'
            step='0.01'
            className='w-28'
          />
          <Input name='currency' placeholder='KRW' className='w-24' />
          <Button type='submit'>추가</Button>
        </form>
      </div>

      <InfiniteList
        pages={query.data?.pages}
        isLoading={query.isLoading}
        isFetchingNextPage={query.isFetchingNextPage}
        hasNextPage={query.hasNextPage}
        onLoadMore={() => query.fetchNextPage()}
        sentinelRef={query.sentinelRef}
        emptyText='계정이 없습니다.'
        renderItem={(it: any) => (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                <span className='flex items-center gap-2'>
                  <span
                    className='inline-block size-3 rounded-full'
                    style={{ background: it.color }}
                  />
                  {it.name}
                </span>
                <span className='text-xs text-muted-foreground'>{it.type}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='flex gap-2'>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget as HTMLFormElement);
                  const name = String(fd.get('name') || '');
                  const color = String(fd.get('color') || '');
                  await updateAction(slug, it.id, { name, color });
                }}
                className='flex gap-2'
              >
                <Input name='name' defaultValue={it.name} className='max-w-[200px]' />
                <Input name='color' defaultValue={it.color} className='w-28' />
                <Button type='submit' variant='secondary'>
                  수정
                </Button>
              </form>
              <Button type='button' variant='destructive' onClick={() => deleteAction(slug, it.id)}>
                삭제
              </Button>
            </CardContent>
          </Card>
        )}
      />
    </div>
  );
};

export default HoldingsClient;
