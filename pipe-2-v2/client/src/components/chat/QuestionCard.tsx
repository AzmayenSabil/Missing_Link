import type { Question } from "../../types";
import TextInput from "./TextInput";
import SingleSelectInput from "./SingleSelectInput";
import MultiSelectInput from "./MultiSelectInput";

interface QuestionCardProps {
  question: Question;
  onAnswer: (value: string | string[]) => void;
  disabled?: boolean;
}

export default function QuestionCard({
  question,
  onAnswer,
  disabled,
}: QuestionCardProps) {
  return (
    <div>
      <p
        className="text-sm font-medium leading-relaxed"
        style={{ color: "#c8d8e8" }}
      >
        {question.questionText}
      </p>
      {question.rationale && (
        <p
          className="text-xs font-mono mt-1 italic"
          style={{ color: "#00d4ff44" }}
        >
          {question.rationale}
        </p>
      )}

      {question.type === "text" && (
        <TextInput onSubmit={onAnswer} disabled={disabled} />
      )}

      {question.type === "single_select" && question.options && (
        <SingleSelectInput
          options={question.options}
          onSubmit={onAnswer}
          disabled={disabled}
        />
      )}

      {question.type === "multi_select" && question.options && (
        <MultiSelectInput
          options={question.options}
          onSubmit={(vals) => onAnswer(vals)}
          disabled={disabled}
        />
      )}
    </div>
  );
}
