'use client';
import { InfiniteList } from '@/components/infinite/InfiniteList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Holding } from '@/db/schema';
import { type PageResult, useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { toast } from '@/hooks/use-toast';
import type { HoldingCreateInput, HoldingUpdateInput } from '@/lib/validation/holdings';
import * as React from 'react';

type HoldingListItem = Omit<Holding, 'spaceId' | 'createdAt' | 'updatedAt'>;

type Actions = {
  listAction: (args: {
    slug: string;
    cursor?: string | null;
    limit?: number;
    q?: string;
    type?: Holding['type'];
  }) => Promise<PageResult<HoldingListItem>>;
  createAction: (slug: string, input: HoldingCreateInput) => Promise<{ id: string }>;
  updateAction: (
    slug: string,
    id: string,
    patch: Partial<HoldingUpdateInput>,
  ) => Promise<{ id: string }>;
  deleteAction: (slug: string, id: string) => Promise<{ id: string }>;
};

type Props = {
  slug: string;
  actions: Actions;
};

const HoldingsClient = ({ slug, actions }: Props) => {
  const [q, setQ] = React.useState('');
  const [qDebounced, setQDebounced] = React.useState('');
  const [type, setType] = React.useState<'' | 'bank' | 'card' | 'cash' | 'etc'>('');

  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const fetchPage = React.useCallback(
    (cursor: string | null) =>
      actions.listAction({ slug, cursor, limit: 20, q: qDebounced, type: type || undefined }),
    [slug, qDebounced, type, actions.listAction],
  );
  const query = useInfiniteScroll({ queryKey: ['holdings', slug, qDebounced, type], fetchPage });

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
          onChange={(e) => {
            const v = e.target.value;
            if (v === '' || v === 'bank' || v === 'card' || v === 'cash' || v === 'etc') setType(v);
          }}
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
            try {
              await actions.createAction(slug, {
                name,
                color,
                type,
                currency,
                openingBalance,
              });
              toast({ description: '계정을 추가했어요.' });
              (e.currentTarget as HTMLFormElement).reset();
            } catch (err) {
              const msg = err instanceof Error ? err.message : '생성 중 오류가 발생했어요';
              toast({ description: msg });
            }
          }}
        >
          <Input name='name' placeholder='새 계정' required className='max-w-[200px]' />
          <Input name='color' placeholder='#34C759' required className='w-28' type='color' />
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

      <InfiniteList<HoldingListItem>
        pages={query.pages}
        isLoading={query.isLoading}
        isFetchingNextPage={query.isFetchingNextPage}
        hasNextPage={query.hasNextPage}
        onLoadMore={() => query.fetchNextPage()}
        sentinelRef={query.sentinelRef}
        emptyText='계정이 없습니다.'
        renderItem={(it: HoldingListItem) => (
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
                  try {
                    await actions.updateAction(slug, it.id, { name, color });
                    toast({ description: '계정을 수정했어요.' });
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : '수정 중 오류가 발생했어요';
                    toast({ description: msg });
                  }
                }}
                className='flex gap-2'
              >
                <Input name='name' defaultValue={it.name} className='max-w-[200px]' />
                <Input name='color' defaultValue={it.color} className='w-28' type='color' />
                <Button type='submit' variant='secondary'>
                  수정
                </Button>
              </form>
              <Button
                type='button'
                variant='destructive'
                onClick={async () => {
                  if (!confirm('정말 삭제하시겠어요?')) return;
                  try {
                    await actions.deleteAction(slug, it.id);
                    toast({ description: '계정을 삭제했어요.' });
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : '삭제 중 오류가 발생했어요';
                    toast({ description: msg });
                  }
                }}
              >
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
