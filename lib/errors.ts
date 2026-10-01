export type ErrorCode =
  | "bad_request"
  | "rate_limited"
  | "no_api_key"
  | "refusal"
  | "truncated"
  | "invalid_output"
  | "upstream_busy"
  | "upstream_error"
  | "network";

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  bad_request: "Something in the request was missing or too long. Check your resume and job description.",
  rate_limited: "You've used today's free AI runs.",
  no_api_key: "This copy of Fitted has no AI key set up. You can still try the sample.",
  refusal: "The AI declined to process this request. Edit the text and try again.",
  truncated: "The response was cut off. Try a shorter resume or job description.",
  invalid_output: "The AI returned a response Fitted couldn't read. Try again.",
  upstream_busy: "The AI service is busy right now. Try again in a minute.",
  upstream_error: "Something went wrong talking to the AI service. Try again.",
  network: "The connection dropped before the response finished. Try again.",
};

export function describeError(code: ErrorCode, reset?: number): string {
  if (code === "rate_limited" && reset) {
    const time = new Date(reset).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${ERROR_MESSAGES.rate_limited} They reset at ${time}. You can still try the sample.`;
  }
  return ERROR_MESSAGES[code];
}
