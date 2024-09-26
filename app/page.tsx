/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { ImSpinner2 } from 'react-icons/im';
import QuestionPopup from './QuestionPopup'; // Import the new component
import VideoResources from './VideoResources';

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
    playerVars?: {
      controls?: number;
      showinfo?: number;
      modestbranding?: number;
      rel?: number;
      autoplay: number;
      iv_load_policy?: number;
      playsinline: number;
      enablejsapi: number;
    };
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
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
          playerVars: {
            controls: 0,          // Hides controls completely
            modestbranding: 1,    // Minimal YouTube branding
            rel: 0,               // No related videos at the end
            iv_load_policy: 3,    // Disables annotations
            autoplay: 0,          // Auto-start the video
            playsinline: 1,       // Play inline on mobile
            showinfo: 0,          // (Deprecated) was used to hide title
            enablejsapi: 1        // Enable JavaScript API for controlling the player
          },
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

        // Close modal after submission
        setIsModalOpen(false);
        setAnsweredQuestions((prev) => new Set(prev.add(currentQuestion.id)));
        setCurrentQuestion(null);
        setSelectedAnswers([]);

        // Continue playing the video after submitting
        if (!isVideoEnded) {
          if (isYouTubeUrl(videoData!.videoUrl)) {
            playerRef.current?.playVideo();
          } else {
            videoRef.current?.play();
          }
        }
      } catch (err) {
        setError('Error submitting answer.');
        console.error('Error during submission:', err); // Logging the error
      } finally {
        setSubmitLoading(false);
      }
    }
  };


  const isYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
  };

  const extractYouTubeId = (url: string): string => {
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : '';
  };

  return (
    <div className="container mx-auto p-4">
      {loading && (
        <div className="flex justify-center items-center h-screen">
          <ImSpinner2 className="animate-spin text-3xl" />
        </div>
      )}

      {error && <p className="text-red-500">{error}</p>}

      {videoData && !loading && (
        <>
          <h1 className="text-3xl font-bold mb-4">{videoData.videoTitle}</h1>
          {isYouTubeUrl(videoData.videoUrl) ? (
            <div id="youtube-player" style={{ width: '100%', height: '500px' }} />
          ) : (
            <video
              ref={videoRef}
              width="100%"
              height="500px"
              controls
              src={videoData.videoUrl}
              onTimeUpdate={(e) => {
                const time = Math.floor((e.target as HTMLVideoElement).currentTime);
                setCurrentTime(time);
                handleQuestionPopup(time);
              }}
              onEnded={handleVideoEnd}
            />
          )}
          
          <div className="mt-4">
            <h2 className="text-xl font-semibold">Description:</h2>
            <div className="mt-2" dangerouslySetInnerHTML={{ __html: videoData.videoDescription }} />
          </div>

          {/* Use the VideoResources component here */}
          <VideoResources resources={videoData.videoResources} />

          {/* Questions Modal */}
          <QuestionPopup
            isOpen={isModalOpen}
            question={currentQuestion}
            selectedAnswers={selectedAnswers}
            setSelectedAnswers={setSelectedAnswers}
            handleSubmit={handleSubmit}
            closeModal={closeModal}
            submitLoading={submitLoading}
          />
        </>
      )}
    </div>
  );
};

export default VideoWithQuestions;
