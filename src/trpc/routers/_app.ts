import { authRouter } from '@/modules/auth/server/procedure';
import { createTRPCRouter } from '../init'; 
import { categoriesRouter } from '@/modules/categories/server/procedures';
import { productsRouter } from '@/modules/products/server/procedures';
import { tagsRouter } from '@/modules/tags/server/procedures';
import { tenantsRouter } from '@/modules/tenants/server/procedures';
import { checkoutRouter } from '@/modules/checkout/server/procedure';
import { libraryRouter } from '@/modules/library/server/procedures';
import { reviewsRouter } from '@/modules/reviews/server/procedures';
import { profilesRouter } from '@/modules/profiles/server/procedures';


export const appRouter = createTRPCRouter({
    tags: tagsRouter,
    auth: authRouter,
    categories : categoriesRouter,
    products: productsRouter,
    tenants: tenantsRouter,
    checkout: checkoutRouter,
    library: libraryRouter,
    reviews: reviewsRouter,
    profiles: profilesRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;