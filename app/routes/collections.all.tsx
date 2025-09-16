import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {
  useLoaderData,
  useLocation,
  useNavigate,
  type MetaFunction,
} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductItem} from '~/components/ProductItem';
import {PRODUCT_ITEM_FRAGMENT} from '~/lib/fragments';
import {useMemo, useRef, useState} from 'react';
import {ChevronDownIcon, FilterIcon} from '~/assets';
import {useClickOutside} from '~/lib/utils';
import {PRODUCT_SORT_MAPPING} from '~/lib/constants';

export const meta: MetaFunction<typeof loader> = () => {
  return [{title: `Project Playground | Products`}];
};

export async function loader(args: LoaderFunctionArgs) {
  const url = new URL(args.request.url);
  const sortKey = url.searchParams.get('sort_by');
  const filterQuery = '';

  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData, sortKey, filterQuery};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request}: LoaderFunctionArgs) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 12,
  });

  const sortAndFilterVariables: Record<string, any> = {};
  const url = new URL(request.url);
  const sortKey = url.searchParams.get(
    'sort_by',
  ) as keyof typeof PRODUCT_SORT_MAPPING;
  if (sortKey && sortKey in PRODUCT_SORT_MAPPING) {
    sortAndFilterVariables['sortKey'] = PRODUCT_SORT_MAPPING[sortKey].value;
    sortAndFilterVariables['reverse'] = PRODUCT_SORT_MAPPING[sortKey].reverse;
  }

  const [{products}] = await Promise.all([
    storefront.query(CATALOG_QUERY, {
      variables: {...paginationVariables, ...sortAndFilterVariables},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {products};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  return {};
}

export default function Collection() {
  const {products, sortKey} = useLoaderData<typeof loader>();
  const {pathname, search} = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const sortBy =
    sortKey && {}.hasOwnProperty.call(PRODUCT_SORT_MAPPING, sortKey)
      ? PRODUCT_SORT_MAPPING[sortKey as keyof typeof PRODUCT_SORT_MAPPING]
      : null;

  useClickOutside(sortDropdownRef, () => {
    setIsSortOpen(false);
  });

  return (
    <div className="collection">
      <h1 className="collection-header">All Products</h1>
      <div className="collection-products">
        <div className="sticky-facets">
          <div className="facets-bar">
            <button
              className="filter-button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <FilterIcon width={18} height={18} viewBox="0 0 24 24" />
              <span>{isFilterOpen ? 'Hide' : 'Show'} Filters</span>
              <ChevronDownIcon
                width={18}
                height={18}
                viewBox="0 0 24 24"
                style={{
                  transform: `${isFilterOpen ? 'scaleY(-1)' : 'scaleY(1)'}`,
                }}
              />
            </button>
            <div ref={sortDropdownRef}>
              <button
                className="sort-button"
                onClick={() => setIsSortOpen(!isSortOpen)}
              >
                <span>{sortBy?.displayName || 'Sort By'}</span>
                <ChevronDownIcon
                  width={18}
                  height={18}
                  stroke="rgb(var(--color-secondary-text))"
                  viewBox="0 0 24 24"
                  style={{
                    transform: `${isSortOpen ? 'scaleY(-1)' : 'scaleY(1)'}`,
                  }}
                />
              </button>
              <div className={`sort-options${isSortOpen ? ' open' : ''}`}>
                {Object.entries(PRODUCT_SORT_MAPPING).map(
                  ([key, sortOption]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setIsSortOpen(false);
                        searchParams.set('sort_by', key);
                        navigate({
                          pathname,
                          search: searchParams.toString(),
                        });
                      }}
                      style={
                        searchParams.get('sort_by') === key
                          ? {
                              textDecoration: 'underline',
                              textUnderlineOffset: '5px',
                            }
                          : {}
                      }
                    >
                      {sortOption.displayName}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="products-grid-wrapper">
          <div className={`product-filters${isFilterOpen ? ' open' : ''}`}>
            FILTERS
          </div>
          <PaginatedResourceSection
            connection={products}
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
        </div>
      </div>
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/product
const CATALOG_QUERY = `#graphql
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $sortKey: ProductSortKeys
    $reverse: Boolean
    $query: String
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products (
      first: $first,
      last: $last,
      sortKey: $sortKey,
      reverse: $reverse,
      before: $startCursor,
      after: $endCursor,
      query: $query
    ) {
      nodes {
        ...ProductItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${PRODUCT_ITEM_FRAGMENT}
` as const;
