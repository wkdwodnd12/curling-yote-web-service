import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import yachtPictogram from "../image/yacht-pictogram.svg";
import curlingPictogram from "../image/curling-pictogram.svg";
import introImage1 from "../image/intro_1.webp";
import introImage2 from "../image/intro_2.webp";
import introImage3 from "../image/intro_3.webp";

const introSlides = [
  {
    image: introImage1,
    title: "intro_1",
    heading1: "팀 강원 SAIL FOR GOLD :",
    heading2: "여성 전문 선수 육성 프로그램 크루 모집 신청",
    detail: "나도 요트 & 서핑 크루가 될 수 있을까?\n지금 바로 도전하세요!",
  },
  {
    image: introImage2,
    title: "intro_2",
    heading1: "강릉 유스 마린 아카데미 원데이클래스",
    heading2: "1일 프로그램 신청 (처음만나는바다)",
    detail: "강릉 관내 초3- 중3 단체신청 ONLY",
  },
  {
    image: introImage3,
    title: "intro_3",
    heading1: "강릉 유스 마린 아카데미",
    heading2: "3일 프로그램 신청 (다시만나는바다)",
    detail: "강릉 관내 초3부터 중3까지만 신청가능 성인 신청불가",
  },
];

const Intro = () => {
  const pinTriggerRef = useRef(null);
  const pinTargetRef = useRef(null);
  const guideLabelRef = useRef(null);
  const footerTextRef = useRef(null);
  const footerUnderlineRef = useRef(null);
  const sceneRefs = useRef([]);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      if (!pinTriggerRef.current || !pinTargetRef.current) {
        return;
      }

      const scenes = sceneRefs.current.filter(Boolean);

      if (scenes.length === 0) {
        return;
      }

      gsap.set(scenes, { autoAlpha: 0, x: 40 });
      gsap.set(scenes[0], { autoAlpha: 1, x: 0 });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: pinTriggerRef.current,
          start: "top top",
          end: "+=3600",
          scrub: true,
          pin: pinTargetRef.current,
          invalidateOnRefresh: true,
        },
      });

      timeline.to(scenes[0], { autoAlpha: 0, x: -40, duration: 0.24 }, 0.22);
      timeline.to(scenes[1], { autoAlpha: 1, x: 0, duration: 0.24 }, 0.3);
      timeline.to(scenes[1], { autoAlpha: 0, x: -40, duration: 0.24 }, 0.58);
      timeline.to(scenes[2], { autoAlpha: 1, x: 0, duration: 0.24 }, 0.66);

      if (guideLabelRef.current) {
        gsap.fromTo(
          guideLabelRef.current,
          { autoAlpha: 0, y: -24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.45,
            ease: "power2.out",
            scrollTrigger: {
              trigger: pinTriggerRef.current,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      if (footerTextRef.current && footerUnderlineRef.current) {
        gsap.set(footerUnderlineRef.current, {
          scaleX: 0,
          transformOrigin: "left center",
        });

        gsap.to(footerUnderlineRef.current, {
          scaleX: 1,
          duration: 1.25,
          delay: 0.3,
          ease: "power2.out",
          scrollTrigger: {
            trigger: footerTextRef.current,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        });
      }
    }, pinTriggerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="w-full bg-gradient-to-br from-sky-400 via-blue-500 to-blue-700 text-white">
      <div className="relative overflow-hidden min-h-[100svh]">
        <img
          src={curlingPictogram}
          alt="컬링 픽토그램"
          className="absolute -left-16 top-1/2 hidden h-[420px] w-[420px] -translate-y-1/2 opacity-80 md:block"
          style={{
            filter: "brightness(0) invert(1)",
            opacity: 0.6,
            animation: "intro-left 0.55s ease-out 0s forwards",
          }}
        />
        <img
          src={yachtPictogram}
          alt="요트 픽토그램"
          className="absolute -right-12 top-1/2 hidden h-[380px] w-[380px] -translate-y-1/2 opacity-0 md:block"
          style={{
            filter: "brightness(0) invert(1)",
            animation: "intro-right 0.85s ease-out 0.5s forwards",
          }}
        />

        <div className="mx-auto max-w-5xl px-6 py-32 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/35 px-8 py-2.5 text-base font-medium text-white/95 md:px-10 md:py-3 md:text-xl">
            강릉 해양스포츠 팜
          </div>
          <h1 className="mt-10 text-4xl md:text-6xl font-bold leading-tight">
            {"바다를 달리는 새로운 취미, 세일링".split("").map((char, idx) => (
              <span
                key={`${char}-${idx}`}
                className="inline-block opacity-0 animate-[intro-char_0.6s_ease-out_forwards]"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </h1>
          <p className="mt-8 flex flex-col items-center gap-2 text-white/85 text-base md:flex-row md:items-center md:justify-center md:gap-14 md:text-2xl animate-[intro-rise_0.7s_0.08s_ease-out_forwards] opacity-0">
            <span className="w-full text-center md:min-w-[340px] md:text-right">
              5월~11월 프로그램 별 상이
            </span>
            <span className="w-full text-center md:min-w-[460px] md:text-left">
              문의 : 카카오톡 : &apos;강릉해양스포츠팜&apos;
            </span>
          </p>
          <div className="mt-20 flex flex-col items-center justify-center gap-5 animate-[intro-rise_0.7s_0.16s_ease-out_forwards] opacity-0">
            <Link
              to="/home"
              className="px-10 py-3.5 rounded-full border border-white/60 text-white font-semibold shadow-lg shadow-blue-900/30 transition duration-200 hover:scale-105 hover:border-white hover:bg-white/15 hover:shadow-xl hover:shadow-blue-900/45"
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
      <section
        ref={pinTriggerRef}
        className="relative -mt-[2px] min-h-[calc(100svh+3600px)] pt-[2px] text-white"
      >
        <div ref={pinTargetRef} className="relative h-[100svh] w-full overflow-hidden">
          <div
            ref={guideLabelRef}
            className="absolute left-1/2 top-12 z-30 -translate-x-1/2 text-center text-white/90"
          >
            <p className="text-xl font-semibold tracking-[0.26em] md:text-3xl">강습소개</p>
          </div>
          <div className="mx-auto flex h-full max-w-[1320px] items-start justify-center px-4 pt-28 md:px-8 md:pt-36">
            <div className="relative h-[74svh] w-full md:h-[78svh]">
              {introSlides.map((slide, index) => (
                <div
                  key={slide.title}
                  ref={(el) => {
                    sceneRefs.current[index] = el;
                  }}
                  className="absolute inset-0 grid grid-cols-1 gap-2 md:grid-cols-[1.05fr_0.95fr] md:gap-3 will-change-transform"
                  style={{ zIndex: index + 1 }}
                >
                  <div className="flex h-full items-center justify-center overflow-hidden rounded-[28px]">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="h-full w-full object-contain object-center"
                    />
                  </div>
                  <div className="self-center -translate-y-2 md:-translate-y-3">
                    <h1 className="text-[clamp(1.45rem,2.8vw,3rem)] font-bold leading-tight tracking-tight text-white drop-shadow-[0_4px_14px_rgba(15,23,42,0.25)]">
                      {slide.heading1}
                    </h1>
                    <h2 className="mt-2 text-[clamp(1rem,1.7vw,1.9rem)] font-semibold leading-tight tracking-tight text-sky-100">
                      {slide.heading2}
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-sky-100/90 md:text-xl">
                      {slide.detail.split("\n").map((line, lineIndex) => (
                        <span key={`${slide.title}-detail-${lineIndex}`}>
                          {line}
                          {lineIndex < slide.detail.split("\n").length - 1 ? (
                            <br />
                          ) : null}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <footer className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-6 pt-16 pb-28 text-center text-white md:pt-20 md:pb-36">
        <p ref={footerTextRef} className="text-lg font-medium md:text-2xl">
          <span className="relative inline-block pb-1.5">
            강릉에서 시작하는 세일링, 프로그램별로 쉽게 신청하세요.
            <span
              ref={footerUnderlineRef}
              className="absolute bottom-0 left-0 block h-[2px] w-full bg-white/90"
            />
          </span>
        </p>
        <Link
          to="/home"
          className="intro-bounce rounded-full border border-white/70 px-10 py-3 text-base font-semibold transition duration-200 hover:bg-white/15 md:text-lg"
        >
          신청하기
        </Link>
      </footer>
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
        .intro-bounce {
          animation: intro-soft-bounce 2.8s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes intro-soft-bounce {
          0%, 72%, 100% {
            transform: translateY(0) scale(1);
          }
          78% {
            transform: translateY(-4px) scale(1.03);
          }
          84% {
            transform: translateY(0) scale(0.99);
          }
          90% {
            transform: translateY(-2px) scale(1.01);
          }
        }
      `}</style>
    </div>
  );
};

export default Intro;
