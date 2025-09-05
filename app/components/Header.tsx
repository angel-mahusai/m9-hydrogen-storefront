import {Suspense, useState} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {CartIcon, SearchIcon, UserIcon, MenuIcon} from '../assets';

import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {
  HeaderQuery,
  CartApiQueryFragment,
  ChildMenuItemFragment,
  MetaobjectConnectionFragment,
} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {BrandImage} from './BrandImage';
import type * as StorefrontAPI from '@shopify/hydrogen/storefront-api-types';
import {HeaderImage} from './HeaderImage';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  searchBar?: React.ReactNode;
}

type Viewport = 'desktop' | 'mobile';

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
  searchBar,
}: HeaderProps) {
  const {shop, menu, metaobjects} = header;

  const shopImage: StorefrontAPI.Maybe<
    Pick<StorefrontAPI.Image, 'id' | 'url' | 'altText' | 'width' | 'height'>
  > = shop.brand?.logo?.image ?? null;

  return (
    <header className="header">
      <HeaderMenu
        menu={menu}
        viewport="desktop"
        primaryDomainUrl={header.shop.primaryDomain.url}
        publicStoreDomain={publicStoreDomain}
        additionalMenuItems={metaobjects.nodes}
      />
      <nav className="header-ctas header-ctas__left header-menu-mobile-toggle">
        <HeaderMenuMobileToggle />
        <SearchToggle className={'header-menu-mobile-toggle'} />
      </nav>
      <NavLink prefetch="intent" to="/" end>
        {shopImage?.url ? (
          <BrandImage image={shopImage} />
        ) : (
          <strong>{shop.name}</strong>
        )}
      </NavLink>
      <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
      {searchBar}
    </header>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
  additionalMenuItems,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
  additionalMenuItems?: MetaobjectConnectionFragment['nodes'];
}) {
  const className = `header-menu-${viewport}`;
  const {close} = useAside();
  const [isMenuOpen, setIsMenuOpen] = useState(
    Array(menu?.items.length).fill(false),
  );

  const handleMouseEnter = (menuIndex: number) => {
    const updatedMenuState = isMenuOpen.map((item, index) => {
      if (index === menuIndex) {
        return true;
      }
      return false;
    });
    setIsMenuOpen(updatedMenuState);
  };

  const handleMouseLeave = () => {
    setIsMenuOpen(Array(menu?.items.length).fill(false));
  };
  return (
    <nav className={className} role="navigation">
      {viewport === 'mobile' && (
        <NavLink end onClick={close} prefetch="intent" to="/">
          Home
        </NavLink>
      )}
      {(menu || FALLBACK_HEADER_MENU).items.map((item, index) => {
        if (!item.url) return null;

        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;

        return (
          <div
            className="header-menu-item-container"
            key={item.id}
            onMouseEnter={(e) => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="header-menu-item">
              <NavLink
                className="hover-underline-link"
                end
                key={item.id}
                onClick={close}
                prefetch="intent"
                to={url}
              >
                {item.title}
              </NavLink>
            </div>
            <HeaderSubmenu
              submenu={item.items}
              primaryDomainUrl={primaryDomainUrl}
              publicStoreDomain={publicStoreDomain}
              onMouseEnter={(e) => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              isOpen={isMenuOpen[index]}
              additionalMenuItems={additionalMenuItems?.filter(
                (additionalMenuItem) =>
                  additionalMenuItem?.menu_title?.value === item.title,
              )}
            />
          </div>
        );
      })}
    </nav>
  );
}

function HeaderSubmenu({
  submenu,
  primaryDomainUrl,
  publicStoreDomain,
  isOpen,
  onMouseEnter,
  onMouseLeave,
  additionalMenuItems,
}: {
  submenu: ChildMenuItemFragment[];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  publicStoreDomain: HeaderProps['publicStoreDomain'];
  isOpen: boolean;
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onMouseLeave: () => void;
  additionalMenuItems?: MetaobjectConnectionFragment['nodes'];
}) {
  if (submenu.length === 0 || !isOpen) {
    return <></>;
  }

  const hasChildren = submenu
    .map((item) => (item.items ? item.items.length : 0))
    .reduce((a, b) => a + b);

  const submenuItems = submenu.map((item) => {
    if (!item.url) return null;
    //  if the url is internal, we strip the domain
    const url =
      item.url.includes('myshopify.com') ||
      item.url.includes(publicStoreDomain) ||
      item.url.includes(primaryDomainUrl)
        ? new URL(item.url).pathname
        : item.url;

    const hasChildren = item.items && item.items.length > 0;

    return (
      <div
        key={item.id}
        className={hasChildren ? 'submenu-list' : 'submenu-item'}
      >
        <NavLink
          className={`hover-fade ${hasChildren ? 'header-submenu-item' : 'header-submenu-child'}`}
          end
          key={item.id}
          prefetch="intent"
          to={url}
        >
          {item.title}
        </NavLink>
        {item.items ? (
          item.items.map((childLink) => {
            if (!childLink.url) return null;
            // if the url is internal, we strip the domain
            const url =
              childLink.url.includes('myshopify.com') ||
              childLink.url.includes(publicStoreDomain) ||
              childLink.url.includes(primaryDomainUrl)
                ? new URL(childLink.url).pathname
                : childLink.url;
            return (
              <NavLink
                className="hover-fade header-submenu-child"
                end
                key={childLink.id}
                prefetch="intent"
                to={url}
              >
                {childLink.title}
              </NavLink>
            );
          })
        ) : (
          <></>
        )}
      </div>
    );
  });
  return (
    <div className="submenu-container">
      {hasChildren ? (
        submenuItems
      ) : (
        <div className="submenu-list">{submenuItems}</div>
      )}
      {additionalMenuItems?.map((additionalMenuItem, amIdx) => {
        console.log('ADDITIONAL MENU ITEM', additionalMenuItem);
        const menuImage = additionalMenuItem.image?.reference?.image ?? null;
        let menuLink = '/';
        if (additionalMenuItem.product?.reference?.handle) {
          menuLink = `/products/${additionalMenuItem.product?.reference?.handle}`;
        } else if (additionalMenuItem.collection?.reference?.handle) {
          menuLink = `/collections/${additionalMenuItem.collection?.reference?.handle}`;
        } else if (additionalMenuItem.page?.reference?.handle) {
          menuLink = `/pages/${additionalMenuItem.page?.reference?.handle}`;
        }

        return (
          <a
            href={menuLink}
            style={{
              color: additionalMenuItem.text_color?.value
                ? additionalMenuItem.text_color?.value
                : 'inherit',
            }}
            key={amIdx}
            className="submenu-with-image"
          >
            <div className="submenu-with-image-text">
              <h2>{additionalMenuItem.title?.value}</h2>
              {additionalMenuItem.subtitle?.value && (
                <p>{additionalMenuItem.subtitle?.value}</p>
              )}
            </div>
            {menuImage?.url && <HeaderImage image={menuImage} />}
          </a>
        );
      })}
    </div>
  );
}

function HeaderCtas({
  isLoggedIn,
  cart,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart'>) {
  return (
    <nav className="header-ctas" role="navigation">
      <NavLink prefetch="intent" to="/account">
        <Suspense fallback="Sign in">
          <Await resolve={isLoggedIn} errorElement="Sign in">
            <UserIcon />
          </Await>
        </Suspense>
      </NavLink>
      <SearchToggle className={'header-menu-desktop-toggle'} />
      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      className="header-menu-mobile-toggle reset"
      onClick={() => open('mobile')}
    >
      <MenuIcon />
    </button>
  );
}

function SearchToggle({className}: {className: string | null}) {
  const {open} = useAside();
  return (
    <button
      className={`reset${className && ` ${className}`}`}
      onClick={() => open('search')}
    >
      <SearchIcon />
    </button>
  );
}

function CartBadge({count}: {count: number | null}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      href="/cart"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
    >
      <CartIcon />{' '}
      {count !== null && (
        <div className="cart-items-count">
          <div>{count > 9 ? '9+' : count}</div>
        </div>
      )}
    </a>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? null} />;
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};
