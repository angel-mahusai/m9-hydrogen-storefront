import {redirect, type ActionFunctionArgs} from '@shopify/remix-oxygen';
import {RECENTLY_VIEWED_PRODUCTS_COUNT} from '~/lib/constants';

export async function action({request, context}: ActionFunctionArgs) {
  const formData = await request.formData();
  const title = formData.get('title') as string;

  try {
    if (!title) {
      throw new Error('NO HANDLE PROVIDED');
    }
    return await setRecentlyViewedProducts(context.session, title);
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

async function setRecentlyViewedProducts(
  session: ActionFunctionArgs['context']['session'],
  title: string,
) {
  let recentlyViewedQuery = '';
  if (session.has('recentlyViewedProductsTitles')) {
    let sessionRecentlyViewed: string[] = session.get(
      'recentlyViewedProductsTitles',
    );

    if (sessionRecentlyViewed.includes(title)) {
      sessionRecentlyViewed = sessionRecentlyViewed.filter(
        (item) => item !== title,
      );
    }

    if (sessionRecentlyViewed.length >= RECENTLY_VIEWED_PRODUCTS_COUNT) {
      sessionRecentlyViewed = sessionRecentlyViewed.slice(
        sessionRecentlyViewed.length - RECENTLY_VIEWED_PRODUCTS_COUNT + 1,
        sessionRecentlyViewed.length,
      );
    }
    sessionRecentlyViewed.push(title);
    session.set('recentlyViewedProductsTitles', sessionRecentlyViewed);
    recentlyViewedQuery = `title:${sessionRecentlyViewed.toString().replaceAll(',', ' OR title:')}`;
  } else {
    session.set('recentlyViewedProductsTitles', [title]);
    recentlyViewedQuery = `title:${title}`;
  }

  return Response.json(
    {recentlyViewedQuery, error: null},
    {
      headers: {
        'Set-Cookie': await session.commit(),
      },
    },
  );
}

function returnError({error}: {error: {message: string}}) {
  console.error(error.message);
  return {recentlyViewedQuery: null, error};
}
