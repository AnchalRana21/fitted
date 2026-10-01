import Link from "next/link";
import type { StreamError } from "@/hooks/useStream";
import { Alert } from "./Alert";
import { Button } from "./Button";

export function ErrorNotice({ error, onRetry }: { error: StreamError; onRetry?: () => void }) {
  const offerSample = error.code === "rate_limited" || error.code === "no_api_key";
  const showRetry = Boolean(onRetry) && !offerSample;
  return (
    <Alert
      tone="danger"
      actions={
        showRetry || offerSample ? (
          <>
            {showRetry && (
              <Button variant="secondary" size="sm" onClick={onRetry}>
                Try again
              </Button>
            )}
            {offerSample && (
              <Link href="/" className="rounded-sm font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Try the sample from the home page
              </Link>
            )}
          </>
        ) : undefined
      }
    >
      <p>{error.message}</p>
    </Alert>
  );
}
