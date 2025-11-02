import { useEffect, useState } from 'react';
import { getAllStory } from '../api/api';
import { Plus } from 'lucide-react';
import moment from 'moment';
import StoryModal from './StoryModal';
import StoryViewer from './StoryViewer';

const StoriesBar = () => {
  const [storiesByUser, setStoriesByUser] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [viewStories, setViewStories] = useState(null); // Now holds an array of stories for a user

  const fetchStories = async () => {
    const data = await getAllStory();
    // Group stories by user
    const grouped = data.stories.reduce((acc, story) => {
      const userId = story.user._id;
      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: [],
        };
      }
      acc[userId].stories.push(story);
      return acc;
    }, {});
    setStoriesByUser(grouped);
  };

  useEffect(() => {
    fetchStories();
  }, []);

  return (
    <div className="w-screen sm:w-[calc(100vw-240px)] lg:max-w-2xl no-scrollbar overflow-x-auto px-4">
      <div className="flex gap-4 pb-5">
        {/* Add a story card */}
        <div
          onClick={() => setShowModal(true)}
          className="rounded-lg shadow-sm min-w-30 max-w-30 max-h-40 aspect-[3/4] cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-dashed border-indigo-300 bg-gradient-to-b from-indigo-50 to-white"
        >
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="size-10 bg-indigo-500 rounded-full flex items-center justify-center mb-3">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-slate-700 text-center">Create Story</p>
          </div>
        </div>
        {/* User Story Cards */}
        {Object.values(storiesByUser).map((userData) => (
          <div
            onClick={() => setViewStories(userData.stories)}
            key={userData.user._id}
            className="relative rounded-lg shadow min-w-30 max-w-30 max-h-40 cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-b from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95"
          >
            <img
              src={userData.user.profilePics || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200'}
              alt=""
              className="absolute size-8 top-3 left-3 z-10 rounded-full ring ring-gray-100 shadow"
            />
            <p className="absolute top-18 left-3 text-white/60 text-sm truncate max-w-24">
              {userData.stories[0].content}
            </p>
            <p className="text-white absolute bottom-1 right-2 z-10 text-xs">
              {moment(userData.stories[0].createdAt).fromNow()}
            </p>
            {userData.stories[0].media_type !== 'text' && (
              <div className="absolute inset-0 z-1 rounded-lg bg-black overflow-hidden">
                {userData.stories[0].media_type === 'image' ? (
                  <img
                    src={userData.stories[0].media_url}
                    alt=""
                    className="h-full w-full object-cover hover:scale-110 transition duration-500 opacity-70 hover:opacity-80"
                  />
                ) : (
                  <video
                    src={userData.stories[0].media_url}
                    className="h-full w-full object-cover hover:scale-110 transition duration-500 opacity-70 hover:opacity-80"
                  />
                )}
              </div>
            )}
            {/* Indicate multiple stories */}
            {userData.stories.length > 1 && (
              <div className="absolute top-1 left-1 z-20 bg-indigo-600 text-white text-xs rounded-full px-2 py-1">
                {userData.stories.length}
              </div>
            )}
          </div>
        ))}
      </div>
      {showModal && <StoryModal setShowModal={setShowModal} fetchStories={fetchStories} />}
      {viewStories && <StoryViewer stories={viewStories} setViewStories={setViewStories} fetchStories={fetchStories} />}
    </div>
  );
};

export default StoriesBar;