'use client'
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';

type Question = {
  id: number;
  question: string;
  options: string[];
  type: 'mcq' | 'multi-select';
  timeline: number; // Time in seconds when the question appears
  closeable: boolean;
};

type VideoData = {
  videoUrl: string;
  questions: Question[];
};

const VideoWithQuestions = () => {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Fake JSON data
    const fakeVideoData: VideoData = {
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', // Example video URL
      questions: [
        {
          id: 1,
          question: 'What is the color of the sky?',
          options: ['Blue', 'Green', 'Red', 'Yellow'],
          type: 'mcq',
          timeline: 5, // Show at 5 seconds
          closeable: true,
        },
        {
          id: 2,
          question: 'Select the fruits from the list:',
          options: ['Apple', 'Carrot', 'Banana', 'Potato'],
          type: 'multi-select',
          timeline: 10, // Show at 10 seconds
          closeable: false,
        },
        {
          id: 3,
          question: 'What is the capital of France?',
          options: ['Paris', 'London', 'Berlin', 'Madrid'],
          type: 'mcq',
          timeline: 120, // Out of range, will show at the end
          closeable: true,
        },
      ],
    };

    // Set the fake data
    setVideoData(fakeVideoData);
  }, []);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const current = Math.floor(e.currentTarget.currentTime);
    setCurrentTime(current);

    if (videoData) {
      const question = videoData.questions.find(
        (q) => q.timeline === current && !answeredQuestions.has(q.id)
      );
      if (question) {
        setCurrentQuestion(question);
        setIsModalOpen(true);
        videoRef.current?.pause();
      }
    }
  };

  const closeModal = () => {
    if (currentQuestion?.closeable) {
      setIsModalOpen(false);
      setCurrentQuestion(null);
      setAnsweredQuestions((prev) => new Set(prev.add(currentQuestion!.id)));
      videoRef.current?.play();
    }
  };

  const handleVideoEnd = () => {
    if (videoData) {
      const outOfRangeQuestion = videoData.questions.find(
        (q) => q.timeline > currentTime && !answeredQuestions.has(q.id)
      );

      if (outOfRangeQuestion) {
        setCurrentQuestion(outOfRangeQuestion);
        setIsModalOpen(true);
        videoRef.current?.pause();
      }
    }
  };

  const handleAnswerSelect = (option: string) => {
    if (currentQuestion?.type === 'mcq') {
      setSelectedAnswers([option]); // Single select for MCQ
    } else if (currentQuestion?.type === 'multi-select') {
      setSelectedAnswers((prev) =>
        prev.includes(option)
          ? prev.filter((answer) => answer !== option)
          : [...prev, option]
      );
    }
  };

  const handleSubmit = () => {
    setIsModalOpen(false);
    setAnsweredQuestions((prev) => new Set(prev.add(currentQuestion!.id)));
    setSelectedAnswers([]);
    setCurrentQuestion(null);
    videoRef.current?.play();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="relative">
        {videoData && (
          <video
            ref={videoRef}
            className="w-full h-auto rounded-lg"
            src={videoData.videoUrl}
            controls
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnd}
          />
        )}

        {isModalOpen && currentQuestion && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
              {currentQuestion.closeable && (
                <button
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                  onClick={closeModal}
                >
                  <FiX className="w-6 h-6" />
                </button>
              )}

              <h3 className="text-xl font-bold mb-4">{currentQuestion.question}</h3>
              <div className="space-y-2">
                {currentQuestion.type === 'mcq' &&
                  currentQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      className={`block w-full bg-gray-100 p-2 rounded-lg text-left hover:bg-gray-200 ${
                        selectedAnswers.includes(option) ? 'bg-blue-200' : ''
                      }`}
                      onClick={() => handleAnswerSelect(option)}
                    >
                      {option}
                    </button>
                  ))}

                {currentQuestion.type === 'multi-select' &&
                  currentQuestion.options.map((option, idx) => (
                    <label key={idx} className="block bg-gray-100 p-2 rounded-lg">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={selectedAnswers.includes(option)}
                        onChange={() => handleAnswerSelect(option)}
                      />
                      {option}
                    </label>
                  ))}
              </div>

              <button
                className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                onClick={handleSubmit}
              >
                Submit
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VideoWithQuestions;
