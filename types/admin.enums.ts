/**
 * Information that describes when a customer consented to
 *         receiving marketing material by email.
 */
export enum CustomerEmailMarketingState {
  /** The customer’s email address marketing state is invalid. */
  Invalid = 'INVALID',
  /** The customer isn't subscribed to email marketing. */
  NotSubscribed = 'NOT_SUBSCRIBED',
  /** The customer is in the process of subscribing to email marketing. */
  Pending = 'PENDING',
  /** The customer's personal data is erased. This value is internally-set and read-only. */
  Redacted = 'REDACTED',
  /** The customer is subscribed to email marketing. */
  Subscribed = 'SUBSCRIBED',
  /** The customer isn't currently subscribed to email marketing but was previously subscribed. */
  Unsubscribed = 'UNSUBSCRIBED'
}

/**
 * The possible values for the marketing subscription opt-in level enabled at the time the customer consented to receive marketing information.
 *
 * The levels are defined by [the M3AAWG best practices guideline
 *   document](https://www.m3aawg.org/sites/maawg/files/news/M3AAWG_Senders_BCP_Ver3-2015-02.pdf).
 */
export enum CustomerMarketingOptInLevel {
  /**
   * After providing their information, the customer receives a confirmation and is required to
   * perform a intermediate step before receiving marketing information.
   */
  ConfirmedOptIn = 'CONFIRMED_OPT_IN',
  /**
   * After providing their information, the customer receives marketing information without any
   * intermediate steps.
   */
  SingleOptIn = 'SINGLE_OPT_IN',
  /** The customer receives marketing information but how they were opted in is unknown. */
  Unknown = 'UNKNOWN'
}