import {Link, useNavigate} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {AddToCartButton} from './AddToCartButton';
import type {
  ProductItemFragment,
  CollectionItemFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import {useAside} from './Aside';
import {ProductPrice} from './ProductPrice';
import {CartPlusIcon} from '~/assets';

export function ComplementaryProductItem({
  product,
  loading,
}: {
  product: CollectionItemFragment | ProductItemFragment;
  loading?: 'eager' | 'lazy';
}) {
  const {open} = useAside();
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  const selectedVariant = product.selectedOrFirstAvailableVariant;

  return (
    <div className="complementary-product-item" key={product.id}>
      <div className="product-image-wrapper">
        {image && (
          <Link prefetch="intent" to={variantUrl}>
            <Image
              alt={image.altText || product.title}
              aspectRatio="5/6"
              data={image}
              loading={loading}
              sizes="(min-width: 45em) 400px, 100vw"
            />
          </Link>
        )}
      </div>
      {selectedVariant.compareAtPrice && selectedVariant.availableForSale && (
        <div className="product-badge on-sale">Sale</div>
      )}
      <div className="product-content">
        <Link prefetch="intent" to={variantUrl}>
          <h4>{product.title}</h4>
          <small>
            {selectedVariant.availableForSale ? (
              <ProductPrice
                price={selectedVariant?.price}
                compareAtPrice={selectedVariant?.compareAtPrice}
              />
            ) : (
              <span>Sold out</span>
            )}
          </small>
        </Link>
      </div>
      <div className="quick-add-button">
        <AddToCartButton
          disabled={!selectedVariant || !selectedVariant.availableForSale}
          onClick={() => {
            open('cart');
          }}
          lines={
            selectedVariant
              ? [
                  {
                    merchandiseId: selectedVariant.id,
                    quantity: 1,
                    selectedVariant,
                  },
                ]
              : []
          }
        >
          <CartPlusIcon />
        </AddToCartButton>
      </div>
    </div>
  );
}
