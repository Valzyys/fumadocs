import { type Page } from '@/lib/source';

export async function getLLMText(page: Page) {
  if (page.data.type === 'openapi') return '';

  const category =
    {
      ui: 'JKT48Connect Framework',
      headless: 'JKT48Connect Core (core library of framework)',
      mdx: 'JKT48Connect MDX (the built-in content source)',
      cli: 'JKT48Connect CLI (the CLI tool for automating JKT48Connect apps)',
    }[page.slugs[0]] ?? page.slugs[0];

  const processed = await page.data.getText('processed');

  return `# ${category}: ${page.data.title}
URL: ${page.url}

${page.data.description ?? ''}
        
${processed}`;
}
