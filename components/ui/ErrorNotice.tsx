import Link from "next/link";
import type { StreamError } from "@/hooks/useStream";
import { Button } from "./Button";

export function ErrorNotice({ error, onRetry }: { error: StreamError; onRetry?: () => void }) {
  const offerSample = error.code === "rate_limited" || error.code === "no_api_key";
  const showRetry = Boolean(onRetry) && !offerSample;
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
      <p>{error.message}</p>
      {(showRetry || offerSample) && (
      <div className="mt-3 flex flex-wrap gap-2">
        {showRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        )}
        {offerSample && (
          <Link href="/" className="font-medium underline">
            Try the sample from the home page
          </Link>
        )}
      </div>
      )}
    </div>
  );
}
