import type { Metadata } from 'next';
import NetworkErrorPage from './network_error/page';

export const metadata: Metadata = {
  title: 'Page not found · Roast My Resume',
};

export default function NotFound() {
  return <NetworkErrorPage />;
}
