/* eslint-disable no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getConfig } from '@/lib/config';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  console.log('server-config called: ', request.url);

  const config = await getConfig();
  const result = {
    SiteName: config.SiteConfig.SiteName,
    StorageType: process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage',
  };
  // 验证接口缓存 10 分钟：TV 端启动「验证服务器配置」时秒开（避免边缘冷启动 2-6s 转圈）
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, max-age=600, s-maxage=600' },
  });
}
