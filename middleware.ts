import { createClient } from '@supabase/supabase-js';

export const config = {
  matcher: '/gallery/:path*',
  runtime: 'edge',
};

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const segments = url.pathname.split('/');
  const id = segments[segments.length - 1];

  if (!id) return fetch(request);

  try {
    // 【规范做法】从环境变量中读取 Key
    // ! 号是告诉 TypeScript "我保证这肯定有值，别报错"
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // 1. 获取 Supabase 数据
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: image } = await supabase
      .from('saved_images')
      .select('image_url, caption')
      .eq('id', id)
      .single();

    if (!image) return fetch(request);

    // 2. 获取原始 HTML
    const indexResponse = await fetch(new URL('/index.html', request.url));
    const html = await indexResponse.text();

    // 3. 准备 Meta 标签
    const safeTitle = (image.caption || 'StoryBoard AI').replace(/"/g, '&quot;');
    const description = `Check out this comic panel: "${safeTitle}"`;
    const imageUrl = image.image_url;

    const newMetaTags = `
      <title>${safeTitle}</title>
      <meta property="og:title" content="${safeTitle}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:image" content="${imageUrl}" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${safeTitle}" />
      <meta name="twitter:description" content="${description}" />
      <meta name="twitter:image" content="${imageUrl}" />
    `;

    // 4. 暴力插入到 </head> 之前
    const modifiedHtml = html.replace('</head>', `${newMetaTags}</head>`);

    return new Response(modifiedHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    });

  } catch (error) {
    console.error('Middleware Error:', error);
    return fetch(request);
  }
}