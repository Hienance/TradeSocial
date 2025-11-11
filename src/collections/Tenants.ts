import type { CollectionConfig } from 'payload'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
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
        admin: {
            description: "This will be the subdomain of the store (e.g. [slug].TradeSocial.com)",
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
        admin: {
            readOnly: true
        },
    },
    {
        name: "stripeDetailsSubmitted",
        type: "checkbox",
        admin: {
            readOnly: true,
            description: "You cannot create products until you have set up your stripe details",
        },
    },
  ],
}
