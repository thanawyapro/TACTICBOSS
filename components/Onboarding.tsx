import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "مرحبا بك في Tactic Boss",
      description: "التطبيق اللي هيساعدك تبني خطط تكتيكية قوية بطريقة سهلة واحترافية.",
      icon: "⚽"
    },
    {
      title: "السبورة التكتيكية",
      description: "اسحب اللاعبين وضعهم في المكان المناسب. السبورة بتحلل التشكيلة تلقائيًا وتديك نصائح ذكية.",
      icon: "📍"
    },
    {
      title: "رقابة لصيقة",
      description: "حدد اللاعب الخطر عند الخصم (مثل AMF أو LWF) واختار مين من فريقك يراقبه. دي من أقوى المميزات في التطبيق.",
      icon: "🎯"
    },
    {
      title: "ابني خطتك",
      description: "استخدم الخطط اليدوية أو اختار من الخطط الجاهزة في الميتا.",
      icon: "📋"
    }
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f172a] rounded-2xl max-w-md w-full p-8 text-center border border-white/10">
        <div className="text-6xl mb-6">{currentStep.icon}</div>
        
        <h2 className="text-2xl font-bold text-white mb-4">
          {currentStep.title}
        </h2>
        
        <p className="text-gray-300 mb-8 leading-relaxed text-[15px]">
          {currentStep.description}
        </p>

        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div 
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === step ? 'bg-yellow-400 w-8' : 'bg-white/30 w-2'
              }`}
            />
          ))}
        </div>

        <button 
          onClick={handleNext}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-xl transition-colors active:scale-[0.985]"
        >
          {step === steps.length - 1 ? "ابدأ الآن" : "التالي"}
        </button>

        <button 
          onClick={onComplete}
          className="mt-3 text-gray-400 hover:text-white text-sm"
        >
          تخطي الشرح
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
