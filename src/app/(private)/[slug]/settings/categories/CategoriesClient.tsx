'use client';
import { InfiniteList } from '@/components/infinite/InfiniteList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Category } from '@/db/schema';
import { type PageResult, useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { toast } from '@/hooks/use-toast';
import type { CategoryCreateInput, CategoryUpdateInput } from '@/lib/validation/categories';
import * as React from 'react';

type CategoryListItem = Pick<Category, 'id' | 'name' | 'color' | 'kind'>;

type Actions = {
  listAction: (args: {
    slug: string;
    cursor?: string | null;
    limit?: number;
    q?: string;
    kind?: 'expense' | 'income';
  }) => Promise<PageResult<CategoryListItem>>;
  createAction: (slug: string, input: CategoryCreateInput) => Promise<{ id: string }>;
  updateAction: (
    slug: string,
    id: string,
    patch: Partial<CategoryUpdateInput>,
  ) => Promise<{ id: string }>;
  deleteAction: (slug: string, id: string) => Promise<{ id: string }>;
};

type Props = {
  slug: string;
  actions: Actions;
};

const CategoriesClient = ({ slug, actions }: Props) => {
  const [q, setQ] = React.useState('');
  const [qDebounced, setQDebounced] = React.useState('');
  const [kind, setKind] = React.useState<'' | 'expense' | 'income'>('');

  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const fetchPage = React.useCallback(
    (cursor: string | null) =>
      actions.listAction({ slug, cursor, limit: 20, q: qDebounced, kind: kind || undefined }),
    [slug, qDebounced, kind, actions.listAction],
  );

  const query = useInfiniteScroll({ queryKey: ['categories', slug, qDebounced, kind], fetchPage });

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='카테고리 검색'
          className='max-w-xs'
        />
        <select
          className='h-10 rounded-md border bg-background px-3 text-sm'
          value={kind}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '' || v === 'expense' || v === 'income') setKind(v);
          }}
        >
          <option value=''>전체</option>
          <option value='expense'>지출</option>
          <option value='income'>수입</option>
        </select>
        <form
          className='ml-auto flex gap-2'
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget as HTMLFormElement);
            const name = String(fd.get('name') || '');
            const color = String(fd.get('color') || '');
            const k = String(fd.get('kind') || 'expense') as 'expense' | 'income';
            try {
              await actions.createAction(slug, { name, color, kind: k, icon: undefined });
              toast({ description: '카테고리를 추가했어요.' });
              (e.currentTarget as HTMLFormElement).reset();
            } catch (err) {
              const msg = err instanceof Error ? err.message : '생성 중 오류가 발생했어요';
              toast({ description: msg });
            }
          }}
        >
          <Input name='name' placeholder='새 카테고리' required className='max-w-[200px]' />
          <Input name='color' placeholder='#007AFF' required className='w-28' type='color' />
          <select
            name='kind'
            className='h-10 rounded-md border bg-background px-2 text-sm'
            required
          >
            <option value='expense'>지출</option>
            <option value='income'>수입</option>
          </select>
          <Button type='submit'>추가</Button>
        </form>
      </div>

      <InfiniteList<CategoryListItem>
        pages={query.pages}
        isLoading={query.isLoading}
        isFetchingNextPage={query.isFetchingNextPage}
        hasNextPage={query.hasNextPage}
        onLoadMore={() => query.fetchNextPage()}
        sentinelRef={query.sentinelRef}
        emptyText='카테고리가 없습니다.'
        renderItem={(it: CategoryListItem) => (
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
                <span className='text-xs text-muted-foreground'>{it.kind}</span>
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
                    toast({ description: '카테고리를 수정했어요.' });
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
                    toast({ description: '카테고리를 삭제했어요.' });
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

export default CategoriesClient;
