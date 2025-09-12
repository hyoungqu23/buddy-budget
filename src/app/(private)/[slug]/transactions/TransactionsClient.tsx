'use client';

import { InfiniteList } from '@/components/infinite/InfiniteList';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageResult, useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { toast } from '@/hooks/use-toast';
import { TransactionCreateInput, TransactionUpdateInput } from '@/lib/validation/transactions';
import * as React from 'react';

type TransactionListItem = {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: string;
  occurredAt: string;
  memo: string | null;
  categoryId: string | null;
  fromHoldingId: string | null;
  toHoldingId: string | null;
};

type Actions = {
  listAction: (args: {
    slug: string;
    cursor?: string | null;
    limit?: number;
    q?: string;
    type?: 'income' | 'expense' | 'transfer' | ('income' | 'expense' | 'transfer')[];
    categoryId?: string;
    holdingId?: string;
    from?: string;
    to?: string;
  }) => Promise<PageResult<TransactionListItem>>;
  createAction: (slug: string, input: TransactionCreateInput) => Promise<{ id: string }>;
  updateAction: (
    slug: string,
    id: string,
    patch: TransactionUpdateInput,
  ) => Promise<{ id: string } | undefined>;
  deleteAction: (slug: string, id: string) => Promise<{ id: string }>;
};

type Option = { id: string; name: string };

type Props = {
  slug: string;
  actions: Actions;
  categories: Option[];
  holdings: Option[];
};

const formatAmount = (
  type: TransactionListItem['type'],
  amount: string,
  locale = 'ko-KR',
  currency = 'KRW',
) => {
  const n = Number(amount);
  const nf = new Intl.NumberFormat(locale, { style: 'currency', currency });
  const abs = nf.format(Math.abs(n));
  const sign = type === 'expense' ? '-' : type === 'income' ? '+' : '';
  return `${sign}${abs}`;
};

const formatDateTime = (iso: string, locale = 'ko-KR') => {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

const TransactionsClient = ({ slug, actions, categories, holdings }: Props) => {
  const [q, setQ] = React.useState('');
  const [qDebounced, setQDebounced] = React.useState('');
  const [type, setType] = React.useState<'' | 'income' | 'expense' | 'transfer'>('');
  const [categoryId, setCategoryId] = React.useState('');
  const [holdingId, setHoldingId] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [createType, setCreateType] = React.useState<'income' | 'expense' | 'transfer'>('expense');

  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const fetchPage = React.useCallback(
    (cursor: string | null) =>
      actions.listAction({
        slug,
        cursor,
        limit: 20,
        q: qDebounced || undefined,
        type: type || undefined,
        categoryId: categoryId || undefined,
        holdingId: holdingId || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
    [slug, actions.listAction, qDebounced, type, categoryId, holdingId, from, to],
  );

  const query = useInfiniteScroll<TransactionListItem>({
    queryKey: ['tx', slug, qDebounced, type, categoryId, holdingId, from, to],
    fetchPage,
  });

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='메모 검색'
          className='max-w-xs'
        />
        <select
          className='h-10 rounded-md border bg-background px-3 text-sm'
          value={type}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '' || v === 'income' || v === 'expense' || v === 'transfer') setType(v);
          }}
        >
          <option value=''>전체</option>
          <option value='income'>수입</option>
          <option value='expense'>지출</option>
          <option value='transfer'>이체</option>
        </select>
        <select
          className='h-10 rounded-md border bg-background px-3 text-sm'
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value=''>카테고리 전체</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className='h-10 rounded-md border bg-background px-3 text-sm'
          value={holdingId}
          onChange={(e) => setHoldingId(e.target.value)}
        >
          <option value=''>계정 전체</option>
          {holdings.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
        <Input type='date' value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type='date' value={to} onChange={(e) => setTo(e.target.value)} />

        <form
          className='ml-auto flex flex-wrap items-center gap-2'
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget as HTMLFormElement);
            const t = String(fd.get('type') || '') as 'income' | 'expense' | 'transfer';
            const amount = Number(fd.get('amount') || 0);
            const occurredAtLocal = String(fd.get('occurredAt') || '');
            const occurredAt = new Date(occurredAtLocal).toISOString();
            const memo = String(fd.get('memo') || '') || undefined;
            const categoryId = String(fd.get('categoryId') || '') || undefined;
            const fromHoldingId = String(fd.get('fromHoldingId') || '') || undefined;
            const toHoldingId = String(fd.get('toHoldingId') || '') || undefined;
            try {
              if (t === 'expense') {
                await actions.createAction(slug, {
                  type: 'expense',
                  amount,
                  occurredAt,
                  memo,
                  categoryId: categoryId!,
                  fromHoldingId: fromHoldingId!,
                });
              } else if (t === 'income') {
                await actions.createAction(slug, {
                  type: 'income',
                  amount,
                  occurredAt,
                  memo,
                  categoryId: categoryId!,
                  toHoldingId: toHoldingId!,
                });
              } else if (t === 'transfer') {
                await actions.createAction(slug, {
                  type: 'transfer',
                  amount,
                  occurredAt,
                  memo,
                  fromHoldingId: fromHoldingId!,
                  toHoldingId: toHoldingId!,
                });
              }
              toast({ description: '거래를 추가했어요.' });
              (e.currentTarget as HTMLFormElement).reset();
              await query.refetch();
            } catch (err) {
              const msg = err instanceof Error ? err.message : '생성 중 오류가 발생했어요';
              toast({ description: msg });
            }
          }}
        >
          <select
            name='type'
            className='h-10 rounded-md border bg-background px-2 text-sm'
            value={createType}
            onChange={(e) => setCreateType(e.target.value as any)}
            required
          >
            <option value='expense'>지출</option>
            <option value='income'>수입</option>
            <option value='transfer'>이체</option>
          </select>
          <Input
            name='amount'
            placeholder='0.00'
            type='number'
            step='0.01'
            className='w-28'
            required
          />
          <Input name='occurredAt' type='datetime-local' className='w-56' required />
          <Input name='memo' placeholder='메모' className='w-40' />
          {createType !== 'transfer' && (
            <select
              name='categoryId'
              className='h-10 rounded-md border bg-background px-2 text-sm'
              required
            >
              <option value=''>카테고리</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          {(createType === 'expense' || createType === 'transfer') && (
            <select
              name='fromHoldingId'
              className='h-10 rounded-md border bg-background px-2 text-sm'
              required
            >
              <option value=''>출금 계정</option>
              {holdings.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          )}
          {(createType === 'income' || createType === 'transfer') && (
            <select
              name='toHoldingId'
              className='h-10 rounded-md border bg-background px-2 text-sm'
              required
            >
              <option value=''>입금 계정</option>
              {holdings.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          )}
          <Button type='submit'>추가</Button>
        </form>
      </div>

      <InfiniteList<TransactionListItem>
        pages={query.pages}
        isLoading={query.isLoading}
        isFetchingNextPage={query.isFetchingNextPage}
        hasNextPage={query.hasNextPage}
        onLoadMore={() => query.fetchNextPage()}
        sentinelRef={query.sentinelRef}
        emptyText='거래가 없습니다.'
        renderItem={(it: TransactionListItem) => (
          <div className='flex items-center justify-between rounded-md border p-3'>
            <div className='flex min-w-0 flex-col'>
              <div className='text-sm font-medium'>
                {it.type} · {formatDateTime(it.occurredAt.toISOString())}
              </div>
              {it.memo && <div className='truncate text-sm text-muted-foreground'>{it.memo}</div>}
            </div>
            <div className='flex items-center gap-2'>
              <div className='text-right text-sm font-semibold'>
                {formatAmount(it.type, it.amount)}
              </div>
              <TransactionEditDialog slug={slug} item={it} actions={actions} onUpdated={() => query.refetch()} />
              <ConfirmDialog
                title='거래 삭제'
                description='이 거래를 삭제할까요?'
                onConfirm={async () => {
                  try {
                    await actions.deleteAction(slug, it.id);
                    toast({ description: '거래를 삭제했어요.' });
                    await query.refetch();
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : '삭제 중 오류가 발생했어요';
                    toast({ description: msg });
                  }
                }}
                trigger={
                  <Button type='button' variant='ghost'>
                    삭제
                  </Button>
                }
              />
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default TransactionsClient;

const TransactionEditDialog = ({
  slug,
  item,
  actions,
  onUpdated,
}: {
  slug: string;
  item: TransactionListItem;
  actions: Actions;
  onUpdated?: () => void | Promise<void>;
}) => {
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState(item.amount);
  const [occurredAt, setOccurredAt] = React.useState('');
  const [memo, setMemo] = React.useState(item.memo ?? '');

  React.useEffect(() => {
    const d = new Date(item.occurredAt);
    const pad = (n: number) => String(n).padStart(2, '0');
    const v = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setOccurredAt(v);
  }, [item.occurredAt]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type='button' variant='ghost'>
          수정
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>거래 수정</DialogTitle>
        </DialogHeader>
        <form
          className='space-y-3'
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await actions.updateAction(slug, item.id, {
                amount: Number(amount),
                occurredAt,
                memo,
              });
              toast({ description: '거래를 수정했어요.' });
              setOpen(false);
              await onUpdated?.();
            } catch (err) {
              const msg = err instanceof Error ? err.message : '수정 중 오류가 발생했어요';
              toast({ description: msg });
            }
          }}
        >
          <div className='space-y-1'>
            <Label>금액</Label>
            <Input
              type='number'
              step='0.01'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className='space-y-1'>
            <Label>일시</Label>
            <Input
              type='datetime-local'
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              required
            />
          </div>
          <div className='space-y-1'>
            <Label>메모</Label>
            <Input value={memo} onChange={(e) => setMemo(e.target.value)} />
          </div>
          <div className='flex justify-end gap-2'>
            <Button type='submit'>저장</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
