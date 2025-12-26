
'use client';

import { User, Tag } from 'lucide-react';
import Link from 'next/link';

interface ProductMetaProps {
  creatorName: string;
  creatorUsername: string;
  category: string;
  tags: string[];
}

export function ProductMeta({ creatorName, creatorUsername, category, tags }: ProductMetaProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <div className="text-xs font-medium text-gray-400 mb-1.5">Creator</div>
        <Link href={`/creators/${creatorUsername}`} className="flex items-center group">
          <User className="w-3.5 h-3.5 text-gray-500 mr-2 group-hover:text-orange-400 transition-colors" />
          <span className="text-sm text-gray-200 font-medium group-hover:text-orange-400 transition-colors">{creatorName}</span>
        </Link>
      </div>
      {category && (
        <div>
          <div className="text-xs font-medium text-gray-400 mb-1.5">Category</div>
          <div className="flex items-center">
            <Tag className="w-3.5 h-3.5 text-gray-500 mr-2" />
            <span className="text-sm text-gray-200 font-medium">{category}</span>
          </div>
        </div>
      )}
      {tags && tags.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-400 mb-2">Tags</div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="bg-white/10 border border-white/10 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-lg">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
