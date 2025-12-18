"use client";

// import Link from "next/link";
import { Poppins } from "next/font/google"
import { usePathname } from "next/navigation";

import { cn, generateTenantURL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NavbarSidebar } from "./navbar-sidebar";
import { useState } from "react";
import { MenuIcon } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isSuperAdmin } from "@/lib/access";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

    const poppins = Poppins({
        subsets: ["latin"],
        weight: ["700"],
    });

interface NavbarItemProps {
    href: string;
    children: React.ReactNode;
    isActive?: boolean;
};

const NavbarItem = ({
    href,
    children,
    isActive, 
}: NavbarItemProps) => {
    return (
        <Button
            asChild
            variant="outline"
            className={cn("bg-transparent hover:bg-transparent rounded-full hover:border-primary border-transparent px-3.5 text-lg",
                isActive && "bg-black text-white hover:bg-black hover:text-white")}
        >
            <a href={href}>
                {children}
            </a>
        </Button>
    );
};

const navbarItems = [
    {href: "/", children: "Home"},
];

export const Navbar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [isSideBarOpen, setIsSideBarOpen] = useState(false);

    const trpc = useTRPC();
    const session = useQuery(trpc.auth.session.queryOptions());
    const logout = useMutation(trpc.auth.logout.mutationOptions({
        onError: (error) => {
            toast.error(error?.message ?? "Failed to logout");
        },
        onSuccess: async () => {
            // update session state so Navbar re-renders without user
            await session.refetch();
            router.push("/");
        },
    }));

    return (
        <nav className=" h-20 flex border-b justify-between font-medium bg-white">
            <a href="/" className="pl-6 flex items-center">
                <span className={cn("text-5xl font-semibold", poppins.className)}>
                    TradeSocial
                </span>
            </a>

            <NavbarSidebar
                session={!!session.data?.user}
                items={navbarItems}
                open={isSideBarOpen}
                onOpenChange={setIsSideBarOpen}
            />

            <div className="items-center gap-4 hidden lg:flex">
                {navbarItems.map((item) => (
                    <NavbarItem 
                        key={item.href}
                        href={item.href}
                        isActive={pathname === item.href}
                    >
                        {item.children}
                    </NavbarItem>
                ))}
            </div>

            {session.data?.user ? (
            <div className="hidden lg:flex">
                    {isSuperAdmin(session.data.user) ? (
                        <Button asChild className="border-l border-t-0 border-b-0 border-r-0 h-full rounded-none bg-black text-white hover:bg-pink-400 transition-colors hover:text-black text-lg">
                            <a href="/admin">
                                Dashboard
                            </a>
                        </Button>
                    ) : (
                        <Button asChild className="border-l border-t-0 border-b-0 border-r-0 h-full rounded-none bg-black text-white hover:bg-pink-400 transition-colors hover:text-black text-lg">
                            <a href={`${generateTenantURL(session.data.user.username)}/profile`}>
                                Dashboard
                            </a>
                        </Button>
                    )}
                <Button 
                    variant="secondary"
                    className="border-l border-t-0 border-b-0 border-r-0 h-full rounded-none bg-white hover:bg-pink-400 transition-color"
                    onClick={async () => {
                        try {
                            await logout.mutateAsync();
                        } catch {
                        }
                    }}
                    disabled={logout.isPending}
                >
                    Logout
                </Button>
                </div>
            ) : (
            <div className="hidden lg:flex">
                <Button asChild variant="secondary" className="border-l border-t-0 border-b-0 border-r-0 h-full rounded-none bg-white hover:bg-pink-400 transition-color">
                    <a href="/sign-in">
                        Login         
                    </a>    
                </Button>
                <Button asChild className="border-l border-t-0 border-b-0 border-r-0 h-full rounded-none bg-black text-white hover:bg-pink-400 transition-colors hover:text-black text-lg">
                    <a href="/sign-up">
                        Sign up!
                    </a>
                </Button>
            </div>
            )}

            <div className="flex lg:hidden items-center justify-center">
                <Button
                     variant="ghost"
                     className="size-12 border-transparent bg-white"
                     onClick={() => (setIsSideBarOpen(true))}
                >
                    <MenuIcon/>
                </Button>
            </div>
        </nav>
    );
}