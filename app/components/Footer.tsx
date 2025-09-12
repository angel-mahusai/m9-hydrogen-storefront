import {Image} from '@shopify/hydrogen';
import {Suspense, useState} from 'react';
import {Await, NavLink} from 'react-router';
import type {ShopInformationQuery} from 'types/admin.generated';
import type {
  ChildMenuItemFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';
import {MinusIcon, PlusIcon} from '~/assets';
import {getUrl} from '~/lib/utils';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  shopInformation: ShopInformationQuery | undefined;
  header: HeaderQuery;
  publicStoreDomain: string;
}

export function Footer({
  footer: footerPromise,
  shopInformation,
  header,
  publicStoreDomain,
}: FooterProps) {
  return (
    <Suspense>
      <Await resolve={footerPromise}>
        {(footer) => (
          <footer className="footer">
            {shopInformation && (
              <FooterAbout shopInfo={shopInformation?.shop} />
            )}
            {footer?.menu && header.shop.primaryDomain?.url && (
              <FooterMenu
                menu={footer.menu}
                primaryDomainUrl={header.shop.primaryDomain.url}
                publicStoreDomain={publicStoreDomain}
              />
            )}
          </footer>
        )}
      </Await>
    </Suspense>
  );
}

function FooterAbout({shopInfo}: {shopInfo: ShopInformationQuery['shop']}) {
  const image = shopInfo?.logo_dark?.reference?.image;
  const address = shopInfo?.billingAddress;
  return (
    image && (
      <div className="footer-about">
        <Image
          alt={image.altText || 'Dark Brand Logo'}
          aspectRatio={`${image.width}/${image.height}`}
          data={image}
          key={image.id}
          sizes="(min-width: 45em) 50vw, 100vw"
        />
        {address && (
          <div className="footer-shop-address">
            {Object.entries(address).map(
              ([key, value]) => value && <span key={key}>{value}</span>,
            )}
          </div>
        )}
        <NavLink
          end
          prefetch="intent"
          to="pages/contact"
          className="initial-underline-link"
        >
          Contact Us
        </NavLink>
      </div>
    )
  );
}

function FooterMenu({
  menu,
  primaryDomainUrl,
  publicStoreDomain,
}: {
  menu: FooterQuery['menu'];
  primaryDomainUrl: FooterProps['header']['shop']['primaryDomain']['url'];
  publicStoreDomain: string;
}) {
  return (
    <nav className="footer-menu" role="navigation">
      {(menu || {items: []}).items.map((item, index) => {
        if (!item.url) return null;
        if (!item.items) {
          {
            // if the url is internal, we strip the domain
            const url = getUrl(item, publicStoreDomain, primaryDomainUrl);
            const isExternal = !url.startsWith('/');
            return isExternal ? (
              <a
                href={url}
                key={item.id}
                rel="noopener noreferrer"
                target="_blank"
              >
                {item.title}
              </a>
            ) : (
              <NavLink end key={item.id} prefetch="intent" to={url}>
                {item.title}
              </NavLink>
            );
          }
        }
        return (
          <FooterSubmenu
            submenuItem={item}
            primaryDomainUrl={primaryDomainUrl}
            publicStoreDomain={publicStoreDomain}
            key={item.id}
          />
        );
      })}
    </nav>
  );
}

function FooterSubmenu({
  submenuItem,
  primaryDomainUrl,
  publicStoreDomain,
}: {
  submenuItem: ChildMenuItemFragment;
  primaryDomainUrl: FooterProps['header']['shop']['primaryDomain']['url'];
  publicStoreDomain: string;
}) {
  const [open, setOpen] = useState<boolean>(false);

  if (!submenuItem) return null;

  return (
    <div className={`footer-submenu${open ? ' open' : ''}`}>
      <div className="footer-submenu-header">
        <h2>{submenuItem.title}</h2>
        <button onClick={() => setOpen(!open)}>
          <PlusIcon />
          <MinusIcon />
        </button>
      </div>
      <ul className="footer-submenu-links">
        {submenuItem.items.map((childLink) => {
          if (!childLink.url) return null;
          // if the url is internal, we strip the domain
          const childUrl = getUrl(
            childLink,
            publicStoreDomain,
            primaryDomainUrl,
          );
          return (
            <li key={childLink.id}>
              <NavLink end prefetch="intent" to={childUrl}>
                {childLink.title}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
