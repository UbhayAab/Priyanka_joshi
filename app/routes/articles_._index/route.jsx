import { baseMeta } from '~/utils/meta';
import { getPosts } from './posts.server';
import { json } from '@remix-run/cloudflare';

export async function loader() {
  try {
    const allPosts = await getPosts();
    
    // Handle case with no posts
    if (!allPosts || allPosts.length === 0) {
      return json({ posts: [], featured: null });
    }
    
    const featured = allPosts.filter(post => post.frontmatter.featured)[0] || null;
    const posts = allPosts.filter(post => featured?.slug !== post.slug);

    return json({ posts, featured });
  } catch (error) {
    console.error("Error loading posts:", error);
    return json({ posts: [], featured: null });
  }
}

export function meta() {
  return baseMeta({
    title: 'Articles',
    description:
      'A collection of technical design and development articles. May contain incoherent ramblings.',
  });
}

export { Articles as default } from './articles';
