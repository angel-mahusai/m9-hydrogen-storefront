import {Link, useNavigate} from 'react-router';
import {type MappedProductOptions} from '@shopify/hydrogen';
import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import type {ProductFragment} from 'storefrontapi.generated';
import {useRef, useState} from 'react';
import {ChevronDownIcon, MinusIcon, PlusIcon} from '~/assets';
import {useClickOutside} from '~/lib/utils';

export function ProductForm({
  productOptions,
  selectedVariant,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
}) {
  const navigate = useNavigate();
  const {open} = useAside();
  const [productQuantity, setProductQuantity] = useState<number | undefined>(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const quantityDropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(quantityDropdownRef, () => {
    setIsDropdownOpen(false);
  });

  return (
    <div className="product-form">
      {productOptions.map((option) => {
        // If there is only a single value in the option values, don't display the option
        if (option.optionValues.length === 1) return null;
        const selectedVariant = option.optionValues.find(
          (value) => value.selected,
        );
        return (
          <div className="product-options" key={option.name}>
            <div>
              <h5>{option.name}</h5>
              {selectedVariant && (
                <span className="selected-variant">{selectedVariant.name}</span>
              )}
            </div>
            <div className="product-options-grid">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;

                if (isDifferentProduct) {
                  // SEO
                  // When the variant is a combined listing child product
                  // that leads to a different url, we need to render it
                  // as an anchor tag
                  return (
                    <Link
                      className="product-options-item"
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                      style={{
                        border: selected
                          ? '1px solid black'
                          : '1px solid transparent',
                        opacity: available ? 1 : 0.3,
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </Link>
                  );
                } else {
                  // SEO
                  // When the variant is an update to the search param,
                  // render it as a button with javascript navigating to
                  // the variant so that SEO bots do not index these as
                  // duplicated links
                  return (
                    <button
                      type="button"
                      className={`product-options-item${
                        exists && !selected ? ' link' : ''
                      }`}
                      key={option.name + name}
                      disabled={!exists}
                      onClick={() => {
                        if (!selected) {
                          navigate(`?${variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                        }
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </button>
                  );
                }
              })}
            </div>
          </div>
        );
      })}
      <div className="purchase-controls">
        <div className="quantity-wrapper">
          {productQuantity && productQuantity < 10 ? (
            <div
              className="quantity-dropdown-wrapper"
              ref={quantityDropdownRef}
            >
              <button
                className="dropdown-button"
                onClick={() => {
                  setIsDropdownOpen((isDropdownOpen) => !isDropdownOpen);
                }}
              >
                <span className="product-quantity">{productQuantity}</span>
                <ChevronDownIcon
                  width={18}
                  height={18}
                  stroke="rgb(var(--color-secondary-text))"
                  viewBox="0 0 24 24"
                  style={{
                    transform: `translateX(calc(var(--padding-small) * -1)) ${
                      isDropdownOpen ? 'scaleY(-1)' : 'scaleY(1)'
                    }`,
                  }}
                />
              </button>
              <div
                className={`product-quantity-dropdown${isDropdownOpen ? ' open' : ''}`}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((quantity) => (
                  <button
                    key={`product-quantity-${quantity}`}
                    onClick={() => {
                      setProductQuantity(quantity);
                      setIsDropdownOpen((isDropdownOpen) => !isDropdownOpen);
                    }}
                  >
                    {quantity === 10 ? '10+' : quantity}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <button
                className="button-start"
                onClick={() =>
                  setProductQuantity(
                    productQuantity
                      ? productQuantity > 1
                        ? productQuantity - 1
                        : productQuantity
                      : 1,
                  )
                }
              >
                <MinusIcon
                  width={16}
                  height={16}
                  stroke="rgb(var(--color-secondary-text))"
                  viewBox="0 0 24 24"
                />
              </button>
              <input
                className="product-quantity"
                id="product-quantity"
                value={productQuantity || ''}
                onChange={(e) =>
                  setProductQuantity(
                    Number(e.target.value) <= 0
                      ? undefined
                      : Number(e.target.value),
                  )
                }
                type="text"
              />
              <button
                className="button-end"
                onClick={() =>
                  setProductQuantity(productQuantity ? productQuantity + 1 : 1)
                }
              >
                <PlusIcon
                  width={18}
                  height={18}
                  stroke="rgb(var(--color-secondary-text))"
                  viewBox="0 0 24 24"
                />
              </button>
            </>
          )}
        </div>
        <div className="add-to-cart">
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
                      quantity: productQuantity,
                      selectedVariant,
                    },
                  ]
                : []
            }
          >
            {selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
          </AddToCartButton>
        </div>
      </div>
    </div>
  );
}

function ProductOptionSwatch({
  swatch,
  name,
}: {
  swatch?: Maybe<ProductOptionValueSwatch> | undefined;
  name: string;
}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  // if (!image && !color) return name;
  if (!image) return name;

  return (
    <div
      aria-label={name}
      className="product-option-label-swatch"
      style={{
        backgroundColor: color || 'transparent',
      }}
    >
      {!!image && <img src={image} alt={name} />}
    </div>
  );
}
