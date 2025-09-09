"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import * as React from "react";

// Minimal Tabs implementation (fallback) with ARIA & keyboard support

const SimpleTabs = ({
  tabs,
}: {
  tabs: { key: string; label: string; content: React.ReactNode }[];
}) => {
  const [active, setActive] = React.useState(tabs[0]?.key);
  const id = React.useId();

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = tabs.findIndex((t) => t.key === active);
    if (idx < 0) return;
    if (e.key === "ArrowRight") {
      const next = tabs[(idx + 1) % tabs.length];
      setActive(next.key);
    } else if (e.key === "ArrowLeft") {
      const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
      setActive(prev.key);
    }
  };
  return (
    <div>
      <div
        className="mb-3 inline-flex gap-2 rounded-md bg-muted p-1"
        role="tablist"
        aria-label="quick add tabs"
        onKeyDown={onKeyDown}
      >
        {tabs.map((t) => {
          const selected = active === t.key;
          const tabId = `tab-${id}-${t.key}`;
          const panelId = `panel-${id}-${t.key}`;
          return (
            <button
              key={t.key}
              id={tabId}
              role="tab"
              aria-controls={panelId}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.key)}
              className={`rounded px-3 py-1 text-sm ${
                selected ? "bg-background shadow" : "text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div>
        {tabs.map((t) => {
          const selected = active === t.key;
          const tabId = `tab-${id}-${t.key}`;
          const panelId = `panel-${id}-${t.key}`;
          return (
            <div
              key={t.key}
              id={panelId}
              role="tabpanel"
              aria-labelledby={tabId}
              hidden={!selected}
            >
              {t.content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const QuickAddWidget = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-h4 md:text-h3">빠른 거래 입력</CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleTabs
          tabs={[
            {
              key: "expense",
              label: "지출",
              content: (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <Input
                    placeholder="금액"
                    type="number"
                    inputMode="decimal"
                    step="1"
                  />
                  <Input placeholder="카테고리" />
                  <Input placeholder="계정" />
                  <Button className="w-full md:w-auto">추가</Button>
                </div>
              ),
            },
            {
              key: "income",
              label: "수입",
              content: (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <Input
                    placeholder="금액"
                    type="number"
                    inputMode="decimal"
                    step="1"
                  />
                  <Input placeholder="카테고리" />
                  <Input placeholder="계정" />
                  <Button className="w-full md:w-auto">추가</Button>
                </div>
              ),
            },
            {
              key: "transfer",
              label: "이체",
              content: (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <Input
                    placeholder="금액"
                    type="number"
                    inputMode="decimal"
                    step="1"
                  />
                  <Input placeholder="출금 계정" />
                  <Input placeholder="입금 계정" />
                  <Button className="w-full md:w-auto">이체</Button>
                </div>
              ),
            },
          ]}
        />
      </CardContent>
    </Card>
  );
};

export default QuickAddWidget;
