/** The set of valid sort keys for products belonging to a collection. */
export enum ProductSortKeys {
  /** Sort by best selling. */
  BestSelling = 'BEST_SELLING',
  /** Sort by creation time. */
  CreatedAt = 'CREATED_AT',
  /** Sort by id. */
  Id = 'ID',
  /** Sort by price. */
  Price = 'PRICE',
  /** Sort by product type. */
  ProductType = 'PRODUCT_TYPE',
  /** Sort by relevance. */
  Relevance = 'RELEVANCE',
  /** Sort by title. */
  Title = 'TITLE',
  /** Sort by updated time. */
  UpdatedAt = 'UPDATED_AT',
  /** Sort by vendor. */
  Vendor = 'VENDOR',
}

/** The set of valid sort keys for products belonging to a collection. */
export enum ProductCollectionSortKeys {
  /** Sort by best selling. */
  BestSelling = 'BEST_SELLING',
  /** Sort by collection default order. */
  CollectionDefault = 'COLLECTION_DEFAULT',
  /** Sort by creation time. */
  Created = 'CREATED',
  /** Sort by id. */
  Id = 'ID',
  /** Sort by manual order. */
  Manual = 'MANUAL',
  /** Sort by price. */
  Price = 'PRICE',
  /** Sort by relevance. */
  Relevance = 'RELEVANCE',
  /** Sort by title. */
  Title = 'TITLE'
}
