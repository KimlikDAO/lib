import { Overridable } from "@kimlikdao/kdts";

const Status = 404 satisfies Overridable;
const HostUrl = "https://example.com" satisfies Overridable;

export default () => Response.redirect(HostUrl, Status);
