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
import { disconnectRepository, getConnectedRepositories, getUserProfile, updateUserProfile } from "@/module/settings/actions";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function RepositoryList() {
    const queryClient = useQueryClient();
    const [disconnectAllOpen, setDisconnectAllOpen] = useState(false);

    const { data: repositories, isLoading } = useQuery({
        queryKey: ["connected-repositories"],
        queryFn: getConnectedRepositories,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const disconnectedRepoMutation = useMutation({
        mutationFn: async (repositoryId: string) => {
            return disconnectRepository(repositoryId);
        },
        onSuccess: (result) => {
            if (result?.success) {
                queryClient.invalidateQueries({ queryKey: ["connected-repositories"] });
                queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
                toast.success("Repository disconnected successfully");
            } else {
                toast.error(result?.error || "Failed to disconnect repository");
            }
        },
    })
};