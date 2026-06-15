import React from 'react';

interface State { hasError: boolean; }
interface Props { children?: React.ReactNode }

export default class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('App render error', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="min-h-screen bg-[#070b13] text-slate-100 grid place-items-center p-6" dir="rtl">
        <section className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950 p-6 text-center space-y-4 shadow-2xl">
          <div className="text-4xl" aria-hidden="true">⚽</div>
          <h1 className="text-lg font-black">تعذر فتح Tactic Boss</h1>
          <p className="text-xs leading-relaxed text-slate-400">حدث خطأ غير متوقع. أعد فتح التطبيق، ولن تتأثر بيانات حسابك المحفوظة.</p>
          <p className="text-xs leading-relaxed text-slate-500" dir="ltr">Something unexpected happened. Reopen the app; your saved account data is safe.</p>
          <button type="button" onClick={() => window.location.reload()} className="w-full rounded-xl bg-violet-600 py-3 text-sm font-bold">إعادة فتح التطبيق</button>
        </section>
      </main>
    );
  }
}
