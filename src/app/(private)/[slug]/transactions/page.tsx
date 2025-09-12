import { listInfiniteCategories } from '@/app/actions/categories';
import { listInfiniteHoldings } from '@/app/actions/holdings';
import {
  createTransaction,
  deleteTransaction,
  listInfiniteTransactions,
  updateTransaction,
} from '@/app/actions/transactions';
import TransactionsClient from './TransactionsClient';

const TransactionsPage = async ({ params }: { params: { slug: string } }) => {
  const slug = params.slug;
  const [cats, holds] = await Promise.all([
    listInfiniteCategories({ slug, limit: 100, cursor: null }),
    listInfiniteHoldings({ slug, limit: 100, cursor: null }),
  ]);

  const categories = cats.items.map((c) => ({ id: c.id, name: c.name }));
  const holdings = holds.items.map((h) => ({ id: h.id, name: h.name }));

  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold'>거래</h2>
      <TransactionsClient
        slug={slug}
        actions={{
          listAction: listInfiniteTransactions,
          createAction: createTransaction,
          updateAction: updateTransaction,
          deleteAction: deleteTransaction,
        }}
        categories={categories}
        holdings={holdings}
      />
    </div>
  );
};

export default TransactionsPage;
