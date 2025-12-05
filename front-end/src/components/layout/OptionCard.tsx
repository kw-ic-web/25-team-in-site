// src/components/layout/OptionCard.tsx

// 1. 오류가 발생하던 import { cn } ... 줄을 완전히 삭제합니다.

interface OptionCardProps {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

export const OptionCard = ({
  title,
  description,
  selected,
  onClick,
}: OptionCardProps) => {
  // 2. 기본 스타일과 선택/기본 상태 스타일을 정의합니다.
  // (hover:shadow-lg, hover:scale-[1.02], hover:bg-option-hover 등 hover 관련 클래스 모두 제거)
  const baseClasses =
    "w-full text-left p-6 rounded-2xl border-2 transition-all duration-300";
  
  const selectedStateClasses = "bg-option-selected border-primary shadow-md";
  const defaultStateClasses = "bg-option-card border-border";

  return (
    <button
      onClick={onClick}
      // 3. cn 함수 대신, 템플릿 리터럴(백틱)을 사용해
      //    selected 값에 따라 클래스 이름을 동적으로 조합합니다.
      className={`${baseClasses} ${
        selected ? selectedStateClasses : defaultStateClasses
      }`}
    >
      <h3 className="font-bold text-lg mb-2 text-option-text">{title}</h3>
      <p className="text-sm text-option-muted leading-relaxed">{description}</p>
    </button>
  );
};