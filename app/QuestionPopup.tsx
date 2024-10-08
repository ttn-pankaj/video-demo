import React from 'react';
import { motion } from 'framer-motion';

type Question = {
  id: number;
  question: string;
  options?: string[]; // options are optional for fill-in-the-blanks and text input questions
  type: 'mcq' | 'multi-select' | 'fill-in-the-blank' | 'text-input';
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

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (question.type === 'fill-in-the-blank' || question.type === 'text-input') {
      setSelectedAnswers([value]); // For fill-in-the-blank and text input, we replace previous answers
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
          {question.type === 'mcq' && question.options && question.options.map((option, index) => (
            <div key={index} className="flex items-center mb-2">
              <input
                type="radio"
                name="answers"
                value={option}
                checked={selectedAnswers.includes(option)}
                onChange={() => handleAnswerSelect(option)}
                className="mr-2"
              />
              <label>{option}</label>
            </div>
          ))}

          {question.type === 'multi-select' && question.options && question.options.map((option, index) => (
            <div key={index} className="flex items-center mb-2">
              <input
                type="checkbox"
                name="answers"
                value={option}
                checked={selectedAnswers.includes(option)}
                onChange={() => handleAnswerSelect(option)}
                className="mr-2"
              />
              <label>{option}</label>
            </div>
          ))}

          {question.type === 'fill-in-the-blank' && (
            <input
              type="text"
              placeholder="Fill in the blank..."
              onChange={handleInputChange}
              className="border p-2 w-full mb-4"
            />
          )}

          {question.type === 'text-input' && (
            <input
              type="text"
              placeholder="Enter your answer..."
              onChange={handleInputChange}
              className="border p-2 w-full mb-4"
            />
          )}
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
