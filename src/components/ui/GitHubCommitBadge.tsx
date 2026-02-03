import { useState, useEffect } from 'react';

interface GitHubCommitBadgeProps {
  owner?: string;
  repo?: string;
  className?: string;
}

export default function GitHubCommitBadge({ 
  owner = 'qiyufeng1127', 
  repo = 'my-jarvis',
  className = ''
}: GitHubCommitBadgeProps) {
  const [commitCount, setCommitCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommitCount();
  }, [owner, repo]);

  const fetchCommitCount = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (response.ok) {
        // 从 Link header 获取总提交数
        const linkHeader = response.headers.get('Link');
        if (linkHeader) {
          const match = linkHeader.match(/page=(\d+)>; rel="last"/);
          if (match) {
            setCommitCount(parseInt(match[1]));
          }
        } else {
          // 如果没有 Link header，说明提交数少于100，直接获取
          const commits = await response.json();
          setCommitCount(commits.length);
        }
      } else {
        console.error('Failed to fetch commit count');
      }
    } catch (error) {
      console.error('Error fetching commit count:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 ${className}`}>
        <span className="text-sm">🔄</span>
        <span className="text-xs font-semibold text-purple-600">加载中...</span>
      </div>
    );
  }

  if (commitCount === null) {
    return null;
  }

  return (
    <a
      href={`https://github.com/${owner}/${repo}/commits/main`}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 hover:from-purple-100 hover:to-pink-100 transition-all cursor-pointer ${className}`}
      title={`查看所有 ${commitCount} 次提交`}
    >
      <span className="text-sm">🚀</span>
      <span className="text-xs font-bold text-purple-600">{commitCount}</span>
    </a>
  );
}

