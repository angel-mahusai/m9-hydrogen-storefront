import {Image} from '@shopify/hydrogen';
import type * as StorefrontAPI from '@shopify/hydrogen/storefront-api-types';

interface ImageWithTextProps {
  image:
    | StorefrontAPI.Maybe<
        Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>
      >
    | undefined;
  containerClassName?: string;
  textFirst?: boolean;
  children: React.ReactNode;
}

export default function ImageWithText({
  image,
  textFirst = true,
  containerClassName = 'background-medium',
  children,
}: ImageWithTextProps) {
  return (
    <div
      className={`image-with-text ${containerClassName}${textFirst ? '' : ' reverse'}`}
    >
      <div className="text-wrapper">{children}</div>
      <div className="image-wrapper">
        {image && (
          <Image
            alt={image.altText || ''}
            aspectRatio={`${image.width}/${image.height}`}
            data={image}
            key={image.id}
            sizes="(min-width: 45em) 50vw, 100vw"
          />
        )}
      </div>
    </div>
  );
}
