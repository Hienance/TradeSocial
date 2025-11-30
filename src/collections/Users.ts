import type { CollectionConfig } from 'payload'
import {tenantsArrayField}  from "@payloadcms/plugin-multi-tenant/fields";
import { isSuperAdmin } from '@/lib/access';

const defaultTenantArrayField = tenantsArrayField({
  tenantsArrayFieldName: "tenants",
  tenantsCollectionSlug: "tenants",
  tenantsArrayTenantFieldName: "tenant",
  arrayFieldAccess: {
    read: () => true,
    create: ({ req}) => isSuperAdmin(req.user),
    update: ({ req}) => isSuperAdmin(req.user),
  },
  tenantFieldAccess: {
    read: () => true,
    create: ({ req}) => isSuperAdmin(req.user),
    update: ({ req}) => isSuperAdmin(req.user),
  }
})

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    read: () => true,
    create: ({ req }) => isSuperAdmin(req.user),
    delete: ({ req }) => isSuperAdmin(req.user),
    update: ({ req, id }) => { 
      if (isSuperAdmin(req.user)) return true
    
      return req.user?.id === id;
    }

  },
  admin: {
    useAsTitle: 'email',
    hidden: ({ user }) => !isSuperAdmin(user)
  },
  auth: true,
  fields: [
    {
      name: "username",
      required: true,
      unique: true,
      type: "text",
    },
    // TOTP MFA fields
    {
      name: 'totpEnabled',
      label: 'TOTP Enabled',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Whether user has activated TOTP MFA.' },
      access: { update: ({ req }) => isSuperAdmin(req.user) || !!req.user },
    },
    {
      name: 'totpSecret',
      label: 'TOTP Secret',
      type: 'text',
      admin: { position: 'sidebar', description: 'Internal storage of user\'s TOTP secret (base32). Hidden.' },
      access: { update: ({ req }) => isSuperAdmin(req.user) || !!req.user },
    },
    {
      name: 'totpVerifiedAt',
      label: 'Last TOTP Verification',
      type: 'date',
      admin: { position: 'sidebar' },
      access: { update: ({ req }) => isSuperAdmin(req.user) || !!req.user },
    },
    {
      name: "otpCode",
      label: "One-Time Passcode",
      type: "text",
      admin: {
        position: "sidebar",
        description: "Temporary OTP for login verification.",
      },
      access: {
        update: ({ req }) => isSuperAdmin(req.user) || !!req.user,
      },
    },
    {
      name: "otpExpiresAt",
      label: "OTP Expires At",
      type: "date",
      admin: {
        position: "sidebar",
      },
      access: {
        update: ({ req }) => isSuperAdmin(req.user) || !!req.user,
      },
    },
    {
      name: "googleId",
      label: "Google Account ID",
      type: "text",
      unique: true,
      admin: {
        position: "sidebar",
        description: "Linked Google account identifier (sub)."
      },
      access: {
        update: ({ req }) => isSuperAdmin(req.user) || !!req.user,
      }
    },
    {
      name: "googleEmail",
      label: "Google Email",
      type: "email",
      unique: false,
      admin: {
        position: "sidebar",
        description: "Email returned from Google OAuth (for MFA / SSO)."
      },
      access: {
        update: ({ req }) => isSuperAdmin(req.user) || !!req.user,
      }
    },
    {
      name: "mfaGoogleEnabled",
      label: "MFA via Google Enabled",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Require Google re-auth as second factor."
      },
      access: {
        update: ({ req }) => isSuperAdmin(req.user) || !!req.user,
      }
    },
    {
      name: "mfaGoogleVerifiedAt",
      label: "Last Google MFA Verification",
      type: "date",
      admin: {
        position: "sidebar",
      },
      access: {
        update: ({ req }) => isSuperAdmin(req.user) || !!req.user,
      }
    },
    {
      admin: {
        position: "sidebar",
      },
      name: "roles",
      type: "select",
      defaultValue: ["user"],
      hasMany: true,
      options: ["super-admin", "user"],
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      }
    },
    {
      ...defaultTenantArrayField,
      admin: {
        ...(defaultTenantArrayField?.admin || {}),
        position: "sidebar",
      },
    },
  ],
}
