import {Image} from '@shopify/hydrogen';
import {NavLink} from 'react-router';
import {CollFragment} from 'storefrontapi.generated';

export default function CreatorItem({creator}: {creator: CollFragment}) {
  const creatorMetaObject = creator.creator?.reference;
  const image = creatorMetaObject?.image?.reference?.image;
  return (
    <div className="creator-item">
      {image && (
        <Image
          alt={image.altText || creator.handle}
          aspectRatio="1/1"
          data={image}
          key={image.id}
          sizes="(min-width: 45em) 50vw, 100vw"
        />
      )}
      <h2>{creator.title}</h2>
      <NavLink
        to={`/collections/${creator.handle}`}
        className="initial-underline-link"
      >
        Explore
      </NavLink>
    </div>
  );
}
