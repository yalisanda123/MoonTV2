import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge";

const UA =
  "Mozilla/5.0 (Linux; Android 12; TV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const SITE = "https://hongguoduanju.com";

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept-Language": "zh-CN,zh;q=0.9",
    },
    cf: { cacheTtl: 300 } as any,
  });
  if (!res.ok) throw new Error(`红果 ${res.status}`);
  return await res.text();
}

function extractJson(html: string): any[] {
  // 红果页内联 JSON（series_id/series_name 对象），抓取所有含 series_name 的 JSON 块
  const out: any[] = [];
  const re = /\{[^{}]*"series_id"[^{}]*"series_name"[^{}]*\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      out.push(JSON.parse(m[0]));
    } catch {
      // 跳过坏块
    }
  }
  return out;
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action") || "home";
  const id = req.nextUrl.searchParams.get("id") || "";
  const tid = req.nextUrl.searchParams.get("tid") || "";
  const q = req.nextUrl.searchParams.get("q") || "";

  try {
    let url = SITE + "/";
    if (action === "category" && tid) {
      const tidMap: Record<string, string> = {
        hot: "sort_type=1",
        new: "sort_type=2",
        city: "background=cate_1",
        modern: "background=cate_757",
        ancient: "background=cate_758",
        village: "background=cate_11",
        work: "background=cate_127",
        school: "background=cate_4",
        suspense: "topic=cate_165",
        comedy: "topic=cate_303",
        rebirth: "setting=cate_36",
        time: "setting=cate_37",
      };
      const query = tidMap[tid] || "sort_type=1";
      url = `${SITE}/category?${query}`;
    } else if (action === "detail" && id) {
      url = `${SITE}/detail?series_id=${encodeURIComponent(id)}`;
    } else if (action === "search" && q) {
      url = `${SITE}/search?keyword=${encodeURIComponent(q)}`;
    }

    const html = await fetchHtml(url);
    const items = extractJson(html);

    // 去重
    const seen = new Set<string>();
    const list: any[] = [];
    for (const it of items) {
      const sid = String(it.series_id || "");
      if (!sid || seen.has(sid)) continue;
      seen.add(sid);
      list.push({
        series_id: sid,
        series_name: it.series_name || "",
        cover: it.series_cover || it.title_link_pc || "",
        episode_cnt: it.episode_cnt || "",
        tags: it.tags || "",
        intro: (it.series_intro || "").slice(0, 200),
      });
    }

    return NextResponse.json({
      code: 200,
      action,
      total: list.length,
      list,
    });
  } catch (e: any) {
    return NextResponse.json(
      { code: 500, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
