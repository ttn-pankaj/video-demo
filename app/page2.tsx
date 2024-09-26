'use client'

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
  videoUrl: string;
  questions: Question[];
};

const VideoWithQuestions = () => {
  const params = useParams();
  const { videoId } = params; // Get the videoId from the route params

  // State management
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch video data and questions from API
  useEffect(() => {
    if (videoId) {
      const fetchVideoData = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/videos/${videoId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch video data');
          }
          const data = await response.json();
          setVideoData(data);
        } catch (err) {
          console.log(err)
          setError('Error fetching video and questions.');
        } finally {
          setLoading(false);
        }
      };
      fetchVideoData();
    }
  }, [videoId]);

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

  // Submit question answers to API
  const handleSubmit = async () => {
    if (currentQuestion) {
      const payload = {
        videoId,
        questionId: currentQuestion.id,
        answers: selectedAnswers,
      };

      // Set submit loading state
      setSubmitLoading(true);
      try {
        const response = await fetch(`/api/submit-answer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to submit answer');
        }

        // Success: close modal and reset state
        setIsModalOpen(false);
        setAnsweredQuestions((prev) => new Set(prev.add(currentQuestion!.id)));
        setSelectedAnswers([]);
        setCurrentQuestion(null);
        videoRef.current?.play();
      } catch (err) {
        console.log(err)
        setError('Error submitting the answer.');
      } finally {
        setSubmitLoading(false);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="relative">
        {loading && (
          <div className="flex justify-center items-center">
            <ImSpinner2 className="animate-spin text-4xl text-gray-500" />
          </div>
        )}

        {error && (
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        )}

        {!loading && videoData && (
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
                  disabled={submitLoading}
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
                      disabled={submitLoading}
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
                        disabled={submitLoading}
                      />
                      {option}
                    </label>
                  ))}
              </div>

              <button
                className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center justify-center"
                onClick={handleSubmit}
                disabled={submitLoading}
              >
                {submitLoading ? <ImSpinner2 className="animate-spin mr-2" /> : 'Submit'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VideoWithQuestions;
