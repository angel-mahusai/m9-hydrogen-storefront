import {Suspense, useState} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {
  ArrowRightIcon,
  CartIcon,
  SearchIcon,
  UserIcon,
  MenuIcon,
  ArrowLeftIcon,
} from '../assets';

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
import {getUrl} from '~/lib/utils';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(
    Array(menu?.items.length).fill(0),
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

  const handleMobileMenuOpen = (menuIndex: number) => {
    const updatedMenuState = isMobileMenuOpen.map((item, index) => {
      if (index === menuIndex) {
        return 1;
      }
      return 0;
    });
    setIsMobileMenuOpen(updatedMenuState);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(Array(menu?.items.length).fill(0));
  };

  return (
    <nav className={className} role="navigation">
      {(menu || {items: []}).items.map((item, index) => {
        if (!item.url) return null;

        // if the url is internal, we strip the domain
        const url = getUrl(item, publicStoreDomain, primaryDomainUrl);

        const submenuItems =
          additionalMenuItems?.filter(
            (additionalMenuItem) =>
              additionalMenuItem?.menu_title?.value === item.title,
          ) || [];

        return viewport === 'desktop' ? (
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
            <HeaderSubmenuDesktop
              submenu={item.items}
              primaryDomainUrl={primaryDomainUrl}
              publicStoreDomain={publicStoreDomain}
              onMouseEnter={(e) => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              isOpen={isMenuOpen[index]}
              additionalMenuItems={submenuItems}
            />
          </div>
        ) : submenuItems.length > 0 ? (
          <div key={item.id}>
            <button
              className={`mobile-menu-item${isMobileMenuOpen.reduce((accumulator, currentValue) => accumulator + currentValue, 0) > 0 ? ' hidden' : ''}`}
              onClick={(e) => handleMobileMenuOpen(index)}
              key={item.id}
            >
              <span>{item.title}</span>
              <ArrowRightIcon />
            </button>
            <HeaderSubmenuMobile
              key={`${item.id}-submenu`}
              submenu={item.items}
              title={item.title}
              primaryDomainUrl={primaryDomainUrl}
              publicStoreDomain={publicStoreDomain}
              isOpen={isMobileMenuOpen[index]}
              additionalMenuItems={submenuItems}
              handleClose={handleMobileMenuClose}
              handleCloseWindow={() => {
                handleMobileMenuClose();
                close();
              }}
            />
          </div>
        ) : (
          <NavLink
            className={`mobile-menu-item${isMobileMenuOpen.reduce((accumulator, currentValue) => accumulator + currentValue, 0) > 0 ? ' hidden' : ''}`}
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            to={url}
          >
            <span>{item.title}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function HeaderSubmenuDesktop({
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
    const url = getUrl(item, publicStoreDomain, primaryDomainUrl);

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
            const url = getUrl(childLink, publicStoreDomain, primaryDomainUrl);
            return (
              <NavLink
                className={`hover-fade header-submenu-child${childLink.title === 'Sale' ? ' sale' : ''}`}
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
            key={additionalMenuItem.title?.value}
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

function HeaderSubmenuMobile({
  submenu,
  title,
  primaryDomainUrl,
  publicStoreDomain,
  isOpen,
  handleClose,
  handleCloseWindow,
  additionalMenuItems,
  level = 0,
}: {
  submenu: ChildMenuItemFragment[];
  title: string;
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  publicStoreDomain: HeaderProps['publicStoreDomain'];
  isOpen: boolean;
  handleClose: () => void;
  handleCloseWindow: () => void;
  additionalMenuItems?: MetaobjectConnectionFragment['nodes'];
  level?: number;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(
    Array(submenu?.length).fill(0),
  );

  const handleMobileMenuOpen = (menuIndex: number) => {
    const updatedMenuState = isMobileMenuOpen.map((item, index) => {
      if (index === menuIndex) {
        return 1;
      }
      return 0;
    });
    setIsMobileMenuOpen(updatedMenuState);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(Array(submenu?.length).fill(0));
  };

  if (submenu.length === 0 || !isOpen) {
    return <></>;
  }

  const submenuItems = submenu.map((item, index) => {
    if (!item.url) return null;
    //  if the url is internal, we strip the domain
    const url = getUrl(item, publicStoreDomain, primaryDomainUrl);

    const hasChildren = item.items && item.items.length > 0;

    return hasChildren ? (
      <div key={item.id}>
        <button
          className={`mobile-submenu-item-${level}${isMobileMenuOpen.reduce((accumulator, currentValue) => accumulator + currentValue, 0) > 0 ? ' hidden' : ''}`}
          onClick={(e) => handleMobileMenuOpen(index)}
          key={item.id}
        >
          <span>{item.title}</span>
          <ArrowRightIcon />
        </button>
        <HeaderSubmenuMobile
          key={`${item.id}-submenu`}
          submenu={item.items}
          title={item.title}
          primaryDomainUrl={primaryDomainUrl}
          publicStoreDomain={publicStoreDomain}
          isOpen={isMobileMenuOpen[index]}
          handleClose={handleMobileMenuClose}
          handleCloseWindow={() => {
            handleMobileMenuClose();
            handleCloseWindow();
          }}
          level={level + 1}
        />
      </div>
    ) : (
      <NavLink
        className={`mobile-submenu-item${isMobileMenuOpen.reduce((accumulator, currentValue) => accumulator + currentValue, 0) > 0 ? ' hidden' : ''}`}
        end
        key={item.id}
        onClick={handleCloseWindow}
        prefetch="intent"
        to={url}
      >
        <span>{item.title}</span>
      </NavLink>
    );
  });
  return (
    <div className="submenu-container">
      <button
        className={`mobile-submenu-item${isMobileMenuOpen.reduce((accumulator, currentValue) => accumulator + currentValue, 0) > 0 ? ' hidden' : ''}`}
        onClick={() => {
          handleClose();
        }}
      >
        <ArrowLeftIcon />
        <span style={{textAlign: 'center'}}>{title}&emsp;&emsp;</span>
      </button>
      {submenuItems}
      {additionalMenuItems?.map((additionalMenuItem, amIdx) => {
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
            onClick={handleCloseWindow}
            key={amIdx}
            className={`submenu-with-image mobile-submenu-item${isMobileMenuOpen.reduce((accumulator, currentValue) => accumulator + currentValue, 0) > 0 ? ' hidden' : ''}`}
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
