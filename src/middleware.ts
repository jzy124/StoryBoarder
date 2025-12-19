export const config = {
  matcher: '/gallery/:path*',
  runtime: 'edge',
};

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const segments = url.pathname.split('/');
  const id = segments[segments.length - 1];

  if (!id || id.includes('.')) {
    return fetch(request);
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // 1. 获取 Supabase 数据
    const apiUrl = `${supabaseUrl}/rest/v1/saved_images?id=eq.${id}&select=image_url,caption`;
    
    const dbResponse = await fetch(apiUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!dbResponse.ok) return fetch(request);

    const data = await dbResponse.json();
    const image = data && data.length > 0 ? data[0] : null;

    if (!image) return fetch(request);

    // 2. 获取原始 HTML
    const indexResponse = await fetch(new URL('/index.html', request.url));
    const html = await indexResponse.text();

    // 3. 准备 Meta 标签
    const safeTitle = (image.caption || 'StoryBoard AI').replace(/"/g, '&quot;').substring(0, 50);
    const description = `Check out this comic panel: "${safeTitle}..."`;
    const imageUrl = image.image_url;

    const newMetaTags = `
      <title>${safeTitle}</title>
      <meta property="og:title" content="${safeTitle}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:image" content="${imageUrl}" />
      <meta property="og:image:width" content="1024" />
      <meta property="og:image:height" content="1024" />
      <meta property="og:type" content="website" />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${safeTitle}" />
      <meta name="twitter:description" content="${description}" />
      <meta name="twitter:image" content="${imageUrl}" />
      `;

    // 4. 【核心改动】把新标签直接接在 <head> 后面
    // 这样它们会出现在 HTML 的最顶端，覆盖掉后面任何默认标签
    const modifiedHtml = html.replace('<head>', `<head>${newMetaTags}`);

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