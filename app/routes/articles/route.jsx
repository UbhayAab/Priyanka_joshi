import { json } from '@remix-run/cloudflare';
import { Outlet, useLoaderData } from '@remix-run/react';
import { MDXProvider } from '@mdx-js/react';
import { Post, postMarkdown } from '~/layouts/post';
import { baseMeta } from '~/utils/meta';
import config from '~/config.json';
import { formatTimecode, readingTime } from '~/utils/timecode';

export async function loader({ request }) {
  try {
    const slug = request.url.split('/').at(-1);
    
    let module, text, readTime;
    
    try {
      module = await import(`../articles.${slug}.mdx`);
    } catch (error) {
      console.error(`Error loading article module for slug '${slug}':`, error);
      throw new Response("Article not found", { status: 404 });
    }
    
    try {
      text = await import(`../articles.${slug}.mdx?raw`);
      readTime = readingTime(text.default);
    } catch (error) {
      console.warn(`Error loading raw content for '${slug}':`, error);
      readTime = 0;
    }
    
    const ogImage = `${config.url}/static/${slug}-og.jpg`;

    return json({
      ogImage,
      frontmatter: module.frontmatter,
      timecode: formatTimecode(readTime),
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error in article loader:", error);
    throw new Response("Server Error", { status: 500 });
  }
}

export function meta({ data }) {
  if (!data) {
    return baseMeta({ 
      title: "Article Not Found", 
      description: "The article you're looking for doesn't exist."
    });
  }
  
  const { title, abstract } = data.frontmatter;
  return baseMeta({ title, description: abstract, prefix: '', ogImage: data.ogImage });
}

export default function Articles() {
  const { frontmatter, timecode } = useLoaderData();

  return (
    <MDXProvider components={postMarkdown}>
      <Post {...frontmatter} timecode={timecode}>
        <Outlet />
      </Post>
    </MDXProvider>
  );
}
