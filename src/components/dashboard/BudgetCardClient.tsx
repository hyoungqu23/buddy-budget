'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

type Props = {
  slug: string;
  actions: {
    listAction: (args: { slug: string; month: string }) => Promise<BudgetProgress[]>;
  };
};

const yyyymm = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const addMonths = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return yyyymm(d);
};

const BudgetCardClient = ({ slug, actions }: Props) => {
  const qc = useQueryClient();
  const router = useRouter();
  const search = useSearchParams();
  const initialMonth = search.get('month') || yyyymm(new Date());
  const [month, setMonth] = React.useState<string>(initialMonth);

  // URL ?month 동기화
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('month') !== month) {
      sp.set('month', month);
      router.replace(`?${sp.toString()}`);
    }
  }, [month, router]);

  const query = useQuery({
    queryKey: ['budgets', slug, month],
    queryFn: () => actions.listAction({ slug, month }),
    placeholderData: (prev) => prev,
  });

  const budgets = query.data || [];
  const totalLimit = budgets.reduce((s, b) => s + (b.limit || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);
  const totalPercent =
    totalLimit > 0 ? Math.min(100, Math.round((totalSpent / totalLimit) * 100)) : 0;

  const prefetchMonth = React.useCallback(
    async (target: string) => {
      await qc.prefetchQuery({
        queryKey: ['budgets', slug, target],
        queryFn: () => actions.listAction({ slug, month: target }),
      });
    },
    [qc, slug, actions],
  );

  return (
    <Card className='w-full'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-h4 md:text-h3'>예산 집행률</CardTitle>
        <div className='flex items-center gap-2'>
          <Button
            type='button'
            variant='secondary'
            onClick={() => setMonth((m) => addMonths(m, -1))}
            onMouseEnter={() => prefetchMonth(addMonths(month, -1))}
          >
            이전
          </Button>
          <input
            type='month'
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className='h-10 rounded-md border bg-background px-2 text-sm'
          />
          <Button
            type='button'
            variant='secondary'
            onClick={() => setMonth((m) => addMonths(m, 1))}
            onMouseEnter={() => prefetchMonth(addMonths(month, 1))}
          >
            다음
          </Button>
        </div>
        <a
          href={`./settings/budgets?month=${month}`}
          className='ml-2 text-sm text-muted-foreground underline-offset-4 hover:underline'
        >
          예산 관리로 이동
        </a>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* 합계 요약 */}
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>총 집행률</span>
          <span className='text-muted-foreground'>
            {totalSpent.toLocaleString('ko-KR')} / {totalLimit.toLocaleString('ko-KR')} 원
          </span>
        </div>
        <Progress value={totalPercent} />

        {query.isLoading && (
          <div className='space-y-2'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='space-y-2'>
                <div className='h-4 w-1/3 animate-pulse rounded bg-muted' />
                <div className='h-2 w-full animate-pulse rounded bg-muted' />
              </div>
            ))}
          </div>
        )}

        {!query.isLoading && budgets.length === 0 && (
          <p className='text-sm text-muted-foreground'>해당 월에 설정된 예산이 없습니다.</p>
        )}
        {budgets.map((b) => {
          const ratio = b.limit > 0 ? b.spent / b.limit : 0;
          const percent = b.limit > 0 ? Math.min(100, Math.round(ratio * 100)) : 0;
          const tone = ratio >= 1 ? 'danger' : ratio >= 0.8 ? 'warning' : 'normal';
          return (
            <div key={b.categoryId} className='space-y-1'>
              <div className='flex items-center justify-between text-sm'>
                <span className='flex items-center gap-2'>
                  <span
                    className='inline-block size-3 rounded-full'
                    style={{ background: b.categoryColor }}
                  />
                  {b.categoryName}
                </span>
                <span className={ratio >= 1 ? 'text-destructive' : 'text-muted-foreground'}>
                  {b.spent.toLocaleString('ko-KR')} / {b.limit.toLocaleString('ko-KR')} 원
                </span>
              </div>
              <Progress value={percent} tone={tone} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default BudgetCardClient;
