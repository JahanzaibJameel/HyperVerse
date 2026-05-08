import React, { lazy } from 'react';
import { LazyScreen } from '../LazyScreen';

// Lazy load the AI screen
const AIScreen = lazy(() => import('@/app/(tabs)/ai'));

const LazyAIWrapper: React.FC = () => {
  return (
    <LazyScreen>
      <AIScreen />
    </LazyScreen>
  );
};

export default LazyAIWrapper;
