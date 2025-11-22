import { isSuperAdmin } from '@/lib/access'
import { Tenant } from '@/payload-types';
import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
    slug: "products",
    access: {
        create: ({ req }) => {
            if (isSuperAdmin(req.user)) return true;

            const tenant = req.user?.tenants?. [0]?.tenant as Tenant
            
            return Boolean(tenant?.stripeDetailsSubmitted);
        },
        delete: ({ req }) => isSuperAdmin(req.user),
    },
    admin: {
        useAsTitle: "name",
        description: "You must verify your Stripe account before adding products."
    },
    fields: [
        {
            name: "name",
            type: "text",
            required: true,
        },
        {
            name: "description",
            type: "richText",
        },
        {
            name: "price",
            admin: {
                description: "List price in USD"
            },
            type: "number",
            required: true,
        },
        {
            name: "category",
            type: "relationship",
            relationTo: "categories",
            hasMany: false,
        },
        {
            name: "tags",
            type: "relationship",
            relationTo: "tags",
            hasMany: true,
        },
        {
            name: "image",
            type: "upload",
            relationTo: "media",
        },
                {
            name: "cover",
            type: "upload",
            relationTo: "media",
        },
        {
            name: "refundPolicy",
            type: "select",
            options: ["30-day","14-day","7-day","1-day","no-refunds"],
            defaultValue: ["30-day"],
        },
        {
            name: "content",
            type: "richText",
            admin: {
                description: 
                    "Protected content only visible to customers after purchase. Add product documentation, downloadable files, getting started guides and bonus materials. Support markdown formatting"
            },
        },
        {
            name: "isArchived",
            label: "Archive",
            defaultValue: false,
            type: "checkbox",
            admin: {
                description: "Check if you want to delete this product.",
            },
        },
        {
            name: "isPrivate",
            label: "Private",
            defaultValue: false,
            type: "checkbox",
            admin: {
                description: "Check if you want to private this product. Only visible on the tenant's store.",
            },
        }
    ]   
}