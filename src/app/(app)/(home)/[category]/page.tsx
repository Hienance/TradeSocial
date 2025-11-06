import { ProductList, ProductListSkeleton } from "@/modules/products/ui/components/product-list";
import { trpc, getQueryClient } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";

interface Props {
    params: Promise<{
        category: string;
    }>
};

const Page = async ({params}: Props) => {
    const { category} = await params;

    const queryClient = getQueryClient();
    void queryClient.prefetchQuery(trpc.products.getMany.queryOptions({
        category,
    }));



    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<ProductListSkeleton/>}/>
                <ProductList category={category}/>
        </HydrationBoundary>
    );
};

export default Page;