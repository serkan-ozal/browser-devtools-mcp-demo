import { IconUsers } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TeamPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4 lg:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center text-center">
          <IconUsers className="size-32 text-muted-foreground mb-4" />
          <CardTitle className="text-2xl">Team</CardTitle>
          <CardDescription>Coming soon...</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            This page is currently under development. Content will be available
            soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
