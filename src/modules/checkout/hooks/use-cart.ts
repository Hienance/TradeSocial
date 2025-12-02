import { useCallback } from "react";
import { useCartStore } from "../store/use-cart-store";
import { useShallow} from "zustand/react/shallow"

export const useCart = (tenantSlug: string) => {
    const addProduct = useCartStore((state) => state.addProduct);
    const addProductQuantity = useCartStore((state) => state.addProductQuantity);
    const removeProduct = useCartStore((state) => state.removeProduct);
    const removeOneProduct = useCartStore((state) => state.removeOneProduct);
    const clearCart = useCartStore((state) => state.clearCart);
    const clearAllCarts = useCartStore((state) => state.clearAllCarts);

    const productIds = useCartStore(useShallow((state) => state.tenantCarts[tenantSlug]?.productIds || []));

    const toggleProduct = useCallback((productId: string) => {
        if (productIds.includes(productId)) {
            removeProduct(tenantSlug,productId);
        } else {
            addProduct(tenantSlug,productId);
        }
    }, [addProduct, removeProduct, productIds, tenantSlug]);

    const isProductInCart = useCallback((productId: string) => {
        return productIds.includes(productId);
    }, [productIds]);

    const clearTenantCart = useCallback(() => {
        clearCart(tenantSlug);
    },[tenantSlug, clearCart]);

    const handleAddProduct = useCallback((productId: string) => {
        addProduct(tenantSlug, productId);
    }, [addProduct, tenantSlug]);

    const handleRemoveProduct = useCallback((productId: string) => {
        removeProduct(tenantSlug, productId);
    }, [removeProduct, tenantSlug]);

    const getQuantity = useCallback((productId: string) => {
        return productIds.filter((id) => id === productId).length;
    }, [productIds]);

    const incrementQuantity = useCallback((productId: string, amount: number = 1) => {
        if (amount <= 0) return;
        addProductQuantity(tenantSlug, productId, amount);
    }, [addProductQuantity, tenantSlug]);

    const decrementQuantity = useCallback((productId: string, amount: number = 1) => {
        if (amount <= 0) return;
        for (let i = 0; i < amount; i++) {
            removeOneProduct(tenantSlug, productId);
        }
    }, [removeOneProduct, tenantSlug]);

    return {
        productIds,
        addProduct: handleAddProduct,
        removeProduct: handleRemoveProduct,
        clearCart: clearTenantCart,
        clearAllCarts,
        toggleProduct,
        isProductInCart,
        getQuantity,
        incrementQuantity,
        decrementQuantity,
        totalItems: productIds.length,
    }
}