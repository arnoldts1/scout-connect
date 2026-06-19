/**
 * Upload Diagnostics - Debug utility for file upload issues
 * Run diagnostics() in browser console to check upload setup
 */
import { supabase, isSupabaseConfigured } from './supabase';

export async function diagnostics() {
  console.log('🔍 Starting upload diagnostics...\n');

  const results = {
    supabaseConfig: false,
    bucketsExist: {},
    bucketsPublic: {},
    rls: {},
    auth: false,
  };

  // 1. Check Supabase Configuration
  console.log('1️⃣ Checking Supabase Configuration...');
  if (!isSupabaseConfigured) {
    console.error('❌ Supabase not configured! Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    return results;
  }
  console.log('✅ Supabase configured');
  results.supabaseConfig = true;

  // 2. Check Authentication
  console.log('\n2️⃣ Checking Authentication...');
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('✅ Authenticated as:', user.email);
      results.auth = true;
    } else {
      console.warn('⚠️ Not authenticated - uploads require authentication');
    }
  } catch (error) {
    console.error('❌ Auth error:', error.message);
  }

  // 3. Check Buckets
  console.log('\n3️⃣ Checking Storage Buckets...');
  const buckets = ['avatars', 'media', 'documents', 'audio'];
  
  for (const bucket of buckets) {
    try {
      // Try to list bucket - will fail if bucket doesn't exist or we don't have permissions
      const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 });
      
      if (error) {
        console.error(`❌ Bucket "${bucket}" error:`, error.message);
        results.bucketsExist[bucket] = false;
      } else {
        console.log(`✅ Bucket "${bucket}" exists and is accessible`);
        results.bucketsExist[bucket] = true;
      }
    } catch (error) {
      console.error(`❌ Failed to check bucket "${bucket}":`, error.message);
      results.bucketsExist[bucket] = false;
    }
  }

  // 4. Test Upload
  console.log('\n4️⃣ Testing Sample Upload...');
  try {
    // Create a tiny test file
    const testContent = new Blob(['test'], { type: 'text/plain' });
    const testFile = new File([testContent], `test-${Date.now()}.txt`, { type: 'text/plain' });

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('media')
      .upload(`test/${testFile.name}`, testFile);

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
    } else {
      console.log('✅ Upload successful:', uploadData.path);

      // Try to get public URL
      const { data: urlData, error: urlError } = supabase.storage
        .from('media')
        .getPublicUrl(uploadData.path);

      if (urlError || !urlData?.publicUrl) {
        console.error('❌ Could not generate public URL:', urlError?.message);
      } else {
        console.log('✅ Public URL generated:', urlData.publicUrl);
      }

      // Clean up test file
      try {
        await supabase.storage.from('media').remove([uploadData.path]);
        console.log('✅ Cleaned up test file');
      } catch (cleanupError) {
        console.warn('⚠️ Could not clean up test file:', cleanupError.message);
      }
    }
  } catch (error) {
    console.error('❌ Upload test error:', error.message);
  }

  // 5. Summary
  console.log('\n📋 Diagnostics Summary:');
  console.log('Supabase Configured:', results.supabaseConfig);
  console.log('Authenticated:', results.auth);
  console.log('Buckets accessible:', results.bucketsExist);
  
  const allBucketsOk = Object.values(results.bucketsExist).every(v => v);
  if (allBucketsOk && results.auth && results.supabaseConfig) {
    console.log('\n✅ Upload system looks GOOD!');
  } else {
    console.log('\n❌ Issues detected. Check above for details.');
    if (!results.auth) console.log('   → User is not authenticated');
    if (!allBucketsOk) console.log('   → Some buckets are missing or inaccessible');
    if (!results.supabaseConfig) console.log('   → Supabase is not configured');
  }

  return results;
}

// Export for console access
if (typeof window !== 'undefined') {
  window.uploadDiagnostics = diagnostics;
  console.log('💡 Tip: Run diagnostics() in console to check upload setup');
}
