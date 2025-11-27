import ProfileView from "@/modules/profiles/ui/views/profile-view";
import { caller } from "@/trpc/server";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/access";
import { Tenant } from "@/payload-types";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

const Page = async ({ params }: PageProps) => {
    const { slug } = await params;
    const session = await caller.auth.session();

    // Redirect to sign-in if not authenticated
    if (!session.user) {
        redirect(`/sign-in`);
    }

    // Get the user's tenant
    const userTenant = session.user.tenants?.[0]?.tenant as Tenant | undefined;
    
    // Check if user is super admin or owns this tenant
    const isOwner = userTenant?.slug === slug;
    const isAdmin = isSuperAdmin(session.user);

    // If not owner and not admin, redirect to the tenant's store
    if (!isOwner && !isAdmin) {
        redirect(`/tenants/${slug}`);
    }

    return <ProfileView />;
};

export default Page;