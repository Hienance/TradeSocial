import { cn, formatCurrency } from "@/lib/utils";
import { useCart } from "../../hooks/use-cart";
import Link from "next/link";
import Image from "next/image";

interface CheckoutItemProps {
    isLast?: boolean;
    imageUrl?: string | null;
    name: string;
    productUrl: string;
    tenantUrl: string;
    tenantName: string;
    price: number;
    onRemove: () => void;
    tenantSlug: string;
    productId: string;
}

export const CheckoutItem = ({
    isLast,
    imageUrl,
    name,
    productUrl,
    tenantUrl,
    tenantName,
    price,
    onRemove,
    tenantSlug,
    productId,
}
 : CheckoutItemProps) => {
    const cart = useCart(tenantSlug);
    const qty = cart.getQuantity(productId);
    const inCart = qty > 0;

    const increment = () => {
        cart.incrementQuantity(productId, 1);
    };

    const decrement = () => {
        if (qty <= 1) {
            cart.removeProduct(productId);
        } else {
            cart.decrementQuantity(productId, 1);
        }
    };
    return (
        <div className={cn("grid grid-cols-[8.5rem_1fr_auto] gap-4 pr-4 border-b",
            isLast && "border-b-0"
        )}>
            <div className="overflow-hidden border-r">
                <div className="relative aspect-square h-full">
                    <Image
                        src={imageUrl || "/placeholder.png"}
                        alt={name}
                        fill
                        className="object-cover"
                    />
                </div>

            </div>
            <div className="py-4 flex-col justify-between">
                <div>
                    <Link href={productUrl}>
                        <h4 className="font-bold underline">{name}</h4>
                    </Link>
                    <Link href={tenantUrl}>
                        <p className="font-medium underline">{tenantName}</p>
                    </Link>
                </div>
            </div>
            <div className="py-4 flex flex-col justify-between items-end gap-2">
                <p className="font-medium">{formatCurrency(price)}</p>
                {inCart && (
                    <div className="flex items-center rounded-sm overflow-hidden border text-sm">
                        <button
                            type="button"
                            className="px-2 py-1 bg-pink-400 text-white border-0 border-r border-black hover:bg-pink-500 active:bg-pink-600"
                            onClick={decrement}
                        >
                            −
                        </button>
                        <div className="px-2 py-1 bg-white">{qty}</div>
                        <button
                            type="button"
                            className="px-2 py-1 bg-pink-400 text-white border-0 border-l border-black hover:bg-pink-500 active:bg-pink-600"
                            onClick={increment}
                        >
                            +
                        </button>
                    </div>
                )}
                <button className="underline font-medium cursor-pointer" onClick={onRemove} type="button">
                    Remove
                </button>
            </div>
        </div>
    )
}