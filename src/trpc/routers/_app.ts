import { authRouter } from '@/modules/auth/server/procedure';
import { createTRPCRouter } from '../init'; 
import { categoriesRouter } from '@/modules/categories/server/procedures';
import { productsRouter } from '@/modules/products/server/procedures';
import { tagsRouter } from '@/modules/tags/server/procedures';
import { tenantsRouter } from '@/modules/tenants/server/procedures';


export const appRouter = createTRPCRouter({
    tags: tagsRouter,
    auth: authRouter,
    categories : categoriesRouter,
    products: productsRouter,
    tenants: tenantsRouter
});
// export type definition of API
export type AppRouter = typeof appRouter;