import { Link } from "react-router-dom";
import yachtPictogram from "../image/yacht-pictogram.svg";
import curlingPictogram from "../image/curling-pictogram.svg";

const Intro = () => {
  return (
    <div className="min-h-[100svh] w-full bg-gradient-to-br from-sky-500 via-blue-600 to-blue-800 text-white">
      <div className="relative overflow-hidden min-h-[100svh]">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-[-120px] left-[-80px] h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
        <img
          src={curlingPictogram}
          alt="컬링 픽토그램"
          className="absolute -left-16 top-1/2 hidden h-[420px] w-[420px] -translate-y-1/2 opacity-80 md:block"
          style={{
            filter: 'brightness(0) invert(1)',
            opacity: 0.6,
            animation: 'intro-left 0.55s ease-out 0s forwards'
          }}
        />
        <img
          src={yachtPictogram}
          alt="요트 픽토그램"
          className="absolute -right-12 top-1/2 hidden h-[380px] w-[380px] -translate-y-1/2 opacity-0 md:block"
          style={{
            filter: 'brightness(0) invert(1)',
            animation: 'intro-right 0.85s ease-out 0.5s forwards'
          }}
        />

        <div className="mx-auto max-w-5xl px-6 py-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-1 text-xs text-white/90 mx-auto">
            Wev Service
          </div>
          <h1 className="mt-10 text-4xl md:text-6xl font-bold leading-tight">
            {'컬링 · 요트 강습 신청'.split('').map((char, idx) => (
              <span
                key={`${char}-${idx}`}
                className="inline-block opacity-0 animate-[intro-char_0.6s_ease-out_forwards]"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </h1>
          <p className="mt-8 text-white/80 text-base md:text-xl animate-[intro-rise_0.7s_0.08s_ease-out_forwards] opacity-0">
            분기별로 열리는 체험 강습을 빠르게 확인하고
            <br />
            간편하게 신청하세요.
          </p>
          <div className="mt-20 flex flex-col items-center justify-center gap-5 animate-[intro-rise_0.7s_0.16s_ease-out_forwards] opacity-0">
            <Link
              to="/home"
              className="px-10 py-3.5 rounded-full bg-white text-blue-700 font-semibold shadow-lg shadow-blue-900/30 hover:bg-white/90 transition"
            >
              둘러보기
            </Link>
            <div className="text-sm text-white/70">
              지금 열려있는 강습을 확인할 수 있어요.
            </div>
          </div>
          <div className="mt-12" />
        </div>
      </div>
      <style>{`
        @keyframes intro-rise {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes intro-char {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes intro-left {
          from {
            opacity: 0;
            transform: translate(-80px, -50%);
          }
          to {
            opacity: 0.6;
            transform: translate(0, -50%);
          }
        }
        @keyframes intro-right {
          from {
            opacity: 0;
            transform: translate(80px, -50%);
          }
          to {
            opacity: 0.6;
            transform: translate(0, -50%);
          }
        }
      `}</style>
    </div>
  );
};

export default Intro;
