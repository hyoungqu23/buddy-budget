'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import type { Category } from '@/db/schema';
import type { PageResult } from '@/hooks/use-infinite-scroll';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

type BudgetProgress = {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string | null;
  month: string;
  limit: number;
  spent: number;
  remaining: number;
};

type Actions = {
  listAction: (args: { slug: string; month: string }) => Promise<BudgetProgress[]>;
  upsertAction: (
    slug: string,
    input: { categoryId: string; month: string; amount: number },
  ) => Promise<{ id: string }>;
  deleteAction: (
    slug: string,
    input: { categoryId: string; month: string },
  ) => Promise<{ id: string } | null>;
  listCategories: (args: {
    slug: string;
    cursor?: string | null;
    limit?: number;
    q?: string;
    kind?: 'expense' | 'income';
  }) => Promise<PageResult<Pick<Category, 'id' | 'name' | 'kind' | 'color'>>>;
  listHistory?: (
    slug: string,
    input: { categoryId: string; month?: string },
  ) => Promise<
    | { prevAmount: number | null; newAmount: number; changedAt: Date }[]
    | { budgetId: string; prevAmount: number | null; newAmount: number; changedAt: Date }[]
  >;
};

type Props = {
  slug: string;
  actions: Actions;
};

const yyyymm = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const BudgetsClient = ({ slug, actions }: Props) => {
  const qc = useQueryClient();
  const router = useRouter();
  const search = useSearchParams();
  const initialMonth = search.get('month') || yyyymm(new Date());
  const [month, setMonth] = React.useState<string>(initialMonth);
  const [q, setQ] = React.useState('');
  const [isAdding, setIsAdding] = React.useState(false);
  const [pendingMap, setPendingMap] = React.useState<Record<string, boolean>>({});

  // URL ?month=YYYY-MM 동기화
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('month') !== month) {
      sp.set('month', month);
      router.replace(`?${sp.toString()}`);
    }
  }, [month, router]);

  // Fetch budgets for month
  const budgetsQuery = useQuery({
    queryKey: ['budgets', slug, month],
    queryFn: () => actions.listAction({ slug, month }),
    placeholderData: (prev) => prev,
  });

  // Fetch all expense categories (paged) once
  const categoriesQuery = useQuery({
    queryKey: ['categories', slug, 'expense', 'all'],
    queryFn: async () => {
      let cursor: string | null = null;
      const items: { id: string; name: string; kind: 'expense' | 'income'; color: string }[] = [];
      for (let i = 0; i < 20; i++) {
        const page = await actions.listCategories({ slug, cursor, limit: 50, kind: 'expense' });
        items.push(...page.items);
        if (!page.nextCursor) break;
        cursor = page.nextCursor;
      }
      return items;
    },
  });

  const categories = React.useMemo(() => {
    const all = categoriesQuery.data || [];
    const filtered = q.trim()
      ? all.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()))
      : all;
    return filtered;
  }, [categoriesQuery.data, q]);

  const existingCategoryIds = new Set((budgetsQuery.data || []).map((b) => b.categoryId));
  const candidateCategories = categories.filter((c) => !existingCategoryIds.has(c.id));

  // Optimistic upsert/delete
  const upsertMutation = useMutation({
    mutationFn: async (vars: { categoryId: string; amount: number }) =>
      actions.upsertAction(slug, { categoryId: vars.categoryId, month, amount: vars.amount }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['budgets', slug, month] });
      const prev = qc.getQueryData<BudgetProgress[]>(['budgets', slug, month]);
      if (prev) {
        const exists = prev.some((b) => b.categoryId === vars.categoryId);
        const baseCat = categories.find((c) => c.id === vars.categoryId);
        const next = exists
          ? prev.map((b) =>
              b.categoryId === vars.categoryId
                ? { ...b, limit: vars.amount, remaining: vars.amount - b.spent }
                : b,
            )
          : [
              ...prev,
              {
                budgetId: 'temp',
                categoryId: vars.categoryId,
                categoryName: baseCat?.name || '',
                categoryColor: baseCat?.color || '#999999',
                categoryIcon: null,
                month,
                limit: vars.amount,
                spent: 0,
                remaining: vars.amount,
              },
            ];
        qc.setQueryData(['budgets', slug, month], next);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['budgets', slug, month], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['budgets', slug, month] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (vars: { categoryId: string }) =>
      actions.deleteAction(slug, { categoryId: vars.categoryId, month }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['budgets', slug, month] });
      const prev = qc.getQueryData<BudgetProgress[]>(['budgets', slug, month]);
      if (prev) {
        qc.setQueryData(
          ['budgets', slug, month],
          prev.filter((b) => b.categoryId !== vars.categoryId),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['budgets', slug, month], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['budgets', slug, month] }),
  });

  const copyFromPrev = async () => {
    const [y, m] = month.split('-').map(Number);
    const prevDate = new Date(y, (m || 1) - 2, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    const prevBudgets = await actions.listAction({ slug, month: prevMonth });
    const current = budgetsQuery.data || [];
    const currentIds = new Set(current.map((b) => b.categoryId));
    const targets = prevBudgets.filter((b) => !currentIds.has(b.categoryId));
    if (targets.length === 0) {
      toast({ description: '복사할 예산이 없습니다.' });
      return;
    }
    for (const t of targets) {
      await upsertMutation.mutateAsync({ categoryId: t.categoryId, amount: t.limit });
    }
    toast({ description: '이전 달 예산을 복사했어요.' });
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <label className='text-sm text-muted-foreground'>월 선택</label>
        <Input
          type='month'
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className='w-[160px]'
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='카테고리 검색'
          className='ml-auto max-w-xs'
        />
        <ConfirmDialog
          title='지난 달 예산 복사'
          description='현재 월에 없는 항목만 이전 달 예산 한도를 복사합니다.'
          onConfirm={copyFromPrev}
          trigger={<Button type='button'>지난 달 복사</Button>}
        />
      </div>

      {/* 추가 폼 */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>예산 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className='flex flex-wrap items-center gap-2'
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget as HTMLFormElement);
              const categoryId = String(fd.get('categoryId') || '');
              const amount = Number(fd.get('amount') || 0);
              try {
                setIsAdding(true);
                await upsertMutation.mutateAsync({ categoryId, amount });
                toast({ description: '예산을 저장했어요.' });
                (e.currentTarget as HTMLFormElement).reset();
              } catch (err) {
                const msg = err instanceof Error ? err.message : '저장 중 오류가 발생했어요';
                toast({ description: msg });
              } finally {
                setIsAdding(false);
              }
            }}
          >
            <select
              name='categoryId'
              className='h-10 min-w-40 rounded-md border bg-background px-3 text-sm'
              required
              defaultValue=''
            >
              <option value='' disabled>
                카테고리 선택(지출)
              </option>
              {candidateCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Input
              name='amount'
              placeholder='0.00'
              type='number'
              step='0.01'
              min={0.01}
              inputMode='decimal'
              className='w-32'
            />
            <Button type='submit' disabled={isAdding}>
              {isAdding ? '저장 중…' : '추가'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 목록 */}
      <div className='space-y-3'>
        {(budgetsQuery.data || []).map((b) => {
          const ratio = b.limit > 0 ? b.spent / b.limit : 0;
          const percent = b.limit > 0 ? Math.min(100, Math.round(ratio * 100)) : 0;
          const tone = ratio >= 1 ? 'danger' : ratio >= 0.8 ? 'warning' : 'normal';
          return (
            <Card key={b.categoryId}>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  <span className='flex items-center gap-2'>
                    <span
                      className='inline-block size-3 rounded-full'
                      style={{ background: b.categoryColor }}
                    />
                    {b.categoryName}
                  </span>
                  <span
                    className={
                      'text-xs ' + (ratio >= 1 ? 'text-destructive' : 'text-muted-foreground')
                    }
                  >
                    {b.spent.toLocaleString('ko-KR')} / {b.limit.toLocaleString('ko-KR')} 원
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <Progress value={percent} tone={tone} />
                <div className='flex flex-wrap items-center gap-2'>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget as HTMLFormElement);
                      const amount = Number(fd.get('amount') || 0);
                      try {
                        setPendingMap((m) => ({ ...m, [b.categoryId]: true }));
                        await upsertMutation.mutateAsync({ categoryId: b.categoryId, amount });
                        toast({ description: '예산을 수정했어요.' });
                      } catch (err) {
                        const msg =
                          err instanceof Error ? err.message : '수정 중 오류가 발생했어요';
                        toast({ description: msg });
                      } finally {
                        setPendingMap((m) => ({ ...m, [b.categoryId]: false }));
                      }
                    }}
                    className='flex items-center gap-2'
                  >
                    <Input
                      name='amount'
                      defaultValue={b.limit}
                      type='number'
                      step='0.01'
                      min={0.01}
                      inputMode='decimal'
                      className='w-32'
                    />
                    <Button type='submit' variant='secondary' disabled={!!pendingMap[b.categoryId]}>
                      {pendingMap[b.categoryId] ? '저장 중…' : '수정'}
                    </Button>
                  </form>
                  {actions.listHistory && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button type='button' variant='ghost'>
                          이력
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{b.categoryName} 이력</DialogTitle>
                        </DialogHeader>
                        <HistoryList
                          slug={slug}
                          categoryId={b.categoryId}
                          month={month}
                          fetch={actions.listHistory}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                  <ConfirmDialog
                    title='예산 삭제'
                    description='삭제하면 되돌릴 수 없어요.'
                    onConfirm={async () => {
                      try {
                        setPendingMap((m) => ({ ...m, [b.categoryId]: true }));
                        await deleteMutation.mutateAsync({ categoryId: b.categoryId });
                        toast({ description: '예산을 삭제했어요.' });
                      } catch (err) {
                        const msg =
                          err instanceof Error ? err.message : '삭제 중 오류가 발생했어요';
                        toast({ description: msg });
                      } finally {
                        setPendingMap((m) => ({ ...m, [b.categoryId]: false }));
                      }
                    }}
                    trigger={
                      <Button
                        type='button'
                        variant='destructive'
                        disabled={!!pendingMap[b.categoryId]}
                      >
                        {pendingMap[b.categoryId] ? '처리 중…' : '삭제'}
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
        {budgetsQuery.isLoading && (
          <div className='space-y-2'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='space-y-2'>
                <div className='h-4 w-1/3 animate-pulse rounded bg-muted' />
                <div className='h-2 w-full animate-pulse rounded bg-muted' />
              </div>
            ))}
          </div>
        )}
        {!budgetsQuery.isLoading && budgetsQuery.data?.length === 0 && (
          <p className='text-sm text-muted-foreground'>
            현재 월에 설정된 예산이 없습니다. 위에서 추가해보세요.
          </p>
        )}
      </div>
    </div>
  );
};

export default BudgetsClient;

// 이력 리스트 컴포넌트
function HistoryList({
  slug,
  categoryId,
  month,
  fetch,
}: {
  slug: string;
  categoryId: string;
  month: string;
  fetch: NonNullable<Actions['listHistory']>;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['budget-history', slug, categoryId, month],
    queryFn: () => fetch(slug, { categoryId, month }),
  });
  if (isLoading) return <p className='text-sm text-muted-foreground'>불러오는 중…</p>;
  if (error) return <p className='text-sm text-destructive'>이력을 불러오지 못했어요.</p>;
  const items = (data as any[]) || [];
  if (items.length === 0) return <p className='text-sm text-muted-foreground'>이력이 없습니다.</p>;
  return (
    <div className='space-y-2'>
      {items.map((it, idx) => (
        <div key={idx} className='flex items-center justify-between text-sm'>
          <span>
            {it.prevAmount === null ? '신규' : Number(it.prevAmount).toLocaleString('ko-KR')} →{' '}
            {Number(it.newAmount).toLocaleString('ko-KR')}
          </span>
          <span className='text-muted-foreground'>
            {new Date(it.changedAt).toLocaleString('ko-KR')}
          </span>
        </div>
      ))}
    </div>
  );
}
