'use client';
import dynamic from 'next/dynamic';

const FPSGame = dynamic(() => import('@/components/fps/FPSGame'), { ssr: false });

export default function FPSPage() {
  return <FPSGame />;
}
