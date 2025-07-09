import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  loading?: boolean;
}

export function StatsCard({
  icon,
  title,
  value,
  loading = false,
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">{icon}</div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
