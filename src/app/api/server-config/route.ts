/* eslint-disable no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getConfig } from '@/lib/config';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // Cache API 显式缓存（CF Pages Functions 响应默认不缓存，Cache-Control 头无效）
  const cache = (caches as any).default; // caches.default 是 CF Workers 专有，DOM 类型无此属性
  const cacheKey = new URL(request.url).toString();
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  console.log('server-config called: ', request.url);

  const config = await getConfig();
  const result = {
    SiteName: config.SiteConfig.SiteName,
    StorageType: process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage',
  };
  // 缓存 10 分钟：TV 端启动「验证服务器配置」秒开（避免边缘冷启动 2-6s 转圈）
  const resp = NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, max-age=600' },
  });
  await cache.put(cacheKey, resp.clone());
  return resp;
}
