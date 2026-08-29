'use client';

import Image from 'next/image';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import { FaLinkedinIn, FaGithub, FaInstagram } from 'react-icons/fa';
import SpecularButton from '@/components/specular_button';
import { ElasticStack, type ElasticStackItem } from '@/components/ui/elastic-stack';
import Reveal from '@/rb_components/reveal';
import { openDeniseModal } from '@/rb_components/denise_modal_store';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600', '800'],
  variable: '--font-poppins',
});

const futuraDisplay = localFont({
  src: '../../../../../public/assets/fonts/futura_display/Futura Display.ttf',
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
        <FaLinkedinIn className="text-white" size={24} />
      </span>
    ),
  },
  {
    id: 'github',
    name: 'GitHub',
    href: 'https://github.com/ItzEvhyx',
    node: (
      <span className="flex h-full w-full items-center justify-center rounded-full bg-black">
        <FaGithub className="text-white" size={24} />
      </span>
    ),
  },
  {
    id: 'instagram',
    name: 'Instagram',
    href: 'https://www.instagram.com/_vhxn_/',
    node: (
      <span className="flex h-full w-full items-center justify-center rounded-full bg-black">
        <FaInstagram className="text-white" size={24} />
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

export default function ContactsMobile() {
  return (
    <section
      className={`relative z-10 flex flex-col px-5 py-14 ${poppins.variable} ${futuraDisplay.variable}`}
    >
      {/* Headline */}
      <Reveal
        as="h2"
        className="text-4xl leading-[1.05] text-white"
        style={{ fontFamily: futuraStack, fontWeight: 800 }}
      >
        Your resume and your dating Profile have the same problem: nobody&apos;s
        reading past line one.
      </Reveal>

      {/* Subtext */}
      <Reveal
        as="p"
        delay={100}
        className="mt-5 text-base leading-relaxed text-white/70"
        style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
      >
        Upload what you&apos;ve got, or build from scratch. Either way,
        you&apos;re getting the truth.
      </Reveal>

      {/* CTA */}
      <Reveal delay={180} className="mt-8">
        <SpecularButton
          radius={999}
          size="md"
          tint="#0b0d12"
          tintOpacity={1}
          textColor="#f5f5f5"
          className="w-full"
          onClick={openDeniseModal}
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}
        >
          Get started &gt;
        </SpecularButton>
      </Reveal>

      {/* Social stack */}
      <Reveal delay={260} className="mt-10 flex justify-center">
        <ElasticStack items={SOCIALS} itemSize={56} overlap={22} />
      </Reveal>

      {/* Footer line */}
      <Reveal
        delay={340}
        className="mt-12 flex flex-col items-center gap-1 border-t border-white/10 pt-6 text-center"
      >
        <span
          className="flex items-center gap-2 text-xs text-white/50"
          style={{ fontFamily: 'var(--font-poppins)', fontWeight: 400 }}
        >
          <Image
            src="/assets/logos/rmr_logo.png"
            alt="RoastMyResume"
            width={18}
            height={18}
          />
          RoastMyResume &copy; {new Date().getFullYear()}
        </span>
      </Reveal>
    </section>
  );
}
