import {MenuItemFragment} from 'storefrontapi.generated';
import {useEffect} from 'react';

export function getUrl(
  menuItem: MenuItemFragment,
  publicStoreDomain: string,
  primaryDomainUrl: string,
) {
  if (!menuItem.url) {
    return "";
  }

  const url =
    menuItem.url.includes('myshopify.com') ||
    menuItem.url.includes(publicStoreDomain) ||
    menuItem.url.includes(primaryDomainUrl)
      ? new URL(menuItem.url).pathname
      : menuItem.url;

  return url;
}

export function useClickOutside(ref: React.RefObject<HTMLElement>, onClickOutside: () => void) {
  useEffect(() => {
    /**
     * Invoke Function onClick outside of element
     */
    function handleClickOutside({target}: MouseEvent) {
      if (ref.current && !ref.current.contains(target as Node)) {
        onClickOutside();
      }
    }
    // Bind
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // dispose
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, onClickOutside]);
}
