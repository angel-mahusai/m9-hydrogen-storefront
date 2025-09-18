import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {
  NavLink,
  useLoaderData,
  useLocation,
  useNavigate,
  type MetaFunction,
} from 'react-router';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductItem} from '~/components/ProductItem';
import {COLLECTION_QUERY} from '~/lib/fragments';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ChevronDownIcon, FilterIcon, MinusIcon, PlusIcon} from '~/assets';
import {getProductFiltersAndSortVariables, useClickOutside} from '~/lib/utils';
import {PRODUCT_COLLECTION_SORT_MAPPING} from '~/lib/constants';
import ImageWithText from '~/components/ImageWithText';
import type {Collection} from '@shopify/hydrogen/storefront-api-types';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [
    {title: `Project Playground | ${data?.collection.title ?? ''} Collection`},
  ];
};

export async function loader(args: LoaderFunctionArgs) {
  const url = new URL(args.request.url);
  const sortKey = url.searchParams.get('sort_by');

  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData, sortKey};
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

  const url = new URL(request.url);

  const {filters, sortVariables} = getProductFiltersAndSortVariables(
    url.searchParams,
  );

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {
        handle,
        ...paginationVariables,
        ...sortVariables,
        filters,
      },
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
    filters,
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
  const {collection, sortKey} = useLoaderData<typeof loader>();
  const {pathname, search} = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const sortBy =
    sortKey && {}.hasOwnProperty.call(PRODUCT_COLLECTION_SORT_MAPPING, sortKey)
      ? PRODUCT_COLLECTION_SORT_MAPPING[
          sortKey as keyof typeof PRODUCT_COLLECTION_SORT_MAPPING
        ]
      : null;

  const priceFilter = collection.products.filters.find(
    (filter) => filter.type === 'PRICE_RANGE',
  );

  const getPrice = useCallback(
    (type: string) => {
      if (!priceFilter || (type !== 'min' && type !== 'max')) {
        return undefined;
      }
      return (
        searchParams?.get(`filter.v.price.${type === 'min' ? 'gte' : 'lte'}`) ||
        JSON.parse(priceFilter.values[0].input || '')['price'][type]
      );
    },
    [priceFilter, searchParams],
  );

  const [minPrice, setMinPrice] = useState<number | undefined>(getPrice('min'));
  const [maxPrice, setMaxPrice] = useState<number | undefined>(getPrice('max'));

  useEffect(() => {
    setMinPrice(getPrice('min'));
    setMaxPrice(getPrice('max'));
  }, [getPrice]);

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

  useClickOutside(sortDropdownRef, () => {
    setIsSortOpen(false);
  });

  function clearFilters() {
    let filterSearchParams;
    if (!searchParams) {
      filterSearchParams = new URLSearchParams(search);
    } else {
      filterSearchParams = searchParams;
    }

    Array.from(filterSearchParams).map(([key, value]) => {
      if (key.startsWith('filter')) {
        filterSearchParams.delete(key);
      }
    });

    navigate(
      {
        pathname,
        search: filterSearchParams.toString(),
      },
      {preventScrollReset: true},
    );
  }

  interface FilterClear {
    filterId: string;
    filterValue?: string;
  }

  function clearFilter(filtersToClear: FilterClear[]) {
    filtersToClear.map((filter) => {
      if (filter.filterValue) {
        searchParams.delete(filter.filterId, filter.filterValue);
      } else {
        searchParams.delete(filter.filterId);
      }
    });

    navigate(
      {
        pathname,
        search: searchParams.toString(),
      },
      {preventScrollReset: true},
    );
  }

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
                {Object.entries(PRODUCT_COLLECTION_SORT_MAPPING).map(
                  ([key, sortOption]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setIsSortOpen(false);
                        searchParams.set('sort_by', key);
                        navigate(
                          {
                            pathname,
                            search: searchParams.toString(),
                          },
                          {preventScrollReset: true},
                        );
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
            <div>
              {searchParams && (
                <div className="active-filters">
                  {searchParams.size >
                    1 + (searchParams.has('sort_by') ? 1 : 0) && (
                    <button onClick={clearFilters}>Clear All</button>
                  )}
                  {(collection.products.filters || []).map((filter) => {
                    if (
                      filter.type === 'PRICE_RANGE' &&
                      (searchParams.has('filter.v.price.gte') ||
                        searchParams.has('filter.v.price.lte'))
                    ) {
                      return (
                        <button
                          key={`active-filter-${filter.id}`}
                          onClick={() => {
                            clearFilter([
                              {filterId: 'filter.v.price.gte'},
                              {filterId: 'filter.v.price.lte'},
                            ]);
                          }}
                        >
                          {`₱${searchParams.get('filter.v.price.gte')} - ₱${searchParams.get('filter.v.price.lte')}`}
                        </button>
                      );
                    } else if (filter.type === 'LIST') {
                      return (
                        <>
                          {filter.values.map((filterOption) => {
                            const searchParamValue = filter.id.startsWith(
                              'filter.p.m.',
                            )
                              ? `${filterOption.label}-${filterOption.id.split('-').pop()}`
                              : filterOption.label;
                            return (
                              searchParams.has(filter.id, searchParamValue) && (
                                <button
                                  key={`active-filter-${filterOption.id}`}
                                  onClick={() => {
                                    clearFilter([
                                      {
                                        filterId: filter.id,
                                        filterValue: searchParamValue,
                                      },
                                    ]);
                                  }}
                                >
                                  {filterOption.label}
                                </button>
                              )
                            );
                          })}
                        </>
                      );
                    }
                    return <></>;
                  })}
                </div>
              )}
              {(collection.products.filters || []).map((filter) => {
                return (
                  <FilterListOptions
                    filter={filter}
                    searchParams={searchParams}
                    key={filter.id}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    setMinPrice={setMinPrice}
                    setMaxPrice={setMaxPrice}
                  />
                );
              })}
            </div>
            <button
              className="button reset-filters"
              onClick={() => clearFilters()}
            >
              RESET
            </button>
          </div>
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
        </div>
      </div>
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

function FilterListOptions({
  filter,
  searchParams,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
}: {
  filter: Collection['products']['filters'][0];
  searchParams?: URLSearchParams;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  setMinPrice: React.Dispatch<React.SetStateAction<number | undefined>>;
  setMaxPrice: React.Dispatch<React.SetStateAction<number | undefined>>;
}) {
  const navigate = useNavigate();
  const {pathname, search} = useLocation();

  const [open, setOpen] = useState<boolean>(false);

  if (!filter) return null;

  function handlePriceSet() {
    let filterSearchParams;
    if (!searchParams) {
      filterSearchParams = new URLSearchParams(search);
    } else {
      filterSearchParams = searchParams;
    }

    filterSearchParams.set(`${filter.id}.gte`, (minPrice || '0').toString());
    filterSearchParams.set(`${filter.id}.lte`, (maxPrice || '').toString());
    navigate(
      {
        pathname,
        search: filterSearchParams.toString(),
      },
      {preventScrollReset: true},
    );
  }

  function handleAddFilter(value: string) {
    let filterSearchParams;
    if (!searchParams) {
      filterSearchParams = new URLSearchParams(search);
    } else {
      filterSearchParams = searchParams;
    }

    if (filterSearchParams.has(filter.id, value)) {
      filterSearchParams.delete(filter.id, value);
    } else {
      filterSearchParams.append(filter.id, value);
    }

    navigate(
      {
        pathname,
        search: filterSearchParams.toString(),
      },
      {preventScrollReset: true},
    );
  }

  return (
    <div className={`filter-category${open ? ' open' : ''}`}>
      <div className="filter-label">
        <h4>{filter.label}</h4>
        <button onClick={() => setOpen(!open)}>
          <PlusIcon
            width={18}
            height={18}
            stroke="rgba(var(--color-secondary-text), 0.5)"
            viewBox="0 0 24 24"
          />
          <MinusIcon
            width={18}
            height={18}
            stroke="rgba(var(--color-secondary-text), 0.5)"
            viewBox="0 0 24 24"
          />
        </button>
      </div>
      {filter.type === 'LIST' ? (
        <ul className="filter-options">
          {filter.values.map((filterOption) => {
            const searchParamValue = filter.id.startsWith('filter.p.m.')
              ? `${filterOption.label}-${filterOption.id.split('-').pop()}`
              : filterOption.label;
            return (
              <li key={filterOption.id}>
                <input
                  type="checkbox"
                  onClick={() => handleAddFilter(searchParamValue)}
                  checked={
                    searchParams
                      ? searchParams.has(filter.id, searchParamValue)
                      : false
                  }
                />
                <span>{filterOption.label}</span>
              </li>
            );
          })}
        </ul>
      ) : filter.type === 'PRICE_RANGE' ? (
        <div className="price-filter">
          <div className="price-input-wrapper">
            <span className="currency-symbol">₱</span>
            <input
              className="price-range"
              id="price-range-min"
              value={minPrice || 0}
              onChange={(e) =>
                setMinPrice(
                  Number(e.target.value) < 0
                    ? undefined
                    : Number(e.target.value),
                )
              }
              onBlur={() => handlePriceSet()}
              type="text"
            />
          </div>
          <span>-</span>
          <div className="price-input-wrapper">
            <span className="currency-symbol">₱</span>
            <input
              className="price-range"
              id="price-range-max"
              value={maxPrice || ''}
              onChange={(e) =>
                setMaxPrice(
                  Number(e.target.value) < 0
                    ? undefined
                    : Number(e.target.value),
                )
              }
              onBlur={() => handlePriceSet()}
              type="text"
            />
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
