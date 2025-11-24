import ProfileView from "@/modules/profiles/ui/views/profile-view";

export const dynamic = "force-dynamic";

/**
 * UI-only tenant profile page; backend wiring will follow later.
 */
const Page = async () => {
    return <ProfileView />;
};

export default Page;