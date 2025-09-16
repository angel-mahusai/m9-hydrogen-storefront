import * as React from 'react';
import type {SVGProps} from 'react';
const SvgFilter = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={1}
    className="filter_svg__feather filter_svg__feather-filter"
    {...props}
  >
    <path d="M22 3H2l8 9.46V19l4 2v-8.54z" />
  </svg>
);
export default SvgFilter;
