import { formatTimecode, readingTime } from '~/utils/timecode';

export async function getPosts() {
  try {
    const modules = import.meta.glob('../articles.*.mdx', { eager: true });
    
    // If no articles found, return empty array
    if (Object.keys(modules).length === 0) {
      console.warn('No articles found matching the pattern ../articles.*.mdx');
      return [];
    }
    
    const build = await import('virtual:remix/server-build');

    const posts = await Promise.all(
      Object.entries(modules).map(async ([file, post]) => {
        try {
          let id = file.replace('../', 'routes/').replace(/\.mdx$/, '');
          let slug = build.routes[id]?.path;
          if (slug === undefined) {
            console.warn(`No route for ${id}`);
            return null;
          }

          let readTime;
          try {
            const text = await import(`../articles.${slug}.mdx?raw`);
            readTime = readingTime(text.default);
          } catch (error) {
            console.warn(`Error loading raw content for ${slug}:`, error);
            readTime = 0;
          }
          
          const timecode = formatTimecode(readTime);

          return {
            slug,
            timecode,
            frontmatter: post.frontmatter,
          };
        } catch (error) {
          console.warn(`Error processing article ${file}:`, error);
          return null;
        }
      })
    );

    // Filter out any null entries from errors
    const validPosts = posts.filter(Boolean);
    return sortBy(validPosts, post => post.frontmatter.date, 'desc');
  } catch (error) {
    console.error("Error getting posts:", error);
    return [];
  }
}

function sortBy(arr, key, dir = 'asc') {
  return arr.sort((a, b) => {
    const res = compare(key(a), key(b));
    return dir === 'asc' ? res : -res;
  });
}

function compare(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
