import React from 'react';
import { motion } from 'framer-motion';

type Question = {
  id: number;
  question: string;
  options?: string[]; // Options are optional for fill-in-the-blanks and text input questions
  type: 'mcq' | 'multi-select' | 'fill-in-the-blank' | 'text-input';
  closeable: boolean;
};

type QuestionPopupProps = {
  isOpen: boolean;
  questions: Question[]; // Change to array of questions
  selectedAnswers: Record<number, string[]>; // Map of question ID to selected answers
  setSelectedAnswers: React.Dispatch<React.SetStateAction<Record<number, string[]>>>;
  handleSubmit: () => void;
  closeModal: () => void;
  submitLoading: boolean;
};

const QuestionPopup: React.FC<QuestionPopupProps> = ({
  isOpen,
  questions,
  selectedAnswers,
  setSelectedAnswers,
  handleSubmit,
  closeModal,
  submitLoading,
}) => {
  if (!isOpen || questions.length === 0) return null;

  const handleAnswerSelect = (option: string, questionId: number) => {
    const currentAnswers = selectedAnswers[questionId] || [];
    
    if (questions.find(q => q.id === questionId)?.type === 'mcq') {
      setSelectedAnswers((prev) => ({ ...prev, [questionId]: [option] }));
    } else if (questions.find(q => q.id === questionId)?.type === 'multi-select') {
      setSelectedAnswers((prev) => ({
        ...prev,
        [questionId]: currentAnswers.includes(option)
          ? currentAnswers.filter((answer) => answer !== option)
          : [...currentAnswers, option],
      }));
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, questionId: number) => {
    const value = event.target.value;
    if (questions.find(q => q.id === questionId)?.type === 'fill-in-the-blank' || questions.find(q => q.id === questionId)?.type === 'text-input') {
      setSelectedAnswers((prev) => ({ ...prev, [questionId]: [value] })); // For fill-in-the-blank and text input, replace previous answers
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    >
      <div className="bg-white p-6 rounded-lg max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Questions</h2>

        {questions.map((question) => (
          <div key={question.id} className="mb-6">
            <p className="mb-2">{question.question}</p>

            <div>
              {question.type === 'mcq' && question.options && question.options.map((option, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="radio"
                    name={`answers-${question.id}`} // Ensure radio buttons are grouped by question
                    value={option}
                    checked={selectedAnswers[question.id]?.includes(option)}
                    onChange={() => handleAnswerSelect(option, question.id)}
                    className="mr-2"
                  />
                  <label>{option}</label>
                </div>
              ))}

              {question.type === 'multi-select' && question.options && question.options.map((option, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    name={`answers-${question.id}`} // Ensure checkbox inputs are grouped by question
                    value={option}
                    checked={selectedAnswers[question.id]?.includes(option)}
                    onChange={() => handleAnswerSelect(option, question.id)}
                    className="mr-2"
                  />
                  <label>{option}</label>
                </div>
              ))}

              {(question.type === 'fill-in-the-blank' || question.type === 'text-input') && (
                <input
                  type="text"
                  placeholder={question.type === 'fill-in-the-blank' ? "Fill in the blank..." : "Enter your answer..."}
                  onChange={(event) => handleInputChange(event, question.id)}
                  className="border p-2 w-full mb-4"
                />
              )}
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
            onClick={handleSubmit}
            disabled={submitLoading}
          >
            {submitLoading ? 'Submitting...' : 'Submit'}
          </button>
          {questions[0]?.closeable && ( // Check closeable for the first question
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
