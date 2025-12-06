import Image from 'next/image';
import { cn } from '@/lib/cn';
import Link from 'next/link';
import { cva } from 'class-variance-authority';
import {
  BatteryChargingIcon,
  FileIcon,
  FileTextIcon,
  Heart,
  SearchIcon,
  TimerIcon,
  KeyIcon,
  PackageIcon,
  ServerIcon,
  Infinity, 
  Globe,
  Zap,
  Users,
  Code,
  Newspaper,
  CircleAlert, 
  BadgeCheck,
} from 'lucide-react';
import { Marquee } from '@/app/(home)/marquee';
import { CodeBlock } from '@/components/code-block';
import {
  Hero,
  AgnosticBackground,
  CreateAppAnimation,
  PreviewImages,
  Writing,
  ContentAdoptionBackground,
} from '@/app/(home)/page.client';
import ShadcnImage from './20251121_212123.jpg';
import ContributorCounter from '@/components/contributor-count';
import { owner, repo } from '@/lib/github';

const headingVariants = cva('font-medium tracking-tight', {
  variants: {
    variant: {
      h2: 'text-3xl lg:text-4xl',
      h3: 'text-xl lg:text-2xl',
    },
  },
});

const buttonVariants = cva(
  'inline-flex justify-center px-5 py-3 rounded-full font-medium tracking-tight transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-brand-foreground hover:bg-brand-200',
        secondary:
          'border bg-fd-secondary text-fd-secondary-foreground hover:bg-fd-accent',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
);

const cardVariants = cva('rounded-2xl text-sm p-6 bg-origin-border shadow-lg', {
  variants: {
    variant: {
      secondary: 'bg-brand-secondary text-brand-secondary-foreground',
      default: 'border bg-fd-card',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export default function Page() {
  return (
    <main className="text-landing-foreground pt-4 pb-6 dark:text-landing-foreground-dark md:pb-12">
      <div className="relative flex min-h-[600px] h-[70vh] max-h-[900px] border rounded-2xl overflow-hidden mx-auto w-full max-w-[1400px] bg-origin-border">
        <Hero />
        <div className="flex flex-col z-2 px-4 size-full md:p-12 max-md:items-center max-md:text-center">
          <p className="mt-12 text-xs text-brand font-medium rounded-full p-2 border border-brand/50 w-fit">
            the JKT48 API service you need.
          </p>
          <h1 className="text-4xl my-8 leading-tighter font-medium xl:text-5xl xl:mb-12">
            Connect with
            <br className="md:hidden" /> JKT48,
            <br />
            your <span className="text-brand">way</span>.
          </h1>
          <div className="flex flex-row items-center justify-center gap-4 flex-wrap w-fit">
            <Link
              href="/docs"
              className={cn(buttonVariants(), 'max-sm:text-sm')}
            >
              Getting Started
            </Link>
            <a
              href="https://github.com/JKT48Connect"
              target="_blank"
              rel="noreferrer noopener"
              className={cn(
                buttonVariants({ variant: 'secondary' }),
                'max-sm:text-sm',
              )}
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-10 mt-12 px-6 mx-auto w-full max-w-[1400px] md:px-12 lg:grid-cols-2">
        <p className="text-2xl tracking-tight leading-snug font-light col-span-full md:text-3xl xl:text-4xl">
          JKT48Connect is a <span className="text-brand font-medium">comprehensive API service</span>{' '}
          for{' '}
          <span className="text-brand font-medium">Developers & Fans</span>,
          beautifully designed to access{' '}
          <span className="text-brand font-medium">JKT48</span> data. Bringing
          powerful features for your applications and bots, with easy integration
          through REST API and npm packages, works seamlessly with any platform,
          framework — anything.
        </p>
        <div className="p-8 bg-radial-[circle_at_top_center] from-25% to-brand-secondary/50 rounded-xl col-span-full">
          <h2 className="text-xl text-center text-brand font-mono font-bold uppercase mb-2">
            Try it out.
          </h2>
          <CodeBlock
            code="npm install @jkt48/core"
            lang="bash"
            wrapper={{
              className: 'mx-auto w-full max-w-[800px]',
            }}
          />
          <CreateAppAnimation />
        </div>
        <Feedback />
        <Aesthetics />
        <AnybodyCanUse />
        <ForDevelopers />
        <PriorityAccessSection />
        <OpenSource />
      </div>
    </main>
  );
}

function Aesthetics() {
  return (
    <>
      <div
        className={cn(
          cardVariants({
            variant: 'secondary',
            className: 'flex items-center justify-center p-0',
          }),
        )}
      >
        <PreviewImages />
      </div>
      <div className={cn(cardVariants(), 'flex flex-col')}>
        <h3
          className={cn(headingVariants({ variant: 'h3', className: 'mb-6' }))}
        >
          Powerful API Features.
        </h3>
        <p className="mb-8">
          Access real-time data with our comprehensive <span className="text-brand">REST API</span> and 
          <span className="text-brand"> npm package</span> — providing seamless integration for 
          Node.js developers and universal platform access.
        </p>
        <div className="mt-auto flex flex-col gap-2 @container mask-[linear-gradient(to_bottom,white,transparent)]">
          {[
            {
              name: 'Live',
              description: 'Real-time member live data from IDN and Showroom platforms.',
            },
            {
              name: 'Theater',
              description:
                'Real-time theater schedule and performance data with live updates.',
            },
            {
              name: 'News',
              description: 'Latest JKT48 news and updates delivered in real-time.',
            },
            {
              name: 'Members',
              description: 'Complete member list including trainees and core members.',
            },
            {
              name: 'Events',
              description: 'Comprehensive list of JKT48 off-air shows and events.',
            },
          ].map((item) => (
            <div
              key={item.name}
              className="flex flex-col text-sm gap-2 p-2 border border-dashed border-brand-secondary @lg:flex-row @lg:items-center last:@max-lg:hidden"
            >
              <p className="font-medium text-nowrap">{item.name}</p>
              <p className="text-xs flex-1 @lg:text-end">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ApiKeyDisplay() {
  return (
    <div className="flex select-none flex-col mt-auto bg-fd-popover rounded-xl border mask-[linear-gradient(to_bottom,white_40%,transparent_90%)] max-md:-mx-4">
      <div className="inline-flex items-center gap-2 px-4 py-3 text-sm text-fd-muted-foreground">
        <KeyIcon className="size-4" />
        API Key Management
      </div>
      <div className="border-t p-2">
        {[
          ['Standard Access', 'Basic API access with rate limiting.'],
          ['Priority Access', 'Enhanced limits for official fanbases.'],
          ['Developer Tier', 'Higher rate limits for development.'],
          ['Enterprise', 'Custom solutions for large projects.'],
        ].map(([title, description], i) => (
          <div
            key={i}
            className={cn(searchItemVariants(), i === 0 && 'bg-fd-accent')}
          >
            <div className="flex flex-row items-center gap-2">
              <KeyIcon className="size-4 text-fd-muted-foreground" />
              <p>{title}</p>
            </div>
            <p className="text-xs mt-2 text-fd-muted-foreground ps-6">
              {description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const searchItemVariants = cva(
  'rounded-md p-2 text-sm text-fd-popover-foreground',
);

function Search() {
  return (
    <div className="flex select-none flex-col mt-auto bg-fd-popover rounded-xl border mask-[linear-gradient(to_bottom,white_40%,transparent_90%)] max-md:-mx-4">
      <div className="inline-flex items-center gap-2 px-4 py-3 text-sm text-fd-muted-foreground">
        <SearchIcon className="size-4" />
        Search documentation...
      </div>
      <div className="border-t p-2">
        {[
          ['Getting Started', 'Start using JKT48Connect API.'],
          ['Authentication', 'API key and priority key setup.'],
          ['npm Package', 'Using the npm package in your project.'],
          ['API Reference', 'Complete API endpoint documentation.'],
        ].map(([title, description], i) => (
          <div
            key={i}
            className={cn(searchItemVariants(), i === 0 && 'bg-fd-accent')}
          >
            <div className="flex flex-row items-center gap-2">
              <FileTextIcon className="size-4 text-fd-muted-foreground" />
              <p>{title}</p>
              {i === 0 && (
                <p className="ms-auto text-xs text-fd-muted-foreground">Open</p>
              )}
            </div>
            <p className="text-xs mt-2 text-fd-muted-foreground ps-6">
              {description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriorityAccessSection() {
  return (
    <>
      <h2
        className={cn(
          headingVariants({
            variant: 'h2',
            className: 'mt-16 text-brand text-center mb-4 col-span-full',
          }),
        )}
      >
        Priority Access Program
      </h2>
      
      <p className="text-center text-fd-muted-foreground mb-8 col-span-full max-w-3xl mx-auto">
        Enhanced access for verified organizations, communities, and developers. 
        Get unlimited API requests with priority support.
      </p>

      {/* Main Priority Card */}
      <div className={cn(cardVariants({ 
        className: 'col-span-full relative overflow-hidden border-2 border-brand/20'
      }))}>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand/5 to-transparent" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Benefits */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-medium mb-4 border border-brand/20">
              <KeyIcon className="size-3" />
              Priority Access
            </div>
            
            <h3 className={cn(headingVariants({ variant: 'h3', className: 'mb-4' }))}>
              Enhanced Access for Verified Organizations
            </h3>
            
            <p className="mb-6 text-sm">
              Get priority access with unlimited requests, no API keys required, and 
              enhanced support for verified organizations, communities, fanbase groups, 
              developers, and media partners.
            </p>

            {/* Benefits List */}
            <div className="space-y-3 mb-8">
              {[
                {
                  Icon: Infinity,
                  title: 'Unlimited API Requests',
                  description: 'No rate limits or request quotas'
                },
                {
                  Icon: Globe,
                  title: 'No IP Whitelisting Required',
                  description: 'Access from anywhere without restrictions'
                },
                {
                  Icon: Zap,
                  title: 'Priority Support',
                  description: 'Dedicated support channel and faster response times'
                },
              ].map((benefit, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-fd-secondary/50">
                  <benefit.Icon className="size-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{benefit.title}</p>
                    <p className="text-xs text-fd-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="https://forms.gle/KeqJF9nAeEq7hxWP9"
              target="_blank"
              rel="noreferrer noopener"
              className={cn(buttonVariants({ variant: 'primary', className: 'w-full sm:w-auto' }))}
            >
              Apply for Priority Access
            </a>
          </div>

          {/* Right Side - Eligible Organizations */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm mb-4">Eligible Organizations:</h4>
            
            {[
              {
                Icon: Users,
                title: 'Verified Communities & Fanbase',
                description: 'Registered JKT48 fan communities and official fanbase groups',
              },
              {
                Icon: Code,
                title: 'Verified Developers',
                description: 'Certified developers building JKT48-related applications',
              },
              {
                Icon: Newspaper,
                title: 'Media Partners',
                description: 'Accredited media organizations covering JKT48',
              },
            ].map((org, i) => (
              <div 
                key={i} 
                className="p-4 rounded-xl border bg-fd-secondary/30 hover:bg-fd-secondary/50 hover:scale-[1.02] transition-all"
              >
                <div className="flex items-start gap-3">
                  <org.Icon className="size-5 text-brand shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{org.title}</p>
                      <BadgeCheck className="size-4 text-green-500" />
                    </div>
                    <p className="text-xs text-fd-muted-foreground">{org.description}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Requirements Note */}
            <div className="mt-6 p-4 rounded-lg border bg-fd-secondary/20">
              <p className="text-xs font-medium mb-2 flex items-center gap-2">
                <CircleAlert className="size-4" />
                Legal Registration Required
              </p>
              <p className="text-xs text-fd-muted-foreground leading-relaxed">
                Organizations must provide valid legal documentation and undergo verification 
                process. Required: Twitter (X), Instagram, or official website to verify authenticity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info Cards */}
      <div className={cn(cardVariants({ className: 'flex flex-col' }))}>
        <ServerIcon className="size-8 text-brand mb-4" />
        <h3 className={cn(headingVariants({ variant: 'h3', className: 'mb-4' }))}>
          Application Process
        </h3>
        <p className="text-sm text-fd-muted-foreground mb-4">
          The verification process typically takes 3-5 business days. We'll review your 
          application and verify your organization's authenticity.
        </p>
        <ul className="text-xs space-y-2 list-disc list-inside text-fd-muted-foreground">
          <li>Submit application form with required documents</li>
          <li>Provide social media accounts or official website</li>
          <li>Wait for verification team review</li>
          <li>Receive priority access credentials upon approval</li>
        </ul>
      </div>

      <div className={cn(cardVariants({ className: 'flex flex-col' }))}>
        <Heart fill="currentColor" className="size-8 text-pink-500 mb-4" />
        <h3 className={cn(headingVariants({ variant: 'h3', className: 'mb-4' }))}>
          Community First
        </h3>
        <p className="text-sm text-fd-muted-foreground mb-4">
          We prioritize verified JKT48 communities and fanbase groups to ensure they 
          have the best tools to serve fellow fans.
        </p>
        <a
          href="https://forms.gle/KeqJF9nAeEq7hxWP9"
          target="_blank"
          rel="noreferrer noopener"
          className={cn(buttonVariants({ variant: 'secondary', className: 'w-fit' }))}
        >
          Start Your Application
        </a>
      </div>
    </>
  );
}

function OpenSource() {
  return (
    <>
      <h2
        className={cn(
          headingVariants({
            variant: 'h2',
            className: 'mt-8 text-brand text-center mb-4 col-span-full',
          }),
        )}
      >
        Connect With JKT48.
      </h2>

      <div className={cn(cardVariants({ className: 'flex flex-col' }))}>
        <Heart fill="currentColor" className="text-pink-500 mb-4" />
        <h3
          className={cn(
            headingVariants({
              variant: 'h3',
              className: 'mb-6',
            }),
          )}
        >
          Made For Fans, By Fans.
        </h3>
        <p className="mb-8">
          JKT48Connect is built with love for the JKT48 community, providing
          reliable access to JKT48 data.
        </p>
        <div className="mb-8 flex flex-row items-center gap-2">
          <Link
            href="/community"
            className={cn(buttonVariants({ variant: 'primary' }))}
          >
            Join Community
          </Link>
          <a
            href="https://github.com/JKT48Connect"
            rel="noreferrer noopener"
            target="_blank"
            className={cn(buttonVariants({ variant: 'secondary' }))}
          >
            GitHub
          </a>
        </div>
        <ContributorCounter repoOwner={owner} repoName={repo} />
      </div>

      <div
        className={cn(
          cardVariants({
            className: 'flex flex-col p-0 pt-8',
          }),
        )}
      >
        <h2 className="text-3xl text-center font-extrabold font-mono uppercase mb-4 lg:text-4xl">
          Start Building
        </h2>
        <p className="text-center font-mono text-xs opacity-50 mb-8">
          Connect your app with JKT48 data today.
        </p>
        <div className="h-[200px] mt-auto overflow-hidden p-8 bg-gradient-to-b from-brand-secondary/10">
          <div className="mx-auto bg-radial-[circle_at_0%_100%] from-60% from-transparent to-brand-secondary size-[500px] rounded-full" />
        </div>
      </div>

      <ul
        className={cn(
          cardVariants({
            className: 'flex flex-col gap-6 col-span-full',
          }),
        )}
      >
        <li>
          <span className="flex flex-row items-center gap-2 font-medium">
            <ServerIcon className="size-5" />
            REST API Ready.
          </span>
          <span className="mt-2 text-sm text-fd-muted-foreground">
            Production-ready API with comprehensive documentation.
          </span>
        </li>
        <li>
          <span className="flex flex-row items-center gap-2 font-medium">
            <PackageIcon className="size-5" />
            npm Package Available.
          </span>
          <span className="mt-2 text-sm text-fd-muted-foreground">
            Easy integration with full TypeScript support.
          </span>
        </li>
        <li>
          <span className="flex flex-row items-center gap-2 font-medium">
            <KeyIcon className="size-5" />
            Secure Authentication.
          </span>
          <span className="mt-2 text-sm text-fd-muted-foreground">
            API keys with priority access for official communities.
          </span>
        </li>
        <li>
          <span className="flex flex-row items-center gap-2 font-medium">
            <TimerIcon className="size-5" />
            Fast & Reliable.
          </span>
          <span className="mt-2 text-sm text-fd-muted-foreground">
            Low latency responses with high availability.
          </span>
        </li>
        <li className="flex flex-row flex-wrap gap-2 mt-auto">
          <Link href="/docs" className={cn(buttonVariants())}>
            Read Documentation
          </Link>
          <a
            href="https://github.com/JKT48Connect"
            rel="noreferrer noopener"
            target="_blank"
            className={cn(
              buttonVariants({
                variant: 'secondary',
              }),
            )}
          >
            View on GitHub
          </a>
        </li>
      </ul>

      <div className={cn(cardVariants({ className: 'flex flex-col col-span-full' }))}>
        <h3
          className={cn(
            headingVariants({
              variant: 'h3',
              className: 'mb-6',
            }),
          )}
        >
          Clean documentation, Maximum clarity.
        </h3>
        <p className="mb-4">
          JKT48Connect offers well-organized documentation, with clear examples
          for both REST API and npm package usage.
        </p>
        <p className="mb-4">
          Need API access? Get your API key and start building.
        </p>
        <CodeBlock
          code={`curl -X GET "https://api.jkt48connect.com/members" \\
  -H "x-api-key: YOUR_API_KEY"`}
          lang="bash"
        />
      </div>
    </>
  );
} 

function AnybodyCanUse() {
  return (
    <Writing
      tabs={{
        restapi: (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <CodeBlock
              code={`// Fetch member data
const response = await fetch(
  'https://api.jkt48connect.com/members',
  {
    headers: {
      'x-api-key': 'YOUR_API_KEY'
    }
  }
);

const data = await response.json();
console.log(data);

// Get theater schedule
const schedule = await fetch(
  'https://api.jkt48connect.com/schedule',
  {
    headers: {
      'x-api-key': 'YOUR_API_KEY'
    }
  }
);`}
              lang="javascript"
            />
            <div className="max-lg:row-start-1">
              <h3
                className={cn(
                  headingVariants({ variant: 'h3', className: 'my-4' }),
                )}
              >
                Simple REST API.
              </h3>
              <p>
                Access JKT48 data through our REST API with just a few lines of code.
                Perfect for any platform or language.
              </p>
              <ul className="text-xs list-disc list-inside mt-8">
                <li>Member profiles and information</li>
                <li>Theater schedules and shows</li>
                <li>Event information</li>
                <li>News and announcements</li>
                <li>Social media updates</li>
                <li>API key authentication</li>
                <li>Priority access for official fanbases</li>
              </ul>
            </div>
          </div>
        ),
        npmpackage: (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <CodeBlock
              code={`import { JKT48Connect } from 'jkt48connect';

// Initialize the client
const client = new JKT48Connect({
  apiKey: 'YOUR_API_KEY'
});

// Get all members
const members = await client.getMembers();

// Get specific member
const member = await client.getMember('shani');

// Get theater schedule
const schedule = await client.getSchedule();

// Works with React!
function MemberList() {
  const [members, setMembers] = useState([]);
  
  useEffect(() => {
    client.getMembers()
      .then(setMembers);
  }, []);
  
  return members.map(m => <div>{m.name}</div>);
}`}
              lang="typescript"
            />
            <div className="max-lg:row-start-1">
              <h3
                className={cn(
                  headingVariants({ variant: 'h3', className: 'my-4' }),
                )}
              >
                Powerful npm package.
              </h3>
              <p>
                Use our npm package for easier integration with full TypeScript support.
              </p>
              <ul className="text-xs list-disc list-inside mt-8">
                <li>TypeScript support with full type definitions</li>
                <li>Works with React, Vue, and other frameworks</li>
                <li>Built-in error handling</li>
                <li>Automatic request caching</li>
                <li>Promise-based API</li>
                <li>Perfect for Discord bots and web apps</li>
              </ul>
            </div>
          </div>
        ),
        comunity: (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <CodeBlock
              code={`// Official fanbase gets priority key
const client = new JKT48Connect({
  apiKey: 'YOUR_API_KEY',
  priorityKey: 'YOUR_PRIORITY_KEY'
});

// Higher rate limits
// Priority queue access
// Early access to new features

// Community features
const events = await client.getCommunityEvents();
const polls = await client.getPolls();
const discussions = await client.getDiscussions();

// Share with the community
await client.createPost({
  title: 'Theater Review',
  content: 'Amazing show tonight!'
});`}
              lang="typescript"
            />

            <div className="max-lg:row-start-1">
              <h3
                className={cn(
                  headingVariants({ variant: 'h3', className: 'my-4' }),
                )}
              >
                Built for the community.
              </h3>
              <p>
                Special access for official fanbases and community features to
                connect all JKT48 fans together.
              </p>
              <ul className="text-xs list-disc list-inside mt-8">
                <li>Priority API access for official fanbases</li>
                <li>Higher rate limits with priority key</li>
                <li>Community events and polls</li>
                <li>Fan discussions and forums</li>
                <li>Share content with other fans</li>
                <li>Early access to new features</li>
              </ul>
            </div>
          </div>
        ),
      }}
    />
  );
}

const feedback = [
  {
    avatar: 'https://avatars.githubusercontent.com/u/124599',
    user: 'Fan Developer',
    role: 'Discord Bot Creator',
    message: `JKT48Connect makes it super easy to build JKT48 Discord bots. 

The npm package is well-documented and the API is reliable.

No more scraping websites!`,
  },
  {
    avatar: 'https://avatars.githubusercontent.com/u/35677084',
    user: 'Web Developer',
    role: 'Fanbase Website',
    message: `We use JKT48Connect for our fanbase website. The API is fast, reliable, and the documentation is excellent. Highly recommended!`,
  },
  {
    user: 'Community Manager',
    avatar: 'https://avatars.githubusercontent.com/u/38025074',
    role: 'Official Fanbase',
    message: 'The priority key feature is amazing for managing our official community!',
  },
  {
    avatar: 'https://avatars.githubusercontent.com/u/10645823',
    user: 'Mobile Developer',
    role: 'JKT48 Fan App',
    message: `Building our JKT48 fan app would be impossible without JKT48Connect. The API has everything we need! 🎉`,
  },
];

function Feedback() {
  return (
    <>
      <div className={cn(cardVariants())}>
        <h3
          className={cn(headingVariants({ variant: 'h3', className: 'mb-6' }))}
        >
          A service fans love.
        </h3>
        <p className="mb-6">
          Trusted by developers and official fanbases to build amazing JKT48
          applications, bots, and websites — growing everyday to serve the community better.
        </p>
        <Link href="/showcase" className={cn(buttonVariants())}>
          Showcase
        </Link>
      </div>
      <div
        className={cn(
          cardVariants({
            variant: 'secondary',
            className: 'relative p-0',
          }),
        )}
      >
        <div className="absolute inset-0 z-2 inset-shadow-[0_10px_60px] inset-shadow-brand-secondary rounded-2xl" />
        <Marquee className="p-8">
          {feedback.map((item) => (
            <div
              key={item.user}
              className="flex flex-col rounded-xl border bg-fd-card text-landing-foreground p-4 shadow-lg w-[320px]"
            >
              <p className="text-sm whitespace-pre-wrap">{item.message}</p>

              <div className="mt-auto flex flex-row items-center gap-2 pt-4">
                <Image
                  src={item.avatar}
                  alt="avatar"
                  width="32"
                  height="32"
                  unoptimized
                  className="size-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-medium">{item.user}</p>
                  <p className="text-xs text-fd-muted-foreground">
                    {item.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </Marquee>
      </div>
    </>
  );
}

function ForDevelopers() {
  return (
    <>
      <h2
        className={cn(
          headingVariants({
            variant: 'h2',
            className: 'text-brand text-center mb-4 col-span-full',
          }),
        )}
      >
        Built For Developers.
      </h2>

      <div
        className={cn(
          cardVariants(),
          'relative flex flex-col overflow-hidden z-2',
        )}
      >
        <h3
          className={cn(
            headingVariants({
              variant: 'h3',
              className: 'mb-6',
            }),
          )}
        >
          Platform Agnostic
        </h3>
        <p className="mb-20">
          Works with any platform, language, or framework — REST API accessible
          from anywhere, npm package for Node.js projects.
        </p>
        <div className="flex flex-row gap-2 mt-auto bg-brand text-brand-foreground rounded-xl p-2 w-fit">
          <svg
            fill="currentColor"
            role="img"
            viewBox="0 0 24 24"
            className="size-6"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Node.js</title>
            <path d="M11.998,24c-0.321,0-0.641-0.084-0.922-0.247l-2.936-1.737c-0.438-0.245-0.224-0.332-0.08-0.383 c0.585-0.203,0.703-0.25,1.328-0.604c0.065-0.037,0.151-0.023,0.218,0.017l2.256,1.339c0.082,0.045,0.197,0.045,0.272,0l8.795-5.076 c0.082-0.047,0.134-0.141,0.134-0.238V6.921c0-0.099-0.053-0.192-0.137-0.242l-8.791-5.072c-0.081-0.047-0.189-0.047-0.271,0 L3.075,6.68C2.99,6.729,2.936,6.825,2.936,6.921v10.15c0,0.097,0.054,0.189,0.139,0.235l2.409,1.392 c1.307,0.654,2.108-0.116,2.108-0.89V7.787c0-0.142,0.114-0.253,0.256-0.253h1.115c0.139,0,0.255,0.112,0.255,0.253v10.021 c0,1.745-0.95,2.745-2.604,2.745c-0.508,0-0.909,0-2.026-0.551L2.28,18.675c-0.57-0.329-0.922-0.945-0.922-1.604V6.921 c0-0.659,0.353-1.275,0.922-1.603l8.795-5.082c0.557-0.315,1.296-0.315,1.848,0l8.794,5.082c0.57,0.329,0.924,0.944,0.924,1.603 v10.15c0,0.659-0.354,1.273-0.924,1.604l-8.794,5.078C12.643,23.916,12.324,24,11.998,24z M19.099,13.993 c0-1.9-1.284-2.406-3.987-2.763c-2.731-0.361-3.009-0.548-3.009-1.187c0-0.528,0.235-1.233,2.258-1.233 c1.807,0,2.473,0.389,2.747,1.607c0.024,0.115,0.129,0.199,0.247,0.199h1.141c0.071,0,0.138-0.031,0.186-0.081 c0.048-0.054,0.074-0.123,0.067-0.196c-0.177-2.098-1.571-3.076-4.388-3.076c-2.508,0-4.004,1.058-4.004,2.833 c0,1.925,1.488,2.457,3.895,2.695c2.88,0.282,3.103,0.703,3.103,1.269c0,0.983-0.789,1.402-2.642,1.402 c-2.327,0-2.839-0.584-3.011-1.742c-0.02-0.124-0.126-0.215-0.253-0.215h-1.137c-0.141,0-0.254,0.112-0.254,0.253 c0,1.482,0.806,3.248,4.655,3.248C17.501,17.007,19.099,15.91,19.099,13.993z"/>
          </svg>
          <svg
            fill="currentColor"
            role="img"
            viewBox="0 0 24 24"
            className="size-6"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>React</title>
            <path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z"/>
          </svg>
          <svg
            fill="currentColor"
            role="img"
            viewBox="0 0 24 24"
            className="size-6"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Python</title>
            <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/>
          </svg>
        </div>

        <AgnosticBackground />
      </div>
      <div
        className={cn(
          cardVariants({
            className: 'flex flex-col',
          }),
        )}
      >
        <h3
          className={cn(headingVariants({ variant: 'h3', className: 'mb-6' }))}
        >
          Dual access methods.
        </h3>
        <p className="mb-8">
          Choose your preferred way: <span className="text-brand">REST API</span> for
          universal access, or <span className="text-brand">npm package</span> for
          seamless Node.js integration — offering the flexibility
          that developers love.
        </p>
        <div className="mt-auto flex flex-col gap-2 @container mask-[linear-gradient(to_bottom,white,transparent)]">
          {[
            {
              name: 'REST API',
              description: 'Universal HTTP API accessible from any platform.',
            },
            {
              name: 'npm Package',
              description:
                'Node.js package with TypeScript support and easy integration.',
            },
            {
              name: 'API Key',
              description: 'Secure authentication for all API requests.',
            },
            {
              name: 'Priority Key',
              description: 'Enhanced access for official fanbases and communities.',
            },
            {
              name: 'Member Data',
              description: 'Access comprehensive JKT48 member information.',
            },
          ].map((item) => (
            <div
              key={item.name}
              className="flex flex-col text-sm gap-2 p-2 border border-dashed border-brand-secondary @lg:flex-row @lg:items-center last:@max-lg:hidden"
            >
              <p className="font-medium text-nowrap">{item.name}</p>
              <p className="text-xs flex-1 @lg:text-end">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div className={cn(cardVariants())}>
        <h3
          className={cn(headingVariants({ variant: 'h3', className: 'mb-6' }))}
        >
          Works with any data source.
        </h3>
        <p className="mb-4">
          JKT48Connect aggregates data from{' '}
          <span className="text-brand">official sources</span>, providing a
          unified API for all your JKT48 needs.
        </p>
        <div className="flex flex-row w-fit items-center gap-4 mb-6">
          {[
            {
              href: 'https://jkt48.com',
              text: 'Official Site',
            },
            {
              href: 'https://twitter.com/jkt48',
              text: 'Social Media',
            },
            {
              href: 'https://www.showroom-live.com/jkt48',
              text: 'SHOWROOM',
            },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              rel="noreferrer noopener"
              target="_blank"
              className="text-sm text-brand hover:underline"
            >
              {item.text}
            </a>
          ))}
        </div>
        <CodeBlock
          wrapper={{
            title: 'Quick Start',
          }}
          code={`
import { JKT48Connect } from 'jkt48connect';

const client = new JKT48Connect({
  apiKey: process.env.JKT48_API_KEY,
});

// Get all members
const members = await client.getMembers();

// Get theater schedule
const schedule = await client.getSchedule();`.trim()}
          lang="typescript"
        />
      </div>
      <div
        className={cn(
          cardVariants({ className: 'relative overflow-hidden min-h-[400px]' }),
        )}
      >
        <ContentAdoptionBackground className="absolute inset-0" />
        <div className="absolute top-8 left-4 w-[70%] flex flex-col bg-neutral-50/80 backdrop-blur-lg border text-neutral-800 p-2 rounded-xl shadow-lg shadow-black dark:bg-neutral-900/80 dark:text-neutral-200">
          <p className="px-2 pb-2 font-medium border-b mb-2 text-neutral-500 dark:text-neutral-400">
            API Endpoints
          </p>
          {['GET /members', 'GET /schedule', 'GET /events', 'GET /news'].map(
            (endpoint) => (
              <div
                key={endpoint}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-400/20"
              >
                <ServerIcon className="stroke-neutral-500 size-4 dark:stroke-neutral-400" />
                <span className="text-sm font-mono">{endpoint}</span>
                <div className="px-3 py-1 font-mono rounded-full bg-brand text-xs text-brand-foreground ms-auto">
                  Ready
                </div>
              </div>
            ),
          )}
        </div>

        <div className="absolute bottom-8 right-4 w-[70%] flex flex-col bg-neutral-100 text-neutral-800 rounded-xl border shadow-lg shadow-black dark:bg-neutral-900 dark:text-neutral-200">
          <div className="px-4 py-2 text-neutral-500 border-b font-medium dark:text-neutral-400">
            Response Example
          </div>
          <pre className="text-base text-neutral-800 overflow-auto p-4 dark:text-neutral-400">
            {`{
  "data": {
    "name": "Shani Indira Natio",
    "generation": "JKT48 Gen 1",
    "status": "active"
  }
}`}
          </pre>
        </div>
      </div>
      <div className={cn(cardVariants(), 'flex flex-col max-md:pb-0')}>
        <h3
          className={cn(headingVariants({ variant: 'h3', className: 'mb-6' }))}
        >
          API Key Management.
        </h3>
        <p className="mb-6">
          Simple API key management system with support for priority access for
          official communities.
        </p>
        <Link
          href="/docs/api/authentication"
          className={cn(buttonVariants({ className: 'w-fit mb-8' }))}
        >
          Learn More
        </Link>
        <ApiKeyDisplay />
      </div>
      <div className={cn(cardVariants(), 'flex flex-col p-0 overflow-hidden')}>
        <div className="p-6 mb-2">
          <h3
            className={cn(
              headingVariants({ variant: 'h3', className: 'mb-6' }),
            )}
          >
            Built for the JKT48 community
          </h3>
          <p className="mb-6">
            Created by fans, for fans. JKT48Connect provides the tools you need
            to build amazing JKT48 applications.
          </p>
          <Link
            href="/docs"
            className={cn(buttonVariants({ className: 'w-fit' }))}
          >
            Documentation
          </Link>
        </div>
        <Image
          src={ShadcnImage}
          alt="JKT48"
          className="mt-auto flex-1 w-full object-cover"
        />
      </div>
    </>
  );
}
