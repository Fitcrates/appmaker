import axios from 'axios';

interface EpisodeMetadata {
  premium: boolean;
  description?: string;
  title?: string;
  error?: string;
}

export async function getEpisodeMetadata(episodeId: string): Promise<EpisodeMetadata> {
  try {
    // Create a server-side request to Crunchyroll
    const response = await axios.get(`https://www.crunchyroll.com/watch/${episodeId}`, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; AnimeSearch/1.0)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const html = response.data;

    // Check for premium indicators in the response
    const isPremium = 
      html.includes('premium-only') || 
      html.includes('membership-required') ||
      html.includes('premium_only') ||
      html.includes('premium-content');

    // Extract metadata from the page
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);

    return {
      premium: isPremium,
      title: titleMatch ? titleMatch[1] : undefined,
      description: descMatch ? descMatch[1] : undefined
    };

  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return { premium: true, error: 'Episode not found' };
      }
      if (error.response?.status === 403) {
        return { premium: true, error: 'Premium content' };
      }
    }
    return { premium: true, error: 'Failed to fetch episode data' };
  }
}
