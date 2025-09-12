import {useLoaderData, Link} from 'react-router';
import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {getPaginationVariables, Image} from '@shopify/hydrogen';
import type {CollectionFragment} from 'storefrontapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';

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
async function loadCriticalData({context, request}: LoaderFunctionArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 100,
  });

  const [{collections}] = await Promise.all([
    context.storefront.query(COLLECTIONS_QUERY, {
      variables: paginationVariables,
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {collections};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  return {};
}

export default function Collections() {
  const {collections} = useLoaderData<typeof loader>();

  return (
    <div className="collections">
      <h1>Meet Our Creators</h1>
      <PaginatedResourceSection
        connection={collections}
        resourcesClassName="collections-grid"
      >
        {({node: collection, index}) => {
          if (
            collection.collection_type?.value !== 'creator' ||
            !collection.creator
          ) {
            return null;
          }
          return (
            <CreatorCollectionItem
              key={collection.id}
              collection={collection}
              index={index}
            />
          );
        }}
      </PaginatedResourceSection>
    </div>
  );
}

function CreatorCollectionItem({
  collection,
  index,
}: {
  collection: CollectionFragment;
  index: number;
}) {
  const creator = collection.creator?.reference;
  const image = creator?.image?.reference?.image;
  return (
    <Link
      className="collection-item"
      key={collection.id}
      to={`/collections/${collection.handle}`}
      prefetch="intent"
    >
      {image && (
        <div className="collection-image-container">
          <Image
            alt={image.altText || collection.title}
            aspectRatio="1/1"
            data={image}
            loading={index < 3 ? 'eager' : undefined}
            sizes="(min-width: 45em) 400px, 100vw"
          />
        </div>
      )}
      <div className="collection-name-container">
        <h5 className="hover-underline-link">{collection.title}</h5>
      </div>
    </Link>
  );
}

const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
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
        }
      }
    }
    collection_type: metafield(namespace: "custom", key: "collection_type") {
      value
    }
  }
  query StoreCollections(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...Collection
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
` as const;
