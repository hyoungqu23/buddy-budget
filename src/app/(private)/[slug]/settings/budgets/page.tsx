import { deleteBudget, listBudgetHistory, listBudgets, upsertBudget } from '@/app/actions/budgets';
import { listInfiniteCategories } from '@/app/actions/categories';
import BudgetsClient from './BudgetsClient';

const BudgetsSettingsPage = async ({ params }: { params: { slug: string } }) => {
  const slug = params.slug;
  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold'>예산 설정</h2>
      <BudgetsClient
        slug={slug}
        actions={{
          listAction: listBudgets,
          upsertAction: upsertBudget,
          deleteAction: deleteBudget,
          listCategories: listInfiniteCategories,
          listHistory: listBudgetHistory,
        }}
      />
    </div>
  );
};

export default BudgetsSettingsPage;
