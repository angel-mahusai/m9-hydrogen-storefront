import React from 'react';
import Slider, {Settings} from '@ant-design/react-slick';

export interface CarouselProps extends Settings {
  children: React.ReactNode;
}

export default function Carousel({
  children,
  arrows = true,
  dots = false,
  infinite = true,
  speed = 500,
  slidesToShow = 1,
  slidesToScroll = 1,
  ...props
}: CarouselProps) {
  return typeof window === 'undefined' ? (
    <>{children}</>
  ) : (
    <>
      <Slider
        arrows={arrows}
        dots={dots}
        infinite={infinite}
        speed={speed}
        slidesToShow={slidesToShow}
        slidesToScroll={slidesToScroll}
        {...props}
      >
        {children}
      </Slider>
    </>
  );
}
