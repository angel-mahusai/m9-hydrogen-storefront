import {
  ProductCollectionSortKeys,
  ProductSortKeys,
} from 'types/storefront.enums';

export const PRODUCT_SORT_MAPPING = {
  manual: {displayName: 'Featured', value: ProductSortKeys.Id, reverse: false},
  'best-selling': {
    displayName: 'Best selling',
    value: ProductSortKeys.BestSelling,
    reverse: false,
  },
  'title-ascending': {
    displayName: 'Alphabetically, A-Z',
    value: ProductSortKeys.Title,
    reverse: false,
  },
  'title-descending': {
    displayName: 'Alphabetically, Z-A',
    value: ProductSortKeys.Title,
    reverse: true,
  },
  'price-ascending': {
    displayName: 'Price, low to high',
    value: ProductSortKeys.Price,
    reverse: false,
  },
  'price-descending': {
    displayName: 'Price, high to low',
    value: ProductSortKeys.Price,
    reverse: true,
  },
  'created-ascending': {
    displayName: 'Date, old to new',
    value: ProductSortKeys.CreatedAt,
    reverse: false,
  },
  'created-descending': {
    displayName: 'Date, new to old',
    value: ProductSortKeys.CreatedAt,
    reverse: true,
  },
};

export const PRODUCT_COLLECTION_SORT_MAPPING = {
  manual: {
    displayName: 'Featured',
    value: ProductCollectionSortKeys.Manual,
    reverse: false,
  },
  'best-selling': {
    displayName: 'Best selling',
    value: ProductCollectionSortKeys.BestSelling,
    reverse: false,
  },
  'title-ascending': {
    displayName: 'Alphabetically, A-Z',
    value: ProductCollectionSortKeys.Title,
    reverse: false,
  },
  'title-descending': {
    displayName: 'Alphabetically, Z-A',
    value: ProductCollectionSortKeys.Title,
    reverse: true,
  },
  'price-ascending': {
    displayName: 'Price, low to high',
    value: ProductCollectionSortKeys.Price,
    reverse: false,
  },
  'price-descending': {
    displayName: 'Price, high to low',
    value: ProductCollectionSortKeys.Price,
    reverse: true,
  },
  'created-ascending': {
    displayName: 'Date, old to new',
    value: ProductCollectionSortKeys.Created,
    reverse: false,
  },
  'created-descending': {
    displayName: 'Date, new to old',
    value: ProductCollectionSortKeys.Created,
    reverse: true,
  },
};
