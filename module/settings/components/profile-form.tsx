"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserProfile, updateUserProfile } from "@/module/settings/actions";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

type ProfileFormValues = {
  name: string;
  email: string;
};

export function ProfileForm() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const form = useForm<ProfileFormValues>({
    values: {
      name: profile?.name ?? "",
      email: profile?.email ?? "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (result) => {
      if (result?.success) {
        queryClient.invalidateQueries({ queryKey: ["userProfile"] });
        toast.success("Profile updated successfully");
      } else {
        toast.error(result?.error || "Failed to update profile");
      }
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Update your profile information</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              disabled={updateProfileMutation.isPending}
              {...form.register("name")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              disabled={updateProfileMutation.isPending}
              {...form.register("email")}
            />
          </div>

          <Button type="submit" disabled={updateProfileMutation.isPending}>
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
