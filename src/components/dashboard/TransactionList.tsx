import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TransactionList = () => {
  const items = [
    { date: "09-01", category: "식비", account: "공동 통장", amount: -18000 },
    { date: "09-01", category: "교통", account: "가족 카드", amount: -2300 },
    { date: "09-02", category: "수입", account: "공동 통장", amount: 200000 },
    { date: "09-03", category: "생활", account: "공동 통장", amount: -8700 },
    { date: "09-03", category: "이체", account: "비상금", amount: -50000 },
  ];
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-h4 md:text-h3">최근 거래</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>일자</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>계정</TableHead>
                <TableHead className="text-right">금액</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it, idx) => (
                <TableRow key={idx}>
                  <TableCell>{it.date}</TableCell>
                  <TableCell>{it.category}</TableCell>
                  <TableCell>{it.account}</TableCell>
                  <TableCell className="text-right">
                    {it.amount < 0 ? (
                      <span className="text-destructive">
                        - ₩{Math.abs(it.amount).toLocaleString("ko-KR")}
                      </span>
                    ) : (
                      <span className="text-accent">
                        + ₩{it.amount.toLocaleString("ko-KR")}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>최근 5건의 거래입니다.</TableCaption>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionList;
