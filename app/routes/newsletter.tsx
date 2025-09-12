import {redirect, type ActionFunctionArgs} from '@shopify/remix-oxygen';
import {
  CustomerEmailMarketingState,
  CustomerMarketingOptInLevel,
} from 'types/admin.enums';
import type {CustomerMutateItemFragment} from 'types/admin.generated';
import {
  CUSTOMER_EMAIL_CONSENT_QUERY,
  UPDATE_CUSTOMER_MARKETING_CONSENT,
  CREATE_SUBSCRIBER,
} from '~/graphql/admin/NewsletterSubscription';

type CustomerMutationSuccess = {
  customer: CustomerMutateItemFragment | null;
  error: null;
};

type CustomerMutationError = {
  customer: null;
  error: {field: string[] | undefined | null; message: string};
};

type CustomerMutation = CustomerMutationSuccess | CustomerMutationError;

export async function action({request, context}: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;

  try {
    if (!email) {
      throw new Error('Email is required');
    }

    const existing = await getCustomerConsent({
      email,
      context,
    });

    const alreadySubscribed =
      existing?.customer?.emailMarketingConsent?.marketingState ===
      'SUBSCRIBED';

    // already subscribed?
    if (alreadySubscribed) {
      return await returnSuccess({
        subscriber: existing.customer,
        session: context.session,
      });
    }

    // create or update customer subscriber
    if (!existing.customer) {
      // create
      const created = await createSubscriber({
        email,
        context,
      });

      if (created.error) {
        return returnError({error: created.error});
      }

      return await returnSuccess({
        subscriber: created.customer,
        session: context.session,
      });
    } else {
      // else, update existing
      const updated = await updateCustomerMarketingConsent({
        customerId: existing.customer.id,
        context,
      });

      if (updated.error) {
        return returnError({error: updated.error});
      }

      return await returnSuccess({
        subscriber: updated.customer,
        session: context.session,
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      return returnError({error});
    }
    return returnError({error: {message: JSON.stringify(error)}});
  }
}

export function loader() {
  return redirect('/');
}

/**
 * Returns a success response with a cookie for marketing consent
 * @param subscriber
 * @param session
 */
async function returnSuccess({
  subscriber,
  session,
}: {
  subscriber: CustomerMutateItemFragment | null;
  session: ActionFunctionArgs['context']['session'];
}) {
  // persist the marketing consent in a cookie so it can be read in the newsletter form
  // to show if a user is already subscribed without having to make an API call
  if (subscriber?.emailMarketingConsent) {
    session.set(
      'emailMarketingConsentTest',
      subscriber.emailMarketingConsent.marketingState,
    );
  }
  return Response.json(
    {subscriber, error: null},
    {
      headers: {
        'Set-Cookie': await session.commit(),
      },
    },
  );
}

function returnError({error}: {error: {message: string}}) {
  console.error(error.message);
  return {subscriber: null, error};
}

/**
 * Get a customer marketing consent by email
 * @param email
 * @param context
 */
async function getCustomerConsent({
  email,
  context,
}: {
  email: string;
  context: ActionFunctionArgs['context'];
}) {
  const [customers] = await Promise.all([
    context.adminClient.request(CUSTOMER_EMAIL_CONSENT_QUERY, {
      variables: {identifier: {emailAddress: email}},
    }),
  ]);

  const customer = customers?.data?.customer;

  if (!customer) {
    return {customer: null, error: null};
  }

  return {
    customer: {
      id: customer.id,
      email: customer.defaultEmailAddress?.emailAddress,
      emailMarketingConsent: {
        marketingOptInLevel: customer.defaultEmailAddress?.marketingOptInLevel,
        marketingState: customer.defaultEmailAddress?.marketingState,
      },
    } as unknown as CustomerMutateItemFragment,
    error: null,
  };
}

/**
 * Update a customer's marketing consent
 * @param customerId
 * @param context
 */
async function updateCustomerMarketingConsent({
  customerId,
  context,
}: {
  customerId: string;
  context: ActionFunctionArgs['context'];
}): Promise<CustomerMutation> {
  const consentUpdatedAt = new Date().toISOString();

  const input = {
    customerId,
    emailMarketingConsent: {
      consentUpdatedAt,
      marketingOptInLevel: CustomerMarketingOptInLevel.SingleOptIn,
      marketingState: CustomerEmailMarketingState.Subscribed,
    },
  };

  const [customerUpdate] = await Promise.all([
    context.adminClient.request(UPDATE_CUSTOMER_MARKETING_CONSENT, {
      variables: {input},
    }),
  ]);

  if (!customerUpdate.data) {
    return {
      error: {
        field: ['CustomerUpdateNewsletterSubscription'],
        message: JSON.stringify(customerUpdate.errors) || '',
      },
      customer: null,
    };
  } else if (
    customerUpdate?.data?.customerEmailMarketingConsentUpdate?.userErrors
      ?.length
  ) {
    const [{field, message}] =
      customerUpdate.data.customerEmailMarketingConsentUpdate.userErrors;
    return {error: {field, message}, customer: null};
  }

  // success
  return {
    customer:
      customerUpdate?.data?.customerEmailMarketingConsentUpdate?.customer ||
      null,
    error: null,
  };
}

async function createSubscriber({
  email,
  context,
}: {
  email: string;
  context: ActionFunctionArgs['context'];
}): Promise<CustomerMutation> {
  const consentUpdatedAt = new Date().toISOString();
  const input = {
    email,
    emailMarketingConsent: {
      consentUpdatedAt,
      marketingOptInLevel: CustomerMarketingOptInLevel.SingleOptIn,
      marketingState: CustomerEmailMarketingState.Subscribed,
    },
    tags: ['newsletter'],
  };

  const [customerCreate] = await Promise.all([
    context.adminClient.request(CREATE_SUBSCRIBER, {
      variables: {input},
    }),
  ]);

  if (!customerCreate.data) {
    return {
      error: {
        field: ['CreateCustomer'],
        message: JSON.stringify(customerCreate.errors) || '',
      },
      customer: null,
    };
  } else if (customerCreate?.data?.customerCreate?.userErrors?.length) {
    const [{field, message}] = customerCreate.data.customerCreate.userErrors;
    return {error: {field, message}, customer: null};
  }

  // success
  return {
    customer: customerCreate?.data?.customerCreate?.customer || null,
    error: null,
  };
}
