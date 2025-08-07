
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
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-white mb-2">Creator</h3>
        <Link href={`/creators/${creatorUsername}`} className="flex items-center group">
          <User className="w-4 h-4 text-gray-400 mr-2 group-hover:text-orange-500" />
          <span className="text-white font-semibold group-hover:text-orange-500">{creatorName}</span>
        </Link>
      </div>
      {category && (
        <div>
          <h3 className="text-sm font-medium text-white mb-2">Category</h3>
          <div className="flex items-center">
            <Tag className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-white">{category}</span>
          </div>
        </div>
      )}
      {tags && tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="bg-gray-800 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
