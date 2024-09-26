// QuestionPopup.tsx

import React from 'react';
import { motion } from 'framer-motion';

type Question = {
  id: number;
  question: string;
  options: string[];
  type: 'mcq' | 'multi-select';
  closeable: boolean;
};

type QuestionPopupProps = {
  isOpen: boolean;
  question: Question | null;
  selectedAnswers: string[];
  setSelectedAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  handleSubmit: () => void;
  closeModal: () => void;
  submitLoading: boolean;
};

const QuestionPopup: React.FC<QuestionPopupProps> = ({
  isOpen,
  question,
  selectedAnswers,
  setSelectedAnswers,
  handleSubmit,
  closeModal,
  submitLoading,
}) => {
  if (!isOpen || !question) return null;

  const handleAnswerSelect = (option: string) => {
    if (question.type === 'mcq') {
      setSelectedAnswers([option]);
    } else if (question.type === 'multi-select') {
      setSelectedAnswers((prev) =>
        prev.includes(option) ? prev.filter((answer) => answer !== option) : [...prev, option]
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    >
      <div className="bg-white p-6 rounded-lg max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Question</h2>
        <p className="mb-4">{question.question}</p>

        <div className="mb-4">
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center mb-2">
              <input
                type={question.type === 'mcq' ? 'radio' : 'checkbox'}
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
          {question.closeable && (
            <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded" onClick={closeModal}>
              Close
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default QuestionPopup;
