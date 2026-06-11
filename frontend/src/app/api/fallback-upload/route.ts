import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log("API fallback-upload: Parsing form data...");
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;

    console.log(`API fallback-upload: File info: filename=${fileName}, size=${file?.size}, type=${file?.type}`);

    if (!file || !fileName) {
      console.log("API fallback-upload: Error - missing file or fileName");
      return NextResponse.json({ error: 'File and fileName are required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    console.log(`API fallback-upload: Supabase URL: ${supabaseUrl}`);
    console.log(`API fallback-upload: Has Service Role Key: ${!!supabaseServiceKey}`);

    if (!supabaseServiceKey) {
      console.log("API fallback-upload: Error - Service Role Key is missing from process.env");
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server' }, { status: 500 });
    }

    console.log("API fallback-upload: Creating Supabase admin client...");
    // Create admin client which has service_role bypass privileges
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false
      }
    });

    // 1. Ensure the bucket exists (create if missing)
    console.log("API fallback-upload: Checking if bucket 'fallback-media' exists...");
    const startBucketCheck = Date.now();
    const { error: bucketError } = await supabaseAdmin.storage.getBucket('fallback-media');
    console.log(`API fallback-upload: Bucket check finished in ${Date.now() - startBucketCheck}ms`);

    if (bucketError && (bucketError.message.includes('not found') || (bucketError as any).status === 404)) {
      console.log('Bucket fallback-media not found, creating it...');
      await supabaseAdmin.storage.createBucket('fallback-media', {
        public: true
      });
      console.log('API fallback-upload: Bucket created successfully.');
    } else if (bucketError) {
      console.error('API fallback-upload: Bucket check error:', bucketError);
    } else {
      console.log('API fallback-upload: Bucket exists.');
    }

    // 2. Upload the file bypassing RLS policies
    console.log("API fallback-upload: Converting file to ArrayBuffer...");
    const arrayBuffer = await file.arrayBuffer();
    console.log(`API fallback-upload: ArrayBuffer converted. Uploading to storage as ${fileName}...`);
    
    const startUpload = Date.now();
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('fallback-media')
      .upload(fileName, arrayBuffer, {
        contentType: file.type || 'video/webm',
        upsert: true
      });
    console.log(`API fallback-upload: Upload call finished in ${Date.now() - startUpload}ms`);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    console.log(`API fallback-upload: Upload successful. Path: ${uploadData.path}`);
    return NextResponse.json({ success: true, path: uploadData.path });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
