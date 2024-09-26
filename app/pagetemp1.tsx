/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiX, FiDownload } from 'react-icons/fi';
import { ImSpinner2 } from 'react-icons/im';

type Question = {
  id: number;
  question: string;
  options: string[];
  type: 'mcq' | 'multi-select';
  timeline: number;
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
  questions: Question[];
  isSubmitSingleEveryTime: boolean;
  videoResources: string[];
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
  // videoUrl: 'https://www.youtube.com/watch?v=qxhDQFr_RPE',
  videoUrl:'https://www.w3schools.com/html/mov_bbb.mp4',
  isSubmitSingleEveryTime: true,
  videoResources: [
    'https://pdfobject.com/pdf/sample.pdf',
    'https://pdfobject.com/pdf/sample.doc',
    'https://pdfobject.com/pdf/sample.png',
  ],
  questions: [
    {
      id: 1,
      question: 'What is the color of the sky?',
      options: ['Blue', 'Green', 'Red'],
      type: 'mcq',
      timeline: 5,
      closeable: false,
    },
    {
      id: 2,
      question: 'Which animals are mammals?',
      options: ['Dog', 'Fish', 'Cat'],
      type: 'multi-select',
      timeline: 10,
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
  const [collectedAnswers, setCollectedAnswers] = useState<any[]>([]);
  const [isVideoEnded, setIsVideoEnded] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchVideoData = async () => {
      setLoading(true);
      setError(null);
      try {
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
        console.log('Submitting all collected answers: ', collectedAnswers);
      } catch (err) {
        setError('Error submitting collected answers.');
      }
    }

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
      setSelectedAnswers([option]);
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

  const handleDownload = (resourceUrl: string) => {
    const link = document.createElement('a');
    link.href = resourceUrl;
    link.setAttribute('download', resourceUrl.split('/').pop() || 'resource');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const extractYouTubeId = (url: string) => {
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
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

          <div className="relative w-full h-auto rounded-lg overflow-hidden shadow-lg">
            {isYouTubeUrl(videoData.videoUrl) ? (
              <iframe
                width="100%"
                height="400"
                src={`https://www.youtube.com/embed/${extractYouTubeId(videoData.videoUrl)}`}
                title={videoData.videoTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <video
                ref={videoRef}
                className="w-full h-full object-cover rounded-lg"
                src={videoData.videoUrl}
                controls
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnd}
              />
            )}
          </div>

          <div className="text-gray-700 text-lg text-center md:text-left mt-4">
            <div dangerouslySetInnerHTML={{ __html: videoData.videoDescription }} />
          </div>

          {videoData.videoResources && (
            <div className="mt-6">
              <h2 className="text-2xl font-semibold mb-4">Resources</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {videoData.videoResources.map((resource, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-100 p-4 rounded-lg shadow"
                  >
                    <span className="truncate">{resource.split('/').pop()}</span>
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => handleDownload(resource)}
                    >
                      <FiDownload className="inline-block" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal to display questions */}
      {isModalOpen && currentQuestion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        >
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto space-y-4">
            <button
              className="absolute top-2 right-2 text-red-600 hover:text-red-800"
              onClick={closeModal}
            >
              <FiX />
            </button>
            <h2 className="text-xl font-semibold">{currentQuestion.question}</h2>
            <div className="space-y-2">
              {currentQuestion.options.map((option) => (
                <button
                  key={option}
                  className={`block w-full text-left px-4 py-2 rounded-lg border ${
                    selectedAnswers.includes(option) ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                  onClick={() => handleAnswerSelect(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg mt-4"
              onClick={handleSubmit}
              disabled={submitLoading}
            >
              {submitLoading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VideoWithQuestions;
