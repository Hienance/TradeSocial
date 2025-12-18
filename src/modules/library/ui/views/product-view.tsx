"use client"

import { ArrowLeftIcon, StarIcon } from "lucide-react"
import Link from "next/link"
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { ReviewSidebar } from "../components/review-sidebar";
import { defaultJSXConverters, RichText } from "@payloadcms/richtext-lexical/react";
import { Suspense } from "react";
import { ReviewFormSkeleton } from "../components/review-form";
import Image from "next/image";
import { formatCurrency, generateTenantURL } from "@/lib/utils";
import { StarRating } from "@/components/star-rating";
import { Fragment } from "react";
import { Progress } from "@/components/ui/progress";

interface Props {
    productId: string;
}

export const ProductView = ({productId}:Props) => {
    const trpc = useTRPC();
    const {data} = useSuspenseQuery(trpc.library.getOne.queryOptions({
        productId,
    }));


    return (
   <div className="min-h-screen bg-white">
        <nav className="p-4 bg-[#F4F4F0] w-full border-b">
            <Link prefetch href="/library" className="flex items-center gap-2">
                <ArrowLeftIcon className="size-4"/>
                <span className="text font-medium">Back to library</span>
            </Link>
        </nav>
        <header className=" bg-[#F4F4F0] py-8 border-b">
            <div className="max-w-(--breakpoint-xl-) mx-auto px-4 lg:px-12">
                <h1 className="text-[40px] font-medium">{data.name}</h1>
            </div>
        </header>
        <section className="bordermax-w-(--breakpoint-xl) mx-auto px-4 lg:px-12 py-10">
            <div className="relative aspect-[3.9] border rounded-t overflow-hidden">
                <Image  
                    src={data.cover?.url || data.image?.url || "/placeholder-cover.webp"}
                    alt={data.name}
                    fill
                    className="object-cover"
                />
            </div>
            <div className="border border-t-0 grid grid-cols-1 lg:grid-cols-6">
                <div className="col-span-4">
                    <div className="p-6">
                        <h1 className="text-4xl font-medium">{data.name}</h1>
                    </div>
                    <div className="border-y flex">
                        <div className="px-6 py-4 flex items-center justify-center border-r">
                            <div className="px-2 py-1 border bg-pink-400 w-fit">
                                <p className="text-base font-medium">{formatCurrency(data.price)}</p>
                            </div>
                        </div>
                        <div className="px-6 py-4 flex items-center justify-center lg:border-r">
                            <Link href={generateTenantURL(data.tenant.slug)} className="flex items-center gap-2">
                                    <Image
                                        src={data.tenant.image?.url || "/Default_pfp.jpg"}
                                        alt={data.tenant.name}
                                        width={20}
                                        height={20}
                                        className="rounded-full border shrink-0 size-[20px]"/>
                                <p className="text-base underline font-medium">
                                {data.tenant.name}
                            </p>
                            </Link>
                        </div>
                        <div className="hidden lg:flex px-6 py-4 items-center justify-center">
                            <div className="flex items-center gap-2"> 
                                <StarRating
                                    rating={data.reviewRating}
                                    iconClassName="size-4"
                                />
                                <p className="text-base font-medium">{data.reviewCount} ratings</p>
                            </div>
                        </div>
                    </div>
                    <div className="block lg:hidden px-6 py-4 items-center justify-center border-b">
                        <div className="flex items-center gap-2">
                            <StarRating
                                rating={data.reviewRating}
                                iconClassName="size-4"
                            />
                            <p className="text-base font-medium">{data.reviewCount} ratings</p>
                        </div>
                    </div>
                    <div className="p-6">
                        {data.description ? (
                            <RichText data={data.description} converters={defaultJSXConverters}/>
                        ) : (
                            <p className="font-medium text-muted-foreground italic">
                                No description provided
                            </p>
                        )}
                    </div>
                </div>
                <div className="col-span-2">
                    <div className="border-t lg:border-t-0 lg:border-l h-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-medium">Ratings</h3>
                                <div className="flex items-center gap-x-1 font-medium">
                                    <StarIcon className="size-4 fill-black"/>
                                    <p>({data.reviewRating})</p>
                                    <p className="text-base">{data.reviewCount} ratings</p>
                                </div>
                            </div>
                            <div className=" grid grid-cols-[auto_1fr_auto] gap-3 mt-4">
                                {[5,4,3,2,1].map((stars) =>(
                                    <Fragment key={stars}>
                                        <div className="font-medium">{stars} {stars === 1 ? "star" : "stars" }</div>
                                        <Progress value={data.ratingDistribution[stars]} className="h-[1lh]"/>
                                        <div className="font-medium">
                                            {data.ratingDistribution[stars]}%
                                        </div>
                                    </Fragment>
                                ))}
                            </div> 
                        </div>
                    </div>
                </div>
            </div>
            <div className="border-b rounded-md grid grid-cols-1 lg:grid-cols-7 gap-4 lg:gap-16">
                <div className="lg:col-span-2">
                    <div className="p-4 gap-4 border-l border-r">
                        <Suspense fallback={<ReviewFormSkeleton/> }>
                            <ReviewSidebar productId={productId}/>
                        </Suspense>
                    </div>
                </div>
                <div className="border-r lg:col-span-5 rounded-md">
                    {data.content ?
                        <RichText data={data.content} converters={defaultJSXConverters}/>
                    :(
                    <p className="font-medium italic text-muted-foreground">No special content</p>
                    )}
                </div>
            </div>
        </section>
    </div>)
}

export const ProductViewSkeleton = () => {
    return( 
        
        <div className="min-h-screen bg-white">
            <nav className="p-4 bg-[#F4F4F0] w-full border-b">
                <div className="flex items-center gap-2">
                    <ArrowLeftIcon className="size-4"/>
                    <span className="text font-medium">Back to library</span>
                </div>
            </nav>
            <header className=" bg-[#F4F4F0] py-8 border-b">
                <div className="max-w-(--breakpoint-xl-) mx-auto px-4 lg:px-12">
                    <h1 className="text-[40px] font-medium">Placeholder</h1>
                </div>
            </header>
            <section className="bordermax-w-(--breakpoint-xl) mx-auto px-4 lg:px-12 py-10">
                <div className="relative aspect-[3.9] border rounded-t overflow-hidden">
                    <Image  
                        src={"/placeholder-cover.webp"}
                        alt="placeholder"
                        fill
                        className="object-cover"
                />
                </div>
            </section>
        </div>
    )
}