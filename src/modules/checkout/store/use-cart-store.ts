import {create} from "zustand";
import {createJSONStorage, persist} from "zustand/middleware";

interface TenantCart {
    productIds: string[],
};

interface CartState {
    tenantCarts: Record<string, TenantCart>;
    addProduct: (tenantSlug: string, productId: string) => void;
    addProductQuantity: (tenantSlug: string, productId: string, quantity: number) => void;
    removeProduct: (tenantSlug: string, productId: string) => void; // removes all occurrences
    removeOneProduct: (tenantSlug: string, productId: string) => void; // removes one occurrence
    clearCart: (tenantSlug: string) => void;
    clearAllCarts: () => void;
};

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            tenantCarts: {},
            addProduct: (tenantSlug, productId) =>
                set((state) => ({
                    tenantCarts: {
                        ...state.tenantCarts,
                        [tenantSlug]: {
                            productIds:[
                                ...(state.tenantCarts[tenantSlug]?.productIds || []),
                                productId,
                            ]
                        }
                    }
                })),
            addProductQuantity: (tenantSlug, productId, quantity) =>
                set((state) => ({
                    tenantCarts: {
                        ...state.tenantCarts,
                        [tenantSlug]: {
                            productIds: [
                                ...(state.tenantCarts[tenantSlug]?.productIds || []),
                                ...Array(Math.max(0, quantity)).fill(productId),
                            ],
                        },
                    },
                })),
            removeProduct: (tenantSlug, productId) =>
                set((state) => ({
                    tenantCarts: {
                        ...state.tenantCarts,
                        [tenantSlug]: {
                            productIds: state.tenantCarts[tenantSlug]?.productIds.filter(
                                (id) => id !== productId
                            ) || [],
                        }
                    }
                })),
            removeOneProduct: (tenantSlug, productId) =>
                set((state) => ({
                    tenantCarts: {
                        ...state.tenantCarts,
                        [tenantSlug]: {
                            productIds: (() => {
                                const list = [...(state.tenantCarts[tenantSlug]?.productIds || [])];
                                const idx = list.indexOf(productId);
                                if (idx !== -1) list.splice(idx, 1);
                                return list;
                            })(),
                        },
                    },
                })),
            clearCart: (tenantSlug) =>
                set((state) => ({
                    tenantCarts: {
                        ...state.tenantCarts,
                        [tenantSlug]: {
                            productIds:[],
                        }
                    }
                })),
            clearAllCarts: () =>
                set({
                    tenantCarts: {},
                }),
        }),

        {
            name: "cart",
            storage: createJSONStorage(() => localStorage),
        }
    )
)