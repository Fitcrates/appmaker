import React, { useEffect, useState } from 'react';
import { fetchFromAPI } from '../api';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Users, ExternalLink } from 'lucide-react';

interface ForumPost {
  mal_id: number;
  url: string;
  title: string;
  date: string;
  author_username: string;
  author_url: string;
  comments: number;
}

interface AnimeForumProps {
  animeId: number;
  className?: string;
}

interface ForumResponse {
  data: ForumPost[];
}

const AnimeForum: React.FC<AnimeForumProps> = ({ animeId, className = '' }) => {
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForumPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchFromAPI<ForumResponse>(`/anime/${animeId}/forum`);
        if (response?.data) {
          setForumPosts(response.data);
        }
      } catch (err) {
        setError('Failed to load forum posts');
        console.error('Error fetching forum posts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForumPosts();
  }, [animeId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-4">
        {error}
      </div>
    );
  }

  if (forumPosts.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No forum discussions found for this anime.
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-xl font-bold mb-4">Forum Discussions</h2>
      <div className="space-y-4">
        {forumPosts.map((post) => (
          <div
            key={post.mal_id}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200"
          >
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-lg font-medium text-blue-600 hover:text-blue-800 flex-1">
                  {post.title}
                  <ExternalLink className="inline-block ml-2 w-4 h-4" />
                </h3>
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  {formatDistanceToNow(new Date(post.date), { addSuffix: true })}
                </span>
              </div>
              
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <a
                    href={post.author_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {post.author_username}
                  </a>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments} comments</span>
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnimeForum;
