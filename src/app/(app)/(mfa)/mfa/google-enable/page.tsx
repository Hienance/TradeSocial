"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { generateTenantURL } from "@/lib/utils";

export default function GoogleEnableMfaPage() {
  const trpc = useTRPC();
  const router = useRouter();
  // Fetch session to get username for tenant-aware redirect
  const { data: session } = useSuspenseQuery(trpc.auth.session.queryOptions());

  const { mutate: finalize, isPending } = useMutation(
    trpc.auth.finalizeGoogleMfaEnable.mutationOptions({
      onSuccess: () => {
        toast.success("Google MFA enabled");
        const username = session?.user?.username;
        const href = username ? `${generateTenantURL(username)}/profile?tab=settings` : "/profile?tab=settings";
        router.replace(href);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to enable Google MFA");
        const username = session?.user?.username;
        const href = username ? `${generateTenantURL(username)}/profile?tab=settings` : "/profile?tab=settings";
        router.replace(href);
      },
    })
  );

  useEffect(() => {
    finalize();
  }, [finalize]);

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold">Finalizing Security Upgrade</h1>
        <p className="text-sm text-muted-foreground">
          {isPending ? "Linking your Google verification..." : "Redirecting..."}
        </p>
      </div>
    </div>
  );
}
