"use client";
import { LayoutDashboard, List, PlusCircle, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type BottomNavProps = {
  slug: string;
};

const BottomNav = ({ slug }: BottomNavProps) => {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-screen-sm grid-cols-4">
        <Link
          href={`/${slug}`}
          className="flex flex-col items-center gap-1 p-3 text-sm"
          aria-current={pathname === `/${slug}` ? "page" : undefined}
        >
          <LayoutDashboard className="size-5" />
          <span>Home</span>
        </Link>
        <Link
          href={`/${slug}/transactions`}
          className="flex flex-col items-center gap-1 p-3 text-sm"
          aria-current={
            pathname?.startsWith(`/${slug}/transactions`) ? "page" : undefined
          }
        >
          <List className="size-5" />
          <span>History</span>
        </Link>
        <Link
          href={`/${slug}`}
          className="flex flex-col items-center gap-1 p-3 text-sm"
        >
          <PlusCircle className="size-5" />
          <span>Add</span>
        </Link>
        <Link
          href={`/${slug}/settings`}
          className="flex flex-col items-center gap-1 p-3 text-sm"
          aria-current={
            pathname?.startsWith(`/${slug}/settings`) ? "page" : undefined
          }
        >
          <Settings className="size-5" />
          <span>Settings</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
