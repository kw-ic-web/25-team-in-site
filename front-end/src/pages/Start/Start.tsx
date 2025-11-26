import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Start.css";

interface Option {
  id: string;
  title: string;
  description: string;
}

interface Question {
  id: number;
  question: string;
  options: Option[];
}

const questions: Question[] = [
  {
    id: 1,
    question: "가장 집중적으로 학습(사용)할 언어는 무엇인가요?",
    options: [
      {
        id: "python",
        title: "Python",
        description: "데이터 분석, AI, 웹 개발 등 다양한 분야에서 활용됩니다.",
      },
      {
        id: "javascript",
        title: "JavaScript",
        description: "웹 프론트엔드와 백엔드 개발의 핵심 언어입니다.",
      },
      {
        id: "java",
        title: "Java",
        description: "엔터프라이즈 애플리케이션과 안드로이드 개발에 사용됩니다.",
      },
      {
        id: "cpp",
        title: "C++",
        description: "시스템 프로그래밍과 게임 개발에 강력한 언어입니다.",
      },
      {
        id: "ex",
        title: "기타",
        description: "다른 언어를 주로 사용해요.",
      },
    ],
  },

  {
    id: 2,
    question: "선택하신 언어의 숙련도는 어느 정도인가요?",
    options: [
      {
        id: "beginner",
        title: "초급",
        description: "이제 막 배우기 시작했어요.",
      },
      {
        id: "intermediate",
        title: "중급",
        description: "기본 문법은 알지만, 프로젝트는 어려워요.",
      },
      {
        id: "advanced",
        title: "고급",
        description: "작은 프로젝트나 과제를 완성해 본 경험이 있어요.",
      },
      {
        id: "expert",
        title: "전문가",
        description: "실무에서 사용하거나 그에 준하는 실력이에요.",
      },
    ],
  },
  {
    id: 3,
    question: "이 IDE를 사용하는 주된 목적은 무엇인가요?",
    options: [
      {
        id: "test",
        title: "알고리즘 / 코딩 테스트 문제 풀이",
        description: "개발자로 취업하기 위해 실력을 키우고 싶어요.",
      },
      {
        id: "project",
        title: "학교 과제 / 개인 프로젝트 진행",
        description: "내가 원하는 프로그램이나 서비스를 만들고 싶어요.",
      },
      {
        id: "hobby",
        title: "취미/교양",
        description: "프로그래밍을 취미로 배우고 싶어요.",
      },
      {
        id: "competition",
        title: "새로운 프로그래밍 언어 학습",
        description: "새로운 언어 학습을 원해요.",
      },
    ],
  },
  {
    id: 4,
    question: "코딩할 때 어떤 부분이 가장 어렵게 느껴지시나요?",
    options: [
      {
        id: "logic",
        title: "논리 / 계획",
        description: "처음부터 어떻게 시작할지, 로직을 짜는 것이 막막해요.",
      },
      {
        id: "syntax",
        title: "기본 문법",
        description: "문법 오류나 오타를 찾고 수정하는 데 시간을 많이 써요.",
      },
      {
        id: "debugging",
        title: "디버깅",
        description: "코드가 왜 원하는 대로 동작하지 않는지, 에러를 추적하기 힘들어요.",
      },
      {
        id: "optimization",
        title: "최적화 / 구조",
        description: "코드는 작동하지만, 더 효율적이고 깔끔하게(리팩토링) 만드는 법을 모르겠어요.",
      },
    ],
  },
];

const Index = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  // const [isLoading, setIsLoading] = useState(false); // 로딩 상태
  const navigate = useNavigate();

  const handleSelectOption = (optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questions[currentStep].id]: optionId,
    }));
  };

  // async 키워드는 백엔드 로직 주석 해제 시 필요합니다.
  const handleNext = async () => {
    const currentAnswer = answers[questions[currentStep].id];
    if (!currentAnswer) {
      alert("답변을 선택한 후 다음으로 진행할 수 있습니다.");
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // 마지막 단계:
      // 나중에 이 answers 객체를 백엔드로 보내면 됩니다.
      console.log("최종 설문 답변:", answers);

      // -- 백엔드 전송 로직 --
      // if (isLoading) return;
      // setIsLoading(true);
      // try {
      //   const response = await fetch("/api/survey/submit", {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify(answers),
      //   });
      //   if (!response.ok) {
      //     throw new Error("서버에 답변을 저장하는 데 실패했습니다.");
      //   }
      //   // 전송 성공
      //   alert("모든 질문에 답변하셨습니다. 맞춤형 학습을 시작해보세요!");
      //   navigate("/home", { replace: true });
      // } catch (error) {
      //   console.error("설문 제출 오류:", error);
      //   alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      // } finally {
      //   setIsLoading(false);
      // }

      // 원래의 완료 로직 (alert + 페이지 이동)
      alert("모든 질문에 답변하셨습니다. 맞춤형 학습을 시작해보세요!");
      navigate("/home", { replace: true });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const currentQuestion = questions[currentStep];
  const progressPercent = ((currentStep + 1) / questions.length) * 100;
  const currentAnswer = answers[currentQuestion.id] || null;

  return (
    <div className="start-container">
      {/* 1. Progress Bar (상단 고정) */}
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${progressPercent}%` }}
        />
        <span className="progress-bar-text">
          {currentStep + 1}/{questions.length}
        </span>
      </div>

      {/* 2. Main Content Card (중앙) */}
      <div className="start-card">
        <h2 className="start-question-title">{currentQuestion.question}</h2>

        {/* 3. Options (QuestionnaireStep 인라인) */}
        <div className="options-container">
          {currentQuestion.options.map((option) => (
            <button
              key={option.id}
              className={`option-card ${
                currentAnswer === option.id ? "selected" : ""
              }`}
              onClick={() => handleSelectOption(option.id)}
            >
              <h3>{option.title}</h3>
              <p>{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Navigation Buttons (하단 고정) */}
      <div className="start-nav">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0} // 백엔드 사용 시: disabled={currentStep === 0 || isLoading}
          className="nav-btn prev"
        >
          이전
        </button>
        <button
          onClick={handleNext}
          disabled={!currentAnswer} // 백엔드 사용 시: disabled={!currentAnswer || isLoading}
          className="nav-btn next"
        >
          {/* 백엔드 사용 시:
            {currentStep === questions.length - 1
              ? isLoading
                ? "저장 중..."
                : "완료"
              : "다음"}
          */}
          {currentStep === questions.length - 1 ? "완료" : "다음"}
        </button>
      </div>
    </div>
  );
};

export default Index;