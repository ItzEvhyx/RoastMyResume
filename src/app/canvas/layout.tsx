import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Build your Resume',
};

export default function CanvasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
