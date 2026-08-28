'use client';

import Image from 'next/image';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import { FaLinkedinIn, FaGithub, FaInstagram } from 'react-icons/fa';
import SpecularButton from '@/components/specular_button';
import { ElasticStack, type ElasticStackItem } from '@/components/ui/elastic-stack';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600', '800'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../../../public/assets/fonts/futura_display/Futura Display.ttf',
  variable: '--font-futura-display',
  display: 'swap',
});

const futuraStack = 'var(--font-futura-display), sans-serif';

const SOCIALS: ElasticStackItem[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/yhvhan-suba-4b985339b/',
    node: (
      <span className="flex h-full w-full items-center justify-center rounded-full bg-black">
        <FaLinkedinIn className="text-white" size={28} />
      </span>
    ),
  },
  {
    id: 'github',
    name: 'GitHub',
    href: 'https://github.com/ItzEvhyx',
    node: (
      <span className="flex h-full w-full items-center justify-center rounded-full bg-black">
        <FaGithub className="text-white" size={28} />
      </span>
    ),
  },
  {
    id: 'instagram',
    name: 'Instagram',
    href: 'https://www.instagram.com/_vhxn_/',
    node: (
      <span className="flex h-full w-full items-center justify-center rounded-full bg-black">
        <FaInstagram className="text-white" size={28} />
      </span>
    ),
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    href: 'https://yhvhan.tech',
    image: '/assets/logos/yhvhan_portfolio_logo.png',
  },
];

export default function Contacts() {
  return (
    <section
      className={`relative z-10 mx-auto flex w-full max-w-7xl flex-col px-6 py-24 ${poppins.variable} ${futuraDisplay.variable}`}
    >
      {/* Headline */}
      <h2
        className="text-5xl leading-[1.02] text-white md:text-6xl lg:text-7xl"
        style={{ fontFamily: futuraStack, fontWeight: 800 }}
      >
        Your resume and your dating
        <br />
        Profile have the same problem:
        <br />
        nobody&apos;s reading past line one.
      </h2>

      {/* Subtext */}
      <p
        className="mt-6 text-lg leading-relaxed text-white/70 md:text-xl"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
      >
        Upload what you&apos;ve got, or build from scratch.
        <br />
        Either way, you&apos;re getting the truth.
      </p>

      {/* Bottom row: CTA (left) + social stack (right) */}
      <div className="mt-10 flex items-end justify-between gap-6">
        <SpecularButton
          radius={999}
          size="lg"
          tint="#0b0d12"
          tintOpacity={1}
          textColor="#f5f5f5"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
        >
          Get started &gt;
        </SpecularButton>

        <ElasticStack items={SOCIALS} itemSize={64} overlap={26} className="py-0" />
      </div>

      {/* Footer line */}
      <div className="mt-16 flex flex-col items-center gap-1 border-t border-white/10 pt-6 text-center">
        <span
          className="flex items-center gap-2 text-sm text-white/50"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
        >
          <Image
            src="/assets/logos/rmr_logo.png"
            alt="RoastMyResume"
            width={20}
            height={20}
          />
          RoastMyResume &copy; {new Date().getFullYear()}
        </span>
      </div>
    </section>
  );
}
