"use client";

import { useEffect, useState } from "react";
import { Poppins } from "next/font/google";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatCurrency, generateTenantURL } from "@/lib/utils";
import { Settings, Package, Image as LayoutDashboard, Save, ShieldCheck, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useTRPC } from "@/trpc/client";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { signIn } from "next-auth/react";
import { CreateProductDialog } from "../components/create-product-dialog";
import { EditProductDialog } from "../components/edit-product-dialog";

const poppins = Poppins({ subsets: ["latin"], weight: ["700"] });

export function ProfileView() {
	const trpc = useTRPC();

	// Auth user (for Google MFA visibility)
	const { data: me, refetch: refetchMe } = useSuspenseQuery(
		trpc.auth.me.queryOptions()
	);
	
	// Fetch tenant data
	const { data: tenant, refetch: refetchTenant } = useSuspenseQuery(
		trpc.profiles.getTenant.queryOptions()
	);
	
	// Products pagination state (10 per page)
	const [productsPage, setProductsPage] = useState(1);
	const PRODUCTS_PAGE_SIZE = 10;
	const [productSearch, setProductSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	useEffect(() => {
		const t = setTimeout(() => {
			setDebouncedSearch(productSearch.trim());
		}, 300);
		return () => clearTimeout(t);
	}, [productSearch]);

	// Fetch products with pagination
	const { data: products, refetch: refetchProducts } = useSuspenseQuery(
		trpc.profiles.getMyProducts.queryOptions({
			page: productsPage,
			limit: PRODUCTS_PAGE_SIZE,
			includeArchived: true,
			search: debouncedSearch || undefined,
		})
	);

	const [tenantName, setTenantName] = useState(tenant.name);
	const [tenantDesc, setTenantDesc] = useState(tenant.description || "");
	const [tenantImage, setTenantImage] = useState<File | null>(null);
	
	// Update tenant mutation
	const { mutate: updateTenant, isPending: isSaving } = useMutation(
		trpc.profiles.updateTenant.mutationOptions({
			onSuccess: () => {
				toast.success("Settings saved successfully");
				refetchTenant();
			},
			onError: (error) => {
				toast.error(error.message || "Failed to save settings");
			},
		})
	);

	// Stripe verification mutation
	const { mutate: verifyStripe, isPending: isVerifying } = useMutation(
		trpc.checkout.verify.mutationOptions({
			onSuccess: (data) => {
				window.location.href = data.url;
			},
			onError: (error) => {
				toast.error(error.message || "Failed to start verification");
			},
		})
	);

	// Archive product mutation
	const { mutate: archiveProduct } = useMutation(
		trpc.profiles.archiveProduct.mutationOptions({
			onSuccess: () => {
				toast.success("Product archived successfully");
				refetchProducts();
			},
			onError: (error) => {
				toast.error(error.message || "Failed to archive product");
			},
		})
	);

	// Toggle product privacy mutation
	const { mutate: togglePrivacy } = useMutation(
		trpc.profiles.toggleProductPrivacy.mutationOptions({
			onSuccess: () => {
				toast.success("Product privacy updated");
				refetchProducts();
			},
			onError: (error) => {
				toast.error(error.message || "Failed to update privacy");
			},
		})
	);

	// Toggle Google MFA mutation
	const { mutate: toggleMfa, isPending: isTogglingMfa } = useMutation(
		trpc.auth.toggleGoogleMfa.mutationOptions({
			onSuccess: () => {
				toast.success("Security preference updated");
				refetchMe();
			},
			onError: (error) => {
				toast.error(error.message || "Failed to update security setting");
			},
		})
	);

	// Toggle Email OTP requirement
	const { mutate: toggleEmailOtp, isPending: isTogglingEmailOtp } = useMutation(
		trpc.auth.toggleEmailOtp.mutationOptions({
			onSuccess: () => {
				toast.success("Security preference updated");
				refetchMe();
			},
			onError: (error) => {
				toast.error(error.message || "Failed to update security setting");
			},
		})
	);

	const handleSaveSettings = async () => {
		try {
			let imageId: string | undefined | null = undefined;
			if (tenantImage) {
				const formData = new FormData();
				formData.append("file", tenantImage);
				formData.append(
					"_payload",
					JSON.stringify({ alt: "Tenant Image", tenant: tenant.id })
				);

				const baseUrl = process.env.NEXT_PUBLIC_PAYLOAD_URL;
				const uploadUrl = baseUrl ? `${baseUrl}/api/media` : "/api/media";
				const res = await fetch(uploadUrl, { method: "POST", body: formData, credentials: 'include' });
				if (!res.ok) throw new Error("Failed to upload image");
				const data = await res.json();
				imageId = data?.doc?.id;
				if (!imageId) throw new Error("Failed to upload image");
			} else {
				imageId = undefined; // do not change image if not provided
			}

			updateTenant({
				name: tenantName,
				description: tenantDesc || null,
				image: imageId,
			});
		} catch (err: any) {
			toast.error(err?.message || "Failed to save settings");
		}
	};

	const handleVerifyStripe = () => {
		verifyStripe();
	};

	const activeProducts = products.docs.filter(p => !p.isArchived);

	// Fetch product stats for dashboard (full counts)
	const { data: productStats } = useSuspenseQuery(
		trpc.profiles.getMyProductStats.queryOptions()
	);

	const formatLastVerified = (iso?: string | null) => {
		if (!iso) return "Never";
		const d = new Date(iso);
		return d.toLocaleString();
	};

	return (
		<div className="flex flex-col gap-8 p-4 lg:p-10 max-w-[1400px] mx-auto">
			{!tenant.stripeDetailsSubmitted && (
				<Alert>
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						Your Stripe account needs verification before you can add products. Please verify your account in the settings tab.
					</AlertDescription>
				</Alert>
			)}
			<header className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
				<div className="flex items-center gap-4">
					<div>
						<h1 className={cn("text-4xl font-semibold", poppins.className)}>{tenant.name}</h1>
						<p className="text-muted-foreground">Manage your store, products & orders</p>
					</div>
				</div>
				<div className="flex gap-3">
					<Button variant="elevated" className="rounded-full">
						<Link href={generateTenantURL(tenant.slug)}>
							View Store
						</Link>
					</Button>
				</div>
			</header>
			<Tabs defaultValue="dashboard" className="w-full">
				<TabsList className="flex flex-wrap w-full justify-start gap-2 bg-transparent">
					<TabsTrigger value="dashboard" className="data-[state=active]:bg-black data-[state=active]:text-white rounded-full"> <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</TabsTrigger>
					<TabsTrigger value="products" className="data-[state=active]:bg-black data-[state=active]:text-white rounded-full hover:bg-black hover:text-white"> <Package className="mr-2 h-4 w-4" /> Products</TabsTrigger>
					<TabsTrigger value="settings" className="data-[state=active]:bg-black data-[state=active]:text-white rounded-full hover:bg-black hover:text-white"> <Settings className="mr-2 h-4 w-4" /> Settings</TabsTrigger>
				</TabsList>
				<Separator className="my-4" />

				{/* Dashboard */}
				<TabsContent value="dashboard" className="space-y-6">
					<div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
						<Card>
							<CardHeader>
								<CardTitle>Products</CardTitle>
								<CardDescription>Total active products</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-4xl font-semibold">{productStats?.totalActive ?? 0}</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Private Products</CardTitle>
								<CardDescription>Store-only visibility</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-4xl font-semibold">{productStats?.totalPrivateActive ?? 0}</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Stripe Status</CardTitle>
								<CardDescription>Account verification</CardDescription>
							</CardHeader>
							<CardContent>
								<Badge variant={tenant.stripeDetailsSubmitted ? "default" : "secondary"}>
									{tenant.stripeDetailsSubmitted ? "Verified" : "Pending"}
								</Badge>
							</CardContent>
						</Card>
					</div>
					<Card>
						<CardHeader>
							<CardTitle>Recent Products</CardTitle>
							<CardDescription>Your latest listings</CardDescription>
						</CardHeader>
						<CardContent>
							{activeProducts.length > 0 ? (
								<Table>
									<thead>
										<tr className="text-left text-sm text-muted-foreground">
											<th className="font-medium py-2">Name</th>
											<th className="font-medium py-2">Price</th>
											<th className="font-medium py-2">Visibility</th>
										</tr>
									</thead>
									<tbody>
										{activeProducts.slice(0, 5).map(p => (
											<tr key={p.id} className="border-t">
												<td className="py-2 text-sm">{p.name}</td>
												<td className="py-2 text-sm">{formatCurrency(p.price)}</td>
												<td className="py-2 text-sm">
													<Badge variant={p.isPrivate ? 'secondary' : 'default'}>
														{p.isPrivate ? 'Private' : 'Public'}
													</Badge>
												</td>
											</tr>
										))}
									</tbody>
								</Table>
							) : (
								<p className="text-muted-foreground text-center py-8">
									No products yet. Create your first product to get started!
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="products" className="space-y-6">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<h2 className={cn("text-2xl font-semibold", poppins.className)}>Products</h2>
						<div className="flex w-full sm:w-auto gap-2">
							<Input
								placeholder="Search products by name..."
								value={productSearch}
								onChange={(e) => {
									setProductsPage(1);
									setProductSearch(e.target.value);
								}}
							/>
							<Button
								variant="outline"
								onClick={() => {
									setProductsPage(1);
									setProductSearch("");
								}}
								disabled={!productSearch}
							>
								Clear
							</Button>
							<CreateProductDialog 
								disabled={!tenant.stripeDetailsSubmitted}
								onSuccess={() => {
									// Stay on current filters, just refetch
									refetchProducts();
								}}
							/>
						</div>
					</div>
					{!tenant.stripeDetailsSubmitted && (
						<Alert>
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>
								Verify your Stripe account to add products.
							</AlertDescription>
						</Alert>
					)}
					<Card>
						<CardContent className="p-0">
							{products.docs.length > 0 ? (
								<>
								<ScrollArea className="max-h-[600px]">
									<Table>
										<thead>
											<tr className="text-left text-sm text-muted-foreground">
												<th className="font-medium py-2 px-4">Name</th>
												<th className="font-medium py-2 px-4">Price</th>
												<th className="font-medium py-2 px-4">Status</th>
												<th className="font-medium py-2 px-4 text-center">Private</th>
												<th className="font-medium py-2 px-4 text-center">Archived</th>
												<th className="font-medium py-2 px-4">Actions</th>
											</tr>
										</thead>
										<tbody>
											{products.docs.map(p => (
												<tr key={p.id} className={cn("border-t", p.isArchived && "opacity-60")}>
													<td className="py-2 px-4 text-sm font-medium">{p.name}</td>
													<td className="py-2 px-4 text-sm">{formatCurrency(p.price)}</td>
													<td className="py-2 px-4 text-sm">
														<Badge variant={p.isArchived ? 'secondary' : 'default'}>
															{p.isArchived ? 'Archived' : 'Active'}
														</Badge>
													</td>
													<td className="py-2 px-4 text-sm">
														<div className="flex justify-center">
															<Checkbox
																checked={!!p.isPrivate}
																onCheckedChange={(checked) => 
																	togglePrivacy({ id: p.id, isPrivate: !!checked })
																}
															/>
														</div>
													</td>
													<td className="py-2 px-4 text-sm">
														<div className="flex justify-center">
															<Checkbox
																checked={!!p.isArchived}
																onCheckedChange={(checked) => 
																	archiveProduct({ id: p.id, isArchived: !!checked })
																}
															/>
														</div>
													</td>
													<td className="py-2 px-4 text-sm">
														<EditProductDialog product={p} onSuccess={refetchProducts} />
													</td>
												</tr>
											))}
										</tbody>
									</Table>
								</ScrollArea>
								<div className="flex items-center justify-between px-4 py-3 border-t">
									<div className="text-sm text-muted-foreground">
										Page {productsPage}
									</div>
									<div className="flex gap-2">
										<Button
											variant="outline"
											disabled={products.hasPrevPage === false || productsPage <= 1}
											onClick={() => {
												setProductsPage((prev) => Math.max(1, prev - 1));
											}}
										>
											Previous
										</Button>
										<Button
											variant="outline"
											disabled={products.hasNextPage === false}
											onClick={() => {
												setProductsPage((prev) => prev + 1);
											}}
										>
											Next
										</Button>
									</div>
								</div>
								</>
							) : (
								<div className="p-12 text-center">
									<p className="text-muted-foreground mb-4">No products yet</p>
									<CreateProductDialog 
										disabled={!tenant.stripeDetailsSubmitted}
										onSuccess={refetchProducts}
									/>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Settings */}
				<TabsContent value="settings" className="space-y-6">
					<h2 className={cn("text-2xl font-semibold", poppins.className)}>Store Settings</h2>

					{/* Security (Google MFA) */}
					{(me.googleId || me.googleEmail) && (
						<Card>
							<CardHeader>
								<CardTitle>Security</CardTitle>
								<CardDescription>Protect your account with Google multi-factor authentication</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<p className="text-sm text-muted-foreground">
									When enabled, you must re-confirm your Google account every 12 hours before sensitive actions. This helps prevent unauthorized use if someone steals your session.
								</p>
								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<p className="text-sm font-medium">Google MFA</p>
										<p className="text-xs text-muted-foreground">
											{me.mfaGoogleEnabled
												? `Enabled • Last verification: ${formatLastVerified(me.mfaGoogleVerifiedAt)}`
												: "Disabled • Enable to require periodic Google re-auth"}
										</p>
									</div>
									<Switch
										checked={!!me.mfaGoogleEnabled}
										disabled={isTogglingMfa}
										onCheckedChange={(checked) => {
											if (checked) {
												// Begin Google re-auth flow; finalize page will enable MFA.
												signIn("google", { callbackUrl: "/mfa/google-enable" });
											} else {
												// Disable directly via toggle procedure.
												toggleMfa({ enabled: false });
											}
										}}
									/>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Security (Email OTP) */}
					<Card>
						<CardHeader>
							<CardTitle>Email Verification</CardTitle>
							<CardDescription>Require a one-time code sent to your email before logging in</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm text-muted-foreground">
								When enabled, the login button is disabled until you enter the code we email to you. This helps prevent unauthorized logins if someone guesses or steals your password.
							</p>
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<p className="text-sm font-medium">Email OTP Required</p>
									<p className="text-xs text-muted-foreground">
										{me.emailOtpEnabled ? "Enabled • A code will be required at login" : "Disabled • You can log in without a code"}
									</p>
								</div>
								<Switch
									checked={!!me.emailOtpEnabled}
									disabled={isTogglingEmailOtp}
									onCheckedChange={(checked) => toggleEmailOtp({ enabled: !!checked })}
								/>
							</div>
						</CardContent>
					</Card>
					
					{/* Stripe Verification Card */}
					<Card>
						<CardHeader>
							<CardTitle>Stripe Account</CardTitle>
							<CardDescription>Manage your payment account verification</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<p className="text-sm font-medium">Verification Status</p>
									<div className="flex items-center gap-2">
										<Badge variant={tenant.stripeDetailsSubmitted ? "default" : "secondary"}>
											{tenant.stripeDetailsSubmitted ? "Verified" : "Not Verified"}
										</Badge>
										{tenant.stripeDetailsSubmitted && (
											<ShieldCheck className="h-4 w-4 text-green-600" />
										)}
									</div>
								</div>
								{!tenant.stripeDetailsSubmitted && (
									<Button 
										onClick={handleVerifyStripe}
										disabled={isVerifying}
										variant="elevated"
									>
										<ShieldCheck className="h-4 w-4 mr-2"/>
										{isVerifying ? 'Redirecting...' : 'Verify Stripe Account'}
									</Button>
								)}
							</div>
							{!tenant.stripeDetailsSubmitted && (
								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>
										You must complete Stripe verification before you can create products and receive payments.
									</AlertDescription>
								</Alert>
							)}
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>General</CardTitle>
							<CardDescription>Change your store information</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-2">
								<label className="text-sm font-medium">Store Name</label>
								<Input 
									value={tenantName} 
									onChange={(e)=>setTenantName(e.target.value)} 
									placeholder="Enter your store name"
								/>
							</div>
							<div className="grid gap-2">
								<label className="text-sm font-medium">Store image</label>
								<Input
									type="file"
									accept="image/*"
									onChange={(e) => {
										const file = e.target.files?.[0] ?? null;
										setTenantImage(file);
									}}
								/>
								{tenantImage && (
									<p className="text-xs text-muted-foreground">
										Selected: {tenantImage.name} ({Math.round(tenantImage.size / 1024)} KB)
									</p>
								)}
							</div>
							<div className="grid gap-2">
								<label className="text-sm font-medium">Description</label>
								<Textarea 
									value={tenantDesc} 
									onChange={(e)=>setTenantDesc(e.target.value)} 
									placeholder="Describe your store..."
									rows={4}
								/>
							</div>
							<Button 
								disabled={isSaving} 
								onClick={handleSaveSettings} 
								className="gap-2"
							>
								<Save className="h-4 w-4"/>
								{isSaving ? 'Saving...' : 'Save Changes'}
							</Button>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

export default ProfileView;
