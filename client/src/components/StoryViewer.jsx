import { BadgeCheck, X, Trash2Icon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import API from '../api/api';
import toast from 'react-hot-toast';

const StoryViewer = ({ stories, setViewStories, fetchStories }) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { user } = useAuth();
  const currentStory = stories[currentStoryIndex];
  const isOwnStory = currentStory && currentStory.user?._id === user?._id;

  const handleStoryDelete = async () => {
    try {
      await API.delete(`/story/${currentStory._id}`, { withCredentials: true });
      toast.success('Story deleted successfully');
      const updatedStories = stories.filter((_, index) => index !== currentStoryIndex);
      if (updatedStories.length === 0) {
        setViewStories(null);
      } else {
        setCurrentStoryIndex(currentStoryIndex >= updatedStories.length ? updatedStories.length - 1 : currentStoryIndex);
        setViewStories(updatedStories);
      }
      fetchStories();
    } catch (error) {
      toast.error('Failed to delete story');
      console.error('Error deleting story:', error);
    }
  };

  useEffect(() => {
    let timer, progressInterval;

    if (currentStory && currentStory.media_type !== 'video' && !isPaused) {
      setProgress(0);
      const duration = 10000; // 10 seconds per story
      const setTime = 100;
      let elapsed = 0;

      progressInterval = setInterval(() => {
        elapsed += setTime;
        setProgress((elapsed / duration) * 100);
      }, setTime);

      timer = setTimeout(() => {
        handleNext();
      }, duration);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [currentStory, isPaused]);

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    } else {
      setViewStories(null);
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    }
  };

  const handleClose = () => {
    setViewStories(null);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  if (!currentStory) return null;

  const renderContent = () => {
    switch (currentStory.media_type) {
      case 'image':
        return <img src={currentStory.media_url} alt="" className="max-w-full max-h-screen object-contain" />;
      case 'video':
        return (
          <video
            onEnded={handleNext}
            src={currentStory.media_url}
            className="max-h-screen"
            controls
            autoPlay={!isPaused}
          />
        );
      case 'text':
        return (
          <div className="w-full h-full flex items-center justify-center p-8 text-white text-2xl text-center">
            {currentStory.content}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 h-screen bg-black bg-opacity-90 z-110 flex items-center justify-center"
      style={{ backgroundColor: currentStory.media_type === 'text' ? currentStory.background_color : '#000000' }}
      onClick={togglePause}
    >
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 w-full flex gap-1 p-2">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100 linear"
              style={{ width: index === currentStoryIndex ? `${progress}%` : index < currentStoryIndex ? '100%' : '0%' }}
            ></div>
          </div>
        ))}
      </div>
      {/* User Info */}
      <div className="absolute top-4 left-4 flex items-center space-x-3 p-2 px-4 sm:p-4 sm:px-8 backdrop-blur-2xl rounded bg-black/50">
        <img
          src={currentStory.user?.profilePics}
          alt=""
          className="size-7 sm:size-8 rounded-full object-cover border border-white"
        />
        <div className="text-white font-medium flex items-center gap-1.5">
          <span>{currentStory.user?.fullname}</span>
          <BadgeCheck size={18} />
        </div>
        {isOwnStory && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStoryDelete();
            }}
            className="ml-4 p-2 bg-red-600 cursor-pointer rounded-full hover:bg-red-700 transition"
          >
            <Trash2Icon className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        className="absolute top-4 right-4 text-white text-3xl font-bold focus:outline-none"
      >
        <X className="w-8 h-8 hover:scale-110 transition cursor-pointer" />
      </button>
      {/* Navigation Buttons */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePrevious();
        }}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white opacity-50 hover:opacity-100 transition"
        disabled={currentStoryIndex === 0}
      >
        <ChevronLeft className="w-10 h-10" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white opacity-50 hover:opacity-100 transition"
        disabled={currentStoryIndex === stories.length - 1}
      >
        <ChevronRight className="w-10 h-10" />
      </button>
      {/* Content Wrapper */}
      <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">{renderContent()}</div>
    </div>
  );
};

export default StoryViewer;