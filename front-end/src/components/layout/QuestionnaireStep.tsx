import { OptionCard } from "./OptionCard";

export interface Option {
  id: string;
  title: string;
  description: string;
}

interface QuestionnaireStepProps {
  question: string;
  options: Option[];
  selectedOption: string | null;
  onSelectOption: (optionId: string) => void;
}

export const QuestionnaireStep = ({
  question,
  options,
  selectedOption,
  onSelectOption,
}: QuestionnaireStepProps) => {
  return (
    <div className="w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-option-text">
        {question}
      </h2>
      <div className="space-y-4">
        {options.map((option) => (
          <OptionCard
            key={option.id}
            title={option.title}
            description={option.description}
            selected={selectedOption === option.id}
            onClick={() => onSelectOption(option.id)}
          />
        ))}
      </div>
    </div>
  );
};
