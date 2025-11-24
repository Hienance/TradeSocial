import { Button } from "@/components/ui/button";
import { useCart } from "@/modules/checkout/hooks/use-cart"
import { cn } from "@/lib/utils";


interface Props {
    tenantSlug: string,
    productId: string,
    isPurchased?: boolean,
};

export const CartButton = ({tenantSlug, productId, isPurchased} : Props) => {
     const cart = useCart(tenantSlug);

    if (isPurchased) {
        return (
        <Button
            variant="elevated"
            className={cn("flex-1 bg-pink-400", cart.isProductInCart(productId) && "bg-white")}
            onClick={() => cart.toggleProduct(productId)}
        >
            {cart.isProductInCart(productId) ? "Remove from cart" : "Add to cart"}
        </Button>
        )
    }

     return (
        <Button
            variant="elevated"
            className={cn("flex-1 bg-pink-400", cart.isProductInCart(productId) && "bg-white")}
            onClick={() => cart.toggleProduct(productId)}
        >
            {cart.isProductInCart(productId) ? "Remove from cart" : "Add to cart"}
        </Button>
     )
}