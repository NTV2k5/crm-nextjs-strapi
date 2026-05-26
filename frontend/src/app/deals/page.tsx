'use client';

import dynamic from 'next/dynamic';

const DealsContent = dynamic(() => import('./DealsContent'), {
  ssr: false,
});

export default function DealsPage() {
  return <DealsContent />;
}
