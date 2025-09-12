const CUSTOMER_QUERY_FRAGMENT = `#graphql
  fragment CustomerQueryItem on Customer {
    id
    defaultEmailAddress {
      emailAddress
      marketingOptInLevel
      marketingState
      marketingUpdatedAt
    }
  }
`;

const CUSTOMER_MUTATE_FRAGMENT = `#graphql
  fragment CustomerMutateItem on Customer {
    id
    email
    emailMarketingConsent{
      consentUpdatedAt
      marketingOptInLevel
      marketingState
    }
  }
`;

export const CUSTOMER_EMAIL_CONSENT_QUERY = `#graphql
  ${CUSTOMER_QUERY_FRAGMENT}
  query CustomerByEmail($identifier: CustomerIdentifierInput!) {
    customer: customerByIdentifier(identifier: $identifier) {
      ...CustomerQueryItem
    }
  }
`;

export const UPDATE_CUSTOMER_MARKETING_CONSENT = `#graphql
  ${CUSTOMER_MUTATE_FRAGMENT}
  mutation CustomerEmailMarketingConsentUpdate($input: CustomerEmailMarketingConsentUpdateInput!) {
    customerEmailMarketingConsentUpdate(input: $input) {
      customer {
        ...CustomerMutateItem
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CREATE_SUBSCRIBER = `#graphql
  ${CUSTOMER_MUTATE_FRAGMENT}
  mutation NewSubscriber($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        ...CustomerMutateItem
      }
      userErrors {
        field
        message
      }
    }
  }
`;
