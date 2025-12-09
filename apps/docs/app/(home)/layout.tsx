import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions, linkItems } from '@/lib/layout.shared';
import {
  NavbarMenu,
  NavbarMenuContent,
  NavbarMenuLink,
  NavbarMenuTrigger,
} from 'fumadocs-ui/layouts/home/navbar';
import Link from 'fumadocs-core/link';
import Image from 'next/image';
import Preview from '@/public/banner.png';
import { Book, ComponentIcon, Pencil, PlusIcon, Server } from 'lucide-react';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <HomeLayout
      {...baseOptions()}
      links={[
        {
          type: 'menu',
          on: 'menu',
          text: 'Documentation',
          items: [
            {
              text: 'Getting Started',
              url: '/docs/jkt48',
              icon: <Book />,
            },
            {
              text: 'Live',
              url: '/docs/jkt48/all-live',
              icon: <ComponentIcon />,
            },
          ],
        },
        {
          type: 'custom',
          on: 'nav',
          children: (
            <NavbarMenu>
              <NavbarMenuTrigger>
                <Link href="/docs/ui">Documentation</Link>
              </NavbarMenuTrigger>
              <NavbarMenuContent>
                <NavbarMenuLink href="/docs/jkt48" className="md:row-span-2">
                  <div className="-mx-3 -mt-3">
                    <Image
                      src={Preview}
                      alt="Perview"
                      className="rounded-t-lg object-cover"
                      style={{
                        maskImage:
                          'linear-gradient(to bottom,white 60%,transparent)',
                      }}
                    />
                  </div>
                  <p className="font-medium">Getting Started</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Learn to use JKT48Connect on your docs project.
                  </p>
                </NavbarMenuLink>

                <NavbarMenuLink
                  href="/docs/jkt48/all-live"
                  className="lg:col-start-2"
                >
                  <ComponentIcon className="bg-fd-primary text-fd-primary-foreground p-1 mb-2 rounded-md" />
                  <p className="font-medium">All Live</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Melihat list member yang sedang live saat ini.
                  </p>
                </NavbarMenuLink>

                <NavbarMenuLink
                  href="/docs/openapi"
                  className="lg:col-start-2"
                >
                  <Server className="bg-fd-primary text-fd-primary-foreground p-1 mb-2 rounded-md" />
                  <p className="font-medium">OpenAPI</p>
                  <p className="text-fd-muted-foreground text-sm">
                    playground untuk mencoba fitur restapi secara langsung.
                  </p>
                </NavbarMenuLink>

                <NavbarMenuLink
                  href="/docs/jkt48/theater"
                  className="lg:col-start-3 lg:row-start-1"
                >
                  <Pencil className="bg-fd-primary text-fd-primary-foreground p-1 mb-2 rounded-md" />
                  <p className="font-medium">Theater</p>
                  <p className="text-fd-muted-foreground text-sm">
                   Melihat data semua show theater yang ada secara realtime.
                  </p>
                </NavbarMenuLink>

                <NavbarMenuLink
                  href="/docs/jkt48/news"
                  className="lg:col-start-3 lg:row-start-2"
                >
                  <PlusIcon className="bg-fd-primary text-fd-primary-foreground p-1 mb-2 rounded-md" />
                  <p className="font-medium">News</p>
                  <p className="text-fd-muted-foreground text-sm">
                    List berita terbaru yang ada pada web jkt48.
                  </p>
                </NavbarMenuLink>
              </NavbarMenuContent>
            </NavbarMenu>
          ),
        },
        ...linkItems,
      ]}
      className="dark:bg-neutral-950 dark:[--color-fd-background:var(--color-neutral-950)] [--color-fd-primary:var(--color-brand)]"
    >
      {children}
    </HomeLayout>
  );
}
