import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BalanceCard = () => {
  const data = {
    total: 12345678,
    monthIncome: 2400000,
    monthExpense: 1750000,
  };
  const fmt = (n: number) => n.toLocaleString("ko-KR");
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-h4 md:text-h3">자산 요약</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <div className="text-sm text-muted-foreground">총 자산</div>
          <div className="mt-1 text-2xl font-bold">₩ {fmt(data.total)}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">이번 달 수입</div>
          <div className="mt-1 text-xl font-semibold text-accent">
            ₩ {fmt(data.monthIncome)}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">이번 달 지출</div>
          <div className="mt-1 text-xl font-semibold text-destructive">
            ₩ {fmt(data.monthExpense)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
