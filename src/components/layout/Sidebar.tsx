"use client";
import { cn } from "@/lib/utils";
import { LayoutDashboard, List, PiggyBank, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarProps = {
  slug: string;
  className?: string;
};

const Sidebar = ({ slug, className }: SidebarProps) => {
  const pathname = usePathname();
  return (
    <aside
      className={cn(
        "hidden h-[calc(100dvh-3.5rem)] w-[240px] shrink-0 border-r md:block md:h-[calc(100dvh-4rem)]",
        className
      )}
    >
      <nav className="flex h-full flex-col gap-1 p-3">
        <Link
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted",
            pathname === `/${slug}` && "bg-muted"
          )}
          href={`/${slug}`}
          aria-current={pathname === `/${slug}` ? "page" : undefined}
        >
          <LayoutDashboard className="size-4" />
          <span>Dashboard</span>
        </Link>
        <Link
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted",
            pathname?.startsWith(`/${slug}/transactions`) && "bg-muted"
          )}
          href={`/${slug}/transactions`}
          aria-current={
            pathname?.startsWith(`/${slug}/transactions`) ? "page" : undefined
          }
        >
          <List className="size-4" />
          <span>Transactions</span>
        </Link>
        <Link
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted",
            pathname?.startsWith(`/${slug}/budgets`) && "bg-muted"
          )}
          href={`/${slug}/budgets`}
          aria-current={
            pathname?.startsWith(`/${slug}/budgets`) ? "page" : undefined
          }
        >
          <PiggyBank className="size-4" />
          <span>Budgets</span>
        </Link>
        <Link
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted",
            pathname?.startsWith(`/${slug}/settings`) && "bg-muted"
          )}
          href={`/${slug}/settings`}
          aria-current={
            pathname?.startsWith(`/${slug}/settings`) ? "page" : undefined
          }
        >
          <Settings className="size-4" />
          <span>Settings</span>
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
