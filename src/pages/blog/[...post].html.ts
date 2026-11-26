import type { APIRoute } from 'astro';
import { decodeHTML, escapeUTF8 } from 'entities';
import { ELEMENT_NODE, TEXT_NODE, parse, walkSync, type Node } from 'ultrahtml';
import { querySelector } from 'ultrahtml/selector';

export function getStaticPaths() {
  const exports = import.meta.glob<string>('../../../third_party/blog/html/blog/**/*.html', {
    query: '?raw', import: 'default', eager: true,
  });
  return Object.entries(exports).map(([path, html]) => ({
    params: { post: path.split('/html/blog/')[1].slice(0, -'.html'.length) },
    props: { html },
  }));
}

function plainText(element: Node) {
  let text = '';
  walkSync(element, (node) => {
    if (node.type === TEXT_NODE) text += node.value;
  });
  return decodeHTML(text).replace(/\s+/g, ' ').trim();
}

export const GET: APIRoute = ({ props, params, site, url }) => {
  let html: string = props.html;
  const document = parse(html);
  const head = querySelector(document, 'head');
  if (head?.type !== ELEMENT_NODE) throw new Error(`Missing head in ${url.pathname}`);
  const heading = querySelector(document, 'h1[data-heading]');
  const fallbackTitle = String(params.post).split('/').at(-1)!.replace(/_/g, ' ');
  const title = escapeUTF8(heading ? plainText(heading) : fallbackTitle);
  const summary = querySelector(document, '[data-callout="summary"]');
  const paragraph = summary && querySelector(summary, 'p');
  const sentences = new Intl.Segmenter('en', { granularity: 'sentence' });
  const firstSentence = paragraph && sentences.segment(plainText(paragraph)).containing(0);
  const description = firstSentence ? escapeUTF8(firstSentence.segment.trim()) : '';

  // Remove the exporter's preview tags by source range to preserve its scripts and article markup.
  for (const node of head.children.toReversed()) {
    if (node.type !== ELEMENT_NODE) continue;
    const { name, property, rel } = node.attributes;
    const key = property || name || '';
    const previewMeta = key === 'description' || key.startsWith('og:') || key.startsWith('twitter:');
    if (node.name === 'title' ||
        (node.name === 'meta' && (previewMeta || 'charset' in node.attributes)) ||
        (node.name === 'link' && rel === 'icon')) {
      html = html.slice(0, node.loc[0].start) + html.slice(node.loc[1].end);
    }
  }
  const metadata = `
<meta charset="UTF-8">
<title>${title}</title>
<meta property="og:title" content="${title}">
<meta property="og:site_name" content="Kaiyuan Wang">
<meta property="og:type" content="article">
<meta property="og:url" content="${escapeUTF8(new URL(url.pathname, site).href)}">
<meta name="twitter:card" content="summary">
<meta name="robots" content="max-image-preview:none">
${description && `<meta name="description" content="${description}">
<meta property="og:description" content="${description}">`}`;
  const insertAt = head.loc[0].end;
  return new Response(html.slice(0, insertAt) + metadata + html.slice(insertAt), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
