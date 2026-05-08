import React, { lazy } from 'react';
import { LazyScreen } from '../LazyScreen';

// Lazy load the AR screen
const ARScreen = lazy(() => import('@/app/(tabs)/ar'));

const LazyARWrapper: React.FC = () => {
  return (
    <LazyScreen>
      <ARScreen />
    </LazyScreen>
  );
};

export default LazyARWrapper;
