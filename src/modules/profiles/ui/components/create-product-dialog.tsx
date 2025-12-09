"use client";

import { useState } from "react";
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
import { Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { refundPolicy } from "@/modules/profiles/types";

interface CreateProductDialogProps {
    disabled?: boolean;
    onSuccess?: () => void;
}

export function CreateProductDialog({ disabled, onSuccess }: CreateProductDialogProps) {
    const trpc = useTRPC();
    const [open, setOpen] = useState(false);
    // Current tenant for assigning media uploads
    const { data: tenant } = useSuspenseQuery(
        trpc.profiles.getTenant.queryOptions()
    );
    
    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState<string>("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [refundPolicy, setRefundPolicy] = useState<string>("30-day");
    const [content, setContent] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);

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

    // Create product mutation
    const { mutate: createProduct, isPending } = useMutation(
        trpc.profiles.createProduct.mutationOptions({
            onSuccess: () => {
                toast.success("Product created successfully");
                setOpen(false);
                resetForm();
                onSuccess?.();
            },
            onError: (error) => {
                toast.error(error.message || "Failed to create product");
            },
        })
    );

    const resetForm = () => {
        setName("");
        setDescription("");
        setPrice("");
        setCategory("");
        setSelectedTags([]);
        setRefundPolicy("30-day");
        setContent("");
        setIsPrivate(false);
        setImageFile(null);
        setCoverFile(null);
    };

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
            if (imageFile) imageId = await uploadToPayload(imageFile, "Product Image");
            if (coverFile) coverId = await uploadToPayload(coverFile, "Product Cover");

            createProduct({
                name: name.trim(),
                description: description.trim() || undefined,
                price: priceNum,
                category: category,
                tags: selectedTags.length > 0 ? selectedTags : undefined,
                refundPolicy: refundPolicy as refundPolicy,
                content: content.trim() || undefined,
                isPrivate,
                image: imageId,
                cover: coverId,
            });
        } catch (err: any) {
            toast.error(err?.message || "Failed to create product");
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
                <Button disabled={disabled}>
                    <Plus className="h-4 w-4 mr-2"/>Add Product
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Create New Product</DialogTitle>
                    <DialogDescription>
                        Add a new product to your store. Fill in the details below.
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
                                                            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                                                        />
                                                        {imageFile && (
                                                            <p className="text-xs text-muted-foreground">Selected: {imageFile.name}</p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="cover">Cover Image</Label>
                                                        <Input
                                                            id="cover"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                                                        />
                                                        {coverFile && (
                                                            <p className="text-xs text-muted-foreground">Selected: {coverFile.name}</p>
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

                        {/* Content (Protected) */}
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

                        {/* Private Checkbox */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isPrivate"
                                checked={isPrivate}
                                onCheckedChange={(checked) => setIsPrivate(!!checked)}
                            />
                            <label
                                htmlFor="isPrivate"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Make this product private (only visible on your store)
                            </label>
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
                        {isPending ? "Creating..." : "Create Product"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
