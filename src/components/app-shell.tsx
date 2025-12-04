"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import {
  LayoutDashboard,
  PiggyBank,
  AreaChart,
  Settings,
  Sparkles,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { AddIncomeButton } from "./add-income-button";
import { useAuth, useUser } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/reports", label: "Reports", icon: AreaChart },
  { href: "/insights", label: "Insights", icon: Sparkles },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      // Force a reload to clear all state and redirect to login
      window.location.href = '/login';
    }
  };

  // Don't render the shell on the login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold font-headline">BudgetFlow</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          {isUserLoading ? (
            <div className="flex items-center gap-2 p-2">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="justify-start gap-2 w-full px-2">
                  <Avatar className="size-8">
                    {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName ?? 'User'} />}
                    <AvatarFallback>
                      {user.isAnonymous ? 'A' : user.email?.[0].toUpperCase() ?? <UserIcon size={16} />}
                    </AvatarFallback>
                  </Avatar>
                  <span className="group-data-[collapsible=icon]:hidden truncate">
                    {user.isAnonymous ? 'Anonymous' : user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  {user.isAnonymous ? 'Anonymous User' : user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-2 sm:p-4 border-b">
          <SidebarTrigger />
          <div className="flex items-center gap-4">
            <AddIncomeButton />
          </div>
        </header>
        {isUserLoading ? (
           <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
             <div className="w-11/12 h-5/6 rounded-lg border p-4 space-y-4">
                <Skeleton className="h-10 w-1/3" />
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                </div>
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Skeleton className="lg:col-span-4 md:col-span-2 h-80" />
                    <Skeleton className="lg:col-span-3 md:col-span-2 h-80" />
                 </div>
             </div>
           </div>
        ) : (
          children
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
