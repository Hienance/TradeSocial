import { isSuperAdmin } from '@/lib/access'
import type { CollectionConfig } from 'payload'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  access: {
    create: ({ req }) => isSuperAdmin(req.user),
    delete: ({ req }) => isSuperAdmin(req.user),
  },
  admin: {
    useAsTitle: 'slug',
  },
  fields: [
    {
      name: "name",
      required: true,
      type: "text",
      label: "Store name",
      admin: {
        description: "This will be the name of the store (e.g. John's store)",
      }
    },
    {
        name: "slug",
        type: "text",
        index: true,
        required: true,
        unique: true,
        access: {
          update: ({ req }) => isSuperAdmin(req.user),
        },
        admin: {
            description: "This will be the subdomain of the store (e.g. [slug].TradeSocial.com)",
      }
    },
        {
      name: "description",
      type: "text",
      label: "Store description",
      admin: {
        description: "This will be the description of the store (e.g. A cozy little shop selling handmade goods)",
      }
    },
    {
        name: "image",
        type: "upload",
        relationTo: "media",
    },
    {
        name:  "stripeAccountId",
        type: "text",
        required: true,
        access: {
          update: ({ req }) => isSuperAdmin(req.user),
        },
        admin: {
            description: "Stripe Account ID associated with your shop",
        },
    },
    {
        name: "stripeDetailsSubmitted",
        type: "checkbox",
        access: {
          update: ({ req }) => isSuperAdmin(req.user),
        },
        admin: {
            description: "You cannot create products until you have set up your stripe details",
        },
    },
  ],
}
