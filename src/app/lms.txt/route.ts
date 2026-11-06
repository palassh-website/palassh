import { GET as getLlmsTxt } from "../llms.txt/route";

export const dynamic = "force-dynamic";

export async function GET() {
  return getLlmsTxt();
}