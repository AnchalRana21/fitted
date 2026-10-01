import { InputForm } from "@/components/input/InputForm";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Tailor your resume to the job in front of you</h1>
        <p className="mt-3 text-neutral-700">
          Fitted shows how well your resume matches a job, suggests changes line by line, and never adds experience
          you don&apos;t have. You approve every change.
        </p>
      </div>
      <InputForm />
    </div>
  );
}
