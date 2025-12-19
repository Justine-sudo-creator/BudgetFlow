
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
import { useBudget } from "@/hooks/use-budget";
import { Badge } from "./ui/badge";
import { loadStripe } from "@stripe/stripe-js";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const { subscriptionTier } = useBudget(); 
  const [isUpgrading, setIsUpgrading] = React.useState(false);

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      window.location.href = '/login';
    }
  };
  
  const handleUpgrade = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: "Not logged in", description: "You must be logged in to upgrade." });
        return;
    }
    setIsUpgrading(true);
    try {
        const res = await fetch('/api/stripe/checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid }),
        });

        if (!res.ok) {
            const { error } = await res.json();
            throw new Error(error || 'Failed to create checkout session.');
        }

        const { sessionId } = await res.json();
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
        
        if (!stripe) throw new Error('Stripe.js failed to load.');

        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) throw error;
        
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Upgrade Failed",
            description: error.message || "Could not initiate upgrade. Please try again.",
        });
    } finally {
        setIsUpgrading(false);
    }
  };

  if (pathname === '/login') {
    return <>{children}</>;
  }
  
  const isPremium = subscriptionTier === 'premium';

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
                  <div className="flex flex-col items-start truncate">
                    <span className="group-data-[collapsible=icon]:hidden truncate">
                      {user.isAnonymous ? 'Anonymous' : user.email}
                    </span>
                    {isPremium && !user.isAnonymous && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs font-normal group-data-[collapsible=icon]:hidden">
                            Premium
                        </Badge>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.isAnonymous ? 'Anonymous User' : user.email}</p>
                    {isPremium && !user.isAnonymous && <p className="text-xs leading-none text-muted-foreground">Premium Member</p>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!isPremium && !user.isAnonymous && (
                    <>
                        <DropdownMenuItem onSelect={handleUpgrade} disabled={isUpgrading}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            <span>{isUpgrading ? 'Redirecting...' : 'Upgrade to Premium'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}
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
