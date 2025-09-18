import {MenuItemFragment} from 'storefrontapi.generated';
import {useEffect} from 'react';
import { ProductFilter } from '@shopify/hydrogen/storefront-api-types';
import { PRODUCT_COLLECTION_SORT_MAPPING } from './constants';

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

export function getProductFiltersAndSortVariables(urlSearchParams: URLSearchParams) {
  const filters: ProductFilter[] = [];
  const priceFilter: Record<string, any> = {};
  const sortVariables: Record<string, any> = {};
  const sortKey = urlSearchParams.get(
    'sort_by',
  ) as keyof typeof PRODUCT_COLLECTION_SORT_MAPPING;

  Array.from(urlSearchParams).map(([key, value]) => {
    if (key === 'sort_by' && value in PRODUCT_COLLECTION_SORT_MAPPING) {
      sortVariables['sortKey'] = PRODUCT_COLLECTION_SORT_MAPPING[sortKey].value;
      sortVariables['reverse'] =
        PRODUCT_COLLECTION_SORT_MAPPING[sortKey].reverse;
      return;
    }

    if (!key.startsWith('filter')) {
      return;
    }

    if (key.startsWith('filter.v.price')) {
      const priceBoundary = key.endsWith('.gte') ? 'min' : 'max';
      priceFilter[priceBoundary] = Number(value);
    } else if (key.startsWith('filter.v.availability')) {
      filters.push({available: value === 'In stock' ? true : false});
    } else if (key.startsWith('filter.v.option')) {
      const variantName = key.split('.')[3];
      filters.push({variantOption: {name: variantName, value}});
    } else if (key.startsWith('filter.p.m.')) {
      const metaobjectNamespace = key.split('.')[3];
      const metaobjectKey = key.split('.')[4];
      const metaobjectValue = `gid:\/\/shopify\/Metaobject\/${value.split('-').pop()}`;
      filters.push({
        productMetafield: {
          namespace: metaobjectNamespace,
          key: metaobjectKey,
          value: metaobjectValue,
        },
      });
    }
  });

  if (Object.keys(priceFilter).length > 0) {
    filters.push({price: priceFilter});
  }

  return {filters, sortVariables};
}
