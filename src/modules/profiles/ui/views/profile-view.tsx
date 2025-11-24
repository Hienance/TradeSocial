"use client";

import { useState } from "react";
import { Poppins } from "next/font/google";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Plus, Settings, Package, Image as ImageIcon, LayoutDashboard, ShoppingCart, Save } from "lucide-react";

const poppins = Poppins({ subsets: ["latin"], weight: ["700"] });

// Placeholder data — will be replaced by backend integration later.
const MOCK_PRODUCTS = Array.from({ length: 5 }).map((_, i) => ({
	id: `prod_${i + 1}`,
	name: `Sample Product ${i + 1}`,
	price: (i + 1) * 12,
	status: i % 2 === 0 ? "active" : "draft",
}));

const MOCK_ORDERS = Array.from({ length: 4 }).map((_, i) => ({
	id: `ord_${i + 1}`,
	total: (i + 2) * 25,
	items: (i + 1) * 3,
	status: ["pending", "fulfilled", "refunded", "shipped"][i],
}));

const MOCK_MEDIA = Array.from({ length: 8 }).map((_, i) => ({
	id: `media_${i + 1}`,
	title: `Image ${i + 1}`,
}));

export function ProfileView() {
	const [tenantName, setTenantName] = useState("Your Tenant Name");
	const [tenantSlug, setTenantSlug] = useState("your-slug");
	const [tenantDesc, setTenantDesc] = useState("Short description of the tenant store.");
	const [saving, setSaving] = useState(false);

	const handleSaveSettings = async () => {
		setSaving(true);
		// Simulate async save
		setTimeout(() => setSaving(false), 800);
	};

	return (
		<div className="flex flex-col gap-8 p-4 lg:p-10 max-w-[1400px] mx-auto">
			<header className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
				<div className="flex items-center gap-4">
					<Avatar className="size-20 border">
						<AvatarImage src={"/tenant-avatar.png"} />
						<AvatarFallback>{tenantName.charAt(0).toUpperCase()}</AvatarFallback>
					</Avatar>
					<div>
						<h1 className={cn("text-4xl font-semibold", poppins.className)}>{tenantName}</h1>
						<p className="text-muted-foreground">Manage your store, products, media & orders</p>
					</div>
				</div>
				<div className="flex gap-3">
					<Button variant="secondary" className="rounded-full">Preview Store</Button>
					<Button className="rounded-full">New Product <Plus className="ml-2 h-4 w-4" /></Button>
				</div>
			</header>
			<Tabs defaultValue="dashboard" className="w-full">
				<TabsList className="flex flex-wrap w-full justify-start gap-2 bg-transparent">
					<TabsTrigger value="dashboard" className="data-[state=active]:bg-black data-[state=active]:text-white rounded-full"> <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</TabsTrigger>
					<TabsTrigger value="products" className="data-[state=active]:bg-black data-[state=active]:text-white rounded-full"> <Package className="mr-2 h-4 w-4" /> Products</TabsTrigger>
					<TabsTrigger value="orders" className="data-[state=active]:bg-black data-[state=active]:text-white rounded-full"> <ShoppingCart className="mr-2 h-4 w-4" /> Orders</TabsTrigger>
					<TabsTrigger value="media" className="data-[state=active]:bg-black data-[state=active]:text-white rounded-full"> <ImageIcon className="mr-2 h-4 w-4" /> Media</TabsTrigger>
					<TabsTrigger value="settings" className="data-[state=active]:bg-black data-[state=active]:text-white rounded-full"> <Settings className="mr-2 h-4 w-4" /> Settings</TabsTrigger>
				</TabsList>
				<Separator className="my-4" />

				{/* Dashboard */}
				<TabsContent value="dashboard" className="space-y-6">
					<div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
						<Card>
							<CardHeader>
								<CardTitle>Products</CardTitle>
								<CardDescription>Total active products</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-4xl font-semibold">{MOCK_PRODUCTS.filter(p => p.status === 'active').length}</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Orders</CardTitle>
								<CardDescription>All-time orders</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-4xl font-semibold">{MOCK_ORDERS.length}</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Revenue</CardTitle>
								<CardDescription>Approximate total</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-4xl font-semibold">${MOCK_ORDERS.reduce((a,o)=>a+o.total,0)}</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Media Items</CardTitle>
								<CardDescription>Images & uploads</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-4xl font-semibold">{MOCK_MEDIA.length}</p>
							</CardContent>
						</Card>
					</div>
					<Card>
						<CardHeader>
							<CardTitle>Recent Orders</CardTitle>
							<CardDescription>Latest activity snapshot</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<thead>
									<tr className="text-left text-sm text-muted-foreground">
										<th className="font-medium py-2">Order ID</th>
										<th className="font-medium py-2">Items</th>
										<th className="font-medium py-2">Total</th>
										<th className="font-medium py-2">Status</th>
									</tr>
								</thead>
								<tbody>
									{MOCK_ORDERS.map(o => (
										<tr key={o.id} className="border-t">
											<td className="py-2 text-sm">{o.id}</td>
											<td className="py-2 text-sm">{o.items}</td>
											<td className="py-2 text-sm">${o.total}</td>
											<td className="py-2 text-sm"><Badge variant={o.status === 'fulfilled' ? 'default' : 'secondary'}>{o.status}</Badge></td>
										</tr>
									))}
								</tbody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Products */}
				<TabsContent value="products" className="space-y-6">
					<div className="flex justify-between items-center">
						<h2 className={cn("text-2xl font-semibold", poppins.className)}>Products</h2>
						<Button><Plus className="h-4 w-4 mr-2"/>Add Product</Button>
					</div>
					<Card>
						<CardContent className="p-0">
							<ScrollArea className="max-h-[400px]">
								<Table>
									<thead>
										<tr className="text-left text-sm text-muted-foreground">
											<th className="font-medium py-2 px-4">Name</th>
											<th className="font-medium py-2 px-4">Price</th>
											<th className="font-medium py-2 px-4">Status</th>
											<th className="font-medium py-2 px-4">Actions</th>
										</tr>
									</thead>
									<tbody>
										{MOCK_PRODUCTS.map(p => (
											<tr key={p.id} className="border-t">
												<td className="py-2 px-4 text-sm">{p.name}</td>
												<td className="py-2 px-4 text-sm">${p.price}</td>
												<td className="py-2 px-4 text-sm"><Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge></td>
												<td className="py-2 px-4 text-sm"><Button variant="ghost" size="sm">Edit</Button></td>
											</tr>
										))}
									</tbody>
								</Table>
							</ScrollArea>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Orders */}
				<TabsContent value="orders" className="space-y-6">
					<h2 className={cn("text-2xl font-semibold", poppins.className)}>Orders</h2>
					<Card>
						<CardContent className="p-0">
							<Table>
								<thead>
									<tr className="text-left text-sm text-muted-foreground">
										<th className="font-medium py-2 px-4">Order</th>
										<th className="font-medium py-2 px-4">Items</th>
										<th className="font-medium py-2 px-4">Total</th>
										<th className="font-medium py-2 px-4">Status</th>
									</tr>
								</thead>
								<tbody>
									{MOCK_ORDERS.map(o => (
										<tr key={o.id} className="border-t">
											<td className="py-2 px-4 text-sm">{o.id}</td>
											<td className="py-2 px-4 text-sm">{o.items}</td>
											<td className="py-2 px-4 text-sm">${o.total}</td>
											<td className="py-2 px-4 text-sm"><Badge>{o.status}</Badge></td>
										</tr>
									))}
								</tbody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Media */}
				<TabsContent value="media" className="space-y-6">
					<div className="flex justify-between items-center">
						<h2 className={cn("text-2xl font-semibold", poppins.className)}>Media Library</h2>
						<Button><Plus className="h-4 w-4 mr-2"/>Upload</Button>
					</div>
					<div className="grid gap-4 grid-cols-2 md:grid-cols-4 xl:grid-cols-6">
						{MOCK_MEDIA.map(m => (
							<Card key={m.id} className="group cursor-pointer">
								<CardContent className="p-2 flex flex-col items-center">
									<div className="aspect-square w-full rounded-md bg-muted flex items-center justify-center">
										<Skeleton className="w-10 h-10" />
									</div>
									<p className="mt-2 text-xs text-center truncate w-full">{m.title}</p>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				{/* Settings */}
				<TabsContent value="settings" className="space-y-6">
					<h2 className={cn("text-2xl font-semibold", poppins.className)}>Store Settings</h2>
					<Card>
						<CardHeader>
							<CardTitle>General</CardTitle>
							<CardDescription>Update basic tenant information (UI only)</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-2">
								<label className="text-sm font-medium">Name</label>
								<Input value={tenantName} onChange={(e)=>setTenantName(e.target.value)} />
							</div>
							<div className="grid gap-2">
								<label className="text-sm font-medium">Slug</label>
								<Input value={tenantSlug} onChange={(e)=>setTenantSlug(e.target.value)} />
							</div>
							<div className="grid gap-2">
								<label className="text-sm font-medium">Description</label>
								<Textarea value={tenantDesc} onChange={(e)=>setTenantDesc(e.target.value)} />
							</div>
							<div className="flex items-center gap-2">
								<Checkbox id="public" />
								<label htmlFor="public" className="text-sm">Make store publicly discoverable</label>
							</div>
							<Button disabled={saving} onClick={handleSaveSettings} className="gap-2">
								<Save className="h-4 w-4"/>
								{saving ? 'Saving...' : 'Save Changes'}
							</Button>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

export default ProfileView;
