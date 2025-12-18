import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface NavbarItem {
    href: string;
    children: React.ReactNode;
}

interface Props {
    items: NavbarItem[];
    open: boolean;
    session?: boolean;
    onOpenChange: (open: boolean) => void;
}

export const NavbarSidebar = ({
    items,
    open,
    session,
    onOpenChange,
}: Props) => {

        const router = useRouter();
        const trpc = useTRPC();
        const sessions = useQuery(trpc.auth.session.queryOptions());
        const logout = useMutation(trpc.auth.logout.mutationOptions({
            onError: (error) => {
                toast.error(error?.message ?? "Failed to logout");
            },
            onSuccess: async () => {
                // update session state so Navbar re-renders without user
                await sessions.refetch();
                router.push("/");
            },
        }));

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="left"
                className="p-0 transition-none"
            >
                <SheetHeader className="p-4 border-b">
                    <div className="flex items-center">
                        <SheetTitle>
                            Menu
                        </SheetTitle>
                    </div>
                </SheetHeader>
                <ScrollArea className=" flex flex-col overflow-y-auto h-full pb-2">
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center text-base font-medium"
                            onClick={() => onOpenChange(false)}
                        >
                            {item.children}
                        </Link>
                    ))}
                    {session ? (
                        <div className="border-t">
                            <Link 
                                href="/Dashboard"
                                className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center text-base font-medium"
                                onClick={() => onOpenChange(false)}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/"
                                className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center text-base font-medium"
                                onClick={async () => {
                                    try {
                                        await logout.mutateAsync();
                                    } catch {
                                        /* error handled in onError */
                                    }
                                }}
                            >
                                Logout
                            </Link>
                        </div>
                    ) : (
                        <div className="border-t">
                            <a 
                                href="/sign-in"
                                className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center text-base font-medium"
                                onClick={() => onOpenChange(false)}
                            >
                                Login
                            </a>
                            <a 
                                href="/sign-up"
                                className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center text-base font-medium"
                                onClick={() => onOpenChange(false)}
                            >
                                Sign up!
                            </a>
                        </div>
                    )}

                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};