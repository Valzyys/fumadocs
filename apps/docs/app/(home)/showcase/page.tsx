
import { PlusIcon } from 'lucide-react';
import Image, { type StaticImageData } from 'next/image';
import { cn } from '@/lib/cn';
import { buttonVariants } from '@/components/ui/button';
import { createMetadata } from '@/lib/metadata';
import Expostarter from '@/public/showcases/expostarter.png';
import Sunar from '@/public/showcases/sunar.png';
import OpenPanel from '@/public/showcases/openpanel.png';
import Supastarter from '@/public/showcases/supastarter.png';
import BetterAuth from '@/public/showcases/better-auth.png';
import ArkType from '@/public/showcases/arktype.png';
import AssistantUI from '@/public/showcases/assistant-ui.png';
import VisionUI from '@/public/showcases/vision-ui.png';
import Design from './design.png';
import Jeketian from './686103cd95e8ca13853ee2a9.jpg';
import Jkt48connect from './685ff7f8525d02566271d545.png';
import nayrakuen from './nayrakuen-logo.jpg';
import Link from 'fumadocs-core/link';
import MixSpace from '@/public/showcases/mix-space.png';
import TurboStarter from '@/public/showcases/turbostarter.png';
import cava from './Cava#2.jpg';

export const metadata = createMetadata({
  title: 'Showcase',
  description: 'Some cool websites using jkt48connect',
  openGraph: {
    url: 'https://docs.jkt48connect.my.id/showcase',
  },
});

interface ShowcaseObject {
  image?: StaticImageData | string;
  name: string;
  url: string;
}

interface ProjectObject {
  name: string;
  description: string;
  category: string;
  url?: string;
  status: 'Active' | 'Maintenance' | 'Beta' | 'Deprecated';
  tech?: string[];
}

const showcases: ShowcaseObject[] = [
  {
    image: Jeketian,
    name: 'Jeketian',
    url: 'https://www.jeketian.web.id/',
  },
  {
    image: Jkt48connect,
    name: 'JKT48Connect',
    url: 'https://www.jkt48connect.com',
  },
  {
    image: nayrakuen,
    name: 'Nayrakuen',
    url: 'https://nayrakuen.com',
  },
  {
    image: cava,
    name: 'Cavallery',
    url: 'https://cavallery.id',
  },
];

const blogs: ShowcaseObject[] = [
  {
    name: "ZENOVA WhatsApp Bot",
    url: 'https://wa.me/6285189020193',
  },
  {
    name: 'JKT48Connect Discord Bot',
  url: 'https://docs.jkt48connect.com',
  },
];

const projects: ProjectObject[] = [
  {
    name: 'JKT48Connect API',
    description: 'RESTful API untuk mengakses data JKT48 termasuk member, jadwal, berita, dan konten multimedia',
    category: 'API',
    url: 'https://v2.jkt48connect.my.id',
    status: 'Active',
    tech: ['Node.js', 'Express', 'MongoDB']
  },
  {
    name: 'JKT48Connect WEB',
    description: ' web official sebagai contoh sekaligus application yang bisa digunakan untuk melihat atau bahkan menonton livestreaming member secara langsung.',
    category: 'Web App',
    url: 'https://www.jkt48connect.my.id',
    status: 'Active',
    tech: ['Next.js', 'React', 'TypeScript']
  },
  {
    name: 'JKT48Connect Docs',
    description: ' web dokumentasi official, untuk membantu developer dalam menggunakan JKT48Connect.',
    category: 'Web App',
    url: 'https://docs.jkt48connect.my.id',
    status: 'Active',
    tech: ['Next.js', 'React', 'TypeScript']
  },
  {
    name: 'ZENOVA',
    description: 'Bot WhatsApp otomatis untuk mendapatkan informasi JKT48 secara real-time',
    category: 'Chatbot',
    url: 'https://wa.me/6285189020193',
    status: 'Active',
    tech: ['Node.js', 'WhatsApp Web.js']
  },
  {
    name: 'JKT48Connect Discord Bot',
    description: 'Bot Discord dengan fitur notifikasi otomatis, games, dan integrasi API JKT48',
    category: 'Chatbot',
    url: 'https://discord.com/oauth2/authorize?client_id=1305141693477027891',
    status: 'Active',
    tech: ['Discord.js', 'Node.js']
  },
  {
    name: '@jkt48/core',
    description: 'Software Development Kits untukmemudahkan dalam menggunakan jkt48connect',
    category: 'Package',
    status: 'Active',
    tech: ['Javascript', 'Express']
  },
 {
    name: '@jkt48connect-corp/baileys',
    description: 'Baileys untuk WhatsApp yang dibekali dengan fitur button dan lainnya.',
    category: 'Package',
    status: 'Active',
    tech: ['Javascript', 'Express']
  },
 {
    name: '@jkt48connect-corp/sdk',
    description: 'Software Development Kits untuk berbagai bahasa pemrograman (JavaScript, Python, PHP)',
    category: 'Developer Tools',
    status: 'Active',
    tech: ['JavaScript', 'Python', 'PHP']
  }
];

const vercel = [
  {
    name: 'Turbo',
    url: 'https://turbo.build',
  },
  {
    name: 'Flags SDK',
    url: 'https://flags-sdk.dev',
  },
  {
    name: 'Chat SDK',
    url: 'https://chat-sdk.dev',
  },
];

const categories = Array.from(new Set(projects.map(project => project.category)));

const getStatusColor = (status: ProjectObject['status']) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Beta':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Maintenance':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Deprecated':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function Showcase() {
  return (
    <main className="px-4 py-12 z-[2] w-full max-w-[1400px] mx-auto [--color-fd-border:color-mix(in_oklab,var(--color-fd-primary)_30%,transparent)]">
      <div className="relative overflow-hidden border border-dashed p-6">
        <h1 className="mb-4 text-xl font-medium">
          The restapi created for everyone.
        </h1>
        <p className="text-fd-muted-foreground">
          A list of beautiful projects with their powered by
          JKT48Connect.
        </p>
        <div className="mt-6">
          <a
            href="https://wa.me/6285701479245"
            target="_blank"
            rel="noreferrer noopener"
            className={cn(
              buttonVariants({
                variant: 'outline',
              }),
            )}
          >
            <PlusIcon className="me-2 size-4" />
            Suggest Yours
          </a>
        </div>
        <span className="absolute text-xs left-6 bottom-6 text-fd-muted-foreground font-mono">
          Showcases
        </span>
        <Image
          src={Design}
          alt="preview"
          priority
          className="ml-auto w-[600px] min-w-[600px] -mt-12 -mb-18 pointer-events-none select-none"
        />
      </div>

      <div className="flex gap-4 border border-dashed p-6 mt-6">
        <svg
          aria-label="Vercel logomark"
          height="64"
          role="img"
          viewBox="0 0 74 64"
          className="size-6 mt-1"
        >
          <path
            d="M37.5896 0.25L74.5396 64.25H0.639648L37.5896 0.25Z"
            fill="currentColor"
          />
        </svg>
        <div>
          <h2 className="text-sm font-medium mb-2">
            JKT48Connect using the host of Vercel open source SDKs.
          </h2>
          <div className="flex items-center gap-2 -mx-1.5">
            {vercel.map((item) => (
              <Link
                key={item.url}
                href={item.url}
                className={cn(
                  buttonVariants({
                    variant: 'link',
                    size: 'xs',
                  }),
                  'text-fd-muted-foreground',
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-6 grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {showcases.map((showcase) => (
          <ShowcaseItem key={showcase.url} {...showcase} />
        ))}
        <div className="absolute text-center bottom-0 inset-x-0 pt-4 bg-gradient-to-t from-fd-background">
          <Link
            href="https://www.jkt48connect.my.id"
            className={cn(
              buttonVariants({
                size: 'sm',
                variant: 'link',
              }),
            )}
          >
            See jkt48connect website
          </Link>
        </div>
      </div>

      <h2 className="text-xl font-medium mt-12 px-4">
        JKT48Connect can power your bot, too.
      </h2>
      <div className="mt-6 grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {blogs.map((showcase) => (
          <ShowcaseItem key={showcase.url} {...showcase} />
        ))}
      </div>

      {/* New Projects Section */}
      <h2 className="text-xl font-medium mt-16 mb-6">
        Our Projects & Services
      </h2>
      <p className="text-fd-muted-foreground mb-8">
        Explore the complete ecosystem of tools and services built by JKT48Connect team.
      </p>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <span className="text-sm font-medium text-fd-muted-foreground">Categories:</span>
        {categories.map((category) => (
          <span
            key={category}
            className="px-3 py-1 text-xs font-medium bg-fd-accent rounded-full border"
          >
            {category}
          </span>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <ProjectCard key={index} {...project} />
        ))}
      </div>

      {/* Call to Action */}
      <div className="mt-16 text-center border border-dashed p-8 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Want to contribute or suggest a project?</h3>
        <p className="text-fd-muted-foreground mb-4">
          We're always looking for new ideas and contributions to expand the JKT48Connect ecosystem.
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="https://github.com/jkt48connect"
            target="_blank"
            rel="noreferrer noopener"
            className={cn(
              buttonVariants({
                variant: 'default',
                size: 'sm',
              }),
            )}
          >
            View on GitHub
          </a>
          <a
            href="https://wa.me/6285701479245"
            target="_blank"
            rel="noreferrer noopener"
            className={cn(
              buttonVariants({
                variant: 'outline',
                size: 'sm',
              }),
            )}
          >
            Contact Us
          </a>
        </div>
      </div>
    </main>
  );
}

function ShowcaseItem({ name, url, image }: ShowcaseObject) {
  if (image) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className="group relative aspect-[1.91/1] border border-dashed"
      >
        <Image
          alt="Preview"
          src={image}
          fill
          sizes="100vw, (min-width: 750px) 500px"
          className="object-cover transition-all group-hover:brightness-150"
        />
        <p className="absolute bottom-0 inset-x-0 z-[2] bg-fd-background px-4 py-2 text-sm font-medium">
          {name}
        </p>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className="flex aspect-[1.91/1] flex-col border border-dashed p-4 transition-all hover:bg-fd-accent"
    >
      <p className="font-mono text-xs mb-2 text-fd-muted-foreground">
        {new URL(url).hostname}
      </p>
      <p className="text-xl font-medium">{name}</p>
    </a>
  );
}

function ProjectCard({ name, description, category, url, status, tech }: ProjectObject) {
  return (
    <div className="group border border-dashed p-6 transition-all hover:bg-fd-accent rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-lg">{name}</h3>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
        <span className={cn(
          "px-2 py-1 text-xs font-medium rounded-full border",
          getStatusColor(status)
        )}>
          {status}
        </span>
      </div>
      
      <p className="text-sm text-fd-muted-foreground mb-3">
        {description}
      </p>
      
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-fd-primary bg-fd-primary/10 px-2 py-1 rounded">
          {category}
        </span>
        
        {tech && tech.length > 0 && (
          <div className="flex gap-1">
            {tech.slice(0, 3).map((technology, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-fd-muted/10 rounded border"
              >
                {technology}
              </span>
            ))}
            {tech.length > 3 && (
              <span className="text-xs px-2 py-1 bg-fd-muted/10 rounded border">
                +{tech.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
