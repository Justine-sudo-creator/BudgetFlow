"use client";

import { useBudget } from "@/hooks/use-budget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "../ui/skeleton";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PHP",
});

export function CategorySpendingReport() {
    const { categories, getSpentForCategory, totalSpent, isLoading } = useBudget();

    if (isLoading) {
        return (
            <Card className="md:col-span-2">
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i}>
                            <Skeleton className="h-5 w-1/4 mb-2" />
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    const needs = categories.filter(c => c.type === 'need');
    const wants = categories.filter(c => c.type === 'want');
    const savings = categories.filter(c => c.type === 'savings');

    const totalNeedsSpent = needs.reduce((sum, cat) => sum + getSpentForCategory(cat.id), 0);
    const totalWantsSpent = wants.reduce((sum, cat) => sum + getSpentForCategory(cat.id), 0);
    const totalSavingsSpent = savings.reduce((sum, cat) => sum + getSpentForCategory(cat.id), 0);

    const CategoryGroup = ({ title, categories }: { title: string, categories: typeof needs }) => {
        const totalGroupSpent = categories.reduce((sum, cat) => sum + getSpentForCategory(cat.id), 0);

        if (categories.length === 0 || totalGroupSpent === 0) {
            return null;
        }

        return (
            <div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <div className="space-y-4">
                    {categories.map(category => {
                        const spent = getSpentForCategory(category.id);
                        if (spent === 0) return null;
                        const percentage = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
                        return (
                            <div key={category.id}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm flex items-center gap-2">
                                        <category.icon className="w-4 h-4 text-muted-foreground" />
                                        {category.name}
                                    </span>
                                    <span className="text-sm font-medium">{currencyFormatter.format(spent)}</span>
                                </div>
                                <Progress value={percentage} className="h-2" />
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    };
    
    const hasSpending = totalSpent > 0;

    return (
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Category Spending</CardTitle>
                <CardDescription>How your spending breaks down by category type.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {hasSpending ? (
                    <>
                        <CategoryGroup title="Needs" categories={needs} />
                        <CategoryGroup title="Wants" categories={wants} />
                        <CategoryGroup title="Savings" categories={savings} />
                    </>
                ) : (
                    <div className="text-center text-muted-foreground p-8">
                        <p>No spending data available.</p>
                        <p className="text-sm">Log expenses to see your category breakdown.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
