// src/components/ImageWithFallback.tsx
import Image, { ImageProps } from 'next/image';
import { useState, useEffect } from 'react';

type Props = ImageProps & {
  fallbackSrc?: string;
};

export const ImageWithFallback = ({ src, fallbackSrc = '/placeholder-product.png', ...rest }: Props) => {
  const [imgSrc, setImgSrc] = useState<string>(src as string);

  useEffect(() => {
    setImgSrc(src as string);
  }, [src]);

  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };
  return <Image src={imgSrc} onError={handleError} unoptimized={true} {...rest} />;
};

export default ImageWithFallback;

