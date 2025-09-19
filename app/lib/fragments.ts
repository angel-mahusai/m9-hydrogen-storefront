// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/cart
export const CART_QUERY_FRAGMENT = `#graphql
  fragment Money on MoneyV2 {
    currencyCode
    amount
  }
  fragment CartLine on CartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
      compareAtAmountPerQuantity {
        ...Money
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice {
          ...Money
        }
        price {
          ...Money
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height

        }
        product {
          handle
          title
          id
          vendor
        }
        selectedOptions {
          name
          value
        }
      }
    }
  }
  fragment CartLineComponent on ComponentizableCartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
      compareAtAmountPerQuantity {
        ...Money
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice {
          ...Money
        }
        price {
          ...Money
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height
        }
        product {
          handle
          title
          id
          vendor
        }
        selectedOptions {
          name
          value
        }
      }
    }
  }
  fragment CartApiQuery on Cart {
    updatedAt
    id
    appliedGiftCards {
      lastCharacters
      amountUsed {
        ...Money
      }
    }
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
      customer {
        id
        email
        firstName
        lastName
        displayName
      }
      email
      phone
    }
    lines(first: $numCartLines) {
      nodes {
        ...CartLine
      }
      nodes {
        ...CartLineComponent
      }
    }
    cost {
      subtotalAmount {
        ...Money
      }
      totalAmount {
        ...Money
      }
      totalDutyAmount {
        ...Money
      }
      totalTaxAmount {
        ...Money
      }
    }
    note
    attributes {
      key
      value
    }
    discountCodes {
      code
      applicable
    }
  }
` as const;


const MENU_FRAGMENT = `#graphql
  fragment MenuItem on MenuItem {
    id
    resourceId
    tags
    title
    type
    url
  }
  fragment ChildMenuItem on MenuItem {
    ...MenuItem
    items {
      ...MenuItem
    }
  }
  fragment ParentMenuItem on MenuItem {
    ...MenuItem
    items {
      ...ChildMenuItem
    }
  }
  fragment Menu on Menu {
    id
    items {
      ...ParentMenuItem
    }
  }
` as const;

export const HEADER_QUERY = `#graphql
  fragment Shop on Shop {
    id
    name
    description
    primaryDomain {
      url
    }
    brand {
      logo {
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
  fragment MetaobjectConnection on MetaobjectConnection {
    nodes {
      handle
      id
      type
      menu_title: field(key: "menu_title") {value}
      title: field(key: "title") {value}
      subtitle: field(key: "subtitle") {value}
      text_color: field(key: "text_color") {value}
      image: field(key: "image") {
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
      product: field(key: "product") {
        reference {
          ... on Product {
            handle
          }
        }
      }
      collection: field(key: "collection") {
        reference {
          ... on Collection {
            handle
          }
        }
      }
      page: field(key: "page") {
        reference {
          ... on Page {
            handle
          }
        }
      }
    }
  }
  query Header(
    $country: CountryCode
    $headerMenuHandle: String!
    $additionalMenuType: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    shop {
      ...Shop
    }
    menu(handle: $headerMenuHandle) {
      ...Menu
    }
    metaobjects(type: $additionalMenuType, first: 10) {
      ...MetaobjectConnection
    }
  }
  ${MENU_FRAGMENT}
` as const;

export const FOOTER_QUERY = `#graphql
  query Footer(
    $country: CountryCode
    $footerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    menu(handle: $footerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
` as const;

export const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

export const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
        }
      }
    }
    adjacentVariants {
      ...ProductVariant
    }
    variants (first: 250) {
      nodes {
        ...ProductVariant
      }
    }
    selectedOrFirstAvailableVariant {
      ...ProductVariant
    }
    variantsCount {
      count
    }
    creator: metafield(namespace: "pp_product", key: "creator") {
      value
      reference {
        ... on Metaobject {
          id
          handle
          name: field(key: "name") {value}
        }
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
export const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $filters: [ProductFilter!]
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        id
        url
        height
        width
        altText
      }
      creator: metafield(namespace: "creator_collection", key: "creator") {
        reference {
          ... on Metaobject {
            id
            handle
            name: field(key: "name") {value}
            image: field(key: "image") {
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
            about: field(key: "about") {
              value
            }
            social_links: field(key: "social_links") {
              value
            }
          }
        }
      }
      quote: metafield(namespace: "creator_collection", key: "quote") {
        reference {
          ... on Metaobject {
            id
            handle
            message: field(key: "message") {value}
            creator_name: field(key: "creator_name") {value}
          }
        }
      }
      featured_product: metafield(namespace: "creator_collection", key: "featured_product") {
        reference {
          ... on Metaobject {
            id
            handle
            name: field(key: "name") {value}
            product: field(key: "product") {
              reference {
                ... on Product {
                  id
                  handle
                  title
                  featuredImage {
                    id
                    url
                    altText
                    width
                    height
                  }
                }
              }
            }
            description: field(key: "description") {value}
            caption: field(key: "caption") {value}
          }
        }
      }
      collection_type: metafield(namespace: "custom", key: "collection_type") {
        value
      }
      products(
        sortKey: $sortKey,
        reverse: $reverse,
        filters: $filters,
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ProductItem
        }
        filters {
          id
          label
          type
          values {
            count
            id
            input
            label
          }
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;
