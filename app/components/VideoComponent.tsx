import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaTimesCircle } from 'react-icons/fa'; // For close icon

// interface VideoResource {
//   image: string;
//   text: string;
// }

interface Meta {
  timeToCompleteQuestion: string;
  timeToShowQuestion: number;
  videoDuration: number;
}

interface Question {
  _id: string;
  answer: string;
  question: {
    image: string;
    text: string;
  };
  options?: { image: string; text: string }[];
  meta: Meta;
  questionLevel: string;
  questionType: string;
}

interface VideoData {
  videoUrl: string;
  videoTitle: string;
  questions: Question[];
}

interface VideoComponentProps {
  videoData: VideoData;
}

const VideoComponent: React.FC<VideoComponentProps> = ({ videoData }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);

  // Track video time
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Handle question popup display
  useEffect(() => {
    const questionToShow = videoData.questions.find(
      (question) => question.meta.timeToShowQuestion <= currentTime && question.meta.timeToShowQuestion + 5 >= currentTime // show within 5 seconds of timeToShowQuestion
    );

    if (questionToShow) {
      setActiveQuestion(questionToShow);
    } else {
      setActiveQuestion(null); // No question to show
    }
  }, [currentTime, videoData.questions]);

  // Close the question popup
  const closePopup = () => {
    setActiveQuestion(null);
  };

  return (
    <div className="relative">
      <video
        ref={videoRef}
        src={videoData.videoUrl}
        controls
        onTimeUpdate={handleTimeUpdate}
        className="w-full h-auto rounded-lg shadow-lg"
        // poster={videoData.videoThumbnail}
      >
        Your browser does not support the video tag.
      </video>
      
      {/* Question Popup */}
      {activeQuestion && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
          className="absolute top-0 left-0 right-0 bg-white p-6 rounded-lg shadow-lg z-50 m-4 max-w-md mx-auto"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Question</h2>
            <FaTimesCircle onClick={closePopup} className="text-red-500 cursor-pointer text-2xl" />
          </div>
          
          <div className="question-content mb-4">
            <div dangerouslySetInnerHTML={{ __html: activeQuestion.question.text }} />
          </div>

          {activeQuestion.options && (
            <div className="options">
              {activeQuestion.options.map((option, index) => (
                <div key={index} className="p-2 bg-gray-100 rounded-lg mb-2">
                  <div dangerouslySetInnerHTML={{ __html: option.text }} />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default VideoComponent;
