import { Button } from "@/components/ui/button";
import { useCart } from "@/modules/checkout/hooks/use-cart";
import { cn } from "@/lib/utils";


interface Props {
    tenantSlug: string,
    productId: string,
    isPurchased?: boolean,
};

export const CartButton = ({tenantSlug, productId, isPurchased} : Props) => {
     const cart = useCart(tenantSlug);
     const qty = cart.getQuantity(productId);
     const inCart = qty > 0;

     const addToCart = () => {
        if (!inCart) {
            cart.incrementQuantity(productId, 1);
        }
     };

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

    const Stepper = (
        <div className="flex w-full rounded-sm overflow-hidden border">
            <Button
                type="button"
                className="px-4 bg-pink-400 text-white rounded-none border-0 border-r border-black hover:bg-pink-500 active:bg-pink-600 hover:text-white focus-visible:ring-0 focus-visible:outline-none shadow-none"
                onClick={decrement}
            >
                −
            </Button>
            <div className="px-4 flex-1 select-none text-center flex items-center justify-center bg-white">
                {qty}
            </div>
            <Button
                type="button"
                className="px-4 bg-pink-400 text-white rounded-none border-0 border-l border-black hover:bg-pink-500 active:bg-pink-600 hover:text-white focus-visible:ring-0 focus-visible:outline-none shadow-none"
                onClick={increment}
            >
                +
            </Button>
        </div>
    );

    const AddButton = (
        <Button
            variant="elevated"
            className={cn("w-full bg-pink-400")}
            onClick={addToCart}
        >
            Add to cart
        </Button>
    );

    if (isPurchased) {
        return <div className="flex-1">{inCart ? Stepper : AddButton}</div>;
    }

    return <div className="flex-1">{inCart ? Stepper : AddButton}</div>;
}