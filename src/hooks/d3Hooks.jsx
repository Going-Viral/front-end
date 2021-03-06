import { useState, useEffect } from 'react';
import ResizeObserver from 'resize-observer-polyfill';

export const useResizeObserver = (ref) => {

  //must use polyfill for safari "resize-observer-polyfill"
  
  const [dimensions, setDimensions] = useState(null);

  useEffect(() => {
    const observeTarget = ref.current;
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach(entry => {
        setDimensions(entry.contentRect);
      });
    });

    resizeObserver.observe(observeTarget);

    return () => {
      resizeObserver.unobserve(observeTarget);
    };
  }, [ref]);
  return dimensions;
};
