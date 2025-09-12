import {ChildMenuItemFragment, MenuItemFragment} from 'storefrontapi.generated';
import { MenuItem } from 'types/admin.types';

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
