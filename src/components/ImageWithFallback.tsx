// src/components/ImageWithFallback.tsx
import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

type Props = ImageProps & {
  fallbackSrc?: string;
};

export const ImageWithFallback = ({ src, fallbackSrc = '/placeholder-product.png', ...rest }: Props) => {
  const [imgSrc, setImgSrc] = useState<string>(src as string);
  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };
  return <Image src={imgSrc} onError={handleError} {...rest} />;
};

export default ImageWithFallback;

