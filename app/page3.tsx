/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { ImSpinner2 } from 'react-icons/im';

type Question = {
  id: number;
  question: string;
  options: string[];
  type: 'mcq' | 'multi-select';
  timeline: number; // Time in seconds when the question appears
  closeable: boolean;
};

type VideoData = {
  _id: string;
  chapterId: string;
  createdAt: string;
  duration: number;
  videoDescription: string;
  videoThumbnail: string;
  videoTitle: string;
  videoUrl: string;
  questions: Question[]; // Should match the structure you want,
  isSubmitSingleEveryTime: boolean;
};

const dummyVideoData: VideoData = {
  _id: '66f191e53dd22067291911eb',
  chapterId: '66f190123dd22067291911e7',
  createdAt: '2024-09-23T16:05:57.324Z',
  duration: 0,
  videoDescription: '<p>This is a sample description for the video.</p>',
  videoThumbnail:
    'https://imageuploads.blr1.digitaloceanspaces.com/DLVBC_instructor/education-66f191cf3dd22067291911e9-WhatsApp Image 2024-09-02 at 11.27.43.jpeg',
  videoTitle: 'Sample Educational Video',
  videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  isSubmitSingleEveryTime: true,
  questions: [
    {
      id: 1,
      question: 'What is the color of the sky?',
      options: ['Blue', 'Green', 'Red'],
      type: 'mcq',
      timeline: 5, // Appears at 5 seconds
      closeable: false,
    },
    {
      id: 2,
      question: 'Which animals are mammals?',
      options: ['Dog', 'Fish', 'Cat'],
      type: 'multi-select',
      timeline: 10, // Appears at 10 seconds
      closeable: true,
    },
  ],
};

const VideoWithQuestions = () => {
  const params = useParams();
  const { videoId } = params;

  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [collectedAnswers, setCollectedAnswers] = useState<any[]>([]); // To store answers when not submitting each time
  const [isVideoEnded, setIsVideoEnded] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchVideoData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Simulating an API call with dummy data
        setVideoData(dummyVideoData);
      } catch (err) {
        setError('Error fetching video and questions.');
      } finally {
        setLoading(false);
      }
    };
    fetchVideoData();
  }, [videoId]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const current = Math.floor(e.currentTarget.currentTime);
    setCurrentTime(current);

    if (videoData && !isVideoEnded) {
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
      if (!isVideoEnded) {
        videoRef.current?.play();
      }
    }
  };

  const handleVideoEnd = async () => {
    setIsVideoEnded(true);

    if (videoData?.isSubmitSingleEveryTime === false && collectedAnswers.length > 0) {
      try {
        // Submit all collected answers
        console.log('Submitting all collected answers: ', collectedAnswers);
        // Simulate API call
      } catch (err) {
        setError('Error submitting collected answers.');
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

  const handleSubmit = async () => {
    if (currentQuestion) {
      const payload = {
        videoId,
        questionId: currentQuestion.id,
        answers: selectedAnswers,
      };

      setSubmitLoading(true);
      try {
        if (videoData?.isSubmitSingleEveryTime) {
          console.log('Submitting answers: ', payload);
          // Simulate a submit API call
        } else {
          setCollectedAnswers((prev) => [...prev, payload]);
        }

        setIsModalOpen(false);
        setAnsweredQuestions((prev) => new Set(prev.add(currentQuestion!.id)));
        setSelectedAnswers([]);
        setCurrentQuestion(null);
        if (!isVideoEnded) {
          videoRef.current?.play();
        }
      } catch (err) {
        setError('Error submitting the answer.');
      } finally {
        setSubmitLoading(false);
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-6">
      {loading && (
        <div className="flex justify-center items-center h-64">
          <ImSpinner2 className="animate-spin text-4xl text-gray-500" />
        </div>
      )}

      {error && (
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      )}

      {!loading && videoData && (
        <>
          <h1 className="text-3xl font-bold text-center md:text-left">{videoData.videoTitle}</h1>

          <div className="relative w-full h-auto rounded-lg overflow-hidden shadow-md">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              src={videoData.videoUrl}
              controls
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnd}
            />
          </div>

          <div className="text-gray-700 text-lg text-center md:text-left mt-4">
            <div dangerouslySetInnerHTML={{ __html: videoData.videoDescription }} />
          </div>
        </>
      )}

      {isModalOpen && currentQuestion && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative">
            {currentQuestion.closeable && (
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                onClick={closeModal}
                disabled={submitLoading}
              >
                <FiX className="w-6 h-6" />
              </button>
            )}

            <h3 className="text-2xl font-semibold mb-4">{currentQuestion.question}</h3>

            <div className="space-y-2">
              {currentQuestion.type === 'mcq' &&
                currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    className={`block w-full bg-gray-100 p-3 rounded-lg text-left transition hover:bg-gray-200 ${
                      selectedAnswers.includes(option) ? 'bg-blue-200' : ''
                    }`}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={submitLoading}
                  >
                    {option}
                  </button>
                ))}

              {currentQuestion.type === 'multi-select' &&
                currentQuestion.options.map((option, idx) => (
                  <label key={idx} className="block bg-gray-100 p-3 rounded-lg flex items-center">
                    <input
                      type="checkbox"
                      className="mr-3"
                      checked={selectedAnswers.includes(option)}
                      onChange={() => handleAnswerSelect(option)}
                      disabled={submitLoading}
                    />
                    {option}
                  </label>
                ))}
            </div>

            <button
              className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg transition hover:bg-blue-700 flex items-center justify-center"
              onClick={handleSubmit}
              disabled={submitLoading}
            >
              {submitLoading ? <ImSpinner2 className="animate-spin mr-2" /> : 'Submit'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VideoWithQuestions;
