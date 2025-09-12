/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as AdminTypes from './admin.types';

export type CustomerQueryItemFragment = (
  Pick<AdminTypes.Customer, 'id'>
  & { defaultEmailAddress?: AdminTypes.Maybe<Pick<AdminTypes.CustomerEmailAddress, 'emailAddress' | 'marketingOptInLevel' | 'marketingState' | 'marketingUpdatedAt'>> }
);

export type CustomerMutateItemFragment = (
  Pick<AdminTypes.Customer, 'id' | 'email'>
  & { emailMarketingConsent?: AdminTypes.Maybe<Pick<AdminTypes.CustomerEmailMarketingConsentState, 'consentUpdatedAt' | 'marketingOptInLevel' | 'marketingState'>> }
);

export type CustomerByEmailQueryVariables = AdminTypes.Exact<{
  identifier: AdminTypes.CustomerIdentifierInput;
}>;


export type CustomerByEmailQuery = { customer?: AdminTypes.Maybe<(
    Pick<AdminTypes.Customer, 'id'>
    & { defaultEmailAddress?: AdminTypes.Maybe<Pick<AdminTypes.CustomerEmailAddress, 'emailAddress' | 'marketingOptInLevel' | 'marketingState' | 'marketingUpdatedAt'>> }
  )> };

export type CustomerEmailMarketingConsentUpdateMutationVariables = AdminTypes.Exact<{
  input: AdminTypes.CustomerEmailMarketingConsentUpdateInput;
}>;


export type CustomerEmailMarketingConsentUpdateMutation = { customerEmailMarketingConsentUpdate?: AdminTypes.Maybe<{ customer?: AdminTypes.Maybe<(
      Pick<AdminTypes.Customer, 'id' | 'email'>
      & { emailMarketingConsent?: AdminTypes.Maybe<Pick<AdminTypes.CustomerEmailMarketingConsentState, 'consentUpdatedAt' | 'marketingOptInLevel' | 'marketingState'>> }
    )>, userErrors: Array<Pick<AdminTypes.CustomerEmailMarketingConsentUpdateUserError, 'field' | 'message'>> }> };

export type NewSubscriberMutationVariables = AdminTypes.Exact<{
  input: AdminTypes.CustomerInput;
}>;


export type NewSubscriberMutation = { customerCreate?: AdminTypes.Maybe<{ customer?: AdminTypes.Maybe<(
      Pick<AdminTypes.Customer, 'id' | 'email'>
      & { emailMarketingConsent?: AdminTypes.Maybe<Pick<AdminTypes.CustomerEmailMarketingConsentState, 'consentUpdatedAt' | 'marketingOptInLevel' | 'marketingState'>> }
    )>, userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }> };

export type ShopInformationQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type ShopInformationQuery = { shop: { billingAddress: Pick<AdminTypes.ShopAddress, 'address1' | 'address2' | 'city' | 'zip'>, logo_dark?: AdminTypes.Maybe<(
      Pick<AdminTypes.Metafield, 'value'>
      & { reference?: AdminTypes.Maybe<{ image?: AdminTypes.Maybe<Pick<AdminTypes.Image, 'id' | 'url' | 'height' | 'width' | 'altText'>> }> }
    )> } };

interface GeneratedQueryTypes {
  "#graphql\n  #graphql\n  fragment CustomerQueryItem on Customer {\n    id\n    defaultEmailAddress {\n      emailAddress\n      marketingOptInLevel\n      marketingState\n      marketingUpdatedAt\n    }\n  }\n\n  query CustomerByEmail($identifier: CustomerIdentifierInput!) {\n    customer: customerByIdentifier(identifier: $identifier) {\n      ...CustomerQueryItem\n    }\n  }\n": {return: CustomerByEmailQuery, variables: CustomerByEmailQueryVariables},
  "#graphql\n  query ShopInformation {\n    shop {\n      billingAddress {\n        address1\n        address2\n        city\n        zip\n      }\n      logo_dark: metafield(namespace: \"custom_shop\", key: \"logo_dark\") {\n        value\n        reference {\n          ... on MediaImage {\n            image {\n              id\n              url\n              height\n              width\n              altText\n            }\n          }\n        }\n      }\n    }\n  }\n": {return: ShopInformationQuery, variables: ShopInformationQueryVariables},
}

interface GeneratedMutationTypes {
  "#graphql\n  #graphql\n  fragment CustomerMutateItem on Customer {\n    id\n    email\n    emailMarketingConsent{\n      consentUpdatedAt\n      marketingOptInLevel\n      marketingState\n    }\n  }\n\n  mutation CustomerEmailMarketingConsentUpdate($input: CustomerEmailMarketingConsentUpdateInput!) {\n    customerEmailMarketingConsentUpdate(input: $input) {\n      customer {\n        ...CustomerMutateItem\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: CustomerEmailMarketingConsentUpdateMutation, variables: CustomerEmailMarketingConsentUpdateMutationVariables},
  "#graphql\n  #graphql\n  fragment CustomerMutateItem on Customer {\n    id\n    email\n    emailMarketingConsent{\n      consentUpdatedAt\n      marketingOptInLevel\n      marketingState\n    }\n  }\n\n  mutation NewSubscriber($input: CustomerInput!) {\n    customerCreate(input: $input) {\n      customer {\n        ...CustomerMutateItem\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n": {return: NewSubscriberMutation, variables: NewSubscriberMutationVariables},
}
declare module '@shopify/admin-api-client' {
  type InputMaybe<T> = AdminTypes.InputMaybe<T>;
  interface AdminQueries extends GeneratedQueryTypes {}
  interface AdminMutations extends GeneratedMutationTypes {}
}
