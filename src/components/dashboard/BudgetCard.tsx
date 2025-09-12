import { listBudgets } from '@/app/actions/budgets';
import BudgetCardClient from './BudgetCardClient';

const BudgetCard = ({ slug }: { slug: string }) => {
  return <BudgetCardClient slug={slug} actions={{ listAction: listBudgets }} />;
};

export default BudgetCard;
