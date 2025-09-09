import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const BudgetCard = () => {
  const budgets = [
    { category: "식비", used: 220000, limit: 400000 },
    { category: "교통", used: 65000, limit: 120000 },
    { category: "주거", used: 500000, limit: 500000 },
    { category: "생활", used: 90000, limit: 150000 },
  ];
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-h4 md:text-h3">예산 집행률</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgets.map((b) => {
          const percent = Math.min(100, Math.round((b.used / b.limit) * 100));
          return (
            <div key={b.category} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{b.category}</span>
                <span className="text-muted-foreground">
                  {b.used.toLocaleString("ko-KR")} /{" "}
                  {b.limit.toLocaleString("ko-KR")} 원
                </span>
              </div>
              <Progress value={percent} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default BudgetCard;
