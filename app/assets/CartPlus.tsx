import * as React from 'react';
import type {SVGProps} from 'react';
const SvgCartPlus = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    className="cart-plus_svg__icon-cart-plus"
    {...props}
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1}
      d="m21 5-2 7H7.377M20 16H8L6 3H3m13 2.5h-2.5m0 0H11m2.5 0V8m0-2.5V3M9 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0m11 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0"
    />
  </svg>
);
export default SvgCartPlus;
