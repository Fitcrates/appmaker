import { supabase } from '../src/lib/supabase';

async function cleanupPlaceholders() {
  try {
    const { data, error } = await supabase
      .from('user_feedback')
      .update({ anime_image: null })
      .eq('anime_image', '/placeholder.jpg');

    if (error) {
      console.error('Error cleaning up placeholders:', error);
      return;
    }

    console.log('Successfully cleaned up placeholder images');
  } catch (err) {
    console.error('Error:', err);
  }
}

cleanupPlaceholders();
