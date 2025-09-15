import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, NavLink, useLoaderData, type MetaFunction} from 'react-router';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductImage} from '~/components/ProductImage';
import {ProductForm} from '~/components/ProductForm';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {PRODUCT_ITEM_FRAGMENT, PRODUCT_VARIANT_FRAGMENT} from '~/lib/fragments';
import ImageWithText from '~/components/ImageWithText';
import Tabs from '~/components/Tabs';
import {RecommendedProductsQuery} from 'storefrontapi.generated';
import {Suspense} from 'react';
import {ProductItem} from '~/components/ProductItem';
import Carousel from '~/components/Carousel';
import {ComplementaryProductItem} from '~/components/ComplementaryProductItem';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [
    {title: `Project Playground | ${data?.product.title ?? ''}`},
    {
      rel: 'canonical',
      href: `/products/${data?.product.handle}`,
    },
  ];
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
async function loadCriticalData({
  context,
  params,
  request,
}: LoaderFunctionArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {
    product,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context, params}: LoaderFunctionArgs) {
  const {handle} = params;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  // Put any API calls that is not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.
  const relatedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY, {
      variables: {handle, intent: 'RELATED'},
    })
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  const complementaryProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY, {
      variables: {handle, intent: 'COMPLEMENTARY'},
    })
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    relatedProducts,
    complementaryProducts,
  };
}

export default function Product() {
  const {product, relatedProducts, complementaryProducts} =
    useLoaderData<typeof loader>();
  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const productDescriptorTabs = [];
  if (product.description) {
    productDescriptorTabs.push({
      id: 'description',
      title: 'Description',
      content: <div>{product.description}</div>,
    });
  }

  if (product.product_info) {
    productDescriptorTabs.push({
      id: 'product-info',
      title: 'Product Information',
      content: <div>{product.product_info.value}</div>,
    });
  }

  if (product.care_guide) {
    productDescriptorTabs.push({
      id: 'care-guide',
      title: 'Care Guide',
      content: <div>{product.care_guide.value}</div>,
    });
  }

  console.log(product);
  // Get creator information
  const creator = product.creator?.reference;
  const creatorImage = creator?.image?.reference?.image;
  const creatorDescription = creator?.about?.value;
  const {title, descriptionHtml} = product;
  return (
    <>
      <div className="product">
        <ProductImage image={selectedVariant?.image} />
        <div className="product-main">
          <div className="product-caption">
            <NavLink className="hover-fade" to={`/`}>
              Home
            </NavLink>
            <div className="breadcrumbs__arrow">&nbsp;</div>
            <span>
              {creator?.name?.value} | {product.title}
            </span>
          </div>
          <h1>{title}</h1>
          <ProductPrice
            price={selectedVariant?.price}
            compareAtPrice={selectedVariant?.compareAtPrice}
          />
          <ProductForm
            productOptions={productOptions}
            selectedVariant={selectedVariant}
          />
          {productDescriptorTabs.length > 0 && (
            <Tabs tabs={productDescriptorTabs} />
          )}
          <Suspense fallback={<div>Loading...</div>}>
            <Await resolve={complementaryProducts}>
              {(response) => {
                return (
                  <div>
                    <p>You may also like:</p>
                    <div className="complementary-products">
                      {response
                        ? response?.productRecommendations?.map((product) => (
                            <ComplementaryProductItem
                              key={product.id}
                              product={product}
                            />
                          ))
                        : null}
                    </div>
                  </div>
                );
              }}
            </Await>
          </Suspense>
        </div>
        <Analytics.ProductView
          data={{
            products: [
              {
                id: product.id,
                title: product.title,
                price: selectedVariant?.price.amount || '0',
                vendor: product.vendor,
                variantId: selectedVariant?.id || '',
                variantTitle: selectedVariant?.title || '',
                quantity: 1,
              },
            ],
          }}
        />
      </div>
      <ImageWithText
        image={creatorImage}
        textFirst={false}
        containerClassName={`creator-collection-header-container background-medium`}
      >
        <div className={`creator-collection-header`}>
          <span className="caption">About the Creator</span>

          <h1>{creator?.name?.value}</h1>
          {creatorDescription && (
            <p className="description">{creatorDescription}</p>
          )}
          <NavLink className="button" to={`/products/${creator?.handle}`}>
            Shop Now
          </NavLink>
        </div>
      </ImageWithText>

      <Tabs
        tabs={[
          {
            id: 'related-products',
            title: 'Related Products',
            content: <RelatedProducts products={relatedProducts} />,
          },
          // TODO: ADD RECENTLY VIEWED PRODUCTS
          {
            id: 'recently-viewed',
            title: 'Recently Viewed',
            content: <div></div>,
          },
        ]}
      />
    </>
  );
}

function RelatedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  return (
    <div className="recommended-products">
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {(response) => {
            return (
              <Carousel slidesToShow={3.5} infinite={false}>
                {response
                  ? response?.productRecommendations?.map((product) => (
                      <ProductItem key={product.id} product={product} />
                    ))
                  : null}
              </Carousel>
            );
          }}
        </Await>
      </Suspense>
      <br />
    </div>
  );
}

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
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
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
    creator: metafield(namespace: "pp_product", key: "creator") {
      value
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
        }
      }
    }
    product_info: metafield(namespace: "pp_product", key: "product_information") {value}
    care_guide: metafield(namespace: "descriptors", key: "care_guide") {value}
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query RecommendedProducts (
    $intent: ProductRecommendationIntent!,
    $handle: String!,
    $country: CountryCode,
    $language: LanguageCode
  )
    @inContext(country: $country, language: $language) {
    productRecommendations(intent: $intent, productHandle: $handle) {
        ...ProductItem
    }
  }
` as const;
