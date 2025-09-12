import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {NavLink, useLoaderData, type MetaFunction} from 'react-router';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductItem} from '~/components/ProductItem';
import {PRODUCT_ITEM_FRAGMENT} from '~/lib/fragments';
import ImageWithText from '~/components/ImageWithText';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [
    {title: `Project Playground | ${data?.collection.title ?? ''} Collection`},
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
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    throw redirect('/collections');
  }

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, ...paginationVariables},
      // Add other queries here, so that they are loaded in parallel
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {
    collection,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  return {};
}

interface SocialLink {
  text: string;
  url: string;
}

export default function Collection() {
  const {collection} = useLoaderData<typeof loader>();
  const collectionType = collection.collection_type?.value;
  const collectionImage =
    collectionType === 'creator'
      ? collection.creator?.reference?.image?.reference?.image
      : collection.image;
  const collectionDescription =
    collectionType === 'creator'
      ? collection.creator?.reference?.about?.value
      : collection.description;
  const creator = collection.creator?.reference;
  const socialLinks: SocialLink[] | undefined =
    collectionType === 'creator' && creator?.social_links?.value
      ? ((JSON.parse(creator?.social_links?.value) ||
          []) as unknown as SocialLink[])
      : undefined;
  return (
    <div className="collection">
      {collectionImage ? (
        <ImageWithText
          image={collectionImage}
          textFirst={collectionType !== 'creator'}
          containerClassName={`${collectionType}-collection-header-container`}
        >
          <div className={`${collectionType}-collection-header`}>
            {collectionType === 'creator' && (
              <span className="caption">Introducing</span>
            )}
            <h1>
              {collectionType === 'category' && 'All '}
              {collectionType === 'creator'
                ? creator?.name?.value
                : collection.title}
            </h1>
            {collectionDescription && (
              <p className="description">{collectionDescription}</p>
            )}
            {socialLinks && (
              <div className="social-links">
                {socialLinks.map((link) => (
                  <a
                    href={link.url}
                    key={`${creator?.name?.value}-${link.text}`}
                    className="initial-underline-link"
                  >
                    {link.text}
                  </a>
                ))}
              </div>
            )}
          </div>
        </ImageWithText>
      ) : (
        <h1 className="collection-header">
          {collectionType === 'category' && 'All'} {collection.title}
        </h1>
      )}
      {collectionType === 'creator' && collection.quote && (
        <div className="creator-collection-quote">
          <h2>“{collection.quote?.reference?.message?.value}”</h2>
          <p className="caption">
            -{' '}
            {collection.quote?.reference?.creator_name?.value ||
              creator?.name?.value}
          </p>
        </div>
      )}
      {collectionType === 'creator' && collection.featured_product && (
        <ImageWithText
          image={
            collection.featured_product?.reference?.product?.reference
              ?.featuredImage
          }
          textFirst={true}
          containerClassName="creator-featured-product-container background-medium"
        >
          <div className={`${collectionType}-collection-header`}>
            <span className="caption">
              {collection.featured_product.reference?.caption?.value ||
                'Featured Product'}
            </span>
            <h1>
              {
                collection.featured_product?.reference?.product?.reference
                  ?.title
              }
            </h1>
            {collection.featured_product.reference?.description?.value && (
              <p className="description">
                {collection.featured_product.reference?.description?.value}
              </p>
            )}
            <NavLink
              className="button"
              to={`/products/${collection.featured_product.reference?.product?.reference?.handle}`}
            >
              Shop Now
            </NavLink>
          </div>
        </ImageWithText>
      )}
      <PaginatedResourceSection
        connection={collection.products}
        resourcesClassName="products-grid"
      >
        {({node: product, index}) => (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
          />
        )}
      </PaginatedResourceSection>
      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
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
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ProductItem
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
