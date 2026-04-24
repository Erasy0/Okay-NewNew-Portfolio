

import { projects } from "@/lib/projects";
import { getBlurDataURL } from "@/lib/getBlurData";
import Work from "./Work";

export default async function WorkServer() {
  const blurMap: Record<number, string> = {};

  await Promise.all(
    projects.map(async (p) => {
      blurMap[p.id] = await getBlurDataURL(p.src);
    })
  );

  return <Work blurMap={blurMap} />;
}

