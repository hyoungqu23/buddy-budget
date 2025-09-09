"use client";
import CreateSpaceDialog from "@/components/space/CreateSpaceDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, ChevronDown } from "lucide-react";
import Link from "next/link";

type HeaderProps = {
  currentSpace?: string;
  spaces?: { id: string; name: string; slug: string }[];
  defaultCreateOpen?: boolean;
};

const Header = ({
  currentSpace = "My Space",
  spaces = [],
  defaultCreateOpen = false,
}: HeaderProps) => {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:h-16 md:px-6">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" className="gap-2">
              <span className="truncate max-w-[140px]">{currentSpace}</span>
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Switch Space</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {spaces.map((s) => (
              <DropdownMenuItem key={s.id} asChild>
                <Link href={`/${s.slug}`}>{s.name}</Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <CreateSpaceDialog defaultOpen={defaultCreateOpen}>
                <span className="flex w-full items-center gap-2">
                  새 스페이스 만들기
                </span>
              </CreateSpaceDialog>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button size="icon" variant="ghost" aria-label="Notifications">
          <Bell className="size-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <Avatar className="size-6">
                <AvatarImage alt="user" />
                <AvatarFallback>BB</AvatarFallback>
              </Avatar>
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="#">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="#">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
