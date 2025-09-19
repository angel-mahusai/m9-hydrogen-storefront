import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import {XIcon} from '../assets';
import {
  ProductItemFragment,
  ProductVariantFragment,
} from 'storefrontapi.generated';

export type AsideType =
  | 'search'
  | 'cart'
  | 'mobile'
  | 'closed'
  | 'submenu'
  | 'product-form';
type AsideLocation = 'top' | 'left' | 'right';
type AsideContextValue = {
  type: AsideType;
  product: ProductItemFragment | undefined;
  selectedVariant: ProductVariantFragment | undefined;
  open: (mode: AsideType) => void;
  close: () => void;
  setProduct: (product: ProductItemFragment | undefined) => void;
  setSelectedVariant: (variant: ProductVariantFragment | undefined) => void;
};

/**
 * A side bar component with Overlay
 * @example
 * ```jsx
 * <Aside type="search" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 */
export function Aside({
  children,
  heading,
  type,
  location = 'right',
}: {
  children?: React.ReactNode;
  type: AsideType;
  heading: React.ReactNode;
  location?: AsideLocation;
}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;

  useEffect(() => {
    const abortController = new AbortController();

    if (expanded) {
      document.addEventListener(
        'keydown',
        function handler(event: KeyboardEvent) {
          if (event.key === 'Escape') {
            close();
          }
        },
        {signal: abortController.signal},
      );
    }
    return () => abortController.abort();
  }, [close, expanded]);

  return (
    <div
      aria-modal
      className={`overlay overlay--${type} overlay--${location} ${expanded ? 'expanded' : ''}`}
      role="dialog"
    >
      <button
        className={`close-outside close-outside--${type} close-outside--${location}`}
        onClick={close}
      />
      <aside className={`aside--${type} aside--${location}`}>
        <header>
          {heading && <h3>{heading}</h3>}
          <button className="close reset" onClick={close} aria-label="Close">
            <XIcon />
          </button>
        </header>
        <main>{children}</main>
      </aside>
    </div>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');
  const [product, setProduct] = useState<ProductItemFragment | undefined>(
    undefined,
  );
  const [selectedVariant, setSelectedVariant] = useState<
    ProductVariantFragment | undefined
  >(undefined);
  return (
    <AsideContext.Provider
      value={{
        type,
        product,
        selectedVariant,
        open: setType,
        close: () => {
          setType('closed');
          setProduct(undefined);
          setSelectedVariant(undefined);
        },
        setProduct,
        setSelectedVariant,
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
