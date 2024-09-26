// VideoResources.tsx

import React from 'react';

type VideoResourcesProps = {
  resources: string[];
};

const VideoResources: React.FC<VideoResourcesProps> = ({ resources }) => {
  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold">Resources:</h2>
      <ul className="list-disc ml-5">
        {resources.map((resource, index) => (
          <li key={index}>
            <a
              href={resource}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              {resource}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VideoResources;
