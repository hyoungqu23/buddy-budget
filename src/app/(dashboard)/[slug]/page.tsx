import AccountCard from "@/components/dashboard/AccountCard";
import BalanceCard from "@/components/dashboard/BalanceCard";
import BudgetCard from "@/components/dashboard/BudgetCard";
import QuickAddWidget from "@/components/dashboard/QuickAddWidget";
import TransactionList from "@/components/dashboard/TransactionList";

const DashboardPage = () => {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 grid grid-cols-1 gap-4">
        <QuickAddWidget />
        <BalanceCard />
      </div>
      <div className="lg:col-span-1">
        <AccountCard />
      </div>
      <div className="lg:col-span-2">
        <BudgetCard />
      </div>
      <div className="lg:col-span-3">
        <TransactionList />
      </div>
    </div>
  );
};

export default DashboardPage;
