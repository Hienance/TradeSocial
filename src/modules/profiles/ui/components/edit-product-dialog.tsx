"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useTRPC } from "@/trpc/client";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Product } from "@/payload-types";
import { refundPolicy } from "@/modules/profiles/types";

interface EditProductDialogProps {
    product: Product;
    onSuccess?: () => void;
    children?: React.ReactNode;
}

export function EditProductDialog({ product, onSuccess, children }: EditProductDialogProps) {
    const trpc = useTRPC();
    const [open, setOpen] = useState(false);
    // Current tenant for assigning media uploads
    const { data: tenant } = useSuspenseQuery(
        trpc.profiles.getTenant.queryOptions()
    );
    
    // Form state - initialized with product data
    const [name, setName] = useState(product.name);
    const [description, setDescription] = useState(
        typeof product.description === 'string' ? product.description : ""
    );
    const [price, setPrice] = useState(product.price.toString());
    const [category, setCategory] = useState(
        typeof product.category === 'string' ? product.category : product.category?.id || ""
    );
    const [selectedTags, setSelectedTags] = useState<string[]>(
        Array.isArray(product.tags) 
            ? product.tags.map(tag => typeof tag === 'string' ? tag : tag.id)
            : []
    );
    const [refundPolicy, setRefundPolicy] = useState<string>(product.refundPolicy || "30-day");
    const [content, setContent] = useState(
        typeof product.content === 'string' ? product.content : ""
    );
    const [isPrivate, setIsPrivate] = useState(!!product.isPrivate);
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const [newCoverFile, setNewCoverFile] = useState<File | null>(null);

    // Reset form when product changes or dialog opens
    useEffect(() => {
        if (open) {
            setName(product.name);
            setDescription(typeof product.description === 'string' ? product.description : "");
            setPrice(product.price.toString());
            setCategory(typeof product.category === 'string' ? product.category : product.category?.id || "");
            setSelectedTags(
                Array.isArray(product.tags) 
                    ? product.tags.map(tag => typeof tag === 'string' ? tag : tag.id)
                    : []
            );
            setRefundPolicy(product.refundPolicy || "30-day");
            setContent(typeof product.content === 'string' ? product.content : "");
            setIsPrivate(!!product.isPrivate);
            setNewImageFile(null);
            setNewCoverFile(null);
        }
    }, [open, product]);

    // Fetch categories
    const { data: categories } = useSuspenseQuery(
        trpc.categories.getMany.queryOptions()
    );

    // Fetch tags
    const { data: tags } = useSuspenseQuery(
        trpc.tags.getMany.queryOptions({
            limit: 100,
        })
    );

    // Update product mutation
    const { mutate: updateProduct, isPending } = useMutation(
        trpc.profiles.updateProduct.mutationOptions({
            onSuccess: () => {
                toast.success("Product updated successfully");
                setOpen(false);
                onSuccess?.();
            },
            onError: (error) => {
                toast.error(error.message || "Failed to update product");
            },
        })
    );

    const uploadToPayload = async (file: File, alt: string) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("_payload", JSON.stringify({ alt, tenant: tenant.id }));
        const baseUrl = process.env.NEXT_PUBLIC_PAYLOAD_URL;
        const uploadUrl = baseUrl ? `${baseUrl}/api/media` : "/api/media";
        const res = await fetch(uploadUrl, { method: "POST", body: formData, credentials: 'include' });
        if (!res.ok) throw new Error("Failed to upload image");
        const data = await res.json();
        const id = data?.doc?.id as string | undefined;
        if (!id) throw new Error("Failed to upload image");
        return id;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            toast.error("Product name is required");
            return;
        }

        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum < 0) {
            toast.error("Please enter a valid price");
            return;
        }

        if (!category) {
            toast.error("Please select a category");
            return;
        }

        try {
            let imageId: string | undefined;
            let coverId: string | undefined;
            if (newImageFile) imageId = await uploadToPayload(newImageFile, "Product Image");
            if (newCoverFile) coverId = await uploadToPayload(newCoverFile, "Product Cover");

            updateProduct({
                id: product.id,
                name: name.trim(),
                description: description.trim() || undefined,
                price: priceNum,
                category: category,
                tags: selectedTags.length > 0 ? selectedTags : undefined,
                refundPolicy: refundPolicy as refundPolicy,
                content: content.trim() || undefined,
                isPrivate,
                ...(typeof imageId !== 'undefined' ? { image: imageId } : {}),
                ...(typeof coverId !== 'undefined' ? { cover: coverId } : {}),
            });
        } catch (err: any) {
            toast.error(err?.message || "Failed to update product");
        }
    };

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev => 
            prev.includes(tagId) 
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || <Button variant="ghost" size="sm">Edit</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                    <DialogDescription>
                        Update your product details below.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
                    <form onSubmit={handleSubmit} className="space-y-6">
                                                {/* Images */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="image">Product Image</Label>
                                                        <Input
                                                            id="image"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => setNewImageFile(e.target.files?.[0] ?? null)}
                                                        />
                                                        {newImageFile ? (
                                                            <p className="text-xs text-muted-foreground">Selected: {newImageFile.name}</p>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground">Leave empty to keep existing image</p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="cover">Cover Image</Label>
                                                        <Input
                                                            id="cover"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => setNewCoverFile(e.target.files?.[0] ?? null)}
                                                        />
                                                        {newCoverFile ? (
                                                            <p className="text-xs text-muted-foreground">Selected: {newCoverFile.name}</p>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground">Leave empty to keep existing cover</p>
                                                        )}
                                                    </div>
                                                </div>
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Product Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter product name"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe your product..."
                                rows={4}
                            />
                        </div>

                        {/* Price */}
                        <div className="space-y-2">
                            <Label htmlFor="price">
                                Price (USD) <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">
                                Category <span className="text-destructive">*</span>
                            </Label>
                            <Select value={category || undefined} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tags */}
                        <div className="space-y-2">
                            <Label>Tags</Label>
                            <div className="border rounded-md p-3 space-y-2 max-h-32 overflow-y-auto">
                                {tags.docs.length > 0 ? (
                                    tags.docs.map((tag) => (
                                        <div key={tag.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`tag-${tag.id}`}
                                                checked={selectedTags.includes(tag.id)}
                                                onCheckedChange={() => toggleTag(tag.id)}
                                            />
                                            <label
                                                htmlFor={`tag-${tag.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {tag.name}
                                            </label>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No tags available</p>
                                )}
                            </div>
                        </div>

                        {/* Refund Policy */}
                        <div className="space-y-2">
                            <Label htmlFor="refundPolicy">Refund Policy</Label>
                            <Select value={refundPolicy} onValueChange={setRefundPolicy}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30-day">30-day refund</SelectItem>
                                    <SelectItem value="14-day">14-day refund</SelectItem>
                                    <SelectItem value="7-day">7-day refund</SelectItem>
                                    <SelectItem value="1-day">1-day refund</SelectItem>
                                    <SelectItem value="no-refunds">No refunds</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Content (Protected) TODO: ADD THE ABILITY TO UPLOAD FILESFOR SPECIAL CONTENT*/}
                        <div className="space-y-2">
                            <Label htmlFor="content">Protected Content</Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Content only visible to customers after purchase..."
                                rows={4}
                            />
                            <p className="text-xs text-muted-foreground">
                                Add product documentation, download links, or bonus materials here.
                            </p>
                        </div>
                    </form>
                </ScrollArea>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isPending}
                    >
                        {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
