import React, {Suspense, useState, useEffect} from 'react';
import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {
  Await,
  useLoaderData,
  Link,
  type MetaFunction,
  NavLink,
  useFetcher,
  type Fetcher,
} from 'react-router';
import {Image, Money, Video} from '@shopify/hydrogen';
import type {
  CollFragment,
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
  HomepageShopInformationQuery,
  StorefrontComponentsQuery,
  TestimonialFragment,
} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';
import Carousel from '~/components/Carousel';
import Tabs from '~/components/Tabs';
import {PRODUCT_ITEM_FRAGMENT} from '~/lib/fragments';
import CreatorItem from '~/components/CreatorItem';
import ImageWithText from '~/components/ImageWithText';

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
  const [
    storefrontComponents,
    {collections},
    {shop},
    allCollections,
    testimonials,
  ] = await Promise.all([
    context.storefront.query(STOREFRONT_COMPONENTS_QUERY, {
      variables: {storefrontComponentType: 'storefront_components'},
    }),
    // Add other queries here, so that they are loaded in parallel
    context.storefront.query(FEATURED_COLLECTION_QUERY),
    context.storefront.query(HOMEPAGE_SHOP_INFORMATION_QUERY),
    context.storefront.query(ALL_COLLECTIONS_QUERY),
    context.storefront.query(TESTIMONIALS_QUERY),
  ]);

  return {
    featuredCollection: collections.nodes[0],
    storefrontComponents: storefrontComponents.metaobjects.nodes,
    shopInformation: shop,
    collections: allCollections.collections.nodes,
    testimonials: testimonials.metaobjects.nodes,
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

  const [slideCount, setSlideCount] = useState(3.5);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 720) {
        setSlideCount(1.5);
      } else if (window.innerWidth < 990) {
        setSlideCount(2.5);
      } else {
        setSlideCount(3.5);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial screen size
  }, []);

  const topCategories = data.collections
    .filter((coll: CollFragment) => coll.collection_type?.value === 'category')
    .slice(0, 3);

  function groupBy(arr: any[], property: string, subproperty?: string) {
    return arr.reduce(function (memo, x) {
      const y = subproperty ? x[property][subproperty] : x[property];

      if (!memo[y]) {
        memo[y] = [];
      }
      memo[y].push(x);
      return memo;
    }, {});
  }
  const storefrontComponents = groupBy(
    data.storefrontComponents,
    'type',
    'value',
  );

  return (
    <div className="home">
      <FeaturedBanner
        featuredBannerItems={storefrontComponents.featured_banner}
      />
      <About shopInformation={data.shopInformation} />
      <TopCategories topCategories={topCategories} slideCount={slideCount} />
      <NewestCreator featuredCreator={storefrontComponents.featured_creator} />
      <FeaturedCreators
        creatorList={['Lagzilla', 'Meeple Maven', 'NoraNova', 'Ogie']}
        collections={data.collections}
        slideCount={slideCount}
      />
      <FeaturedItems featuredItems={storefrontComponents.featured_items} />
      <Newsletter newsletterItem={storefrontComponents.newsletter} />
      <Testimonials
        testimonials={data.testimonials}
        slideCount={slideCount - 0.5}
      />
      {/* <FeaturedCollection collection={data.featuredCollection} />
      <RecommendedProducts products={data.recommendedProducts} /> */}
    </div>
  );
}

function FeaturedBanner({
  featuredBannerItems,
}: {
  featuredBannerItems: StorefrontComponentsQuery['metaobjects']['nodes'];
}) {
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
  shopInformation: HomepageShopInformationQuery['shop'];
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

function TopCategories({
  topCategories,
  slideCount,
}: {
  topCategories: CollFragment[];
  slideCount: number;
}) {
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
              <Carousel slidesToShow={slideCount} infinite={false}>
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

function NewestCreator({
  featuredCreator,
}: {
  featuredCreator: StorefrontComponentsQuery['metaobjects']['nodes'];
}) {
  const newestCreator = featuredCreator[0];

  const creator = newestCreator.collection?.reference?.creator?.reference;
  const image = newestCreator?.image?.reference?.image
    ? newestCreator?.image?.reference?.image
    : creator?.image?.reference?.image;
  return (
    <ImageWithText image={image} containerClassName="background-medium">
      <span className="caption">{newestCreator?.title?.value}</span>
      <h1 className="h0">{newestCreator.collection?.reference?.title}</h1>
      <p className="description">{newestCreator?.subtitle?.value}</p>
      <NavLink
        to={`/collections/${newestCreator.collection?.reference?.handle}`}
        className="button"
      >
        {newestCreator?.button_label?.value}
      </NavLink>
    </ImageWithText>
  );
}

function FeaturedCreators({
  creatorList,
  collections,
  slideCount,
}: {
  creatorList: string[];
  collections: CollFragment[];
  slideCount: number;
}) {
  return (
    <div className="featured-creators-section">
      <h1 className="homepage-section-title">Featured Creators</h1>
      <Carousel slidesToShow={slideCount} infinite={false}>
        {collections
          .filter((collection) =>
            creatorList.includes(
              collection?.creator?.reference?.name?.value || '',
            ),
          )
          .map((collection) => {
            return <CreatorItem key={collection.id} creator={collection} />;
          })}
      </Carousel>
    </div>
  );
}

function FeaturedItems({
  featuredItems,
}: {
  featuredItems: StorefrontComponentsQuery['metaobjects']['nodes'];
}) {
  return (
    <div className="featured-items-section">
      <span className="caption">Featured Items</span>
      <h1>You dont want to miss these!</h1>
      <div className="featured-items-grid">
        {featuredItems.map((item) => {
          if (!item) return null;

          const product = item.product?.reference;

          const productMediaIndex = parseInt(
            item.product_media_index?.value || '0',
          );
          const productMedia =
            (product?.media.nodes.length &&
              (product?.media.nodes.length > productMediaIndex
                ? product?.media.nodes[productMediaIndex]
                : product?.media.nodes[0])) ||
            null;

          const mediaType = item.image?.reference?.image
            ? 'IMAGE'
            : productMedia?.mediaContentType;

          const displayImage =
            item.image?.reference?.image || productMedia?.previewImage;

          const title = product?.title || item.title?.value;

          return (
            <div className="featured-item" key={item.id}>
              {mediaType === 'VIDEO' ? (
                productMedia && (
                  <div className="featured-item-media">
                    <Video
                      data={productMedia}
                      playsInline
                      autoPlay
                      loop
                      muted
                      preload="metadata"
                      controls={false}
                    />
                  </div>
                )
              ) : mediaType === 'IMAGE' ? (
                displayImage && (
                  <div className="featured-item-media">
                    <Image
                      alt={title || 'featured item'}
                      aspectRatio={`${displayImage.width}/${displayImage.height}`}
                      data={displayImage}
                      key={displayImage.id}
                      sizes="(min-width: 45em) 50vw, 100vw"
                    />
                  </div>
                )
              ) : (
                <></>
              )}
              <div className="featured-item-content">
                <div>
                  <h2>{title}</h2>
                  <p>{item.subtitle?.value}</p>
                  <NavLink
                    to={`/collections/${item.collection?.reference?.handle}`}
                    className="initial-underline-link"
                  >
                    {item?.button_label?.value
                      ? item?.button_label?.value
                      : 'Shop Now'}
                  </NavLink>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Newsletter({
  newsletterItem,
}: {
  newsletterItem: StorefrontComponentsQuery['metaobjects']['nodes'];
}) {
  const {Form, ...fetcher} = useFetcher();
  const {data} = fetcher;
  const subscribeSuccess = data?.subscriber;
  const subscribeError = data?.error;
  const newsletter = newsletterItem[0];

  return (
    <ImageWithText
      image={newsletter?.image?.reference?.image}
      textFirst={false}
      containerClassName="newsletter-section"
    >
      <span className="caption">Subscribe to our newsletter</span>
      <h1>{newsletter.title?.value}</h1>
      <p>{newsletter.subtitle?.value}</p>
      {subscribeSuccess ? (
        <p className="success">
          You have successfully subscribed to our newsletter!
        </p>
      ) : (
        <Form className="newsletter-form" method="post" action="newsletter">
          <input placeholder="Email" type="email" name="email" id="email" />
          <button type="submit">JOIN</button>
        </Form>
      )}
      {subscribeError && <p style={{color: 'red'}}>{data.error.message}</p>}
    </ImageWithText>
  );
}

function Testimonials({
  testimonials,
  slideCount,
}: {
  testimonials: TestimonialFragment[];
  slideCount: number;
}) {
  return (
    <div className="testimonials-section">
      <h1 className="homepage-section-title">What Our Customers Are Saying</h1>
      <Carousel slidesToShow={slideCount} infinite={false}>
        {testimonials.map((testimonial) => {
          return (
            <div key={testimonial.handle} className="testimonial-wrapper">
              <div className="testimonial-item">
                <span className="quotation-mark">“</span>
                <h3>{testimonial.testimonial?.value}</h3>
                <div>
                  <p>{testimonial.customer_name?.value}</p>
                  <span className="caption">
                    {testimonial.customer_info?.value || 'Verified Customer'}
                  </span>
                </div>
                <span className="quotation-mark">„</span>
              </div>
            </div>
          );
        })}
      </Carousel>
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

const HOMEPAGE_SHOP_INFORMATION_QUERY = `#graphql
  query HomepageShopInformation(
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
    metaobjects(type: $storefrontComponentType, first: 20) {
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
              title
              media(first: 5) {
                nodes {
                  alt
                  id
                  mediaContentType
                  presentation {
                    id
                  }
                  previewImage {
                    altText
                    url
                    width
                    height
                    id
                  }
                  ... on Video {
                    sources {
                      format
                      height
                      width
                      mimeType
                      url
                    }
                  }
                }
              }
            }
          }
        }
        product_media_index: field(key: "product_media_index") {
          value
        }
        collection: field(key: "collection") {
          reference {
            ... on Collection {
              handle
              title
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
            }
          }
        }
      }
    }
  }
` as const;

const TESTIMONIALS_QUERY = `#graphql
  fragment Testimonial on Metaobject {
    id
    handle
    customer_name: field(key: "customer_name") {value}
    customer_info: field(key: "customer_info") {value}
    testimonial: field(key: "testimonial") {value}
  }
  query Testimonials(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    metaobjects(type: "testimonials", first: 10) {
      nodes {
      ...Testimonial
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
