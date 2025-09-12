
export const SHOP_INFORMATION_QUERY = `#graphql
  query ShopInformation {
    shop {
      billingAddress {
        address1
        address2
        city
        zip
      }
      logo_dark: metafield(namespace: "custom_shop", key: "logo_dark") {
        value
        reference {
          ... on MediaImage {
            image {
              id
              url
              height
              width
              altText
            }
          }
        }
      }
    }
  }
` as const;