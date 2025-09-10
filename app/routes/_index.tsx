import React, {Suspense} from 'react';
import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {
  Await,
  useLoaderData,
  Link,
  type MetaFunction,
  NavLink,
} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  CollFragment,
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
  ShopInformationQuery,
  StorefrontComponentsQuery,
} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';
import Carousel from '~/components/Carousel';
import Tabs from '~/components/Tabs';
import {PRODUCT_ITEM_FRAGMENT} from '~/lib/fragments';

export const meta: MetaFunction = () => {
  return [{title: 'Project Playground | Home'}];
};

export async function loader(args: LoaderFunctionArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: LoaderFunctionArgs) {
  const [storefrontComponents, {collections}, {shop}, allCollections] =
    await Promise.all([
      // const [storefrontComponents, {collections}, {shop}] = await Promise.all([
      context.storefront.query(STOREFRONT_COMPONENTS_QUERY, {
        variables: {storefrontComponentType: 'storefront_components'},
      }),
      // Add other queries here, so that they are loaded in parallel
      context.storefront.query(FEATURED_COLLECTION_QUERY),
      context.storefront.query(SHOP_INFORMATION_QUERY),
      context.storefront.query(ALL_COLLECTIONS_QUERY),
    ]);

  return {
    featuredCollection: collections.nodes[0],
    storefrontComponents: storefrontComponents.metaobjects.nodes,
    shopInformation: shop,
    collections: allCollections.collections.nodes,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();

  const topCategories = data.collections
    .filter((coll: CollFragment) => coll.collection_type?.value === 'category')
    .slice(0, 3);
  return (
    <div className="home">
      <FeaturedBanner storefrontComponents={data.storefrontComponents} />
      <About shopInformation={data.shopInformation} />
      <TopCategories topCategories={topCategories} />
      {/* <FeaturedCollection collection={data.featuredCollection} />
      <RecommendedProducts products={data.recommendedProducts} /> */}
    </div>
  );
}

function FeaturedBanner({
  storefrontComponents,
}: {
  storefrontComponents: StorefrontComponentsQuery['metaobjects']['nodes'];
}) {
  const featuredBannerItems = storefrontComponents.filter(
    (item) => item?.type?.value === 'featured_banner',
  );

  return (
    <Carousel>
      {featuredBannerItems.map((item) => {
        if (!item) return null;
        const image = item.image?.reference?.image ?? null;
        let bannerLink = '/';
        if (item.product?.reference?.handle) {
          bannerLink = `/products/${item.product?.reference?.handle}`;
        } else if (item.collection?.reference?.handle) {
          bannerLink = `/collections/${item.collection?.reference?.handle}`;
        }

        const itemAlignment = item?.text_position?.value?.includes('center')
          ? 'center'
          : item?.text_position?.value?.includes('right')
            ? 'end'
            : 'start';

        const contentAlignment = item?.text_position?.value?.includes('middle')
          ? 'center'
          : item?.text_position?.value?.includes('bottom')
            ? 'end'
            : 'start';

        return (
          <div className="featured-banner" key={item.id}>
            {image && (
              <div className="featured-banner-image">
                <Image
                  alt={image.altText || `${item.title?.value} banner image`}
                  aspectRatio={`${image.width}/${image.height}`}
                  data={image}
                  key={image.id}
                  sizes="(min-width: 45em) 50vw, 100vw"
                />
              </div>
            )}
            <div
              className="featured-banner-content-wrapper"
              style={{
                alignItems: itemAlignment,
                justifyContent: contentAlignment,
              }}
            >
              <div
                className="featured-banner-content"
                style={{
                  backgroundColor: item?.background_color?.value || undefined,
                  color: item?.text_color?.value || undefined,
                  alignItems: itemAlignment,
                  textAlign:
                    itemAlignment === 'start'
                      ? 'left'
                      : itemAlignment === 'end'
                        ? 'right'
                        : 'center',
                }}
              >
                {(item?.title?.value || '').trim().split(/\s+/).length < 5 ? (
                  <h1>{item?.title?.value}</h1>
                ) : (
                  <h2>{item?.title?.value}</h2>
                )}

                <p>{item?.subtitle?.value}</p>
                <NavLink to={bannerLink} className="button">
                  {item?.button_label?.value}
                </NavLink>
              </div>
            </div>
          </div>
        );
      })}
    </Carousel>
  );
}

function About({
  shopInformation,
}: {
  shopInformation: ShopInformationQuery['shop'];
}) {
  const image = shopInformation.logo_colorful?.reference?.image ?? null;
  return (
    <div className="about">
      {image && (
        <Image
          alt={image.altText || 'colorful logo'}
          aspectRatio={`${image.width}/${image.height}`}
          data={image}
          key={image.id}
          sizes="(min-width: 45em) 50vw, 100vw"
        />
      )}
      <h2>{shopInformation.description?.value}</h2>
    </div>
  );
}

function TopCategories({topCategories}: {topCategories: CollFragment[]}) {
  return (
    <div className="top-categories-section">
      <Tabs
        title="Shop Our Top Categories"
        tabs={topCategories.map((topCategory) => {
          const products = topCategory.products.nodes;
          return {
            id: topCategory.id,
            title: topCategory.title,
            handle: topCategory.handle,
            content: (
              <Carousel slidesToShow={4} infinite={false}>
                {products.map((product) => {
                  return <ProductItem key={product.id} product={product} />;
                })}
              </Carousel>
            ),
          };
        })}
        tabHeaderClassName="homepage-section-title"
      />
    </div>
  );
}

function FeaturedCollection({
  collection,
}: {
  collection: FeaturedCollectionFragment;
}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <Link
      className="featured-collection"
      to={`/collections/${collection.handle}`}
    >
      {image && (
        <div className="featured-collection-image">
          <Image data={image} sizes="100vw" />
        </div>
      )}
      <h1>{collection.title}</h1>
    </Link>
  );
}

function RecommendedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  return (
    <div className="recommended-products">
      <h2>Recommended Products</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {(response) => (
            <div className="recommended-products-grid">
              {response
                ? response.products.nodes.map((product) => (
                    <ProductItem key={product.id} product={product} />
                  ))
                : null}
            </div>
          )}
        </Await>
      </Suspense>
      <br />
    </div>
  );
}

const SHOP_INFORMATION_QUERY = `#graphql
  query ShopInformation(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    shop {
      logo_colorful: metafield(namespace: "custom_shop", key: "logo_colorful") {
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
      description: metafield(namespace: "custom_shop", key: "description") {
        value
      }
    }
  }
` as const;

const STOREFRONT_COMPONENTS_QUERY = `#graphql
  query StorefrontComponents(
    $storefrontComponentType: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    metaobjects(type: $storefrontComponentType, first: 10) {
      nodes {
        handle
        id
        type: field(key: "type") {value}
        title: field(key: "title") {value}
        subtitle: field(key: "subtitle") {value}
        button_label: field(key: "button_label") {value}
        text_position: field(key: "text_position") {value}
        text_color: field(key: "text_color") {value}
        background_color: field(key: "background_color") {value}
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
        fields {
          key
          value
        }
      }
    }
  }
` as const;

const ALL_COLLECTIONS_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  fragment Coll on Collection {
    id
    title
    handle
    collection_type: metafield(namespace: "custom", key: "collection_type") {
      value
    }
    products(first: 8) {
      nodes {
        ...ProductItem
      }
    }
  }
  query AllCollections($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 100) {
      nodes {
        ...Coll
      }
    }
  }
` as const;

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
