import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roast My Resume',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
