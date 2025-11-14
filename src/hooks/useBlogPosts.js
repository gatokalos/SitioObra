import { useCallback, useEffect, useState } from 'react';
import { fetchPublishedBlogPosts } from '@/services/blogService';

export const useBlogPosts = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPublishedBlogPosts();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[useBlogPosts] Error al cargar posts:', err);
      setError(err);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPosts();
  }, [refreshPosts]);

  return { posts, isLoading, error, refreshPosts };
};
