/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiX, FiDownload } from 'react-icons/fi';
import { ImSpinner2 } from 'react-icons/im';

// Extend the Window interface to include onYouTubeIframeAPIReady
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
  }
}

// Declare the YT namespace to tell TypeScript about the YouTube Player API
declare namespace YT {
  class Player {
    constructor(elementId: string, options: PlayerOptions);
    playVideo(): void;
    pauseVideo(): void;
    getCurrentTime(): number;
    destroy(): void;
  }

  interface PlayerOptions {
    videoId: string;
    events: {
      onReady: (event: PlayerEvent) => void;
      onStateChange: (event: PlayerEvent) => void;
    };
  }

  interface PlayerEvent {
    target: Player;
    data: number;
  }

  enum PlayerState {
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }
}

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
  videoUrl: 'https://www.youtube.com/watch?v=qxhDQFr_RPE',
  // videoUrl:'https://www.w3schools.com/html/mov_bbb.mp4',
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
  const playerRef = useRef<YT.Player | null>(null);

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

  useEffect(() => {
    if (videoData && isYouTubeUrl(videoData.videoUrl)) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        playerRef.current = new YT.Player('youtube-player', {
          videoId: extractYouTubeId(videoData.videoUrl),
          events: {
            onReady: handlePlayerReady,
            onStateChange: handlePlayerStateChange,
          },
        });
      };
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoData]);

  const handlePlayerReady = (event: YT.PlayerEvent) => {
    setInterval(() => {
      const time = Math.floor(event.target.getCurrentTime());
      setCurrentTime(time);
      handleQuestionPopup(time);
    }, 1000);
  };

  const handlePlayerStateChange = (event: YT.PlayerEvent) => {
    if (event.data === YT.PlayerState.ENDED) {
      handleVideoEnd();
    }
  };

  const handleQuestionPopup = (current: number) => {
    if (videoData && !isVideoEnded) {
      const question = videoData.questions.find(
        (q) => q.timeline === current && !answeredQuestions.has(q.id)
      );
      if (question) {
        setCurrentQuestion(question);
        setIsModalOpen(true);
        playerRef.current?.pauseVideo();
      }
    }
  };

  const closeModal = () => {
    if (currentQuestion?.closeable) {
      setIsModalOpen(false);
      setCurrentQuestion(null);
      setAnsweredQuestions((prev) => new Set(prev.add(currentQuestion!.id)));
      if (!isVideoEnded) {
        playerRef.current?.playVideo();
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
        playerRef.current?.pauseVideo();
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
          playerRef.current?.playVideo();
        }
      } catch (err) {
        setError('Error submitting answers.');
      } finally {
        setSubmitLoading(false);
      }
    }
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  const isYouTubeUrl = (url: string) => {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/.test(url);
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(
      /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : '';
  };

  return (
    <div className="container mx-auto p-4">
      {loading && (
        <div className="flex justify-center items-center">
          <ImSpinner2 className="animate-spin h-10 w-10 text-gray-500" />
        </div>
      )}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && videoData && (
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold">{videoData.videoTitle}</h2>
          <p dangerouslySetInnerHTML={{ __html: videoData.videoDescription }}></p>

          {isYouTubeUrl(videoData.videoUrl) && (
            <div className="aspect-w-16 aspect-h-9">
              <div id="youtube-player"></div>
            </div>
          )}

          <div className="space-y-2">
            {videoData.videoResources.map((resource, index) => (
              <button
                key={index}
                onClick={() => handleDownload(resource)}
                className="flex items-center space-x-2 text-blue-600 hover:underline"
              >
                <FiDownload />
                <span>{resource.split('/').pop()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isModalOpen && currentQuestion && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-white p-6 rounded-lg shadow-lg space-y-4 max-w-lg w-full">
            {!currentQuestion.closeable && (
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                <FiX />
              </button>
            )}
            <h3 className="text-xl font-bold">{currentQuestion.question}</h3>
            <ul className="space-y-2">
              {currentQuestion.options.map((option) => (
                <li key={option}>
                  <button
                    onClick={() => handleAnswerSelect(option)}
                    className={`block w-full text-left p-2 border rounded-lg ${
                      selectedAnswers.includes(option)
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-black border-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeModal}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={handleSubmit}
                className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg ${
                  submitLoading ? 'opacity-50' : ''
                }`}
                disabled={submitLoading}
              >
                {submitLoading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VideoWithQuestions;
