import React, { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';

interface ForumPost {
  mal_id: number;
  url: string;
  title: string;
  date: string;
  author_username: string;
  author_url: string;
  comments: number;
}

interface ForumPostsProps {
  posts: ForumPost[];
  isLoading: boolean;
  error: string | null;
}

type SortField = 'date' | 'comments';
type SortOrder = 'asc' | 'desc';

const ForumPosts: React.FC<ForumPostsProps> = ({ posts, isLoading, error }) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minutes ago`;
      }
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortField === 'date') {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      return sortOrder === 'asc' ? a.comments - b.comments : b.comments - a.comments;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin h-8 w-8 border-4 border-[#4ef1d6] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-4">{error}</div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center text-white py-4">
        No forum discussions found for this anime.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-white">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="py-3 px-4 text-left">Discussion Title</th>
            <th className="py-3 px-4 text-left">Author</th>
            <th className="py-3 px-4 text-left cursor-pointer" onClick={() => handleSort('comments')}>
              <div className="flex items-center gap-1">
                Responses
                <ArrowUpDown className={`w-4 h-4 ${sortField === 'comments' ? 'text-[#4ef1d6]' : ''}`} />
              </div>
            </th>
            <th className="py-3 px-4 text-left cursor-pointer" onClick={() => handleSort('date')}>
              <div className="flex items-center gap-1">
                Date
                <ArrowUpDown className={`w-4 h-4 ${sortField === 'date' ? 'text-[#4ef1d6]' : ''}`} />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedPosts.map((post) => (
            <tr key={`${post.mal_id}-${post.title}`} className="border-b border-gray-700 hover:bg-gray-800/50">
              <td className="py-3 px-4">
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#4ef1d6] transition-colors"
                >
                  {post.title}
                </a>
              </td>
              <td className="py-3 px-4">
                <a
                  href={post.author_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#4ef1d6] transition-colors"
                >
                  {post.author_username}
                </a>
              </td>
              <td className="py-3 px-4">{post.comments}</td>
              <td className="py-3 px-4">{formatDate(post.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ForumPosts;
