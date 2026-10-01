import { InputForm } from "@/components/input/InputForm";

export default function Home() {
  return (
    <main>
      <section className="bg-band">
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-14 sm:px-6 sm:pt-20">
          <p className="text-sm font-semibold text-primary-text">AI resume tailor</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-bold tracking-[-0.025em] text-ink sm:text-5xl">
            Tailor your resume to the job in front of you
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-2">
            Fitted scores the match, suggests honest changes line by line, and never adds experience you don&apos;t
            have. You approve every change.
          </p>
        </div>
      </section>
      <div className="mx-auto -mt-16 max-w-6xl px-4 pb-16 sm:px-6">
        <InputForm />
      </div>
    </main>
  );
}
