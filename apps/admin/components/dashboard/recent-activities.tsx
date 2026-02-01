import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card";

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export function RecentActivities({ activities }: { activities: Activity[] }) {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
        <CardDescription>
          Latest system events and registrations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{activity.type[0]}</AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="ml-auto font-medium text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                {activity.type}
              </div>
            </div>
          ))}
          {(!activities || activities.length === 0) && (
            <div className="text-center text-muted-foreground py-4">
              No recent activities.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
