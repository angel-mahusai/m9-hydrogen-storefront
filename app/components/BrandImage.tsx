import type * as StorefrontAPI from '@shopify/hydrogen/storefront-api-types';
import {Image} from '@shopify/hydrogen';

export function BrandImage({
  image,
}: {
  image?: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>
  >;
}) {
  if (!image) {
    return <div className="brand-image" />;
  }
  return (
    <div className="brand-image">
      <Image
        alt={image.altText || 'Brand Image'}
        aspectRatio={`${image.width}/${image.height}`}
        data={image}
        key={image.id}
        sizes="(min-width: 45em) 50vw, 100vw"
      />
    </div>
  );
}
