import type {IGraphQLConfig} from 'graphql-config';
import {getSchema} from '@shopify/hydrogen-codegen';
import {ApiType, shopifyApiTypes, shopifyApiProject} from '@shopify/api-codegen-preset';

/**
 * GraphQL Config
 * @see https://the-guild.dev/graphql/config/docs/user/usage
 * @type {IGraphQLConfig}
 */
export default {
  projects: {
    default: shopifyApiProject({
      apiType: ApiType.Admin,
      apiVersion: '2025-07',
      documents: ['./app/graphql/admin/*.{js,ts,jsx,tsx}'],
      outputDir: './types',
    }),

    storefront: {
      schema: getSchema('storefront'),
      documents: [
        './*.{ts,tsx,js,jsx}',
        './app/**/*.{ts,tsx,js,jsx}',
        '!./app/graphql/**/*.{ts,tsx,js,jsx}',
      ],
    },

    customer: {
      schema: getSchema('customer-account'),
      documents: ['./app/graphql/customer-account/*.{ts,tsx,js,jsx}'],
    },

    // Add your own GraphQL projects here for CMS, Shopify Admin API, etc.
  },
} as IGraphQLConfig;
