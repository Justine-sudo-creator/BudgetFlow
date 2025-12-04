import type { Category } from "@/lib/types";
import {
  UtensilsCrossed,
  Home,
  Car,
  ShoppingBag,
  Film,
  GraduationCap,
  HeartPulse,
  Coffee,
  Landmark,
} from "lucide-react";

export const seedCategories: Category[] = [
  { id: "food", name: "Food & Groceries", type: "need", icon: UtensilsCrossed, color: "hsl(var(--chart-1))" },
  { id: "housing", name: "Housing", type: "need", icon: Home, color: "hsl(var(--chart-2))" },
  { id: "transport", name: "Transport", type: "need", icon: Car, color: "hsl(var(--chart-3))" },
  { id: "health", name: "Health", type: "need", icon: HeartPulse, color: "hsl(var(--chart-4))" },
  { id: "education", name: "Education", type: "need", icon: GraduationCap, color: "hsl(var(--chart-5))" },
  { id: "shopping", name: "Shopping", type: "want", icon: ShoppingBag, color: "hsl(22, 84%, 60%)" },
  { id: "entertainment", name: "Entertainment", type: "want", icon: Film, color: "hsl(302, 74%, 66%)" },
  { id: "coffee", name: "Coffee Shops", type: "want", icon: Coffee, color: "hsl(342, 97%, 77%)" },
  { id: "savings", name: "Savings", type: "savings", icon: Landmark, color: "hsl(262, 80%, 70%)" },
];
