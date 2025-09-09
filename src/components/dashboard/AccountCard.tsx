import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AccountCard = () => {
  const accounts = [
    { name: "공동 통장", balance: 820000 },
    { name: "가족 카드", balance: 120000 },
    { name: "비상금", balance: 300000 },
  ];
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-h4 md:text-h3">계정 잔액</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {accounts.map((a) => (
          <div
            key={a.name}
            className="flex items-center justify-between text-sm"
          >
            <span>{a.name}</span>
            <span className="font-medium">
              ₩ {a.balance.toLocaleString("ko-KR")}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AccountCard;
