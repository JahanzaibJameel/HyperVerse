import React, { lazy } from 'react';
import { LazyScreen } from '../LazyScreen';

// Lazy load the blockchain screen
const BlockchainScreen = lazy(() => import('@/app/(tabs)/blockchain'));

const LazyBlockchainWrapper: React.FC = () => {
  return (
    <LazyScreen>
      <BlockchainScreen />
    </LazyScreen>
  );
};

export default LazyBlockchainWrapper;
