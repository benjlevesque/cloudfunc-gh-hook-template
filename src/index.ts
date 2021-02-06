import { ReleaseReleasedEvent } from "@octokit/webhooks-definitions/schema";
import { handler } from "cloudfunc-gh-hook";
import { get } from "env-var";

const webhookSecret = get("WEBHOOK_SECRET").required().asString();

export const handleReleased = async (event: ReleaseReleasedEvent) => {
  // do something with the event
  console.log(event);
};

export const main = handler(
  { "release.released": handleReleased },
  webhookSecret
);
