import {Link} from 'react-router';
import {
  getProductOptions,
  Image,
  type MappedProductOptions,
} from '@shopify/hydrogen';
import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';
import {AddToCartButton} from './AddToCartButton';
import {Aside, useAside} from './Aside';
import {ProductPrice} from './ProductPrice';
import {ProductVariantFragment} from 'storefrontapi.generated';

function ProductForm({
  productOptions,
  variants,
}: {
  variants: ProductVariantFragment[];
  productOptions: MappedProductOptions[];
}) {
  const {open, selectedVariant, setSelectedVariant} = useAside();
  const selectOption = (
    optionName: string,
    selectedOptionValue: MappedProductOptions['optionValues'][0],
  ) => {
    const updatedOptions: Record<string, string> = {};
    productOptions.map((productOption) => {
      productOption.optionValues.map((optionValue) => {
        if (productOption.name === optionName) {
          if (optionValue.name === selectedOptionValue.name) {
            optionValue.selected = true;
          } else {
            optionValue.selected = false;
          }
        }

        if (optionValue.selected) {
          updatedOptions[productOption.name] = optionValue.name;
        }
      });
    });

    const newVariant = variants.find((variant) => {
      let isTrue = true;
      variant.selectedOptions.map((option) => {
        if (updatedOptions[option.name] !== option.value) {
          isTrue = false;
        }
      });
      return isTrue;
    });

    if (newVariant) {
      setSelectedVariant(newVariant as ProductVariantFragment);
    }
  };

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
                        selectOption(option.name, value);
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
                      quantity: 1,
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

export function ProductFormAside() {
  // const {product, selectedVariant} = useAside();
  const {product, selectedVariant} = useAside();

  if (!product) {
    return null;
  }

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant:
      selectedVariant || product.selectedOrFirstAvailableVariant,
  });

  const variants = product.variants.nodes || [];

  const image = product.featuredImage;

  return (
    <Aside type="product-form" heading="PRODUCT FORM">
      {product ? (
        <div className="product-form">
          {image && (
            <Image
              alt={image.altText || product.title}
              aspectRatio={`${image.width}/${image.height}`}
              data={image}
              key={image.id}
              sizes="(min-width: 45em) 40vw, 80vw"
            />
          )}
          <h1>{product.title}</h1>
          <ProductPrice
            price={product.selectedOrFirstAvailableVariant?.price}
            compareAtPrice={
              product.selectedOrFirstAvailableVariant?.compareAtPrice
            }
          />
          <ProductForm productOptions={productOptions} variants={variants} />
        </div>
      ) : (
        <h2>Select a product to add to the cart</h2>
      )}
    </Aside>
  );
}
