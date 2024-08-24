import { serve } from "bun";

serve({
  port: 8787,
  fetch(req) {
    console.log(req);
  }
});
