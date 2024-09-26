/* eslint-disable react-hooks/exhaustive-deps */
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
    {
      id: 3,
      question: 'Which animals are mammals?',
      options: ['Dog', 'Fish', 'Cat'],
      type: 'multi-select',
      timeline: 15,
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

  // YouTube Player setup
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

  // Handle regular video player
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
        if (isYouTubeUrl(videoData.videoUrl)) {
          playerRef.current?.pauseVideo();
        } else {
          videoRef.current?.pause();
        }
      }
    }
  };

  const closeModal = () => {
    if (currentQuestion?.closeable) {
      setIsModalOpen(false);
      setCurrentQuestion(null);
      setAnsweredQuestions((prev) => new Set(prev.add(currentQuestion!.id)));
      if (!isVideoEnded) {
        if (isYouTubeUrl(videoData!.videoUrl)) {
          playerRef.current?.playVideo();
        } else {
          videoRef.current?.play();
        }
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
        if (isYouTubeUrl(videoData.videoUrl)) {
          playerRef.current?.pauseVideo();
        } else {
          videoRef.current?.pause();
        }
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
        setAnsweredQuestions((prev) => new Set(prev.add(currentQuestion.id)));
        setCurrentQuestion(null);
        setSelectedAnswers([]);
      } catch (err) {
        setError('Error submitting answer.');
      } finally {
        setSubmitLoading(false);
        if (!isVideoEnded) {
          if (isYouTubeUrl(videoData!.videoUrl)) {
            playerRef.current?.playVideo();
          } else {
            videoRef.current?.play();
          }
        }
      }
    }
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const extractYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ImSpinner2 className="animate-spin text-4xl text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{videoData?.videoTitle}</h1>

      {isYouTubeUrl(videoData!.videoUrl) ? (
        <div id="youtube-player" style={{ width: '100%', height: '500px' }} />
      ) : (
        <video
          ref={videoRef}
          width="100%"
          height="500px"
          controls
          src={videoData?.videoUrl}
          onTimeUpdate={(e) => {
            const time = Math.floor((e.target as HTMLVideoElement).currentTime);
            setCurrentTime(time);
            handleQuestionPopup(time);
          }}
          onEnded={handleVideoEnd}
        />
      )}

      {/* Video description and resources */}
      <div className="mt-4">
        <h2 className="text-2xl font-semibold">Description</h2>
        <div dangerouslySetInnerHTML={{ __html: videoData?.videoDescription || '' }} />
      </div>

      {/* Video resources */}
      {videoData?.videoResources && videoData?.videoResources.length > 0 && (
        <div className="mt-4">
          <h2 className="text-2xl font-semibold">Resources</h2>
          <ul>
            {videoData.videoResources.map((resource, index) => (
              <li key={index}>
                <a
                  href={resource}
                  className="flex items-center space-x-2 text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FiDownload />
                  <span>{resource.split('/').pop()}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )

      }


      {/* Questions Modal */}
      {isModalOpen && currentQuestion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        >
          <div className="bg-white p-6 rounded-lg max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">Question</h2>
            <p className="mb-4">{currentQuestion?.question}</p>

            <div className="mb-4">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type={currentQuestion.type === 'mcq' ? 'radio' : 'checkbox'}
                    name="answers"
                    value={option}
                    checked={selectedAnswers.includes(option)}
                    onChange={() => handleAnswerSelect(option)}
                    className="mr-2"
                  />
                  <label>{option}</label>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
                onClick={handleSubmit}
                disabled={submitLoading}
              >
                {submitLoading ? 'Submitting...' : 'Submit'}
              </button>
              {currentQuestion.closeable && (
                <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded" onClick={closeModal}>
                  Close
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VideoWithQuestions;
